#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <ArduinoOTA.h>

#include <Adafruit_BNO055_modified.h>
#include <Adafruit_Sensor.h>
#include <utility/imumaths.h>

#include "TimerObject.h"

#define ESP8266
#define SDA (0)
#define SDA_AUX (2)
#define SCL (4)
#define SCL_AUX (5)
#define BAUD_RATE (115200)
#define BNO055_CAL_DELAY_MS (10)
#define INTERVAL_100HZ (10)
#define INTERVAL_20HZ (50)
#define BOARD_LED (2)
#define CAL_BLINK_COUNT (3)
#define PORT (9000)
#define PAYLOAD_BUFFER_SIZE (20000)
#define RECEIVE_BUFFER_SIZE (8)
#define TCP_CONNECT_FREEZE_MAX (250000) // ns
#define TCP_CONNECT_FREEZE_MIN (100000) // ns
#define LOST_SERVER_TIME (850000) // ns

extern "C" {
  #include "user_interface.h"
}

// #define SAMPLE_DELAY_US (500)
// const uint8_t* ssid = "yjinms";
// const uint8_t* password = "1fdd2EE3b448@f432@2f";
// const uint8_t* host = "192.168.0.6";

/*
 * It seems client.write() is not always synchronous especially when
 * send buffer size is small (I could be wrong. The behavior of the
 * chip is wierd). Stuff in payloadBuf is copied to sendBuff and then
 * send to the server.
*/

uint8_t payloadBuf[PAYLOAD_BUFFER_SIZE];

const char* ssid = "raspiDatalogger";
const char* password = "d]WJ/6Z\\jBu#]g0*Q]XT";
const char* host = "192.168.2.1";

const uint32_t FLAG100 = 1 << 31;

uint32_t led_val = 0;
uint32_t working_counter = 0;
uint32_t cal_counter = 0;

TimerObject* timer_100Hz;
TimerObject* timer_20Hz;

uint64_t tcpLastConnectTimestamp = 0;
uint64_t tcpReconnectWaitTime = 0;
uint64_t deadTime = 0;
uint32_t sanityCounter = 0;
// volatile uint8_t magBuf[MAG_BUFFER_SIZE];

/* Final payload format
 * NOTE: the chip doesn't like not-32bits-aligned wirte
 * field name                             data type
 * -------------------                    ----------
 * sensor ID                              uint64_t
 * server timestamp                       uint64_t
 * receieve timestamp                     uint64_t
 * send timestamp                         uint64_t
 * base timestamp                         uint64_t
 * -------------------------------------------------------------
 * ------------Either---------------------Or--------------   /|\
 * |Δtimestamp | FlAG100  uint32_t| Δtimestamp   uint32_t|    |
 * |quat_w               float    | magn_x      float    |    |
 * |quat_x               float    | magn_y      float    |    |
 * |quat_y               float    | magn_z      float    |    |
 * |quat_z               float    |                      | repeat n
 * |gyro_x               float    |                      |    |
 * |gyro_y               float    |                      |    |
 * |gyro_z               float    |                      |    |
 * |acc_x                float    |                      |    |
 * |acc_y                float    |                      |    |
 * |acc_z                float    |                      |    |
 * -------------------------------------------------------   \|/
 * -------------------------------------------------------------
 * 0xFFFFFFFF                             uint32_t
 * 0xFFFFFFFF                             uint32_t
*/

uint64_t* id_p = (uint64_t*) &payloadBuf[0];
uint64_t* serverTimeStamp_p = (uint64_t*) &payloadBuf[8];
uint64_t* clientReceiveTimeStamp_p = (uint64_t*) &payloadBuf[16];
uint64_t* clientSendTimeStamp_p = (uint64_t*) &payloadBuf[24];
uint64_t* clientBaseTimeStamp_p = (uint64_t*) &payloadBuf[32];

float* payloadCursor_p = (float*) &payloadBuf[40];
float* payloadCursor_origin =  payloadCursor_p;

// float* magCursor_p = (float*) magBuf;
// float* magCursor_origin =  magCursor_p;

imu::Quaternion quat;
imu::Vector<3> gyro, lacc, acc, magn;


bool ota_flag = true;
bool mySetup_finished = false;
bool dead = false;



Adafruit_BNO055 bno;
WiFiClient client;

void setup() {
  pinMode(BOARD_LED, OUTPUT);
  digitalWrite(BOARD_LED, 0);
  Serial.begin(BAUD_RATE);
  Serial.println(F("Booting"));
  startWIFI();
  client = WiFiClient();
  Serial.println(F("Ready"));
  Serial.print(F("IP address: "));
  Serial.println(WiFi.localIP());

  // Attach chip id to each message
  uint32_t id = ESP.getChipId();
  id_p[0] = id;
  // client.setNoDelay(true);
  digitalWrite(BOARD_LED, 1);
  randomSeed(id);
}

