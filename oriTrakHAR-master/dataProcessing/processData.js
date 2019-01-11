'use strict'
const Promise = require('bluebird')
const db = require('sqlite')
const config = require('./config')
const fs = require('fs')
const csv = require('csv-stream')
const spline = require('cubic-spline')
const THREE = require('three.js-node')
const outputDbInit = fs.readFileSync('./initOutputDb.sql').toString()
var insertPhoneStatement
var insertGPSStatement
var csvStream = csv.createStream({})
var dbPromiseRaw = db.open(config.SOURCE_PATH, {Promise})
var dbPromiseOutput = db.open(config.OUTPUT_PATH, {Promise})

var lastGPSTimestamp
var sensorList
var startTime
var endTime
var torsoId
var headOffset = config.DEFAULT_HEAD_OFFSET
var torsoOffset = config.DEFAULT_TORSO_OFFSET
var server_id = 842283059
var sourceDb
var outputDb
// dbPromise
//
Promise.all([dbPromiseRaw, dbPromiseOutput])
.then(([source, output]) => {
  sourceDb = source
  outputDb = output
  return outputDb.exec(outputDbInit)
})
// .then(insertPhoneData)
.then(() => {
  console.log(`${new Date()} start preprocessing`)
  return sourceDb.all(`SELECT * FROM NUM_DATA`)
})
.then(data => {
  var localTorsoId
  sensorList = data
  server_id = data[0].server_id
  sensorList.forEach(sensor => {
    sensor.name = config.SENSOR_DICT[sensor.sensor_id.toString()]
    if (sensor.name === 'torso') {
      localTorsoId = sensor.sensor_id
    }
  })
  console.log(sensorList)
  torsoId = localTorsoId
})
.then(() => sourceDb.all(`SELECT MIN(sensor_synced_timestamp) AS minTimestamp FROM SensorData100Hz WHERE sensor_id = ${torsoId}`))
.then(data => {
  console.log(data)
  startTime = data[0].minTimestamp + config.TIME_OFFSET
})
.then(() => sourceDb.all(`SELECT MAX(sensor_synced_timestamp) AS maxTimestamp FROM SensorData100Hz WHERE sensor_id = ${torsoId}`))
.then(data => {
  console.log(data)
  endTime = data[0].maxTimestamp
})
.then(() => {
  console.log(`startTime: ${startTime} endTime: ${endTime}`)
  startTime = Math.ceil(startTime / 10000) * 10000
  endTime = Math.floor(endTime / 10000) * 10000
  console.log(`rounded startTime: ${startTime} endTime: ${endTime}`)
})
.then(() => {
  // var resolve
  // var reject
  // var promise = new Promise((res, rej) => {
  //   resolve = res
  //   reject = rej
  // })

  // var dbExecQueue = Promise.resolve()
  var timeStarts = []
  for (var i = startTime; i < endTime; i += config.PROCESSING_BATCH_SIZE) {
    timeStarts.push(i)
  }

  return Promise.each(timeStarts, (queryStartTime, index, length) => {
    if (index % 100 === 0) {
      console.log(`Processing: ${index} / ${length} --- ${index / length * 100}%`)
    }
    if (index === length - 1) {
      console.log(`${new Date()} Processing: ${index} / ${length} --- 100% finishing...`)
    }
    var correctedStartTime = queryStartTime === startTime ? startTime : (queryStartTime - 100000)
    var correctedEndTime = (queryStartTime + config.PROCESSING_BATCH_SIZE + 100000) >= endTime ? endTime : (queryStartTime + config.PROCESSING_BATCH_SIZE + 100000)

    return retrieve100HzData(correctedStartTime, correctedEndTime)
    .then(data => {
      var insert100HZStmt
      return outputDb.run('BEGIN TRANSACTION')
      .then(() => {
        return outputDb.prepare('INSERT OR REPLACE INTO Preprocessed100HZData(interpolated_fixed_rate_time, server_id, torso_quat_w, torso_quat_x, torso_quat_y, torso_quat_z, torso_gyro_x, torso_gyro_y, torso_gyro_z, torso_acc_x, torso_acc_y, torso_acc_z, torso_acc_mag, torso_gyro_mag, torso_yaw, torso_pitch, torso_roll, head_quat_w, head_quat_x, head_quat_y, head_quat_z, head_gyro_x, head_gyro_y, head_gyro_z, head_acc_x, head_acc_y, head_acc_z, head_acc_mag, head_gyro_mag, head_yaw, head_pitch, head_roll, head_relative_yaw, head_relative_pitch, head_relative_roll, left_quat_w, left_quat_x, left_quat_y, left_quat_z, left_gyro_x, left_gyro_y, left_gyro_z, left_acc_x, left_acc_y, left_acc_z, left_acc_mag, left_gyro_mag, left_roll, left_yaw, left_pitch, left_relative_yaw, left_relative_pitch, left_relative_roll, right_quat_w, right_quat_x, right_quat_y, right_quat_z, right_gyro_x, right_gyro_y, right_gyro_z, right_acc_x, right_acc_y, right_acc_z, right_acc_mag, right_gyro_mag, right_roll, right_yaw, right_pitch, right_relative_yaw, right_relative_pitch, right_relative_roll) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      })
      .then(stmt => {
        insert100HZStmt = stmt
      })
      .then(() => {
        var seperatedData = {}
        sensorList.forEach(sensorInfo => {
          seperatedData[sensorInfo.name] = data.filter(row => row.sensor_id === sensorInfo.sensor_id)
        })
        attachDataInterpo(seperatedData.torso)
        attachDataInterpo(seperatedData.head)
        attachDataInterpo(seperatedData.leftArm)
        attachDataInterpo(seperatedData.rightArm)
        // console.log(`get data! times: ${queryStartTime}`)
        var fixredRateTime = []
        for (var i = queryStartTime; i < queryStartTime + config.PROCESSING_BATCH_SIZE; i += 10000) {
          fixredRateTime.push(i)
        }
        function processRow (t) {
          // console.log(`------------------------\nprocessRow: ${t}`)
          var correctedTorsoQuat
          var correctedHeadQuat

          var torsoQuatw = null
          var torsoQuatx = null
          var torsoQuaty = null
          var torsoQuatz = null
          var torsoGyrox = null
          var torsoGyroy = null
          var torsoGyroz = null
          var torsoAccx = null
          var torsoAccy = null
          var torsoAccz = null
          var torsoAccMag = null
          var torsoGyroMag = null
          var torsoYaw = null
          var torsoPitch = null
          var torsoRoll = null

          var headQuatw = null
          var headQuatx = null
          var headQuaty = null
          var headQuatz = null
          var headGyrox = null
          var headGyroy = null
          var headGyroz = null
          var headAccx = null
          var headAccy = null
          var headAccz = null
          var headAccMag = null
          var headGyroMag = null
          var headYaw = null
          var headPitch = null
          var headRoll = null
          var headRelativeYaw = null
          var headRelativePitch = null
          var headRelativeRoll = null

          var leftQuatw = null
          var leftQuatx = null
          var leftQuaty = null
          var leftQuatz = null
          var leftGyrox = null
          var leftGyroy = null
          var leftGyroz = null
          var leftAccx = null
          var leftAccy = null
          var leftAccz = null
          var leftAccMag = null
          var leftGyroMag = null
          var leftYaw = null
          var leftPitch = null
          var leftRoll = null
          var leftRelativeYaw = null
          var leftRelativePitch = null
          var leftRelativeRoll = null

          var rightQuatw = null
          var rightQuatx = null
          var rightQuaty = null
          var rightQuatz = null
          var rightGyrox = null
          var rightGyroy = null
          var rightGyroz = null
          var rightAccx = null
          var rightAccy = null
          var rightAccz = null
          var rightAccMag = null
          var rightGyroMag = null
          var rightYaw = null
          var rightPitch = null
          var rightRoll = null
          var rightRelativeYaw = null
          var rightRelativePitch = null
          var rightRelativeRoll = null

          var torsoQuat = interpolateWith(seperatedData.torso.quat_inter, t)
          var headQuat = interpolateWith(seperatedData.head.quat_inter, t)
          var leftQuat = interpolateWith(seperatedData.leftArm.quat_inter, t)
          var rightQuat = interpolateWith(seperatedData.rightArm.quat_inter, t)
          // console.log(`torsoQuat: ${JSON.stringify(torsoQuat)} \nheadQuat: ${JSON.stringify(headQuat)} \nleftQuat: ${JSON.stringify(leftQuat)} \nrightQuat: ${JSON.stringify(rightQuat)}`)
          // console.log(`torsoQuat: ${JSON.stringify(torsoQuat)}`)
          var insertTorsoHist = Promise.resolve()
          let torsoQuatValid = (torsoQuat.w !== null) && !((torsoQuat.w === torsoQuat.x) && (torsoQuat.w === torsoQuat.y) && (torsoQuat.w === torsoQuat.z))
          if (torsoQuatValid) {
            correctedTorsoQuat = getQuaternionProduct(torsoQuat, torsoOffset)
            torsoQuatw = correctedTorsoQuat.w
            torsoQuatx = correctedTorsoQuat.x
            torsoQuaty = correctedTorsoQuat.y
            torsoQuatz = correctedTorsoQuat.z
            torsoGyrox = interpolateWith(seperatedData.torso.gyro_x_inter, t)
            torsoGyroy = interpolateWith(seperatedData.torso.gyro_y_inter, t)
            torsoGyroz = interpolateWith(seperatedData.torso.gyro_z_inter, t)
            torsoAccx = interpolateWith(seperatedData.torso.acc_x_inter, t)
            torsoAccy = interpolateWith(seperatedData.torso.acc_y_inter, t)
            torsoAccz = interpolateWith(seperatedData.torso.acc_z_inter, t)

            torsoAccMag = vector3DMag(torsoAccx, torsoAccy, torsoAccz)
            torsoGyroMag = vector3DMag(torsoGyrox, torsoGyroy, torsoGyroz)

            var torsoEuler = calcYawPitchRoll(correctedTorsoQuat)
            torsoYaw = torsoEuler.yaw
            torsoPitch = torsoEuler.pitch
            torsoRoll = torsoEuler.roll

            if (torsoAccMag < config.FREE_FALL_ACC_THRESHOLD) {
              torsoCalibrate(torsoQuat)
            }
            // var torsoYawBin = determineBin(torsoYaw, -180, 175, 5)
            // var torsoPitchBin = determineBin(torsoPitch, -90, 85, 5)
            // var torsoRollBin = determineBin(torsoRoll, -180, 175, 5)
            // insertTorsoHist = db.run(genHistInsert(t, 'Torso', torsoYawBin, torsoPitchBin, torsoRollBin))
          }
          var insertHeadHist = Promise.resolve()
          var insertReHeadHist = Promise.resolve()
          let headQuatValid = (headQuat.w !== null) && !((headQuat.w === headQuat.x) && (headQuat.w === headQuat.y) && (headQuat.w === headQuat.z))

          if (headQuatValid) {
            correctedHeadQuat = getQuaternionProduct(headQuat, headOffset)
            headQuatw = correctedHeadQuat.w
            headQuatx = correctedHeadQuat.x
            headQuaty = correctedHeadQuat.y
            headQuatz = correctedHeadQuat.z
            headGyrox = interpolateWith(seperatedData.head.gyro_x_inter, t)
            headGyroy = interpolateWith(seperatedData.head.gyro_y_inter, t)
            headGyroz = interpolateWith(seperatedData.head.gyro_z_inter, t)
            headAccx = interpolateWith(seperatedData.head.acc_x_inter, t)
            headAccy = interpolateWith(seperatedData.head.acc_y_inter, t)
            headAccz = interpolateWith(seperatedData.head.acc_z_inter, t)

            headAccMag = vector3DMag(headAccx, headAccy, headAccz)
            headGyroMag = vector3DMag(headGyrox, headGyroy, headGyroz)

            var headEuler = calcYawPitchRoll(correctedHeadQuat)
            headYaw = headEuler.yaw
            headPitch = headEuler.pitch
            headRoll = headEuler.roll
            // var headYawBin = determineBin(headYaw, -180, 175, 5)
            // var headPitchBin = determineBin(headPitch, -90, 85, 5)
            // var headRollBin = determineBin(headRoll, -180, 175, 5)
            // insertHeadHist = db.run(genHistInsert(t, 'Head', headYawBin, headPitchBin, headRollBin))

            if (torsoQuatValid) {
              var headRelative = calcYawPitchRoll(q12q2(correctedTorsoQuat, correctedHeadQuat))
              headRelativeYaw = headRelative.yaw
              headRelativePitch = headRelative.pitch
              headRelativeRoll = headRelative.roll
              // var headReYawBin = determineBin(headRelativeYaw, -180, 175, 5)
              // var headRePitchBin = determineBin(headRelativePitch, -90, 85, 5)
              // var headReRollBin = determineBin(headRelativeRoll, -180, 175, 5)
              // insertReHeadHist = db.run(genHistInsert(t, 'RelativeHead', headReYawBin, headRePitchBin, headReRollBin))
              if (headAccMag < config.FREE_FALL_ACC_THRESHOLD) {
                headCalibrate(headQuat)
              }
            }
          }
          var insertLeftHist = Promise.resolve()
          var insertReLeftHist = Promise.resolve()
          let leftQuatValid = (leftQuat.w !== null) && !((leftQuat.w === leftQuat.x) && (leftQuat.w === leftQuat.y) && (leftQuat.w === leftQuat.z))

          if (leftQuatValid) {
            leftQuatw = leftQuat.w
            leftQuatx = leftQuat.x
            leftQuaty = leftQuat.y
            leftQuatz = leftQuat.z
            leftGyrox = interpolateWith(seperatedData.leftArm.gyro_x_inter, t)
            leftGyroy = interpolateWith(seperatedData.leftArm.gyro_y_inter, t)
            leftGyroz = interpolateWith(seperatedData.leftArm.gyro_z_inter, t)
            leftAccx = interpolateWith(seperatedData.leftArm.acc_x_inter, t)
            leftAccy = interpolateWith(seperatedData.leftArm.acc_y_inter, t)
            leftAccz = interpolateWith(seperatedData.leftArm.acc_z_inter, t)

            leftAccMag = vector3DMag(leftAccx, leftAccy, leftAccz)
            leftGyroMag = vector3DMag(leftGyrox, leftGyroy, leftGyroz)
            var leftEuler = calcYawPitchRoll(leftQuat)
            leftYaw = leftEuler.yaw
            leftPitch = leftEuler.pitch
            leftRoll = leftEuler.roll
            // var leftYawBin = determineBin(leftYaw, -180, 175, 5)
            // var leftPitchBin = determineBin(leftPitch, -90, 85, 5)
            // var leftRollBin = determineBin(leftRoll, -180, 175, 5)
            // insertLeftHist = db.run(genHistInsert(t, 'Left', leftYawBin, leftPitchBin, leftRollBin))

            if (torsoQuatValid) {
              var leftRelative = calcYawPitchRoll(q12q2(correctedTorsoQuat, leftQuat))
              leftRelativeYaw = leftRelative.yaw
              leftRelativePitch = leftRelative.pitch
              leftRelativeRoll = leftRelative.roll
              // var leftReYawBin = determineBin(leftRelativeYaw, -180, 175, 5)
              // var leftRePitchBin = determineBin(leftRelativePitch, -90, 85, 5)
              // var leftReRollBin = determineBin(leftRelativeRoll, -180, 175, 5)
              // insertReLeftHist = db.run(genHistInsert(t, 'RelativeLeft', leftReYawBin, leftRePitchBin, leftReRollBin))
            }
          }
          var insertRightHist = Promise.resolve()
          var insertReRightHist = Promise.resolve()

          let rightQuatValid = (rightQuat.w !== null) && !((rightQuat.w === rightQuat.x) && (rightQuat.w === rightQuat.y) && (rightQuat.w === rightQuat.z))

          if (rightQuatValid) {
            rightQuatw = rightQuat.w
            rightQuatx = rightQuat.x
            rightQuaty = rightQuat.y
            rightQuatz = rightQuat.z
            rightGyrox = interpolateWith(seperatedData.rightArm.gyro_x_inter, t)
            rightGyroy = interpolateWith(seperatedData.rightArm.gyro_y_inter, t)
            rightGyroz = interpolateWith(seperatedData.rightArm.gyro_z_inter, t)
            rightAccx = interpolateWith(seperatedData.rightArm.acc_x_inter, t)
            rightAccy = interpolateWith(seperatedData.rightArm.acc_y_inter, t)
            rightAccz = interpolateWith(seperatedData.rightArm.acc_z_inter, t)

            rightAccMag = vector3DMag(rightAccx, rightAccy, rightAccz)
            rightGyroMag = vector3DMag(rightGyrox, rightGyroy, rightGyroz)
            var rightEuler = calcYawPitchRoll(rightQuat)
            rightYaw = rightEuler.yaw
            rightPitch = rightEuler.pitch
            rightRoll = rightEuler.roll
            // var rightYawBin = determineBin(rightYaw, -180, 175, 5)
            // var rightPitchBin = determineBin(rightPitch, -90, 85, 5)
            // var rightRollBin = determineBin(rightRoll, -180, 175, 5)
            // insertRightHist = db.run(genHistInsert(t, 'Right', rightYawBin, rightPitchBin, rightRollBin))

            if (torsoQuatValid) {
              var rightRelative = calcYawPitchRoll(q12q2(correctedTorsoQuat, rightQuat))
              rightRelativeYaw = rightRelative.yaw
              rightRelativePitch = rightRelative.pitch
              rightRelativeRoll = rightRelative.roll
              // var rightReYawBin = determineBin(rightRelativeYaw, -180, 175, 5)
              // var rightRePitchBin = determineBin(rightRelativePitch, -90, 85, 5)
              // var rightReRollBin = determineBin(rightRelativeRoll, -180, 175, 5)
              // insertReRightHist = db.run(genHistInsert(t, 'RelativeRight', rightReYawBin, rightRePitchBin, rightReRollBin))
            }
          }
          var insert100HzData = insert100HZStmt.run(t, server_id, torsoQuatw, torsoQuatx, torsoQuaty, torsoQuatz, torsoGyrox, torsoGyroy, torsoGyroz, torsoAccx, torsoAccy, torsoAccz, torsoAccMag, torsoGyroMag, torsoYaw, torsoPitch, torsoRoll, headQuatw, headQuatx, headQuaty, headQuatz, headGyrox, headGyroy, headGyroz, headAccx, headAccy, headAccz, headAccMag, headGyroMag, headYaw, headPitch, headRoll, headRelativeYaw, headRelativePitch, headRelativeRoll, leftQuatw, leftQuatx, leftQuaty, leftQuatz, leftGyrox, leftGyroy, leftGyroz, leftAccx, leftAccy, leftAccz, leftAccMag, leftGyroMag, leftYaw, leftPitch, leftRoll, leftRelativeYaw, leftRelativePitch, leftRelativeRoll, rightQuatw, rightQuatx, rightQuaty, rightQuatz, rightGyrox, rightGyroy, rightGyroz, rightAccx, rightAccy, rightAccz, rightAccMag, rightGyroMag, rightYaw, rightPitch, rightRoll, rightRelativeYaw, rightRelativePitch, rightRelativeRoll)
          // var execQueue = [insert100HzData, insertTorsoHist, insertHeadHist, insertReHeadHist, insertLeftHist, insertReLeftHist, insertRightHist, insertReRightHist]
          // return Promise.all(execQueue, () => {})
          return insert100HzData
        }
        return Promise.map(fixredRateTime, processRow)
      })
      .then(() => outputDb.run('COMMIT'))
    })
  })
})
.then(() => {
  return db.run('PRAGMA optimize')
})

function genHistInsert (timestamp, table, yawBin, pitchBin, rollBin) {
  return `INSERT INTO ${table}HistInfo(timestamp, yaw${yawBin.toString().replace(/-/g, '_')}, pitch${pitchBin.toString().replace(/-/g, '_')}, roll${rollBin.toString().replace(/-/g, '_')}) VALUES(${timestamp},1,1,1)`
}

const torsoZRotate = {
  w: 0.707,
  x: 0,
  y: 0,
  z: 0.707
}

function torsoCalibrate (quat) {
  var offsetTorso = getQuaternionProduct(quat, torsoZRotate)
  var euler = new THREE.Euler().setFromQuaternion(offsetTorso, config.EULER_ORDER)
  euler.x = 0
  euler.z = 0
  var expectedTorsoQuat = new THREE.Quaternion().setFromEuler(euler)
  torsoOffset = q12q2(quat, expectedTorsoQuat)
}

function headCalibrate (quat) {
  var offsetHead = getQuaternionProduct(quat, torsoZRotate)
  var euler = new THREE.Euler().setFromQuaternion(offsetHead, config.EULER_ORDER)
  euler.x = 0
  euler.z = 0
  var expectedHeadQuat = new THREE.Quaternion().setFromEuler(euler)
  headOffset = q12q2(quat, expectedHeadQuat)
}

function interpolateWith (interpolator, j) {
  // console.log(interpolator.evaluate(j))
  try {
    return interpolator.evaluate(j)
  } catch (e) {
    console.log(e)
    return null
  }
}

function calcYawPitchRoll (quat, offset) {
  var euler
  if (quat.w === undefined || quat.w === null) {
    return {yaw: null, pitch: null, roll: null}
  }
  if (offset === undefined) {
    euler = new THREE.Euler().setFromQuaternion(quat, config.EULER_ORDER)
  } else {
    var correctedQuat = getQuaternionProduct(quat, offset)
    euler = new THREE.Euler().setFromQuaternion({ w: correctedQuat.w, x: correctedQuat.x, y: correctedQuat.y, z: correctedQuat.z }, config.EULER_ORDER)
  }
  return {yaw: rad2deg(euler.y), pitch: rad2deg(euler.z), roll: rad2deg(euler.x)}
}

function attachDataInterpo (data) {
  var timeSeries = [] // data.map(rows => data.sensor_synced_timestamp)
  var gyro_x_data = []
  var gyro_y_data = []
  var gyro_z_data = []
  var acc_x_data = []
  var acc_y_data = []
  var acc_z_data = []
  var quat_data = []

  data.forEach(row => {
    timeSeries.push(row.sensor_synced_timestamp)
    gyro_x_data.push(row.gyro_x)
    gyro_y_data.push(row.gyro_y)
    gyro_z_data.push(row.gyro_z)
    acc_x_data.push(row.acc_x)
    acc_y_data.push(row.acc_y)
    acc_z_data.push(row.acc_z)
    quat_data.push({w: row.quat_w, x: row.quat_x, y: row.quat_y, z: row.quat_z})
  })
  // console.log(JSON.stringify(gyro_x_data))
  // console.log(`timeSeries length: ${timeSeries.length} data length: ${gyro_x_data.length}`)

  data.gyro_x_inter = new InterpoCubic(timeSeries, gyro_x_data)
  data.gyro_y_inter = new InterpoCubic(timeSeries, gyro_y_data)
  data.gyro_z_inter = new InterpoCubic(timeSeries, gyro_z_data)
  data.acc_x_inter = new InterpoCubic(timeSeries, acc_x_data)
  data.acc_y_inter = new InterpoCubic(timeSeries, acc_y_data)
  data.acc_z_inter = new InterpoCubic(timeSeries, acc_z_data)
  data.quat_inter = new InterpoQuat(timeSeries, quat_data)
}

function InterpoQuat (timeSeries, data) {
  this.timeSeries = deepCopy(timeSeries)
  this.data = deepCopy(data)
  this.evaluate = function (t) {
    // console.log(`interQuat evaluation called of t: ${t} startTime: ${this.timeSeries[0]} endTime: ${this.timeSeries[this.timeSeries.length - 1]}`)
    // console.log(`evaluate: t ${t} timeSeries: ${JSON.stringify(this.timeSeries)} data: ${JSON.stringify(this.data)}`)
    if (this.timeSeries.length === 0 || this.data.length === 0) {
      return {w: null, x: null, y: null, z: null}
    }
    if (this.timeSeries === null || this.timeSeries === undefined) {
      return {w: null, x: null, y: null, z: null}
    } else if (t < this.timeSeries[0] || t > this.timeSeries[this.timeSeries.length - 1]) {
      return {w: null, x: null, y: null, z: null}
    }
    var i1
    var i2
    for (var i = 0; i < this.timeSeries.length - 1; i++) {
      if ((t >= this.timeSeries[i]) && (t <= this.timeSeries[i + 1])) {
        i1 = i
        i2 = i + 1
        break
      }
    }
    var t1 = this.timeSeries[i1]
    var t2 = this.timeSeries[i2]
    var d1 = this.data[i1]
    var d2 = this.data[i2]
    // console.log(`${JSON.stringify(t1)} ${JSON.stringify(t2)} ${JSON.stringify(d1)} ${JSON.stringify(d2)}`)
    try {
      var q1 = new THREE.Quaternion(d1.x, d1.y, d1.z, d1.w)
      var q2 = new THREE.Quaternion(d2.x, d2.y, d2.z, d2.w)
    } catch (e) {
      console.log(i1)
      console.log((t > this.timeSeries[this.timeSeries.length - 2]) && (t < this.timeSeries[this.timeSeries.length - 1]))
      console.log(this.timeSeries[this.timeSeries.length - 2])
      console.log(this.timeSeries[this.timeSeries.length - 1])
      console.log(`d1: ${d1} evaluate: t ${t} timeSeries: ${JSON.stringify(this.timeSeries)} data: ${JSON.stringify(this.data)}`)
      // console.log(`d1: ${d1} data: ${JSON.str`)
      throw(e)
    }

    q1.slerp(q2, (t - t1) / (t2 - t1))
    // console.log(q1)
    // console.log({w: q1.w, x: q1.x, y: q1.y, z: q1.z})
    return {w: q1.w, x: q1.x, y: q1.y, z: q1.z}
  }
}

function deepCopy (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function InterpoCubic (timeSeries, data) {
  this.timeSeries = deepCopy(timeSeries)
  this.data = deepCopy(data)
  // console.log(`startTime: ${this.timeSeries[0]} endTime: ${this.timeSeries[this.timeSeries.length - 1]}`)
  this.evaluate = function (t) {
    // console.log(`cubic evaluation called of t: ${t} startTime: ${this.timeSeries[0]} endTime: ${this.timeSeries[this.timeSeries.length - 1]}`)
    if (this.timeSeries.length === 0 || this.data.length === 0) {
      console.log('empty data!')
      return null
    }
    // console.log(JSON.stringify(this.timeSeries))
    if (this.timeSeries === null || this.timeSeries === undefined) {
      console.log('empty data!!!')
      return null
    } else if (t < this.timeSeries[0] || t > this.timeSeries[this.timeSeries.length - 1]) {
      console.log('Out of time range')
      return null
    }
    var i1
    var i2
    for (var i = 0; i < this.timeSeries.length - 2; i++) {
      if (t >= this.timeSeries[i] && t < this.timeSeries[i + 1]) {
        i1 = i - 5
        i2 = i + 5
        break
      }
    }
    if (i1 < 0) {
      i1 = 0
    }
    if (i2 > this.timeSeries.length - 1) {
      i2 = this.timeSeries.length - 1
    }

    return spline(t, this.timeSeries.slice(i1, i2), this.data.slice(i1, i2))
  }
}

function rad2deg (rad) {
  return rad * 180 / Math.PI
}

function retrieve100HzData (startTime, endTime) {
  // console.log(`startTime: ${startTime} endTime: ${endTime}`)
  return sourceDb.all(`SELECT * FROM SensorData100Hz WHERE sensor_synced_timestamp >= ${startTime} AND sensor_synced_timestamp <= ${endTime}`)
}

function insertPhoneData () {
  return outputDb.run('BEGIN TRANSACTION')
  .then(() => outputDb.prepare('INSERT OR REPLACE INTO PhoneData(timestamp, activity, activity_confidence, pedometer_num_steps, pedometer_current_pace, pedometer_current_cadence, altimeter_relative_altitude, altimeter_pressure) VALUES(?,?,?,?,?,?,?,?)'))
  .then(stmt => {
    //
    console.log(`${new Date()} inserting phone data`)
    insertPhoneStatement = stmt
    return outputDb.prepare('INSERT OR REPLACE INTO GPSData(location_timestamp, timestamp, location_latitude, location_longitude, location_altitude, location_speed, location_course, location_vertical_accuracy, location_horizontal_accuracy, location_floor) VALUES(?,?,?,?,?,?,?,?,?,?)')
  })
  .then(stmt => {
    insertGPSStatement = stmt
  })
  .then(() => {
    var resolve
    var reject
    var promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    var counter = 0

    var dbExecQueue = Promise.resolve()
    fs.createReadStream(config.CSV_PATH)
    .pipe(csvStream)
    .on('error', err => {
      reject(err)
      console.error(err)
    })
    .on('data', data => {
      counter += 1
      // outputs an object containing a set of key/value pair representing a line found in the csv file.
      // console.log(data)
      // console.log(`activity: ${config.ACTIVITY_DICT[data['activity(txt)']]} ${data['activity(txt)']}`)

      dbExecQueue = dbExecQueue.then(() => {
        return insertPhoneStatement.run([
          new Date(data['loggingTime(txt)']).valueOf(),
          config.ACTIVITY_DICT[data['activity(txt)']],
          data['activityActivityConfidence(Z)'],
          data['pedometerNumberofSteps(N)'],
          data['pedometerCurrentPace(s/m)'],
          data['pedometerCurrentCadence(steps/s)'],
          data['altimeterRelativeAltitude(m)'],
          data['altimeterPressure(kPa)']
        ])
      })
      .then(() => {
        if (data['locationTimestamp_since1970(s)'] !== lastGPSTimestamp) {
          return insertGPSStatement.run([
            data['locationTimestamp_since1970(s)'],
            new Date(data['loggingTime(txt)']).valueOf(),
            data['locationLatitude(WGS84)'],
            data['locationLongitude(WGS84)'],
            data['locationAltitude(m)'],
            data['locationSpeed(m/s)'],
            data['locationCourse(°)'],
            data['locationVerticalAccuracy(m)'],
            data['locationHorizontalAccuracy(m)'],
            data['locationFloor(Z)']
          ])
        }
        lastGPSTimestamp = data['locationTimestamp_since1970(s)']
      })
      .catch(e => {
        console.log(e)
      })

      if (counter % config.NUMBER_RECORDS_TO_INSERT === 0) {
        dbExecQueue = dbExecQueue.then(() => outputDb.run('COMMIT'))
        .then(() => outputDb.run('BEGIN TRANSACTION'))
        .then(() => outputDb.prepare('INSERT OR REPLACE INTO PhoneData(timestamp, activity, activity_confidence, pedometer_num_steps, pedometer_current_pace, pedometer_current_cadence, altimeter_relative_altitude, altimeter_pressure) VALUES(?,?,?,?,?,?,?,?)'))
        .then(stmt => {
          console.log(`${new Date()} inserting phone data`)
          insertPhoneStatement = stmt
          return outputDb.prepare('INSERT OR REPLACE INTO GPSData(location_timestamp, timestamp, location_latitude, location_longitude, location_altitude, location_speed, location_course, location_vertical_accuracy, location_horizontal_accuracy, location_floor) VALUES(?,?,?,?,?,?,?,?,?,?)')
        })
        .then(stmt => {
          insertGPSStatement = stmt
        })
      }
    })
    .on('end', () => {
      dbExecQueue = dbExecQueue.then(() => {
        console.log(`insert finished entries: ${counter}`)
        resolve()
      })
      console.log('read end!')
    })
    .on('close', () => {
      console.log('file closed!')
    })
    return promise
  })
  .then(() => outputDb.run('commit'))
  .then(() => {
    console.log(`${new Date()} finished inserting data`)
  })
}

function determineBin (num, min, max, width) {
  var bin
  if (num <= min) {
    bin = min
  } else if (num >= max) {
    bin = max
  } else {
    bin = Math.floor(num / width) * width
  }
  // console.log(`${num}  ${bin}`)
  // if (isNaN(bin)) {
  //   process.exit()
  // }
  return bin
}

function dataProcess (err, row) {
  if (err) {
    console.log(err)
  }
  console.log(row)
}

function vector3DMag (x, y, z) {
  return Math.sqrt(x * x + y * y + z * z)
}

function getQuaternionProduct (q, r) {
  // ref: https://www.mathworks.com/help/aeroblks/quaternionmultiplication.html
  return {
    w: r.w * q.w - r.x * q.x - r.y * q.y - r.z * q.z,
    x: r.w * q.x + r.x * q.w - r.y * q.z + r.z * q.y,
    y: r.w * q.y + r.x * q.z + r.y * q.w - r.z * q.x,
    z: r.w * q.z - r.x * q.y + r.y * q.x + r.z * q.w
  }
}
function getInverseQuaternion (quat) {
  // ref: https://www.mathworks.com/help/aeroblks/quaternioninverse.html?s_tid=gn_loc_drop
  const denominator = quat.w * quat.w + quat.x * quat.x + quat.y * quat.y + quat.z * quat.z
  return {
    w: quat.w / denominator,
    x: -quat.x / denominator,
    y: -quat.y / denominator,
    z: -quat.z / denominator
  }
}
function q12q2 (q1, q2) {
  return getQuaternionProduct(getInverseQuaternion(q1), q2)
}
