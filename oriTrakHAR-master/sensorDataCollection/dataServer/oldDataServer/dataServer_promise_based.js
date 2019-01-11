'use strict'
const net = require('net')
const os = require('os')
const dataServer = net.createServer()
const config = require('./config')
const Uint64LE = require('int64-buffer').Uint64LE
// const int53 = require('int53')
const microtime = require('microtime')
const _100HZ_FLAG = 2147483648 // 1<<31
const dbService = require('./db_service')
const Promise = require('bluebird')
// const realtimeVis = require('./realtimeVis')
// const express = require('express')

// var app = express()
var macAddr
const platform = os.platform()
if (platform === 'darwin') {
  try {
    macAddr = os.networkInterfaces().en0[0].mac
  } catch (e) {
    macAddr = os.networkInterfaces().en5[0].mac
  }
} else if (platform === 'linux') {
  try {
    // Change wlan0 to what ever interface you are using, wlan0 uses rpi3 built in wifi
    macAddr = os.networkInterfaces().wlan0[0].mac
  } catch (e) {
    // Change wlan0 to what ever interface you are using, wlan1 uses rpi3 wifi dongle
    macAddr = os.networkInterfaces().wlan1[0].mac
  }
}
const machineId = mac2Id(macAddr)
var curSockIndex = 0

var clients = []
dataServer.on('connection', socket => {
  const clientId = getSocketId(socket)
  console.log(`!!! new connection ${clientId}`)
  clients.push(socket)
  socket.on('data', processDataGen(clientId))
  socket.on('end', () => {
    console.log(`Socket: ${clientId} end`)
    clients = clients.filter((socket) => clientId !== getSocketId(socket))
    if (curSockIndex >= clients.length) {
      curSockIndex = 0
    }
    socket.destroy()
  })
  socket.on('error', error => {
    console.log(`Err: ${error}\nOn ${clientId}`)
    clients = clients.filter((socket) => clientId !== getSocketId(socket))
    if (curSockIndex >= clients.length) {
      curSockIndex = 0
    }
    socket.destroy()
  })
  // socket.setTimeout(config.POLL_INTERVAL * 6)
  socket.on('timeout', () => {
    console.log(`client ${clientId} timeout`)
    clients = clients.filter((socket) => clientId !== getSocketId(socket))
  })
  socket.on('end', () => {
    clients = clients.filter((socket) => clientId !== getSocketId(socket))
    if (curSockIndex >= clients.length) {
      curSockIndex = 0
    }
    socket.destroy()
  })
})

dataServer.listen(config.PORT)

var curTaskTimestamp
var resolveCurTask
var rejectCurTask
var curSocket

function pollTaskGen () {
  var myPromise = new Promise((resolve, reject) => {
    resolveCurTask = resolve
    rejectCurTask = reject
  })
  if (clients.length > 0) {
    if (curSockIndex >= clients.length) {
      curSockIndex = 0
    }
    curSocket = clients[curSockIndex]
    var msg = Buffer.alloc(8)
    var timestamp = microtime.now()
    msg.writeDoubleLE(timestamp, 0)
    // console.log(`curSock:${curSockIndex} id:${getSocketId(curSocket)} send message ${timestamp}: ${msg.toString('hex')}`)
    curSocket.write(msg)
    curTaskTimestamp = timestamp
    ++curSockIndex
    if (curSockIndex >= clients.length) {
      curSockIndex = 0
    }
  }
  return myPromise
}
var taskQueue = genTaskPromise()

function genTaskPromise () {
  return pollTaskGen().timeout(config.POLL_INTERVAL_MAX, 'poll task timeout')
  .then(() => {
    taskQueue = taskQueue.then(genTaskPromise())
  })
  .catch(e => {
    console.log(e)
    resolveCurTask = undefined
    rejectCurTask = undefined
    if (clients.length > 0 && curSocket) {
      clients = clients.filter((socket) => getSocketId(curSocket) !== getSocketId(socket))
      console.log(`destroy socket ${getSocketId(curSocket)}`)
      curSocket.destroy()
      curSocket = undefined
      if (curSockIndex >= clients.length) {
        curSockIndex = 0
      }
    }
    taskQueue = taskQueue.then(genTaskPromise())
  })
}

function getSocketId (socket) {
  return socket.remoteAddress.split(':')[3]
}

