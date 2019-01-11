'use strict'
const Database = require('better-sqlite3')
// const Promise = require('bluebird')
const db = new Database('./userActivityData.db')
const fs = require('fs')
var dbInit = fs.readFileSync('./dbInit.sql')
db.exec(dbInit.toString())

var insertSensorData100HzStatement = db.prepare(`INSERT INTO SensorData100Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, quat_w, quat_x, quat_y, quat_z, gyro_x, gyro_y, gyro_z, lacc_x, lacc_y, lacc_z, acc_x, acc_y, acc_z)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
var insertSensorData20HzStatement = db.prepare(`INSERT INTO SensorData20Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, mag_x, mag_y, mag_z)
      VALUES(?, ?, ?, ?, ?, ?, ?)`)
var insertSensorData1HzStatement = db.prepare(`INSERT INTO SensorData1Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, temp)
      VALUES(?, ?, ?, ?, ?)`)
var insertHealthStatement = db.prepare(`INSERT INTO SensorFreq(server_id, sensor_id, server_timestamp, frequency)
      VALUES(?, ?, ?, ?)`)

function insertSensorData100Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  insertSensorData100HzStatement
  .run([serverId, sensorId, sensorTimestamp, serverTimestamp, data.quat.w, data.quat.x, data.quat.y, data.quat.z, data.gyro.x, data.gyro.y, data.gyro.z, data.lacc.x, data.lacc.y, data.lacc.z, data.acc.x, data.acc.y, data.acc.z])
}
function insertSensorData20Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  insertSensorData20HzStatement
  .run([serverId, sensorId, sensorTimestamp, serverTimestamp, data.mag.x, data.mag.y, data.mag.z])
}

function insertSensorData1Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  insertSensorData1HzStatement
  .run([serverId, sensorId, sensorTimestamp, serverTimestamp, data.temp])
}
function insertHealth (serverId, sensorId, serverTimestamp, freq) {
  insertHealthStatement
  .run([serverId, sensorId, serverTimestamp, freq])
}

module.exports = {
  insertSensorData100Hz: insertSensorData100Hz,
  insertSensorData20Hz: insertSensorData20Hz,
  insertSensorData1Hz: insertSensorData1Hz,
  insertHealth: insertHealth
}
