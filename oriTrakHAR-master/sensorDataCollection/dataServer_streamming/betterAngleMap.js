'use strict'
const THREE = require('three.js-node')
const INTERVAL = 5
const ANSWER_INTERVAL = INTERVAL
const EULER_ORDER = 'YZX'
const fs = require('fs')
const cluster = require('cluster')
const numCPUs = require('os').cpus().length * 4
const RIGHT_SHOULDER_Y = { MIN: -100, MAX: 40 }
const RIGHT_SHOULDER_Z = { MIN: -85, MAX: 70 }
const RIGHT_SHOULDER_X = { MIN: -30, MAX: 120 }
const RIGHT_ELBOW_Y = { MIN: 0, MAX: 150 }
const RIGHT_ELBOW_X = { MIN: -20, MAX: 100 }
const LEFT_SHOULDER_Y = { MIN: -40, MAX: 100 }
const LEFT_SHOULDER_Z = { MIN: -85, MAX: 70 }
const LEFT_SHOULDER_X = { MIN: -120, MAX: 30 }
const LEFT_ELBOW_Y = { MIN: -150, MAX: 0 }
const LEFT_ELBOW_X = { MIN: -100, MAX: 20 }
const DICT_Y = { MIN: -180, MAX: 180 }
const DICT_Z = { MIN: -180, MAX: 180 }
const DICT_X = { MIN: -180, MAX: 180 }

function deg2rad (deg) {
  return deg * Math.PI / 180
}
function rad2Bucket (rad) {
  var ans = Math.floor(rad / deg2rad(ANSWER_INTERVAL)) * ANSWER_INTERVAL
  return ans === 180 ? 180 - ANSWER_INTERVAL : ans
}
function EulerToQuat (x, y, z) {
  var vectorEuler = new THREE.Euler(deg2rad(x), deg2rad(y), deg2rad(z), EULER_ORDER)
  return new THREE.Quaternion().setFromEuler(vectorEuler)
}

