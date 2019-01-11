'use strict'
const Promise = require('bluebird')
const db = require('sqlite')
const fs = require('fs')
const UPDATE_INTERVAL = 1000
const dbInit = fs.readFileSync('./dbInit.sql').toString()
var dbPromise = db.open('./userActivityData.db', {Promise})
dbPromise = dbPromise.then(() => db.exec(dbInit))

const insertSensorData100HzQuery = 'INSERT INTO SensorData100Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, quat_w, quat_x, quat_y, quat_z, gyro_x, gyro_y, gyro_z, lacc_x, lacc_y, lacc_z, acc_x, acc_y, acc_z) VALUES\n'
const insertSensorData20HzQuery = 'INSERT INTO SensorData20Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, mag_x, mag_y, mag_z) VALUES\n'
const insertSensorData1HzQuery = 'INSERT INTO SensorData1Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, temp) VALUES\n'
const insertHealthQuery = 'INSERT INTO SensorFreq(server_id, sensor_id, server_timestamp, frequency) VALUES\n'
var sensorData100HzBuf = ''
var sensorData20HzBuf = ''
var sensorData1HzBuf = ''
var healthBuff = ''

function insertSensorData100Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  if (sensorData100HzBuf.length === 0) {
    sensorData100HzBuf = [sensorData100HzBuf, '(', [serverId, sensorId, sensorTimestamp, serverTimestamp, data.quat.w, data.quat.x, data.quat.y, data.quat.z, data.gyro.x, data.gyro.y, data.gyro.z, data.lacc.x, data.lacc.y, data.lacc.z, data.acc.x, data.acc.y, data.acc.z].join(', '), ')'].join('')
  } else {
    sensorData100HzBuf = [sensorData100HzBuf, ',\n(', [serverId, sensorId, sensorTimestamp, serverTimestamp, data.quat.w, data.quat.x, data.quat.y, data.quat.z, data.gyro.x, data.gyro.y, data.gyro.z, data.lacc.x, data.lacc.y, data.lacc.z, data.acc.x, data.acc.y, data.acc.z].join(', '), ')'].join('')
  }
}

function insertSensorData20Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  if (sensorData20HzBuf.length === 0) {
    sensorData20HzBuf = [sensorData20HzBuf, '(', [serverId, sensorId, sensorTimestamp, serverTimestamp, data.mag.x, data.mag.y, data.mag.z].join(', '), ')'].join('')
  } else {
    sensorData20HzBuf = [sensorData20HzBuf, ',\n(', [serverId, sensorId, sensorTimestamp, serverTimestamp, data.mag.x, data.mag.y, data.mag.z].join(', '), ')'].join('')
  }
}

function insertSensorData1Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  if (sensorData1HzBuf.length === 0) {
    sensorData1HzBuf = [sensorData1HzBuf, '(', [serverId, sensorId, sensorTimestamp, serverTimestamp, data.temp].join(', '), ')'].join('')
  } else {
    sensorData1HzBuf = [sensorData1HzBuf, ',\n(', [serverId, sensorId, sensorTimestamp, serverTimestamp, data.temp].join(', '), ')'].join('')
  }
}
function insertHealth (serverId, sensorId, serverTimestamp, freq) {
  if (healthBuff.length === 0) {
    healthBuff = [healthBuff, '(', [serverId, sensorId, serverTimestamp, freq].join(', '), ')'].join('')
  } else {
    healthBuff = [healthBuff, ',\n(', [serverId, sensorId, serverTimestamp, freq].join(', '), ')'].join('')
  }
}

setInterval(() => {
  var query = ''
  if (sensorData100HzBuf.length > 0) {
    query = [query, insertSensorData100HzQuery, sensorData100HzBuf, ';\n'].join('')
  }
  if (sensorData20HzBuf.length > 0) {
    query = [query, insertSensorData20HzQuery, sensorData20HzBuf, ';\n'].join('')
  }
  if (sensorData1HzBuf.length > 0) {
    query = [query, insertSensorData1HzQuery, sensorData1HzBuf, ';\n'].join('')
  }
  if (healthBuff.length > 0) {
    query = [query, insertHealthQuery, healthBuff, ';\n'].join('')
  }
  // console.log(query)
  if (query.length > 0) {
    // console.log('--------------------------')
    // console.log(query)
    dbPromise = dbPromise.then(() => {
      db.exec(query)
      query = null
    })
    .catch(e => {
      console.log(e)
    })
  }
  sensorData100HzBuf = ''
  sensorData20HzBuf = ''
  sensorData1HzBuf = ''
  healthBuff = ''
}, UPDATE_INTERVAL)

module.exports = {
  insertSensorData100Hz: insertSensorData100Hz,
  insertSensorData20Hz: insertSensorData20Hz,
  insertSensorData1Hz: insertSensorData1Hz,
  insertHealth: insertHealth
}
