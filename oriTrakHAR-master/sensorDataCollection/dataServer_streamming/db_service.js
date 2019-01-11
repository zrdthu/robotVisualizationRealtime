'use strict'
const Promise = require('bluebird')
const db = require('sqlite')
const fs = require('fs')
const UPDATE_INTERVAL = 600
const dbInit = fs.readFileSync('./dbInit.sql').toString()
var dbPromise = db.open('./userActivityData.db', {Promise})
dbPromise.then(() => db.exec(dbInit))
dbPromise = startTransaction(dbPromise)

var insertSensorData100HzStmt
var insertSensorData20HzStmt
var insertSensorData1HzStmt
var insertHealthStmt

function insertSensorData100Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(() => insertSensorData100HzStmt.run([serverId, sensorId, sensorTimestamp, serverTimestamp, data.quat.w, data.quat.x, data.quat.y, data.quat.z, data.gyro.x, data.gyro.y, data.gyro.z, data.lacc.x, data.lacc.y, data.lacc.z, data.acc.x, data.acc.y, data.acc.z]))
}

function insertSensorData20Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(() => insertSensorData20HzStmt.run([serverId, sensorId, sensorTimestamp, serverTimestamp, data.mag.x, data.mag.y, data.mag.z]))
}

function insertSensorData1Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(() => insertSensorData1HzStmt.run([serverId, sensorId, sensorTimestamp, serverTimestamp, data.temp]))
}
function insertHealth (serverId, sensorId, serverTimestamp, freq) {
  dbPromise = dbPromise.then(() => insertHealthStmt.run([serverId, sensorId, serverTimestamp, freq]))
}

setInterval(() => {
  dbPromise = startTransaction(dbPromise.then(() => db.run('commit')))
}, UPDATE_INTERVAL)

function startTransaction (p) {
  return p.then(() => db.run('BEGIN TRANSACTION'))
  .then(() => {
    return db.prepare('INSERT INTO SensorData100Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, quat_w, quat_x, quat_y, quat_z, gyro_x, gyro_y, gyro_z, lacc_x, lacc_y, lacc_z, acc_x, acc_y, acc_z) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  }).then(stmt => {
    insertSensorData100HzStmt = stmt
    return db.prepare('INSERT INTO SensorData20Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, mag_x, mag_y, mag_z) VALUES(?, ?, ?, ?, ?, ?, ?)')
  }).then(stmt => {
    insertSensorData20HzStmt = stmt
    return db.prepare('INSERT INTO SensorData1Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, temp) VALUES(?, ?, ?, ?, ?)')
  }).then(stmt => {
    insertSensorData1HzStmt = stmt
    return db.prepare('INSERT INTO SensorFreq(server_id, sensor_id, server_timestamp, frequency) VALUES(?, ?, ?, ?)')
  }).then(stmt => {
    insertHealthStmt = stmt
  })
}

module.exports = {
  insertSensorData100Hz: insertSensorData100Hz,
  insertSensorData20Hz: insertSensorData20Hz,
  insertSensorData1Hz: insertSensorData1Hz,
  insertHealth: insertHealth
}
