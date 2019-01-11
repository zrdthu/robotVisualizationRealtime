const Promise = require('bluebird')
const db = require('sqlite')
const config = require('./config')
const fs = require('fs')
const csv = require('csv-stream')
const cluster = require('cluster')
const Jstat = require('jStat')
const Ra4Fft = require('fft.js')
const fftUtil = require('fft-js').util
const numCPUs = require('os').cpus().length
const VALID_THRESHOLD = 0.6
// const numCPUs = 2

// var preprocessedDataDb
if (cluster.isMaster) {
  masterProcess()
} else {
  childProcess()
}
function dbConnect () {
  return db.open(config.PROCESSED_DATA_PATH, {Promise})
}

function childProcess () {
  var preprocessedDataDb
  function handleMasterMsg (msg) {
    console.log(`Worker receive master msg: ${JSON.stringify(msg)}`)
    switch (msg.event) {
      case 'job':
        processJob(msg.jobNum)
        break
      case 'fin':
        process.exit()
        break
    }
  }

  function getRawDataQuery (jobNum) {
    return `SELECT * FROM Preprocessed100HZData WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH}`
  }
  var execQueue = dbConnect()
  .then(db => {
    preprocessedDataDb = db
  })
  .then(() => {
    console.log(`process ${process.pid} connected!`)
    process.on('message', handleMasterMsg)
    process.send({event: 'ready', id: process.pid})
  })

  function processJob (jobNum) {
    preprocessedDataDb.all(getRawDataQuery(jobNum))
    .then(data => {
      var torso_gyro_x = []
      var torso_gyro_y = []
      var torso_gyro_z = []
      var torso_acc_x = []
      var torso_acc_y = []
      var torso_acc_z = []
      var torso_acc_mag = []
      var torso_gyro_mag = []
      var head_gyro_x = []
      var head_gyro_y = []
      var head_gyro_z = []
      var head_acc_x = []
      var head_acc_y = []
      var head_acc_z = []
      var head_acc_mag = []
      var head_gyro_mag = []
      var left_gyro_x = []
      var left_gyro_y = []
      var left_gyro_z = []
      var left_acc_x = []
      var left_acc_y = []
      var left_acc_z = []
      var left_acc_mag = []
      var left_gyro_mag = []
      var right_gyro_x = []
      var right_gyro_y = []
      var right_gyro_z = []
      var right_acc_x = []
      var right_acc_y = []
      var right_acc_z = []
      var right_acc_mag = []
      var right_gyro_mag = []

      data.forEach(d => {
        if (d.torso_gyro_x !== null) {
          torso_gyro_x.push(d.torso_gyro_x)
        }
        if (d.torso_gyro_y !== null) {
          torso_gyro_y.push(d.torso_gyro_y)
        }
        if (d.torso_gyro_z !== null) {
          torso_gyro_z.push(d.torso_gyro_z)
        }
        if (d.torso_acc_x !== null) {
          torso_acc_x.push(d.torso_acc_x)
        }
        if (d.torso_acc_y !== null) {
          torso_acc_y.push(d.torso_acc_y)
        }
        if (d.torso_acc_z !== null) {
          torso_acc_z.push(d.torso_acc_z)
        }
        if (d.torso_acc_mag !== null) {
          torso_acc_mag.push(d.torso_acc_mag)
        }
        if (d.torso_gyro_mag !== null) {
          torso_gyro_mag.push(d.torso_gyro_mag)
        }
        if (d.head_gyro_x !== null) {
          head_gyro_x.push(d.head_gyro_x)
        }
        if (d.head_gyro_y !== null) {
          head_gyro_y.push(d.head_gyro_y)
        }
        if (d.head_gyro_z !== null) {
          head_gyro_z.push(d.head_gyro_z)
        }
        if (d.head_acc_x !== null) {
          head_acc_x.push(d.head_acc_x)
        }
        if (d.head_acc_y !== null) {
          head_acc_y.push(d.head_acc_y)
        }
        if (d.head_acc_z !== null) {
          head_acc_z.push(d.head_acc_z)
        }
        if (d.head_acc_mag !== null) {
          head_acc_mag.push(d.head_acc_mag)
        }
        if (d.head_gyro_mag !== null) {
          head_gyro_mag.push(d.head_gyro_mag)
        }
        if (d.left_gyro_x !== null) {
          left_gyro_x.push(d.left_gyro_x)
        }
        if (d.left_gyro_y !== null) {
          left_gyro_y.push(d.left_gyro_y)
        }
        if (d.left_gyro_z !== null) {
          left_gyro_z.push(d.left_gyro_z)
        }
        if (d.left_acc_x !== null) {
          left_acc_x.push(d.left_acc_x)
        }
        if (d.left_acc_y !== null) {
          left_acc_y.push(d.left_acc_y)
        }
        if (d.left_acc_z !== null) {
          left_acc_z.push(d.left_acc_z)
        }
        if (d.left_acc_mag !== null) {
          left_acc_mag.push(d.left_acc_mag)
        }
        if (d.left_gyro_mag !== null) {
          left_gyro_mag.push(d.left_gyro_mag)
        }
        if (d.right_gyro_x !== null) {
          right_gyro_x.push(d.right_gyro_x)
        }
        if (d.right_gyro_y !== null) {
          right_gyro_y.push(d.right_gyro_y)
        }
        if (d.right_gyro_z !== null) {
          right_gyro_z.push(d.right_gyro_z)
        }
        if (d.right_acc_x !== null) {
          right_acc_x.push(d.right_acc_x)
        }
        if (d.right_acc_y !== null) {
          right_acc_y.push(d.right_acc_y)
        }
        if (d.right_acc_z !== null) {
          right_acc_z.push(d.right_acc_z)
        }
        if (d.right_acc_mag !== null) {
          right_acc_mag.push(d.right_acc_mag)
        }
        if (d.right_gyro_mag !== null) {
          right_gyro_mag.push(d.right_gyro_mag)
        }
      })

      var mean = [
        Jstat.mean(torso_gyro_x),
        Jstat.mean(torso_gyro_y),
        Jstat.mean(torso_gyro_z),
        Jstat.mean(torso_acc_x),
        Jstat.mean(torso_acc_y),
        Jstat.mean(torso_acc_z),
        Jstat.mean(torso_acc_mag),
        Jstat.mean(torso_gyro_mag),
        Jstat.mean(head_gyro_x),
        Jstat.mean(head_gyro_y),
        Jstat.mean(head_gyro_z),
        Jstat.mean(head_acc_x),
        Jstat.mean(head_acc_y),
        Jstat.mean(head_acc_z),
        Jstat.mean(head_acc_mag),
        Jstat.mean(head_gyro_mag),
        Jstat.mean(left_gyro_x),
        Jstat.mean(left_gyro_y),
        Jstat.mean(left_gyro_z),
        Jstat.mean(left_acc_x),
        Jstat.mean(left_acc_y),
        Jstat.mean(left_acc_z),
        Jstat.mean(left_acc_mag),
        Jstat.mean(left_gyro_mag),
        Jstat.mean(right_gyro_x),
        Jstat.mean(right_gyro_y),
        Jstat.mean(right_gyro_z),
        Jstat.mean(right_acc_x),
        Jstat.mean(right_acc_y),
        Jstat.mean(right_acc_z),
        Jstat.mean(right_acc_mag),
        Jstat.mean(right_gyro_mag)
      ]
      var variance = [
        Jstat.variance(torso_gyro_x),
        Jstat.variance(torso_gyro_y),
        Jstat.variance(torso_gyro_z),
        Jstat.variance(torso_acc_x),
        Jstat.variance(torso_acc_y),
        Jstat.variance(torso_acc_z),
        Jstat.variance(torso_acc_mag),
        Jstat.variance(torso_gyro_mag),
        Jstat.variance(head_gyro_x),
        Jstat.variance(head_gyro_y),
        Jstat.variance(head_gyro_z),
        Jstat.variance(head_acc_x),
        Jstat.variance(head_acc_y),
        Jstat.variance(head_acc_z),
        Jstat.variance(head_acc_mag),
        Jstat.variance(head_gyro_mag),
        Jstat.variance(left_gyro_x),
        Jstat.variance(left_gyro_y),
        Jstat.variance(left_gyro_z),
        Jstat.variance(left_acc_x),
        Jstat.variance(left_acc_y),
        Jstat.variance(left_acc_z),
        Jstat.variance(left_acc_mag),
        Jstat.variance(left_gyro_mag),
        Jstat.variance(right_gyro_x),
        Jstat.variance(right_gyro_y),
        Jstat.variance(right_gyro_z),
        Jstat.variance(right_acc_x),
        Jstat.variance(right_acc_y),
        Jstat.variance(right_acc_z),
        Jstat.variance(right_acc_mag),
        Jstat.variance(right_gyro_mag)
      ]
      var median = [
        Jstat.median(torso_gyro_x),
        Jstat.median(torso_gyro_y),
        Jstat.median(torso_gyro_z),
        Jstat.median(torso_acc_x),
        Jstat.median(torso_acc_y),
        Jstat.median(torso_acc_z),
        Jstat.median(torso_acc_mag),
        Jstat.median(torso_gyro_mag),
        Jstat.median(head_gyro_x),
        Jstat.median(head_gyro_y),
        Jstat.median(head_gyro_z),
        Jstat.median(head_acc_x),
        Jstat.median(head_acc_y),
        Jstat.median(head_acc_z),
        Jstat.median(head_acc_mag),
        Jstat.median(head_gyro_mag),
        Jstat.median(left_gyro_x),
        Jstat.median(left_gyro_y),
        Jstat.median(left_gyro_z),
        Jstat.median(left_acc_x),
        Jstat.median(left_acc_y),
        Jstat.median(left_acc_z),
        Jstat.median(left_acc_mag),
        Jstat.median(left_gyro_mag),
        Jstat.median(right_gyro_x),
        Jstat.median(right_gyro_y),
        Jstat.median(right_gyro_z),
        Jstat.median(right_acc_x),
        Jstat.median(right_acc_y),
        Jstat.median(right_acc_z),
        Jstat.median(right_acc_mag),
        Jstat.median(right_gyro_mag)
      ]

      function generateHist (yaw1, yaw2, pitch1, pitch2, roll1, roll2) {
        return Array((yaw2 - yaw1) / config.HIST_BIN_SIZE * (pitch2 - pitch1) / config.HIST_BIN_SIZE * (roll2 - roll1) / config.HIST_BIN_SIZE).fill(0)
      }
      function clamp (num, min, max) {
        if (num < min) {
          num = min
        } else if (num > max) {
          num = max
        }
        return num
      }

      function processHistGen (yaw1, yaw2, pitch1, pitch2, roll1, roll2) {
        var histArray = generateHist(yaw1, yaw2, pitch1, pitch2, roll1, roll2)
        return function processHist (histDataRows) {
          histDataRows.forEach(row => {
            // console.log(`${JSON.stringify(row)} ${(row.yaw_floor - yaw1) / config.HIST_BIN_SIZE} ${(row.pitch_floor - pitch1) / config.HIST_BIN_SIZE} ${(row.roll_floor - roll1) / config.HIST_BIN_SIZE}`)
            if (row.yaw_floor === null) {
              return
            }
            var yaw = clamp((row.yaw_floor - yaw1) / config.HIST_BIN_SIZE, 0, (yaw2 - yaw1) / config.HIST_BIN_SIZE)
            var pitch = clamp((row.pitch_floor - pitch1) / config.HIST_BIN_SIZE, 0, (pitch2 - pitch1) / config.HIST_BIN_SIZE)
            var roll = clamp((row.roll_floor - roll1) / config.HIST_BIN_SIZE, 0, (roll2 - roll1) / config.HIST_BIN_SIZE)
            histArray[yaw * pitch * roll + pitch * roll + roll] = row.count
          })
          var totalCount = Jstat.sum(histArray)
          if (totalCount > (config.FEATURE_LENGTH / 10000 * VALID_THRESHOLD)) {
            // console.log(` sum: ${totalCount} threshold: ${config.FEATURE_LENGTH / 10000 * VALID_THRESHOLD}`)
            return histArray.map(d => d / totalCount)
          } else {
            return null
          }
        }
      }

      // var torsoHist = preprocessedDataDb.all(`
      //   SELECT
      //     round(torso_yaw/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS yaw_floor,
      //     round(torso_pitch/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS pitch_floor,
      //     round(torso_roll/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS roll_floor,
      //     count(*) AS count
      //   FROM Preprocessed100HZData
      //   WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH}
      //   GROUP BY 1, 2, 3
      //   ORDER BY 1, 2, 3`)
      // .then(processHistGen(-180, 180, -90, 90, -180, 180))

      // var headRelativeHist = preprocessedDataDb.all(`
      //   SELECT
      //     round(head_relative_yaw/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS yaw_floor,
      //     round(head_relative_pitch/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS pitch_floor,
      //     round(head_relative_roll/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS roll_floor,
      //     count(*) AS count
      //   FROM Preprocessed100HZData
      //   WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH} AND head_relative_yaw <= 90 AND head_relative_yaw >= -90 AND head_relative_roll < 45 AND head_relative_roll >= -45
      //   GROUP BY 1, 2, 3
      //   ORDER BY 1, 2, 3`)
      // .then(processHistGen(-90, 90, -90, 90, -45, 45))

      // var leftRelativeHist = preprocessedDataDb.all(`
      //   SELECT
      //     round(left_relative_yaw/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS yaw_floor,
      //     round(left_relative_pitch/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS pitch_floor,
      //     round(left_relative_roll/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS roll_floor,
      //     count(*) AS count
      //   FROM Preprocessed100HZData
      //   WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH}
      //   GROUP BY 1, 2, 3
      //   ORDER BY 1, 2, 3`)
      // .then(processHistGen(-180, 180, -90, 90, -180, 180))

      var rightRelativeHist = preprocessedDataDb.all(`
        SELECT
          round(right_relative_yaw/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS yaw_floor,
          round(right_relative_pitch/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS pitch_floor,
          round(right_relative_roll/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS roll_floor,
          count(*) AS count
        FROM Preprocessed100HZData
        WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH}
        GROUP BY 1, 2, 3
        ORDER BY 1, 2, 3`)
      .then(processHistGen(-180, 180, -90, 90, -180, 180))

      var feature = [] // = [jobNum].concat(mean).concat(variance).concat(median)
      // var feature_list = [[jobNum], mean, variance, median, headRelativeHist, leftRelativeHist, rightRelativeHist]
      var feature_list = [[jobNum], mean, variance, median, rightRelativeHist]
      Promise.map(feature_list, (d) => {
        if (d === null) {
          throw new Error('too much missing data')
        } else {
          feature = feature.concat(d)
        }
      }).then(() => {
        process.send({'event': 'newRow', id: process.pid, feature: feature})
      }).catch(e => {
        process.send({'event': 'ready', id: process.pid})
      })
    })
  }
}