function masterProcess() {
  var workers = {}
  console.log(`Master ${process.pid} is running`)
  var rightArmIter = angleGenerator(RIGHT_SHOULDER_Y, RIGHT_SHOULDER_Z, RIGHT_SHOULDER_X, RIGHT_ELBOW_Y, RIGHT_ELBOW_X, INTERVAL)
  var rightDict = makeDict()
  var leftArmIter = angleGenerator(LEFT_SHOULDER_Y, LEFT_SHOULDER_Z, LEFT_SHOULDER_X, LEFT_ELBOW_Y, LEFT_ELBOW_X, INTERVAL)
  var leftDict = makeDict()
  var finishedRightCoreCount = 0;
  function handleWorkerMsg(msg) {
    switch(msg.event) {
      case 'ready':
        workers[msg.id].send({event:'right_job', params: rightArmIter.next().value})
        break
      case 'ans_right':
        if (msg.ans) {
          rightDict[msg.ans.bucket.y][msg.ans.bucket.z][msg.ans.bucket.x].push(msg.ans.val)
        }
        var rightArm = rightArmIter.next()
        if (rightArm.done) {
          console.log('one process finished rightArm')
          finishedRightCoreCount++
          leftArm = leftArmIter.next()
          workers[msg.id].send({event:'left_job', params: leftArm.value})
          if (finishedRightCoreCount === (numCPUs - 1)) {
            console.log('Finished building right dictionary')
            exportFile(rightDict, './rightDict_yzx.json')
          }
        } else {
          workers[msg.id].send({event:'right_job', params: rightArm.value})
        }
        break
      case 'ans_left':
        if (msg.ans) {
          leftDict[msg.ans.bucket.y][msg.ans.bucket.z][msg.ans.bucket.x].push(msg.ans.val)
        }
        var leftArm = leftArmIter.next()
        if (leftArm.done) {
          workers[msg.id].send({event: 'fin'})
          delete workers[msg.id]
          if (Object.keys(workers).length === 0) {
            console.log('Finished building left dictionary')
            exportFile(leftDict, './leftDict_yzx.json')
          }
        } else {
          workers[msg.id].send({event:'left_job', params: leftArm.value})
        }
        break
    }
  }

  function* angleGenerator(shoulderYRange, shoulderZRange, shoulderXRange, elbowYRange, elbowXRange, interval) {
    for (let shoulderY = shoulderYRange.MIN; shoulderY < shoulderYRange.MAX; shoulderY += interval) {
      for (let shoulderZ = shoulderZRange.MIN; shoulderZ < shoulderZRange.MAX; shoulderZ += interval) {
        for (let shoulderX = shoulderXRange.MIN; shoulderX < shoulderXRange.MAX; shoulderX += interval) {
          for (let elbowY = elbowYRange.MIN; elbowY < elbowYRange.MAX; elbowY += interval) {
            for (let elbowX = elbowXRange.MIN; elbowX < elbowXRange.MAX; elbowX += interval) {
              yield {shoulderY, shoulderZ, shoulderX, elbowY, elbowX}
            }
          }
        }
      }
    }
  }

  function makeDict() {
    var answerBuckets = {}
    for (let y = DICT_Y.MIN; y < DICT_Y.MAX; y += ANSWER_INTERVAL) {
      answerBuckets[y] = {}
      for (let z = DICT_Z.MIN; z < DICT_Z.MAX; z += ANSWER_INTERVAL) {
        answerBuckets[y][z] = {}
        for (let x = DICT_X.MIN; x < DICT_X.MAX; x += ANSWER_INTERVAL) {
          answerBuckets[y][z][x] = []
        }
      }
    }
    return answerBuckets
  }

  function exportFile(answerBuckets, fileName) {
    var finalDictionaryYZX = {}
    for (let y = DICT_Y.MIN; y < DICT_Y.MAX; y += ANSWER_INTERVAL) {
      finalDictionaryYZX[y] = {}
      for (let z = DICT_Z.MIN; z < DICT_Z.MAX; z += ANSWER_INTERVAL) {
        finalDictionaryYZX[y][z] = {}
        for (let x = DICT_X.MIN; x < DICT_X.MAX; x += ANSWER_INTERVAL) {
          let length = answerBuckets[y][z][x].length
          if (length > 0) {
            let shoulderXSum = 0
            let shoulderYSum = 0
            let shoulderZSum = 0
            let elbowYSum = 0
            let elbowXSum = 0
            answerBuckets[y][z][x].forEach(e => {
              shoulderXSum += e.shoulderX
              shoulderYSum += e.shoulderY
              shoulderZSum += e.shoulderZ
              elbowYSum += e.elbowY
              elbowXSum += e.elbowX
            })
            finalDictionaryYZX[y][z][x] = {
              shoulderX: shoulderXSum / length,
              shoulderY: shoulderYSum / length,
              shoulderZ: shoulderZSum / length,
              elbowY: elbowYSum / length,
              elbowX: elbowXSum / length
            }
          } else {
            finalDictionaryYZX[y][z][x] = {
              shoulderX: null,
              shoulderY: null,
              shoulderZ: null,
              elbowY: null,
              elbowX: null
            }
          }
        }
      }
    }
    fs.writeFile(fileName, JSON.stringify(finalDictionaryYZX), () => {
      console.log(`${fileName} write finished!`)
    })
  }

  for (let i = 1; i < numCPUs; i++) {
    console.log(`Forking process number ${i}...`)
    var worker = cluster.fork()
    workers[worker.process.pid] = worker
    worker.on('message', handleWorkerMsg)
  }
}

