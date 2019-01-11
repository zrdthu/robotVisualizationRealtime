#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>

#include <Adafruit_BNO055_modified.h>
#include <Adafruit_Sensor.h>
#include <utility/imumaths.h>

#include "TimerObject.h"

#define CHIP_ID (0)  // CHANGE THIS FOR EACH CHIP!!!!!!
#define ESP8266
#define OTA_WAIT_TIME (3000)
#define SDA (0)
#define SCL (4)
#define BAUD_RATE (115200)
#define BNO055_CAL_DELAY_MS (10)
#define INTERVAL_100HZ (10)
#define INTERVAL_20HZ (50)
#define INTERVAL_1HZ (100)
#define BOARD_LED (2)
#define WORKING_BLINK_COUNT (20)
#define CAL_BLINK_COUNT (5)
#define DATA_BUFF_LENGTH (17)
#define PORT (9000)
                                  //        ID             timestamp           payload
#define DATA_BUFF_100HZ_SIZE (60) // sizeof(utin32_t) + sizeof(utin32_t) + 13 * sizeof(float)
#define DATA_BUFF_20HZ_SIZE (20)  // sizeof(utin32_t) + sizeof(utin32_t) + 3 * sizeof(float)
#define DATA_BUFF_1HZ_SIZE (12)   // sizeof(utin32_t) + sizeof(utin32_t) + 1 * sizeof(float)



// const char* ssid = "yjinms";
// const char* password = "1fdd2EE3b448@f432@2f";
// const char* host = "192.168.0.6";

const char* ssid = "raspiDatalogger";
const char* password = "d]WJ/6Z\\jBu#]g0*Q]XT";
const char* host = "192.168.2.1";


// const char* host = "192.168.4.1";

int led_val = 0;
uint working_counter = 0;
uint cal_counter = 0;

TimerObject* timer_100Hz;
TimerObject* timer_20Hz;
TimerObject* timer_1Hz;

uint32_t timeStamp100Hz;
uint32_t timeStamp20Hz;
uint32_t timeStamp1Hz;


volatile char dataBuff100hz[DATA_BUFF_100HZ_SIZE];
volatile char dataBuff20hz[DATA_BUFF_20HZ_SIZE];
volatile char dataBuff1hz[DATA_BUFF_1HZ_SIZE];


uint32_t* timeStamp100Hz_p = (uint32_t *) (dataBuff100hz + 4);
uint32_t* timeStamp20Hz_p = (uint32_t *) (dataBuff20hz + 4);
uint32_t* timeStamp1Hz_p = (uint32_t *) (dataBuff1hz + 4);

float* buff100hz = (float *) (dataBuff100hz + 8);
float* buff20hz = (float *) (dataBuff20hz + 8);
float* buff1hz = (float *) (dataBuff1hz + 8);

imu::Quaternion quat;
imu::Vector<3> gyro, lacc, acc, magn;


bool ota_flag = true;
bool mySetup_finished = false;

Adafruit_BNO055 bno;
WiFiClient client;

void setup() {
  pinMode(BOARD_LED, OUTPUT);
  digitalWrite(BOARD_LED, 0);
  Serial.begin(BAUD_RATE);
  Serial.println("Booting");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.println("Connection Failed! Rebooting...");
    delay(5000);
    ESP.restart();
  }

  // Port defaults to 8266
  // ArduinoOTA.setPort(8266);

  // Hostname defaults to esp8266-[ChipID]
  ArduinoOTA.setHostname("myesp8266");

  // No authentication by default
  // ArduinoOTA.setPassword((const char *)"343");

  ArduinoOTA.onStart([]() {
    Serial.println("Start");
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });
  ArduinoOTA.begin();
  Serial.println("Ready");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (!client.connect(host, PORT)) {
    Serial.println("Connection to dataServer failed!");
  }
  // Attach chip id to each message
  uint32_t id = ESP.getChipId();
  uint32_t* id_p = (uint32_t*) dataBuff100hz;
  id_p[0] = id;
  id_p = (uint32_t*) dataBuff20hz;
  id_p[0] = id;
  id_p = (uint32_t*) dataBuff1hz;
  id_p[0] = id;
  digitalWrite(BOARD_LED, 1);
}


