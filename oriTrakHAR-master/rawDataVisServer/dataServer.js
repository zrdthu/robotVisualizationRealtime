'use strict'
const THREE = require('three.js-node')
const WSServer = require('http').createServer()
const io = require('socket.io')(WSServer)
const config = require('./config')
const ANGLE_MAP_R = require('./rightDict_yzx.json')
const ANGLE_MAP_L = require('./leftDict_yzx.json')
const Sqlite = require('sqlite-pool')
const d3Scale = require('d3-scale')
const d3 = require('d3')
// const Sqlite = require('sqlite')
// TODO: add pause functionality! distinguish between pause and stop!

const fs = require('fs')
Promise = require('bluebird')
var db_connections = {}
var data_info = {}
var clusterInfo = {}
var clusterResultConnection

fs.readdirSync(config.DB_FOLDER).forEach((subFolder, ndx, arr) => {
  if (subFolder === '.DS_Store') {
    return
  }
  db_connections[subFolder] = new Sqlite([
    config.DB_FOLDER, '/',
    subFolder, '/',
    'userActivityData_preprocessed.db'].join(''), {Promise})
  clusterResultConnection = new Sqlite(config.CLUSTER_DB_PATH, {Promise})
})

// console.log(Object.keys(db_connections))
var getMinMax = Object.keys(db_connections).map(key => { return {key: key, connection: db_connections[key]} }).map(entry => {
  var key = entry.key
  data_info[key] = {}
  return entry.connection.all('SELECT MIN(interpolated_fixed_rate_time) AS min FROM Preprocessed100HZData')
  .then(res => {
    data_info[key].min = res[0].min / 1000
    return entry.connection.all('SELECT MAX(interpolated_fixed_rate_time) AS max FROM Preprocessed100HZData')
  })
  .then(res => {
    // console.log(key)
    data_info[key].max = res[0].max / 1000
  })
})

Promise.all(getMinMax)
.then(() => {
  return clusterResultConnection.all('SELECT * FROM ClusteringName')
  .then(data => {
    data.forEach(cluster => {
      clusterInfo[cluster.name] = cluster.id
    })
    console.log(clusterInfo)
  })
})
.then(() => {
  console.log('listening')
  WSServer.listen(config.SOCKET_IO_PORT, '0.0.0.0')
})

