'use strict'
const THREE = require('three.js-node')
const WSServer = require('http').createServer()
const io = require('socket.io')(WSServer)
const config = require('./config')
const ANGLE_MAP_R = require('./rightDict_yzx.json')
const ANGLE_MAP_L = require('./leftDict_yzx.json')

WSServer.listen(config.SOCKET_IO_PORT, '0.0.0.0')

const originAxis = {
  w: 0,
  x: 0,
  y: 1,
  z: 0
}

const torsoInitQuat = {
  w: 0.74725341796875,
  x: -0.08258056640625,
  y: -0.01483154296875,
  z: 0.65924072265625
}

const headInitQuat = {
  w: 0.7724609375,
  x: -0.03839111328125,
  y: -0.1016845703125,
  z: 0.62567138671875
}

var torsoOffset = q12q2(torsoInitQuat, originAxis)
var headOffset = q12q2(headInitQuat, originAxis)

// torsoOffset = {
//   w: -0.01483116439305834,
//   x: 0.6592238955120293,
//   y: 0.747234344297174,
//   z: 0.08257845853418903
// }

var curTorso = {}

function updateRealtimeVis (quat, idStr) {
  var z = quat.z
  quat.z = quat.x
  quat.x = quat.y
  quat.y = z

  switch (config.SENSOR_DICT[idStr]) {
    case 'torso':
      curTorso = getQuaternionProduct(quat, torsoOffset)

      // console.log(`torsoOffset: ${JSON.stringify(torsoOffset, null, 2)}`)
      // console.log(`headOffset: ${JSON.stringify(headOffset, null, 2)}`)

      // var euler = new THREE.Euler().setFromQuaternion(curTorso, config.EULER_ORDER)
      // console.log(`torso: ${JSON.stringify(quat, null, 2)}
      // ${JSON.stringify(curTorso, null, 2)}
      // ${JSON.stringify(euler)}
      //   `)
      // torsoCalibrate(quat)
      io.sockets.emit('newData', {
        id: config.SENSOR_DICT[idStr],
        quat: curTorso
      })
      break
    case 'head':
      // console.log(`head: ${JSON.stringify(quat, null, 2)}\n ${JSON.stringify(getQuaternionProduct(quat, headOffset), null, 2)}`)
      var headQuat = getQuaternionProduct(quat, headOffset)
      // var euler = new THREE.Euler().setFromQuaternion(headQuat, config.EULER_ORDER)
      // console.log(`head: ${JSON.stringify(quat, null, 2)}
      // ${JSON.stringify(headQuat, null, 2)}
      // ${JSON.stringify(euler)}
      //   `)
      io.sockets.emit('newData', {
        id: config.SENSOR_DICT[idStr],
        quat: headQuat
      })

      break
    case 'rightArm':
      if (curTorso.w) {
        let relativeAngle = q12q2(curTorso, quat)
        let relativeQuat = new THREE.Quaternion(relativeAngle.x, relativeAngle.y, relativeAngle.z, relativeAngle.w)
        let relativeEuler = new THREE.Euler().setFromQuaternion(relativeQuat, config.EULER_ORDER)

        let ans = ANGLE_MAP_R[rad2Bucket(relativeEuler._y)][rad2Bucket(relativeEuler._z)][rad2Bucket(relativeEuler._x)]
        if (ans.shoulderX !== null) {
          let upperArmRelativeEuler = new THREE.Euler(deg2rad(ans.shoulderX), deg2rad(ans.shoulderY), deg2rad(ans.shoulderZ), config.EULER_ORDER)
          let upperArmQuat = getQuaternionProduct(curTorso, new THREE.Quaternion().setFromEuler(upperArmRelativeEuler))
          let quatEuler = new THREE.Euler().setFromQuaternion(quat, config.EULER_ORDER)
          let curTorsoEuler = new THREE.Euler().setFromQuaternion(curTorso, config.EULER_ORDER)
          console.log(`Torso: ${rad2Bucket(curTorsoEuler.y)}  ${rad2Bucket(curTorsoEuler.z)}  ${rad2Bucket(curTorsoEuler.x)}   R: ${rad2Bucket(quatEuler.y)}   ${rad2Bucket(quatEuler.z)}   ${rad2Bucket(quatEuler.x)} --- ${rad2Bucket(relativeEuler._y)}   ${rad2Bucket(relativeEuler._z)}   ${rad2Bucket(relativeEuler._x)}`)
          io.sockets.emit('newData', {id: 'rightUpper', quat: upperArmQuat})
        }
        io.sockets.emit('newData', {id: 'rightLower', quat: quat})
      }
      break

    case 'leftArm':
      if (curTorso.w) {
        let relativeAngle = q12q2(curTorso, quat)
        let relativeQuat = new THREE.Quaternion(relativeAngle.x, relativeAngle.y, relativeAngle.z, relativeAngle.w)
        let relativeEuler = new THREE.Euler().setFromQuaternion(relativeQuat, config.EULER_ORDER)

        let ans = ANGLE_MAP_L[rad2Bucket(relativeEuler._y)][rad2Bucket(relativeEuler._z)][rad2Bucket(relativeEuler._x)]
        if (ans.shoulderX !== null) {
          let upperArmRelativeEuler = new THREE.Euler(deg2rad(ans.shoulderX), deg2rad(ans.shoulderY), deg2rad(ans.shoulderZ), config.EULER_ORDER)
          let upperArmQuat = getQuaternionProduct(curTorso, new THREE.Quaternion().setFromEuler(upperArmRelativeEuler))
          // let quatEuler = new THREE.Euler().setFromQuaternion(quat, config.EULER_ORDER)
          // console.log(`L: ${rad2Bucket(quatEuler.y)}   ${rad2Bucket(quatEuler.z)}   ${rad2Bucket(quatEuler.x)} --- ${rad2Bucket(relativeEuler._y)}   ${rad2Bucket(relativeEuler._z)}   ${rad2Bucket(relativeEuler._x)}`)
          io.sockets.emit('newData', {id: 'leftUpper', quat: upperArmQuat})
        }
        io.sockets.emit('newData', {id: 'leftLower', quat: quat})
      }
      break
  }
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
  var newTorsoOffset = q12q2(quat, expectedTorsoQuat)
  console.log(`newTorsoOffset ${JSON.stringify(newTorsoOffset, null, 2)}`)
  // console.log(`torso: ${JSON.stringify(quat, null, 2)}
  // ${JSON.stringify(offsetTorso, null, 2)}
  // yaw: ${euler._y * 180 / Math.PI} pitch: ${euler._z * 180 / Math.PI} roll: ${euler._x * 180 / Math.PI}
  //   `)
}

function q12q2 (q1, q2) {
  return getQuaternionProduct(getInverseQuaternion(q1), q2)
}

function deg2rad (deg) {
  return deg * Math.PI / 180
}

function rad2Bucket (rad) {
  var ans = Math.floor(rad / deg2rad(config.ANSWER_INTERVAL)) * config.ANSWER_INTERVAL
  return ans === 180 ? 180 - config.ANSWER_INTERVAL : ans
}

// module.exports = {
//   updateRealtimeVis: updateRealtimeVis
// }