void readSensor100Hz() {
  quat = bno.getQuat();

  buff100hz[0] = quat.w();
  buff100hz[1] = quat.x();
  buff100hz[2] = quat.y();
  buff100hz[3] = quat.z();


  gyro = bno.getVector(Adafruit_BNO055::VECTOR_GYROSCOPE);
  buff100hz[4] = gyro.x();
  buff100hz[5] = gyro.y();
  buff100hz[6] = gyro.z();

  lacc = bno.getVector(Adafruit_BNO055::VECTOR_LINEARACCEL);
  buff100hz[7] = lacc.x();
  buff100hz[8] = lacc.y();
  buff100hz[9] = lacc.z();


  acc = bno.getVector(Adafruit_BNO055::VECTOR_ACCELEROMETER);
  buff100hz[10] = acc.x();
  buff100hz[11] = acc.y();
  buff100hz[12] = acc.z();


  timeStamp100Hz_p[0] = millis();

  client.write((char*) dataBuff100hz, DATA_BUFF_100HZ_SIZE);

  working_counter++;
  if (working_counter == WORKING_BLINK_COUNT) {
    working_counter = 0;
    led_val ^= 1;
    digitalWrite(BOARD_LED, led_val);
  }
}

void readSensor20Hz() {
  magn = bno.getVector(Adafruit_BNO055::VECTOR_MAGNETOMETER);
  buff20hz[0] = magn.x();
  buff20hz[1] = magn.y();
  buff20hz[2] = magn.z();
  timeStamp20Hz_p[0] = millis();
  client.write((char*) dataBuff20hz, DATA_BUFF_20HZ_SIZE);
}

void readSensor1Hz() {
  buff1hz[0] =  (float) bno.getTemp();
  timeStamp1Hz_p[0] = millis();
  client.write((char*) dataBuff1hz, DATA_BUFF_1HZ_SIZE);

}

void mySetup() {
  bno = Adafruit_BNO055(55, 0x28);
  if(!bno.begin(SDA, SCL)) {
    Serial.println("bno not detected");
    while(1);
  } else {
    Serial.println("bno detected!");
  }
  displaySensorDetails(bno);
  displaySensorDetails(bno);
  displayCalStatus(bno);
  bno.setExtCrystalUse(true);
  timer_100Hz= new TimerObject(INTERVAL_100HZ);
  timer_100Hz -> setOnTimer(&readSensor100Hz);
  timer_20Hz= new TimerObject(INTERVAL_20HZ);
  timer_20Hz -> setOnTimer(&readSensor20Hz);
  timer_1Hz= new TimerObject(INTERVAL_1HZ);
  timer_1Hz -> setOnTimer(&readSensor1Hz);
  delay(300);
  timer_100Hz -> Start();
  timer_20Hz -> Start();
  timer_1Hz -> Start();
}

void displaySensorDetails(Adafruit_BNO055 bno) {
  sensor_t sensor;
  bno.getSensor(&sensor);
  Serial.print("Sensor: ");
  Serial.print(sensor.name);
  Serial.print("vDriver: ");
  Serial.print(sensor.version);
  Serial.print("UID: ");
  Serial.print(sensor.sensor_id);
  delay(100);
}

void displaySensorStatus(Adafruit_BNO055 bno) {
  uint8_t system_status, self_test_results, system_error;
  system_status = self_test_results = system_error = 0;
  bno.getSystemStatus(&system_status, &self_test_results, &system_error);
  Serial.print("SysStat: ");
  Serial.print(system_status);
  Serial.print("SelfTest: ");
  Serial.print(self_test_results);
  Serial.print("SysErr: ");
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
    Serial.print("System: ");
    Serial.print(bno_system);
    Serial.print("gyro: ");
    Serial.print(bno_gyro);
    Serial.print("accel: ");
    Serial.print(bno_accel);
    Serial.print("mag: ");
    Serial.println(bno_mag);
    delay(BNO055_CAL_DELAY_MS);
  }
  led_val = 0;
  digitalWrite(BOARD_LED, led_val);

}


void loop() {
  ArduinoOTA.handle();
  if (! mySetup_finished) {
    mySetup();
    mySetup_finished = true;
  } else {
    if (client.connected()) {
      timer_100Hz -> Update();
      timer_20Hz -> Update();
      timer_1Hz -> Update();
    } else {
      client = WiFiClient();
      if (!client.connect(host, PORT)) {
        Serial.println("Connection to dataServer failed!");
        delay(500);
      }
    }
  }
}
