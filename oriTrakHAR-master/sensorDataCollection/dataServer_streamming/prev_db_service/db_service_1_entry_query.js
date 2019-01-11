'use strict'
const Promise = require('bluebird')
const sqlite = require('sqlite')
const fs = require('fs')
const dbInit = fs.readFileSync('./dbInit.sql').toString()

var dbPromise = sqlite.open('./userActivityData.db', {Promise})
.then(db => {
  return db.exec(dbInit)
})

function insertSensorData100Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(() => {
    var promise = sqlite.run(`INSERT INTO SensorData100Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, quat_w, quat_x, quat_y, quat_z, gyro_x, gyro_y, gyro_z, lacc_x, lacc_y, lacc_z, acc_x, acc_y, acc_z)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [serverId, sensorId, sensorTimestamp, serverTimestamp, data.quat.w, data.quat.x, data.quat.y, data.quat.z, data.gyro.x, data.gyro.y, data.gyro.z, data.lacc.x, data.lacc.y, data.lacc.z, data.acc.x, data.acc.y, data.acc.z])
    data = null
    return promise
  })
}

function insertSensorData20Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(() => {
    var promise = sqlite.run(`INSERT INTO SensorData20Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, mag_x, mag_y, mag_z)
        VALUES(?, ?, ?, ?, ?, ?, ?)`,
        [serverId, sensorId, sensorTimestamp, serverTimestamp, data.mag.x, data.mag.y, data.mag.z])
    data = null
    return promise
  })
}

function insertSensorData1Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(() => {
    var promise = sqlite.run(`INSERT INTO SensorData1Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, temp)
      VALUES(?, ?, ?, ?, ?)`,
      [serverId, sensorId, sensorTimestamp, serverTimestamp, data.temp])
    data = null
    return promise
  })
}
function insertHealth (serverId, sensorId, serverTimestamp, freq) {
  var promise = sqlite.run(`INSERT INTO SensorFreq(server_id, sensor_id, server_timestamp, frequency)
    VALUES(?, ?, ?, ?)`,
    [serverId, sensorId, serverTimestamp, freq])
  return promise
}

module.exports = {
  insertSensorData100Hz: insertSensorData100Hz,
  insertSensorData20Hz: insertSensorData20Hz,
  insertSensorData1Hz: insertSensorData1Hz,
  insertHealth: insertHealth
}