function processDataGen (clientId) {
  var dataBuffer = Buffer.from('')
  var serverReceiveTimestamp
  var tinySync = {
    keyPoints: [],
    params: {
      aMax: 1,
      bMin: -Number.MAX_SAFE_INTEGER / 2,
      aMin: 1,
      bMax: Number.MAX_SAFE_INTEGER / 2
    }
  }
  var outputDataBuff = []

  return function processData (data) {
    // console.log(`got data from id ${clientId} and data length: ${data.length}}`)
    // console.log(data.toString('hex'))
    if (dataBuffer.length === 0) {
      serverReceiveTimestamp = microtime.now()
    }
    // console.log(data.toString('hex'))
    dataBuffer = Buffer.concat([dataBuffer, data], dataBuffer.length + data.length)
    if (dataBuffer.length < 8) {
      return
    }
    var lineEndIndex = dataBuffer.indexOf(Buffer.from([255, 255, 255, 255, 255, 255, 255, 255]))
    if (lineEndIndex > -1) {
      let msgData = dataBuffer.slice(0, lineEndIndex + 8)
      dataBuffer = dataBuffer.slice(lineEndIndex + 8)
      serverReceiveTimestamp = microtime.now()
      // console.log('before parseRawData')
      let dataBulk = parseRawData(msgData, serverReceiveTimestamp)
      // console.log(`serverSend: ${dataBulk.serverSendTimestamp} cur: ${curTaskTimestamp} serverRECV: ${serverReceiveTimestamp} delay:${Math.round((config.POLL_INTERVAL_MIN * 1000 - (serverReceiveTimestamp - dataBulk.serverSendTimestamp)) / 1000)}`)

      if (dataBulk.serverSendTimestamp === curTaskTimestamp) {
        if ((serverReceiveTimestamp - dataBulk.serverSendTimestamp) > config.POLL_INTERVAL_MIN * 1000) {
          resolveCurTask()
          resolveCurTask = undefined
          rejectCurTask = undefined
        } else {
          // console.log(`delay time: ${Math.round((config.POLL_INTERVAL_MIN * 1000 - (serverReceiveTimestamp - dataBulk.serverSendTimestamp)) / 1000)}`)
          setTimeout((resolveTask) => {
            if (resolveTask) {
              // console.log('msg received! resolve curTask')
              resolveTask()
            }
          }, Math.round((config.POLL_INTERVAL_MIN * 1000 - (serverReceiveTimestamp - dataBulk.serverSendTimestamp)) / 1000), resolveCurTask)
        }
      } else if (dataBulk.serverSendTimestamp > curTaskTimestamp) {
        console.log('Reject Task!')
        rejectCurTask()
        resolveCurTask = undefined
        rejectCurTask = undefined
      }

      dbService.insertSensorMessage(machineId
        , dataBulk.sensor_id, dataBulk.serverSendTimestamp, dataBulk.sensorReceiveTimestamp
        , dataBulk.sensorSendTimestamp, serverReceiveTimestamp, dataBulk.sensorData100hz.length, dataBulk.sensorData20hz.length)

      outputDataBuff.push(dataBulk)

      tinySync.keyPoints.push({
        serverSendTimestamp: dataBulk.serverSendTimestamp + (dataBulk.sensorSendTimestamp - dataBulk.sensorReceiveTimestamp) * (tinySync.params.aMax + tinySync.params.aMin) / 2,
        sensorTimestamp: dataBulk.sensorSendTimestamp,
        serverReceiveTimestamp: dataBulk.serverReceiveTimestamp
      })
      if (tinySync.keyPoints.length >= 8) {
        let keyPointIndex = {
          dataPoint0: undefined,
          dataPoint1: undefined
        }
        let bestParam = {
          aMax: Number.MAX_SAFE_INTEGER / 2,
          bMin: -Number.MAX_SAFE_INTEGER / 2,
          aMin: -Number.MAX_SAFE_INTEGER / 2,
          bMax: Number.MAX_SAFE_INTEGER / 2
        }

        for (let i = 0; i < tinySync.keyPoints.length; i++) {
          for (let j = 0; j < tinySync.keyPoints.length; j++) {
            if (j > i) {
              let param = calLineBound(tinySync.keyPoints[i], tinySync.keyPoints[j])
              if ((bestParam.bMax - bestParam.bMin) > (param.bMax - param.bMin)) {
                bestParam = param
                keyPointIndex.dataPoint0 = i
                keyPointIndex.dataPoint1 = j
              }
            }
          }
        }
        tinySync.keyPoints = tinySync.keyPoints.filter((e, i) => (i === keyPointIndex.dataPoint0) || (i === keyPointIndex.dataPoint1))
        tinySync.params = bestParam
        // console.log(tinySync.params)
        let a = (tinySync.params.aMax + tinySync.params.aMin) / 2
        let b = (tinySync.params.bMax + tinySync.params.bMin) / 2

        outputDataBuff.forEach((bulkData, j, jArr) => {
          bulkData.sensorData100hz.forEach((e, i, iArr) => {
            e.syncedTimestamp = a * e.timestamp + b
            dbService.insertSensorData100Hz(machineId, dataBulk.sensor_id, dataBulk.serverSendTimestamp, e)
          })
          bulkData.sensorData20hz.forEach(e => {
            e.syncedTimestamp = a * e.timestamp + b
            dbService.insertSensorData20Hz(machineId, dataBulk.sensor_id, dataBulk.serverSendTimestamp, e)
          })
        })
        // let deltaT = tinySync.params.bMax - tinySync.params.bMin
        // console.log(tinySync)
        console.log(`-----delta b: ${tinySync.params.bMax - tinySync.params.bMin} a: ${a} b: ${b}`)
        outputDataBuff = []
      }
    }
  }
}