function masterProcess () {
  console.log(`Master ${process.pid} is running`)
  var wstream = fs.createWriteStream(config.FEATURE_OUTPUT)
  var preprocessedDataDb
  var startTime
  var endTime
  var iterator
  var workers = {}
  function handleWorkerMsg (msg) {
    console.log(`master receive worker msg: ${JSON.stringify(msg.event)}`)
    var job = iterator.next()
    switch (msg.event) {
      case 'newRow':
        console.log(msg.feature.length)
        wstream.write(`${msg.feature.join(',')}\n`)
        if (!job.done) {
          workers[msg.id].send({event: 'job', jobNum: job.value})
        } else {
          workers[msg.id].send({event: 'fin'})
          delete workers[msg.id]
          if (Object.keys(workers).length === 0) {
            wstream.end()
          }
        }
        break

      case 'ready':
        if (!job.done) {
          workers[msg.id].send({event: 'job', jobNum: job.value})
        } else {
          workers[msg.id].send({event: 'fin'})
          delete workers[msg.id]
          if (Object.keys(workers).length === 0) {
            wstream.end()
          }
        }
        break
    }
  }

  dbConnect()
  .then(db => {
    preprocessedDataDb = db
  })
  .then(() => {
    return preprocessedDataDb.all(`SELECT MIN(interpolated_fixed_rate_time) FROM Preprocessed100HZData`)
  })
  .then(minTimestamp => {
    startTime = minTimestamp[0]['MIN(interpolated_fixed_rate_time)']
    return preprocessedDataDb.all(`SELECT MAX(interpolated_fixed_rate_time) FROM Preprocessed100HZData`)
  })
  .then(maxTimestamp => {
    var binString = ''
    for (var i = 0; i < 864; i++) {
      binString += `, ${i}_bin`
    }

    wstream.write(`timestamp, mean_torso_gyro_x, mean_torso_gyro_y, mean_torso_gyro_z, mean_torso_acc_x, mean_torso_acc_y, mean_torso_acc_z, mean_torso_acc_mag, mean_torso_gyro_mag, mean_head_gyro_x, mean_head_gyro_y, mean_head_gyro_z, mean_head_acc_x, mean_head_acc_y, mean_head_acc_z, mean_head_acc_mag, mean_head_gyro_mag, mean_left_gyro_x, mean_left_gyro_y, mean_left_gyro_z, mean_left_acc_x, mean_left_acc_y, mean_left_acc_z, mean_left_acc_mag, mean_left_gyro_mag, mean_right_gyro_x, mean_right_gyro_y, mean_right_gyro_z, mean_right_acc_x, mean_right_acc_y, mean_right_acc_z, mean_right_acc_mag, mean_right_gyro_mag, var_torso_gyro_x, var_torso_gyro_y, var_torso_gyro_z, var_torso_acc_x, var_torso_acc_y, var_torso_acc_z, var_torso_acc_mag, var_torso_gyro_mag, var_head_gyro_x, var_head_gyro_y, var_head_gyro_z, var_head_acc_x, var_head_acc_y, var_head_acc_z, var_head_acc_mag, var_head_gyro_mag, var_left_gyro_x, var_left_gyro_y, var_left_gyro_z, var_left_acc_x, var_left_acc_y, var_left_acc_z, var_left_acc_mag, var_left_gyro_mag, var_right_gyro_x, var_right_gyro_y, var_right_gyro_z, var_right_acc_x, var_right_acc_y, var_right_acc_z, var_right_acc_mag, var_right_gyro_mag, median_torso_gyro_x, median_torso_gyro_y, median_torso_gyro_z, median_torso_acc_x, median_torso_acc_y, median_torso_acc_z, median_torso_acc_mag, median_torso_gyro_mag, median_head_gyro_x, median_head_gyro_y, median_head_gyro_z, median_head_acc_x, median_head_acc_y, median_head_acc_z, median_head_acc_mag, median_head_gyro_mag, median_left_gyro_x, median_left_gyro_y, median_left_gyro_z, median_left_acc_x, median_left_acc_y, median_left_acc_z, median_left_acc_mag, median_left_gyro_mag, median_right_gyro_x, median_right_gyro_y, median_right_gyro_z, median_right_acc_x, median_right_acc_y, median_right_acc_z, median_right_acc_mag, median_right_gyro_mag ${binString}\n`)
    endTime = maxTimestamp[0]['MAX(interpolated_fixed_rate_time)']
    iterator = TimeIter(startTime, endTime, config.FEATURE_LENGTH / 2)
    // timeIterGen(startTime, endTime, config.FEATURE_LENGTH / 2)
    // iterator = new TimeIter(startTime, endTime, config.FEATURE_LENGTH / 2)
    for (let i = 1; i < numCPUs; i++) {
      console.log(`Forking process number ${i}...`)
      var worker = cluster.fork()
      workers[worker.process.pid] = worker
      worker.on('message', handleWorkerMsg)
    }
  })

  function * TimeIter (startTime, endTime, interval) {
    for (var cur = startTime; cur < endTime; cur += interval) {
      yield cur
    }
  }
}