void startWIFI() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    //maybe replave the while loop
    Serial.println(F("Connection Failed! Rebooting..."));
    delay(500);
    ESP.restart();
  }

  // Port defaults to 8266
  // ArduinoOTA.setPort(8266);

  // Hostname defaults to esp8266-[ChipID]
  // ArduinoOTA.setHostname("myesp8266");

  // No authentication by default
  // ArduinoOTA.setPassword((const uint8_t *)"343");

  ArduinoOTA.onStart([]() {
    Serial.println(F("Start"));
  });
  ArduinoOTA.onEnd([]() {
    Serial.println(F("\nEnd"));
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println(F("Auth Failed"));
    else if (error == OTA_BEGIN_ERROR) Serial.println(F("Begin Failed"));
    else if (error == OTA_CONNECT_ERROR) Serial.println(F("Connect Failed"));
    else if (error == OTA_RECEIVE_ERROR) Serial.println(F("Receive Failed"));
    else if (error == OTA_END_ERROR) Serial.println(F("End Failed"));
  });
  ArduinoOTA.begin();
}


void readSensor100Hz() {
  if (((payloadCursor_p - payloadCursor_origin) * 4) > PAYLOAD_BUFFER_SIZE - 44) {
    clearBuffer();
  }
  ((uint32_t*)payloadCursor_p)[0] = ((uint32_t) (micros() - *clientBaseTimeStamp_p)) | FLAG100;

  quat = bno.getQuat();
  gyro = bno.getVector(Adafruit_BNO055::VECTOR_GYROSCOPE);
  acc = bno.getVector(Adafruit_BNO055::VECTOR_ACCELEROMETER);

  payloadCursor_p[1] = quat.w();
  // payloadCursor_p[2] = quat.x();
  // payloadCursor_p[3] = quat.y();
  // payloadCursor_p[4] = quat.z();
  payloadCursor_p[2] = quat.y();  //x
  payloadCursor_p[3] = quat.z();  //y
  payloadCursor_p[4] = quat.x();  //z
  // if ((payloadCursor_p[1] == payloadCursor_p[2]) && (payloadCursor_p[2] == payloadCursor_p[3]) && (payloadCursor_p[3] == payloadCursor_p[4])) {
  //   ESP.restart();
  // }
  payloadCursor_p[5] = gyro.x();
  payloadCursor_p[6] = gyro.y();
  payloadCursor_p[7] = gyro.z();
  payloadCursor_p[8]  = acc.x();
  payloadCursor_p[9]  = acc.y();
  payloadCursor_p[10] = acc.z();

  payloadCursor_p = &payloadCursor_p[11];


  if ((payloadCursor_p[1] == payloadCursor_p[2]) && (payloadCursor_p[1] == payloadCursor_p[3]) && (payloadCursor_p[1] == payloadCursor_p[4])) {
    sanityCounter++;
  } else {
    sanityCounter = 0;
  }

  if (sanityCounter  == 300) {
    Serial.println(F("Chip went crazy, all values are 0\nRestart!"));
    ESP.restart();
  }
}

void readSensor20Hz() {
  if (((payloadCursor_p - payloadCursor_origin) * 4) > PAYLOAD_BUFFER_SIZE - 16) {
    clearBuffer();
  }
  ((uint32_t*)payloadCursor_p)[0] = (uint32_t) (micros() - *clientBaseTimeStamp_p);

  magn = bno.getVector(Adafruit_BNO055::VECTOR_MAGNETOMETER);
  payloadCursor_p[1] = magn.x();
  payloadCursor_p[2] = magn.y();
  payloadCursor_p[3] = magn.z();

  payloadCursor_p = &payloadCursor_p[4];
}

void mySetup() {
  bno = Adafruit_BNO055(55, 0x28);
  if(!bno.begin(SDA, SCL)) {
      Serial.println(F("bno not detected on default port"));
    if (!bno.begin(SDA_AUX, SCL_AUX)) {
      Serial.println(F("bno not detected on aux port"));
      while(1);
    }
  } else {
    Serial.println(F("bno detected!"));
  }
  displaySensorDetails(bno);
  displaySensorDetails(bno);
  displayCalStatus(bno);
  bno.setExtCrystalUse(true);
  timer_100Hz= new TimerObject(INTERVAL_100HZ);
  timer_100Hz -> setOnTimer(&readSensor100Hz);
  timer_20Hz= new TimerObject(INTERVAL_20HZ);
  timer_20Hz -> setOnTimer(&readSensor20Hz);
  if (!client.connect(host, PORT)) {
    Serial.println(F("Connection to dataServer failed!"));
  }
  delay(TCP_CONNECT_FREEZE_MAX / 1000);
  timer_100Hz -> Start();
  timer_20Hz -> Start();
  *clientBaseTimeStamp_p = (uint64_t) micros();
  *clientReceiveTimeStamp_p = *clientBaseTimeStamp_p;
}

