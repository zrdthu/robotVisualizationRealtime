const THREE = require('three.js-node')

const INTERVAL = 5
const ANSWER_INTERVAL = INTERVAL

const EULER_ORDER = 'YZX'
var fs = require('fs')

const SHOULDER_Y = {
  MIN: -100,
  MAX: 40
}

const SHOULDER_Z = {
  MIN: -85,
  MAX: 70
}

const SHOULDER_X = {
  MIN: -30,
  MAX: 120
}

const ELBOW_Y = {
  MIN: 0,
  MAX: 150
}

const ELBOW_X = {
  MIN: -20,
  MAX: 100
}

const DICT_Y = {
  MIN: -180,
  MAX: 180
}

const DICT_Z = {
  MIN: -180,
  MAX: 180
}

const DICT_X = {
  MIN: -180,
  MAX: 180
}

var answerBuckets = {}

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

for (let y = DICT_Y.MIN; y < DICT_Y.MAX; y += ANSWER_INTERVAL) {
  answerBuckets[y] = {}
  for (let z = DICT_Z.MIN; z < DICT_Z.MAX; z += ANSWER_INTERVAL) {
    answerBuckets[y][z] = {}
    for (let x = DICT_X.MIN; x < DICT_X.MAX; x += ANSWER_INTERVAL) {
      answerBuckets[y][z][x] = []
    }
  }
}
// console.log(Object.keys(answerBuckets))
// var center = new THREE.Vectors(0, 0, 0)
// var rightShoulder = (new THREE.Vectors(0, 0, 20)).sub(center)
// var rightElbow = (new THREE.Vectors(0, 28, 20)).sub(rightShoulder)
// var rightWrist = (new THREE.Vectors(0, 56, 20)).sub(rightWrist)

for (let shoulderY = SHOULDER_Y.MIN; shoulderY < SHOULDER_Y.MAX; shoulderY += INTERVAL) {
  for (let shoulderZ = SHOULDER_Z.MIN; shoulderZ < SHOULDER_Z.MAX; shoulderZ += INTERVAL) {
    for (let shoulderX = SHOULDER_X.MIN; shoulderX < SHOULDER_X.MAX; shoulderX += INTERVAL) {
      for (let elbowY = ELBOW_Y.MIN; elbowY < ELBOW_Y.MAX; elbowY += INTERVAL) {
        for (let elbowX = ELBOW_X.MIN; elbowX < ELBOW_X.MAX; elbowX += INTERVAL) {

          var rightShoulder = (new THREE.Vector3(0, 0, 20))
          var rightElbow = new THREE.Vector3(28, 0, 0)
          var rightWrist = new THREE.Vector3(28, 0, 0)

          let upperArm = EulerToQuat(shoulderX, shoulderY, shoulderZ)
          let lowerArm = EulerToQuat(elbowX, elbowY, 0)

          rightWrist.applyQuaternion(lowerArm)
          // console.log(rightWrist)
          rightElbow.applyQuaternion(upperArm)
          // console.log(rightElbow)

          rightWrist.add(rightElbow).add(rightShoulder)

          // console.log(`${shoulderY}, ${shoulderZ}, ${shoulderX}, ${elbowY}, ${elbowX}`)
          // console.log(rightWrist)
          // process.exit()
          if (rightWrist.z < 0) {
            if ((rightWrist.z > -20) && (rightWrist.z < 20) && (rightWrist.x > -10) && (rightWrist.x < 10)) {
              break
            }
          } else if (rightWrist < 20){
            if ((rightWrist.z > -10) && (rightWrist.z < 10) && (rightWrist.x > -10) && (rightWrist.x < 10)) {
              break
            }
          }
          let finalQuat = new THREE.Quaternion().multiplyQuaternions(lowerArm, upperArm)
          let finalEuler = new THREE.Euler().setFromQuaternion(finalQuat, EULER_ORDER)
          // console.log(`${rad2Bucket(finalEuler._y)} ${rad2Bucket(finalEuler._z)} ${rad2Bucket(finalEuler._x)}`)
          answerBuckets[rad2Bucket(finalEuler._y)][rad2Bucket(finalEuler._z)][rad2Bucket(finalEuler._x)].push({
            shoulderX: shoulderX,
            shoulderY: shoulderY,
            shoulderZ: shoulderZ,
            elbowY: elbowY,
            elbowX: elbowX
          })
        }
      }
    }
  }
}
// fs.writeFile('rightBucket.json', JSON.stringify(answerBuckets, null, 2), () => {
//   console.log('rightBucket done!')
// })

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

fs.writeFile('rightDict_yzx.json', JSON.stringify(finalDictionaryYZX, null, 2), () => {
  console.log('right Dict!')
})

answerBuckets = {}
for (let y = -DICT_Y.MAX; y < -DICT_Y.MIN; y += ANSWER_INTERVAL) {
  answerBuckets[y] = {}
  for (let z = -DICT_Z.MAX; z < -DICT_Z.MIN; z += ANSWER_INTERVAL) {
    answerBuckets[y][z] = {}
    for (let x = -DICT_X.MAX; x < -DICT_X.MIN; x += ANSWER_INTERVAL) {
      answerBuckets[y][z][x] = []
    }
  }
}

for (let shoulderY = -SHOULDER_Y.MAX; shoulderY < -SHOULDER_Y.MIN; shoulderY += INTERVAL) {
  for (let shoulderZ = SHOULDER_Z.MIN; shoulderZ < SHOULDER_Z.MAX; shoulderZ += INTERVAL) {
    for (let shoulderX = -SHOULDER_X.MAX; shoulderX < -SHOULDER_X.MIN; shoulderX += INTERVAL) {
      for (let elbowY = -ELBOW_Y.MAX; elbowY < -ELBOW_Y.MIN; elbowY += INTERVAL) {
        for (let elbowX = -ELBOW_X.MAX; elbowX < -ELBOW_X.MIN; elbowX += INTERVAL) {
          let upperArm = EulerToQuat(shoulderX, shoulderY, shoulderZ)
          let lowerArm = EulerToQuat(elbowX, elbowY, 0)

          let finalQuat = new THREE.Quaternion().multiplyQuaternions(lowerArm, upperArm)
          let finalEuler = new THREE.Euler().setFromQuaternion(finalQuat, EULER_ORDER)
          // console.log(`${rad2Bucket(finalEuler._y)} ${rad2Bucket(finalEuler._z)} ${rad2Bucket(finalEuler._x)}`)
          answerBuckets[rad2Bucket(finalEuler._y)][rad2Bucket(finalEuler._z)][rad2Bucket(finalEuler._x)].push({
            shoulderX: shoulderX,
            shoulderY: shoulderY,
            shoulderZ: shoulderZ,
            elbowY: elbowY,
            elbowX: elbowX
          })
        }
      }
    }
  }
}

finalDictionaryYZX = {}
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

fs.writeFile('leftDict_yzx.json', JSON.stringify(finalDictionaryYZX, null, 2), () => {
  console.log('left Dict!')
})
