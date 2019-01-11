'use strict'
const net = require('net')
const os = require('os')
const dataServer = net.createServer()
// const dbService = require('./db_service')
const realtimeVis = require('./realtimeVis')
const express = require('express')
const config = require('./config')

var app = express()
var macAddr
const platform = os.platform()
if (platform === 'darwin') {
  macAddr = os.networkInterfaces().en3[0].mac
} else if (platform === 'linux') {
  try {
    macAddr = os.networkInterfaces().wlan0[0].mac // change wlan0 to what ever interface you are using
  } catch (e) {
    macAddr = os.networkInterfaces().wlan1[0].mac // change wlan0 to what ever interface you are using
  }
}

const machineId = mac2Id(macAddr)

dataServer.on('connection', client => {
  client.on('data', processData)
})

dataServer.listen(config.PORT)

app.get('/health', (req, res) => {
  res.end(JSON.stringify(sensorFreq))
})

var appServer = app.listen(config.HEALTH_PORT)
// realtimeVis.init(appServer)

var sensorFreq = {}
var counter = {}

function processData (data) {
  var id = data.readUInt32LE(0)
  var idStr = id.toString()
  // console.log(idStr)
  if (counter.hasOwnProperty(idStr)) {
    counter[idStr] += 1
  } else {
    counter[idStr] = 0
  }
  var timestamp = data.readUInt32LE(4)
  var serverTimestamp = new Date().valueOf()
  switch (data.length) {
    case 60:
      var data100Hz = {
        quat: {
          w: data.readFloatLE(8),
          x: data.readFloatLE(12),
          y: data.readFloatLE(16),
          z: data.readFloatLE(20)
        },
        gyro: {
          x: data.readFloatLE(24),
          y: data.readFloatLE(28),
          z: data.readFloatLE(32)
        },
        lacc: {
          x: data.readFloatLE(36),
          y: data.readFloatLE(40),
          z: data.readFloatLE(44)
        },
        acc: {
          x: data.readFloatLE(48),
          y: data.readFloatLE(52),
          z: data.readFloatLE(56)
        }
      }
      realtimeVis.updateRealtimeVis(data100Hz.quat, idStr)
      var avgAcc = accMag(data100Hz.acc)
      // console.log(`acc_x: ${data100Hz.acc.x} acc_y: ${data100Hz.acc.y} acc_z: ${data100Hz.acc.z} acc_avg: ${avgAcc}`)
      // if (avgAcc < config.FREE_FALL_ACC_THRESHOLD) {
      //   console.log('\n\n\n\n\n\n!!!!!!!!!!!!!!!\n\n\n\n\n\n')
      // }
      // dbService.insertSensorData100Hz(machineId, id, timestamp, serverTimestamp, data100Hz)
      break
    case 20:
      var data20Hz = {
        mag: {
          x: data.readFloatLE(8),
          y: data.readFloatLE(12),
          z: data.readFloatLE(16)
        }
      }
      // dbService.insertSensorData20Hz(machineId, id, timestamp, serverTimestamp, data20Hz)
      break
    case 12:
      var data1Hz = {
        temp: data.readFloatLE(8)
      }
      // dbService.insertSensorData1Hz(machineId, id, timestamp, serverTimestamp, data1Hz)
      break
  }
}

setInterval(() => {
  var serverTimestamp = new Date().valueOf()
  Object.keys(counter).forEach(key => {
    sensorFreq[key] = counter[key]
    // dbService.insertHealth(machineId, parseInt(key), serverTimestamp, counter[key])
    counter[key] = 0
  })
}, 1000)

function mac2Id (mac) {
  return Buffer.from([Buffer.from(mac.substring(6, 8), 16), Buffer.from(mac.substring(9, 11), 16), Buffer.from(mac.substring(12, 14), 16), Buffer.from(mac.substring(15, 17), 16)].join('')).readUInt32LE(0)
}

function accMag (acc) {
  return Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z)
}
