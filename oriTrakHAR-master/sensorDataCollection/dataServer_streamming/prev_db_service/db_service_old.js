'use strict'
const sqlite3 = require('sqlite3').verbose()
const Promise = require('bluebird')
const db = new sqlite3.Database('./userActivityData.db')

function runQueryGen (db) {
  return function runQuery (sql, params) {
    return new Promise((resolve, reject) => {
      db.run(sql, params || [], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
      sql = null
      params = null
    })
    .catch(e => {
      console.log(e)
    })
  }
}

function allQueryGen (db) {
  return function runQuery (sql, params) {
    return new Promise((resolve, reject) => {
      db.all(sql, params || [], (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
      sql = null
      params = null
    })
    .catch(e => {
      console.log(e)
    })
  }
}

db.runQuery = runQueryGen(db)
db.allQuery = allQueryGen(db)

var dbPromise = db.runQuery(`
  CREATE TABLE IF NOT EXISTS SensorData100Hz(
    id               INTEGER PRIMARY KEY,
    server_id        INTEGER NOT NULL,
    sensor_id        INTEGER NOT NULL,
    sensor_timestamp INTEGER NOT NULL,
    server_timestamp INTEGER NOT NULL,
    quat_w           REAL NOT NULL,
    quat_x           REAL NOT NULL,
    quat_y           REAL NOT NULL,
    quat_z           REAL NOT NULL,
    gyro_x           REAL NOT NULL,
    gyro_y           REAL NOT NULL,
    gyro_z           REAL NOT NULL,
    lacc_x           REAL NOT NULL,
    lacc_y           REAL NOT NULL,
    lacc_z           REAL NOT NULL,
    acc_x            REAL NOT NULL,
    acc_y            REAL NOT NULL,
    acc_z            REAL NOT NULL
  );`)
.then(res => {
  return db.runQuery(`
    CREATE TABLE IF NOT EXISTS SensorData20Hz(
        id               INTEGER PRIMARY KEY,
        server_id        INTEGER NOT NULL,
        sensor_id        INTEGER NOT NULL,
        sensor_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER NOT NULL,
        mag_x            REAL NOT NULL,
        mag_y            REAL NOT NULL,
        mag_z            REAL NOT NULL
    );`)
})
.then(res => {
  return db.runQuery(`
    CREATE TABLE IF NOT EXISTS SensorData1Hz(
        id               INTEGER PRIMARY KEY,
        server_id        INTEGER NOT NULL,
        sensor_id        INTEGER NOT NULL,
        sensor_timestamp INTEGER NOT NULL,
        server_timestamp INTEGER NOT NULL,
        temp             INTEGER NOT NULL
    );`)
})

.then(res => {
  return db.runQuery(`
    CREATE TABLE IF NOT EXISTS SensorFreq(
        id               INTEGER PRIMARY KEY,
        server_id        INTEGER NOT NULL,
        sensor_id        INTEGER NOT NULL,
        server_timestamp INTEGER NOT NULL,
        frequency        INTEGER NOT NULL
    );`)
})

.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS sensor_timestamp_100 on SensorData100Hz(sensor_timestamp);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS server_timestamp_100 on SensorData100Hz(server_timestamp);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS sensor_timestamp_20 on SensorData20Hz(sensor_timestamp);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS SensorFreq_server_timestamp on SensorFreq(server_timestamp);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS server_timestamp_20 on SensorData20Hz(server_timestamp);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS sensor_timestamp_1 on SensorData1Hz(sensor_timestamp);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS server_timestamp_1 on SensorData1Hz(server_timestamp);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS id_100 on SensorData100Hz(sensor_id, server_id);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS id_20 on SensorData20Hz(sensor_id, server_id);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS id_1 on SensorData1Hz(sensor_id, server_id);`)
})
.then(res => {
  return db.runQuery(`
  CREATE INDEX IF NOT EXISTS SensorFreq_id on SensorFreq(sensor_id, server_id);`)
})

function insertSensorData100Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(res => {
    // console.log(data)
    var promise = db.runQuery(`INSERT INTO SensorData100Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, quat_w, quat_x, quat_y, quat_z, gyro_x, gyro_y, gyro_z, lacc_x, lacc_y, lacc_z, acc_x, acc_y, acc_z)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [serverId, sensorId, sensorTimestamp, serverTimestamp, data.quat.w, data.quat.x, data.quat.y, data.quat.z, data.gyro.x, data.gyro.y, data.gyro.z, data.lacc.x, data.lacc.y, data.lacc.z, data.acc.x, data.acc.y, data.acc.z])
    data = null
    return promise
  })
}

function insertSensorData20Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(res => {
    var promise = db.runQuery(`INSERT INTO SensorData20Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, mag_x, mag_y, mag_z)
      VALUES(?, ?, ?, ?, ?, ?, ?)`,
      [serverId, sensorId, sensorTimestamp, serverTimestamp, data.mag.x, data.mag.y, data.mag.z])
    data = null
    return promise
  })
}

function insertSensorData1Hz (serverId, sensorId, sensorTimestamp, serverTimestamp, data) {
  dbPromise = dbPromise.then(res => {
    var promise = db.runQuery(`INSERT INTO SensorData1Hz(server_id, sensor_id, sensor_timestamp, server_timestamp, temp)
      VALUES(?, ?, ?, ?, ?)`,
      [serverId, sensorId, sensorTimestamp, serverTimestamp, data.temp])
    data = null
    return promise
  })
}
function insertHealth (serverId, sensorId, serverTimestamp, freq) {
  dbPromise = dbPromise.then(res => {
    var promise = db.runQuery(`INSERT INTO SensorFreq(server_id, sensor_id, server_timestamp, frequency)
      VALUES(?, ?, ?, ?)`,
      [serverId, sensorId, serverTimestamp, freq])
    freq = null
    return promise
  })
}
module.exports = {
  insertSensorData100Hz: insertSensorData100Hz,
  insertSensorData20Hz: insertSensorData20Hz,
  insertSensorData1Hz: insertSensorData1Hz,
  insertHealth: insertHealth
}