function calLineBound (dataPoint0, dataPoint1) {
  let deltaSensor = dataPoint1.sensorTimestamp - dataPoint0.sensorTimestamp
  let aMax = (dataPoint1.serverReceiveTimestamp - dataPoint0.serverSendTimestamp) / deltaSensor
  let aMin = (dataPoint1.serverSendTimestamp - dataPoint0.serverReceiveTimestamp) / deltaSensor
  return {
    aMax: aMax,
    bMin: dataPoint0.serverSendTimestamp - aMax * dataPoint0.sensorTimestamp,
    aMin: aMin,
    bMax: dataPoint0.serverReceiveTimestamp - aMin * dataPoint0.sensorTimestamp
  }
}

function parseRawData (buf, serverReceiveTimestamp) {
  var bulkData = {
    sensor_id: readUInt64LE(buf, 0),
    serverSendTimestamp: buf.readDoubleLE(8),
    sensorReceiveTimestamp: readUInt64LE(buf, 16),
    sensorSendTimestamp: readUInt64LE(buf, 24),
    sensorOffsetTimestamp: readUInt64LE(buf, 32),
    serverReceiveTimestamp: serverReceiveTimestamp,
    sensorData100hz: [],
    sensorData20hz: []
  }
  // console.log(`serverSend:${bulkData.serverSendTimestamp} sensorRecv:${bulkData.sensorReceiveTimestamp} sensorSendTimestamp:${bulkData.sensorSendTimestamp}`)
  if (buf.length <= 40) {
    return bulkData
  }
  var cursor = 40

  while (cursor < buf.length - 8) {
    var rawTimestamp = buf.readUInt32LE(cursor)
    var timestamp = rawTimestamp - _100HZ_FLAG
    // console.log(`rawTimestamp:${rawTimestamp} timestamp:${timestamp}`)

    if (timestamp >= 0) {
      try {
        // if (cursor < buf.length - 52) {
        var sensor100hzDataEntry = {
          timestamp: timestamp + bulkData.sensorOffsetTimestamp,
          quat_w: buf.readFloatLE(cursor + 4),
          quat_x: buf.readFloatLE(cursor + 8),
          quat_y: buf.readFloatLE(cursor + 12),
          quat_z: buf.readFloatLE(cursor + 16),
          gyro_x: buf.readFloatLE(cursor + 20),
          gyro_y: buf.readFloatLE(cursor + 24),
          gyro_z: buf.readFloatLE(cursor + 28),
          acc_x: buf.readFloatLE(cursor + 32),
          acc_y: buf.readFloatLE(cursor + 36),
          acc_z: buf.readFloatLE(cursor + 40)
        }
          // console.log(sensor100hzDataEntry.timestamp)
        bulkData.sensorData100hz.push(sensor100hzDataEntry)
        // } else {
        //   console.log('WARNING! Potentially corrupted 100hz data')
        // }
        cursor += 44
      } catch (e) {
        console.log(e)
        console.log(buf.slice(cursor, buf.length).toString('hex'))
        console.log(`100hz timestamp=${sensor100hzDataEntry.timestamp} buf.length=${buf.length} cursor ${cursor}`)
      }
    } else if (timestamp < 0) {
      try {
        // if (cursor < buf.length - 24) {
        timestamp = rawTimestamp
        var sensor20hzDataEntry = {
          timestamp: timestamp + bulkData.sensorOffsetTimestamp,
          magn_x: buf.readFloatLE(cursor + 4),
          magn_y: buf.readFloatLE(cursor + 8),
          magn_z: buf.readFloatLE(cursor + 12)
        }
        bulkData.sensorData20hz.push(sensor20hzDataEntry)
        // } else {
        //   console.log('WARNING! Potentially corrupted 100hz data')
        // }
        // console.log(sensor20hzDataEntry.timestamp)
        cursor += 16
      } catch (e) {
        console.log(e)
        console.log(buf.slice(cursor, buf.length).toString('hex'))
        console.log(`20hz timestamp=${sensor100hzDataEntry.timestamp} buf.length=${buf.length} cursor ${cursor}`)
      }
    }
  }
  // console.log(bulkData)
  return bulkData
}

function readUInt64LE (buf, offset) {
  var tempBuf = Buffer.alloc(8)
  buf.copy(tempBuf, 0, offset, offset + 8)
  var uint64 = new Uint64LE(tempBuf)
  return uint64.toNumber()
  // var ans
  // // try {
  //   ans = int53.readUInt64LE(buf, offset)

  // return ans
}

function mac2Id (mac) {
  return Buffer.from([
    Buffer.from(mac.substring(6, 8), 16),
    Buffer.from(mac.substring(9, 11), 16),
    Buffer.from(mac.substring(12, 14), 16),
    Buffer.from(mac.substring(15, 17), 16)
  ].join('')).readUInt32LE(0)
}