const TABLE_NAME_DICT = {
  'Right Relative': 'right_relative',
  'Left Relative': 'left_relative',
  'Head Relative': 'head_relative',
  'Torso Orient': 'torso'
}
io.on('connection', (socket) => {
  console.log('a client connected')
  console.log(data_info)
  var playing = false
  var playInterval
  var playIndex = 0
  var myData
  socket.emit('availableDates', data_info)
  socket.emit('availableClusters', clusterInfo)

  socket.on('play', startEndData => {
    console.log(startEndData)
    if (playing) {
      clearInterval(playInterval)
      playIndex = 0
    } else if (!playing && playIndex) {
      playing = true
      let playRatio = startEndData.ratio

      playInterval = setInterval(() => {
        if (playIndex > (myData.length - 1)) {
          clearInterval(playInterval)
          socket.emit('playEnd', {})
          return
        }
        var curData = myData[playIndex]
        // console.log(`${playIndex} - ${JSON.stringify(curData)}`)
        var timestamp = curData.interpolated_fixed_rate_time
        if (curData.torso_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.torso_quat_w, x: curData.torso_quat_x, y: curData.torso_quat_y, z: curData.torso_quat_z}, 'torso', socket)
        }
        if (curData.head_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.head_quat_w, x: curData.head_quat_x, y: curData.head_quat_y, z: curData.head_quat_z}, 'head', socket)
        }
        if (curData.left_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.left_quat_w, x: curData.left_quat_x, y: curData.left_quat_y, z: curData.left_quat_z}, 'leftArm', socket)
        }
        if (curData.right_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.right_quat_w, x: curData.right_quat_x, y: curData.right_quat_y, z: curData.right_quat_z}, 'rightArm', socket)
        }
        playIndex += playRatio
      }, 10)

      return
    }
    var startTime = startEndData.start
    var endTime = startEndData.end
    var data = startEndData.data
    var playRatio = startEndData.ratio
    // console.log(startEndData)
    db_connections[data].all(`SELECT interpolated_fixed_rate_time, torso_quat_w, torso_quat_x, torso_quat_y, torso_quat_z, head_quat_w, head_quat_x, head_quat_y, head_quat_z, left_quat_w, left_quat_x, left_quat_y, left_quat_z, right_quat_w, right_quat_x, right_quat_y, right_quat_z FROM Preprocessed100HZData WHERE interpolated_fixed_rate_time >= ${startTime * 1000} AND interpolated_fixed_rate_time <= ${endTime * 1000}`)
    .then(data => {
      myData = JSON.parse(JSON.stringify(data))
      playing = true
      // console.log(data)
      playInterval = setInterval(() => {
        if (playIndex > (data.length - 1)) {
          clearInterval(playInterval)
          socket.emit('playEnd', {})
          return
        }
        var curData = data[playIndex]
        // console.log(curData)
        var timestamp = curData.interpolated_fixed_rate_time
        if (curData.torso_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.torso_quat_w, x: curData.torso_quat_x, y: curData.torso_quat_y, z: curData.torso_quat_z}, 'torso', socket)
        }
        if (curData.head_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.head_quat_w, x: curData.head_quat_x, y: curData.head_quat_y, z: curData.head_quat_z}, 'head', socket)
        }
        if (curData.left_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.left_quat_w, x: curData.left_quat_x, y: curData.left_quat_y, z: curData.left_quat_z}, 'leftArm', socket)
        }
        if (curData.right_quat_w !== null) {
          updateRealtimeVis({timestamp: timestamp / 1000, w: curData.right_quat_w, x: curData.right_quat_x, y: curData.right_quat_y, z: curData.right_quat_z}, 'rightArm', socket)
        }
        playIndex += playRatio
      }, 10)
    })
  })

  socket.on('requestClusterData', msg => {
    var clusterId = msg.clusterId
    clusterResultConnection.all(`SELECT * FROM ClusteringData WHERE cluster_id = ${clusterId} AND location_latitude IS NOT NULL`)
    .then(data => {
      var dataByCluster = {}
      data.forEach(d => {
        if (! dataByCluster[d.cluster]) {
          dataByCluster[d.cluster] = []
        }
        dataByCluster[d.cluster].push({timestamp: d.timestamp, longitude: d.location_longitude, latitude: d.location_latitude})
      })
      socket.emit('clusterData', {cluster_id: clusterId, dataByCluster})
    })
  })

  socket.on('updateHist', msg => {
    console.log('updateHist called')
    var startTime = msg.start
    var endTime = msg.end
    var source = msg.source
    var data = msg.data
    db_connections[data].all(`
      SELECT
        round(${TABLE_NAME_DICT[source]}_yaw/5.00 - 0.5)*5 AS yaw_floor,
        round(${TABLE_NAME_DICT[source]}_pitch/5.00 - 0.5)*5 AS pitch_floor,
        count(*) AS count
      FROM Preprocessed100HZData
      WHERE interpolated_fixed_rate_time >= ${startTime * 1000} AND interpolated_fixed_rate_time <= ${endTime * 1000}
      GROUP BY 1, 2
      ORDER BY 1, 2;`)
    .then(data => {
      data.splice(0, 1)
      // console.log(data)
      var values = data.map(d => d.count)
      var maxCount = Math.max.apply(null, values)
      console.log(maxCount)
      var colorScale = d3Scale.scaleLinear()
        .domain([0, maxCount])
        .range([d3.rgb(236, 240, 241), d3.rgb(102, 50, 26)])
        .interpolate(d3.interpolateHsl)

      var colorEntries = []
      data.forEach(d => {
        var targetColor = d3.rgb(colorScale(d.count))
        var pitchBin = (-d.pitch_floor + 85) / 5
        var yawBin = ((d.yaw_floor + 360 + 85) % 360) / 5

        // console.log(`yawBin: ${yawBin} pitchBin: ${pitchBin}`)
        if (pitchBin === 0) {
          colorEntries.push({ bin: yawBin, color: { r: targetColor.r, g: targetColor.g, b: targetColor.b } })
        } else if (pitchBin === 35) {
          colorEntries.push({ bin: yawBin + pitchBin * 71 * 2, color: { r: targetColor.r, g: targetColor.g, b: targetColor.b } })
        } else {
          colorEntries.push({ bin: yawBin * 2 + pitchBin * 71 * 2, color: { r: targetColor.r, g: targetColor.g, b: targetColor.b } })
          colorEntries.push({ bin: yawBin * 2 + pitchBin * 71 * 2 + 1, color: { r: targetColor.r, g: targetColor.g, b: targetColor.b } })
        }
      })
      socket.emit('updateHist', colorEntries)
      // console.log(colorEntries)
    })
  })

  socket.on('hist', msg => {
    console.log(msg)
  })

  socket.on('stop', msg => {
    playing = false
    clearInterval(playInterval)
    playIndex = 0
  })

  socket.on('pause', msg => {
    playing = false
    clearInterval(playInterval)
  })

  socket.on('disconnect', () => {
    if (playing) {
      clearInterval(playInterval)
      playing = false
    }
  })
})


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