function childProcess() {
  process.on('message', handleMasterMsg)
  function handleMasterMsg(msg) {
    switch (msg.event) {
      case 'right_job':
        var entry = processRightData(msg.params)
        process.send({event:'ans_right', id: process.pid, ans: entry})
        break

      case 'left_job':
        var entry = processLeftData(msg.params)
        process.send({event:'ans_left', id: process.pid, ans: entry})
        break

      case 'fin':
        process.exit()
        break
    }
  }

  function processRightData(params) {
    let rightShoulder = (new THREE.Vector3(0, 0, 20))
    let rightElbow = new THREE.Vector3(28, 0, 0)
    let rightWrist = new THREE.Vector3(28, 0, 0)

    let upperArm = EulerToQuat(params.shoulderX, params.shoulderY, params.shoulderZ)
    let lowerArm = EulerToQuat(params.elbowX, params.elbowY, 0)

    rightWrist.applyQuaternion(lowerArm)
    rightElbow.applyQuaternion(upperArm)

    var rightWristHalf = rightWrist.clone()
    var rightElbowPos = rightElbow.clone()
    // Check if elbow is in torso/head
    rightElbowPos = rightElbowPos.add(rightShoulder)
    if (rightElbowPos.y < 0) {
      if ((rightElbowPos.z > -20) && (rightElbowPos.z < 20) && (rightElbowPos.x > -10) && (rightElbowPos.x < 10)) {
        return null
      }
    } else if (rightElbowPos.y < 20){
      if ((rightElbowPos.z > -10) && (rightElbowPos.z < 10) && (rightElbowPos.x > -10) && (rightElbowPos.x < 10)) {
        return null
      }
    }

    // Check if wrist is in torso/head
    rightWrist.add(rightElbow).add(rightShoulder)
    if (rightWrist.y < 0) {
      if ((rightWrist.z > -20) && (rightWrist.z < 20) && (rightWrist.x > -10) && (rightWrist.x < 10)) {
        return null
      }
    } else if (rightWrist.y < 20){
      if ((rightWrist.z > -10) && (rightWrist.z < 10) && (rightWrist.x > -10) && (rightWrist.x < 10)) {
        return null
      }
    }
    // Check if upper arm is in torso/head
    rightWristHalf.multiplyScalar(0.5)
    rightWristHalf.add(rightElbow).add(rightShoulder)
    if (rightWristHalf.y < 0) {
      if ((rightWristHalf.z > -20) && (rightWristHalf.z < 20) && (rightWristHalf.x > -10) && (rightWristHalf.x < 10)) {
        return null
      }
    } else if (rightWristHalf.y < 20){
      if ((rightWristHalf.z > -10) && (rightWristHalf.z < 10) && (rightWristHalf.x > -10) && (rightWristHalf.x < 10)) {
        return null
      }
    }

    let finalQuat = new THREE.Quaternion().multiplyQuaternions(lowerArm, upperArm)
    let finalEuler = new THREE.Euler().setFromQuaternion(finalQuat, EULER_ORDER)
    return {
      bucket: {
        y: rad2Bucket(finalEuler._y),
        z: rad2Bucket(finalEuler._z),
        x: rad2Bucket(finalEuler._x)
      },
      val: params
    }
  }

  function processLeftData(params) {
    let leftShoulder = (new THREE.Vector3(0, 0, -20))
    let leftElbow = new THREE.Vector3(28, 0, 0)
    let leftWrist = new THREE.Vector3(28, 0, 0)

    let upperArm = EulerToQuat(params.shoulderX, params.shoulderY, params.shoulderZ)
    let lowerArm = EulerToQuat(params.elbowX, params.elbowY, 0)

    leftWrist.applyQuaternion(lowerArm)
    leftElbow.applyQuaternion(upperArm)

    var leftWristHalf = leftWrist.clone()
    var leftElbowPos = leftElbow.clone()
    // Check if elbow is in torso/head
    leftElbowPos = leftElbowPos.add(leftShoulder)
    if (leftElbowPos.y < 0) {
      if ((leftElbowPos.z > -20) && (leftElbowPos.z < 20) && (leftElbowPos.x > -10) && (leftElbowPos.x < 10)) {
        return null
      }
    } else if (leftElbowPos.y < 20){
      if ((leftElbowPos.z > -10) && (leftElbowPos.z < 10) && (leftElbowPos.x > -10) && (leftElbowPos.x < 10)) {
        return null
      }
    }

    // Check if wrist is in torso/head
    leftWrist.add(leftElbow).add(leftShoulder)
    if (leftWrist.y < 0) {
      if ((leftWrist.z > -20) && (leftWrist.z < 20) && (leftWrist.x > -10) && (leftWrist.x < 10)) {
        return null
      }
    } else if (leftWrist.y < 20){
      if ((leftWrist.z > -10) && (leftWrist.z < 10) && (leftWrist.x > -10) && (leftWrist.x < 10)) {
        return null
      }
    }
    // Check if upper arm is in torso/head
    leftWristHalf.multiplyScalar(0.5)
    leftWristHalf.add(leftElbow).add(leftShoulder)
    if (leftWristHalf.y < 0) {
      if ((leftWristHalf.z > -20) && (leftWristHalf.z < 20) && (leftWristHalf.x > -10) && (leftWristHalf.x < 10)) {
        return null
      }
    } else if (leftWristHalf.y < 20){
      if ((leftWristHalf.z > -10) && (leftWristHalf.z < 10) && (leftWristHalf.x > -10) && (leftWristHalf.x < 10)) {
        return null
      }
    }

    let finalQuat = new THREE.Quaternion().multiplyQuaternions(lowerArm, upperArm)
    let finalEuler = new THREE.Euler().setFromQuaternion(finalQuat, EULER_ORDER)
    return {
      bucket: {
        y: rad2Bucket(finalEuler._y),
        z: rad2Bucket(finalEuler._z),
        x: rad2Bucket(finalEuler._x)
      },
      val: params
    }
  }

  process.send({event:'ready', id: process.pid})
}

if (cluster.isMaster) {
  masterProcess()
} else {
  childProcess()
}