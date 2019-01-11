# oriTrakHAR Sensor Data Collection
This folder is for the sensor data collection part of the oritrak based human activity recognition project. It contains information about sensor hardware setup, embeded code for collecting data, and server side code to record the data.

## System Overview
Each sensor module consists of an [esp8266 nodeMCU D1 Mini V2 wifi chip](https://www.amazon.com/Makerfocus-ESP8266-Wireless-Development-Compatible/dp/B01MU4XDNX/ref=sr_1_50_sspa?s=electronics&ie=UTF8&qid=1516376792&sr=1-50-spons&keywords=D1+Mini+NodeMcu&psc=1), a [Bno-055 absolute orientation sensor](https://www.adafruit.com/product/2472), and a replacable 3.7v li-po battery. The esp8266 chip runs arduino code and connects to the Bno-055 chip via I2C. In action, a server device (rpi3 or an android phone) would setup a wifi soft access point. Each sensor module connects to the wifi access point and send sensor data via TCP sockets to the server device running the data recording script.

-- TODO: add picture

## Folder Structure
```
.
+-- README.md
+-- dataServer                    // node.js data collection code for raspberry pi 3 as the server device
+-- espBno055                     // arduino code for the sensor module
+-- Adafruit_BNO055_modified.zip  // modified bno-055 library to work with the sensor module. Changed defualt I2C pins to nodeMCU D1 Mini pins. Changed I2C bus speed to 400k.
```

## Raspberry Pi 3 as a Server Device Setup
The raspberry pi 3 serves 2 purposes. 1. Act as a wifi soft access point so that the sensor modules can connect to it and send information via TCP sockets. 2. Run data collection script(a node.js script) to record the data.

### Raspberry Pi 3 as a Soft Access Point
Follow [this tutorial](https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md)

### SSH
Follow [this tutorial](https://www.raspberrypi.org/documentation/remote-access/ssh/)

### Install node.js
Follow [this guide](https://nodejs.org/en/download/package-manager/), install the latest LTS version

### Run Data Collection Script
```
    cd dataServer
    node ./dataServer
```

### TODO: set schipt to auto run at boot

## Sensor Module Hardware Setup
The nodeMCU chip is connected to the Bno-055 chip via I2C. The I2C pins of boths chips are soldered together.
-- TODO: add picture

Pinout of the nodeMCU chip:

Pinout of the Bno-055 chip:

Note that the it is not neccessary to use the nodeMCU chip. Any esp8266 based chip should work. esp8266 chip does not have hardware I2C support. Since I2C is implemented in the software, user can define the SCL and SDA pin of the chip. The module we made are defined as shown in the picuture above.

### Use Arduino with esp8266
Follow [this tutorial](https://learn.adafruit.com/adafruit-huzzah-esp8266-breakout/using-arduino-ide) to setup your Arduino to use with esp8266 chip.
Current code also supports over the air (OTA) firmeware update. Follow [this tutorial](https://randomnerdtutorials.com/esp8266-ota-updates-with-arduino-ide-over-the-air/) to see how to use OTA.

### Sensor Calibration
Start the server device and the data collection script first. Connect a sensor module with battery. The red led on the nodeMCU chip indicates power and the blue led indicates status. The power is first connected, you should see the blue led turns on. After the module is connected to an access point. The blue led will start blinking rapidly, indicating that the sensor is in calibration mode. Free style move the sensor for a few secounds, then hold still with the module facing up. You should see the blue led blinks less rapidly, indicating that it is sending the data.

### Debugging using a laptop
You can use a laptop with wifi capability to debug the chip. To do that, you need to setup your laptop to run a wifi access point first. On Mac, if you also have ethernet cable connected, just open "sharing" and share the ethernet to wifi. If you don't have an ethernet connection, follow [this tutorial](http://www.laszlopusztai.net/2016/02/14/creating-a-wi-fi-access-point-on-os-x/) and share "Loopback" to wifi.
Use `arp -a` to see connected devices