void loop() {
  ArduinoOTA.handle();
  if (! mySetup_finished) {
    mySetup();
    mySetup_finished = true;
  } else {
    timer_100Hz -> Update();
    timer_20Hz -> Update();

    if (micros() - tcpLastConnectTimestamp < tcpReconnectWaitTime) {
      return;
    }
    if (dead) {
      if (micros() - deadTime < TCP_CONNECT_FREEZE_MAX) {
        startWIFI();
        *clientReceiveTimeStamp_p = (uint64_t) micros();
        dead = false;
      } else {
        return;
      }
    }

    if (client.connected()) {
      uint32_t receiveLen = client.available();
      if (receiveLen) {
        *clientReceiveTimeStamp_p = (uint64_t) micros();

        led_val ^= 1;
        digitalWrite(BOARD_LED, led_val);
        while (client.read((uint8_t *) serverTimeStamp_p, RECEIVE_BUFFER_SIZE) > 0);

        *((uint32_t*)&payloadCursor_p[0])= 0xFFFFFFFF;
        *((uint32_t*)&payloadCursor_p[1])= 0xFFFFFFFF;
        uint32_t payloadBufLen = payloadCursor_p - payloadCursor_origin;
        uint64_t sendTimeStamp = (uint64_t) micros();
        *clientSendTimeStamp_p = sendTimeStamp;

        client.write((uint8_t*)payloadBuf, payloadBufLen * 4 + 48);

        client.flush();
        *clientBaseTimeStamp_p = (uint64_t) micros();
        payloadCursor_p = payloadCursor_origin;
        tcpReconnectWaitTime = 0;
        dead = false;
        deadTime = 0;
      }
    } else {
      Serial.print((int) system_get_free_heap_size());
      Serial.println(F("Reconnect TCP!"));
      client = WiFiClient();
      if (!client.connect(host, PORT)) {
        dead = true;
        Serial.println(F("Connection to dataServer failed!"));
      } else {
        tcpLastConnectTimestamp = (uint64_t) micros();
        *clientReceiveTimeStamp_p = tcpLastConnectTimestamp;
        tcpReconnectWaitTime = random(TCP_CONNECT_FREEZE_MIN, TCP_CONNECT_FREEZE_MAX);
      }
    }

    if ((micros() - *clientReceiveTimeStamp_p) > LOST_SERVER_TIME) {
      Serial.print((int) system_get_free_heap_size());
      Serial.println(F("Reconnect TCP!"));
      client.stop();
      *clientReceiveTimeStamp_p = (uint64_t) micros();
      client = WiFiClient();
      if (!client.connect(host, PORT)) {
        dead = true;
        Serial.println(F("Connection to dataServer failed!"));
      } else {
        tcpLastConnectTimestamp = (uint64_t) micros();
        *clientReceiveTimeStamp_p = tcpLastConnectTimestamp;
        tcpReconnectWaitTime = random(TCP_CONNECT_FREEZE_MIN, TCP_CONNECT_FREEZE_MAX);
      }
    }

    if (dead) {
      client.stop();
      WiFi.disconnect();
      WiFi.mode(WIFI_OFF);
      Serial.println(F("Reconnect WIFI!"));
      deadTime = (uint64_t) micros();
    }
  }
}

void clearBuffer() {
  Serial.println(F("clear Buffer called"));
  memset(payloadCursor_origin, 0, PAYLOAD_BUFFER_SIZE - 40);
  payloadCursor_p = payloadCursor_origin;
  *clientBaseTimeStamp_p = (uint64_t) micros();
}


void displaySensorDetails(Adafruit_BNO055 bno) {
  sensor_t sensor;
  bno.getSensor(&sensor);
  Serial.print(F("Sensor: "));
  Serial.print(sensor.name);
  Serial.print(F("vDriver: "));
  Serial.print(sensor.version);
  Serial.print(F("UID: "));
  Serial.print(sensor.sensor_id);
  delay(100);
}

void displaySensorStatus(Adafruit_BNO055 bno) {
  uint8_t system_status, self_test_results, system_error;
  system_status = self_test_results = system_error = 0;
  bno.getSystemStatus(&system_status, &self_test_results, &system_error);
  Serial.print(F("SysStat: "));
  Serial.print(system_status);
  Serial.print(F("SelfTest: "));
  Serial.print(self_test_results);
  Serial.print(F("SysErr: "));
  Serial.println(system_error);
  delay(100);
}

void displayCalStatus(Adafruit_BNO055 bno) {
  uint8_t bno_system, bno_gyro, bno_accel, bno_mag;
  bno.getCalibration(&bno_system, &bno_gyro, &bno_accel, &bno_mag);
  while(bno_system != 3) {
    ArduinoOTA.handle();
    cal_counter++;
    if (cal_counter == CAL_BLINK_COUNT) {
      cal_counter = 0;
      led_val ^= 1;
      digitalWrite(BOARD_LED, led_val);
      // Serial.println("blink");
    }
    bno.getCalibration(&bno_system, &bno_gyro, &bno_accel, &bno_mag);
    Serial.print(F("System: "));
    Serial.print(bno_system);
    Serial.print(F("gyro: "));
    Serial.print(bno_gyro);
    Serial.print(F("accel: "));
    Serial.print(bno_accel);
    Serial.print(F("mag: "));
    Serial.println(bno_mag);
    delay(BNO055_CAL_DELAY_MS);
  }
  led_val = 0;
  digitalWrite(BOARD_LED, led_val);
}

