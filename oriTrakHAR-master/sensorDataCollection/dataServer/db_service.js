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
var insertSensorMessageStmt

function insertSensorData100Hz (serverId, sensorId, serverSendTimestamp, data) {
  dbPromise = dbPromise.then(() => insertSensorData100HzStmt.run([serverId, sensorId, serverSendTimestamp, data.syncedTimestamp, data.timestamp, data.quat_w, data.quat_x, data.quat_y, data.quat_z, data.gyro_x, data.gyro_y, data.gyro_z, data.acc_x, data.acc_y, data.acc_z]))
  .catch(e => {
    console.log('insertSensorData100Hz Error:')
    console.log(e)
  })
}

function insertSensorData20Hz (serverId, sensorId, serverSendTimestamp, data) {
  dbPromise = dbPromise.then(() => insertSensorData20HzStmt.run([serverId, sensorId, serverSendTimestamp, data.syncedTimestamp, data.timestamp, data.magn_x, data.magn_y, data.magn_z]))
  .catch(e => {
    console.log('insertSensorData20Hz Error:')
    console.log(e)
  })
}

function insertSensorMessage (serverId, sensorId, serverSendTimestamp, clientRecvTimestamp, clientSendTimestamp, serverRecvTimestamp, num100hzData, num20hzData) {
  dbPromise = dbPromise.then(() => insertSensorMessageStmt.run([serverId, sensorId, serverSendTimestamp, clientRecvTimestamp, clientSendTimestamp, serverRecvTimestamp, num100hzData, num20hzData]))
  .catch(e => {
    console.log('insertSensorMessage Error:')
    console.log(e)
  })
}

setInterval(() => {
  dbPromise = startTransaction(dbPromise.then(() => db.run('commit')))
}, UPDATE_INTERVAL)

function startTransaction (p) {
  return p.then(() => db.run('BEGIN TRANSACTION'))
  .then(() => {
    return db.prepare('INSERT INTO SensorData100Hz(server_id, sensor_id, server_send_timestamp, sensor_synced_timestamp, sensor_raw_timestamp, quat_w, quat_x, quat_y, quat_z, gyro_x, gyro_y, gyro_z, acc_x, acc_y, acc_z) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  }).then(stmt => {
    insertSensorData100HzStmt = stmt
    return db.prepare('INSERT INTO SensorData20Hz(server_id, sensor_id, server_send_timestamp, sensor_synced_timestamp, sensor_raw_timestamp, magn_x, magn_y, magn_z) VALUES(?, ?, ?, ?, ?, ?, ?, ?)')
  }).then(stmt => {
    insertSensorData20HzStmt = stmt
    return db.prepare('INSERT INTO SensorMessage(server_id, sensor_id, server_send_timestamp, client_recv_timestamp, client_send_timestamp, server_recv_timestamp, num_100hz_data, num_20hz_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  }).then(stmt => {
    insertSensorMessageStmt = stmt
  })
}

module.exports = {
  insertSensorData100Hz: insertSensorData100Hz,
  insertSensorData20Hz: insertSensorData20Hz,
  insertSensorMessage: insertSensorMessage
}