var curTorso = {}

function updateRealtimeVis (quat, idStr, socket) {
  // var z = quat.z
  // quat.z = quat.x
  // quat.x = quat.y
  // quat.y = z
  // console.log(quat)
  switch (idStr) {
    case 'torso':
      // curTorso = getQuaternionProduct(quat, torsoOffset)
      curTorso = quat
      socket.emit('newData', {
        id: idStr,
        quat: curTorso
      })
      break
    case 'head':
      // console.log(`head: ${JSON.stringify(quat, null, 2)}\n ${JSON.stringify(getQuaternionProduct(quat, headOffset), null, 2)}`)
      // var headQuat = getQuaternionProduct(quat, headOffset)
      // var euler = new THREE.Euler().setFromQuaternion(headQuat, config.EULER_ORDER)
      // console.log(`head: ${JSON.stringify(quat, null, 2)}
      // ${JSON.stringify(headQuat, null, 2)}
      // ${JSON.stringify(euler)}
      //   `)
      var headQuat = quat
      socket.emit('newData', {
        id: idStr,
        quat: headQuat
      })

      break
    case 'rightArm':
      if (curTorso.w) {
        let relativeAngle = q12q2(curTorso, quat)
        let relativeQuat = new THREE.Quaternion(relativeAngle.x, relativeAngle.y, relativeAngle.z, relativeAngle.w)
        let relativeEuler = new THREE.Euler().setFromQuaternion(relativeQuat, config.EULER_ORDER)
        // console.log(rad2Bucket(relativeEuler._y))
        let ans = ANGLE_MAP_R[rad2Bucket(relativeEuler._y)][rad2Bucket(relativeEuler._z)][rad2Bucket(relativeEuler._x)]
        if (ans.shoulderX !== null) {
          let upperArmRelativeEuler = new THREE.Euler(deg2rad(ans.shoulderX), deg2rad(ans.shoulderY), deg2rad(ans.shoulderZ), config.EULER_ORDER)
          let upperArmQuat = getQuaternionProduct(curTorso, new THREE.Quaternion().setFromEuler(upperArmRelativeEuler))
          let quatEuler = new THREE.Euler().setFromQuaternion(quat, config.EULER_ORDER)
          let curTorsoEuler = new THREE.Euler().setFromQuaternion(curTorso, config.EULER_ORDER)
          // console.log(`Torso: ${rad2Bucket(curTorsoEuler.y)}  ${rad2Bucket(curTorsoEuler.z)}  ${rad2Bucket(curTorsoEuler.x)}   R: ${rad2Bucket(quatEuler.y)}   ${rad2Bucket(quatEuler.z)}   ${rad2Bucket(quatEuler.x)} --- ${rad2Bucket(relativeEuler._y)}   ${rad2Bucket(relativeEuler._z)}   ${rad2Bucket(relativeEuler._x)}`)
          socket.emit('newData', {id: 'rightUpper', quat: upperArmQuat})
        }
        socket.emit('newData', {id: 'rightLower', quat: quat})
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
          socket.emit('newData', {id: 'leftUpper', quat: upperArmQuat})
        }
        socket.emit('newData', {id: 'leftLower', quat: quat})
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
  // console.log(`newTorsoOffset ${JSON.stringify(newTorsoOffset, null, 2)}`)
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

module.exports = {
  updateRealtimeVis: updateRealtimeVis
}
