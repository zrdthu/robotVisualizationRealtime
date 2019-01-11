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
// const numCPUs = 2

// var preprocessedDataDb

if (cluster.isMaster) {
  masterProcess()
} else {
  childProcess()
}

function childProcess() {
  var preprocessedDataDb
  function handleMasterMsg(msg) {
    console.log(`Worker receive master msg: ${JSON.stringify(msg)}`)
    switch (msg.event) {
      case 'job':
        processData(msg.jobNum)
        break
      case 'fin':
        process.exit()
        break
    }
  }
  var execQueue = dbConnect()
  .then(db => {
    preprocessedDataDb = db
    process.on('message', handleMasterMsg)

  })
  .then(() => {
    console.log(`process ${process.pid} connected!`)
    process.send({event:'ready', id:process.pid})
  })

  function generateHist(yaw1, yaw2, pitch1, pitch2, roll1, roll2) {
    return Array((yaw2 - yaw1) / config.HIST_BIN_SIZE * (pitch2 - pitch1) / config.HIST_BIN_SIZE * (roll2 - roll1) / config.HIST_BIN_SIZE).fill(0)
  }

  function clamp(num, min, max) {
    if (num < min) {
      num = min
    } else if (num > max) {
      num = max
    }
    return num
  }

  function processHistGen(yaw1, yaw2, pitch1, pitch2, roll1, roll2) {
    var histArray = generateHist(yaw1, yaw2, pitch1, pitch2, roll1, roll2)
    return function processHist(histDataRows) {
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
      if (totalCount > (config.FEATURE_LENGTH / 10000 * 0.85)) {
        // console.log(` sum: ${totalCount}`)
        return histArray.map(d => d/totalCount)
      } else {
        return null
      }
    }
  }
  function processData(jobNum) {
    console.log(`${process.pid} on job ${jobNum}`)
    function getFFTPhasors (input) {
      const f = new Ra4Fft(config.WINDOW_SIZE)
      const out = f.createComplexArray()
      f.realTransform(out, input)
      f.completeSpectrum(out)
      var phasors = []
      out.forEach((element, ndx) => {
        var i = Math.floor(ndx / 2)
        var isOdd = ndx % 2
        if (!isOdd) {
          phasors.push([element])
        } else {
          phasors[i].push(element)
        }
      })
      return phasors
    }

    function getKeyFreqMag (phasors, SAMPLE_RATE, id) {
      // var sensor1Frequencies = fftUtil.fftFreq(phasors, config.SAMPLE_RATE)
      // console.log(sensor1Frequencies.length)
      var magnitudes = fftUtil.fftMag(phasors)
      var combined = []
      // console.log(magnitudes)
      for (var i = 0; i < magnitudes.length / 2; i += 8) {
        // console.log(Jstat.sum(magnitudes.slice(i, i+8)))
        combined.push(Jstat.sum(magnitudes.slice(i, i+8)))
      }
      // console.log(`combined: ${JSON.stringify(combined)}`)
      return combined
    }


    var rawDataProcess = preprocessedDataDb.all(getRawDataQuery(jobNum))
    .then(data => {
      if (data.length <= (config.FEATURE_LENGTH / 10000 * 0.85)) {
        return null
      }
      torso_gyro_x = data.map(d => d.torso_gyro_x).filter(d => d !== null)
      torso_gyro_y = data.map(d => d.torso_gyro_y).filter(d => d !== null)
      torso_gyro_z = data.map(d => d.torso_gyro_z).filter(d => d !== null)
      torso_acc_x = data.map(d => d.torso_acc_x).filter(d => d !== null)
      torso_acc_y = data.map(d => d.torso_acc_y).filter(d => d !== null)
      torso_acc_z = data.map(d => d.torso_acc_z).filter(d => d !== null)
      torso_acc_mag = data.map(d => d.torso_acc_mag).filter(d => d !== null)
      torso_gyro_mag = data.map(d => d.torso_gyro_mag).filter(d => d !== null)
      head_gyro_x = data.map(d => d.head_gyro_x).filter(d => d !== null)
      head_gyro_y = data.map(d => d.head_gyro_y).filter(d => d !== null)
      head_gyro_z = data.map(d => d.head_gyro_z).filter(d => d !== null)
      head_acc_x = data.map(d => d.head_acc_x).filter(d => d !== null)
      head_acc_y = data.map(d => d.head_acc_y).filter(d => d !== null)
      head_acc_z = data.map(d => d.head_acc_z).filter(d => d !== null)
      head_acc_mag = data.map(d => d.head_acc_mag).filter(d => d !== null)
      head_gyro_mag = data.map(d => d.head_gyro_mag).filter(d => d !== null)
      left_gyro_x = data.map(d => d.left_gyro_x).filter(d => d !== null)
      left_gyro_y = data.map(d => d.left_gyro_y).filter(d => d !== null)
      left_gyro_z = data.map(d => d.left_gyro_z).filter(d => d !== null)
      left_acc_x = data.map(d => d.left_acc_x).filter(d => d !== null)
      left_acc_y = data.map(d => d.left_acc_y).filter(d => d !== null)
      left_acc_z = data.map(d => d.left_acc_z).filter(d => d !== null)
      left_acc_mag = data.map(d => d.left_acc_mag).filter(d => d !== null)
      left_gyro_mag = data.map(d => d.left_gyro_mag).filter(d => d !== null)
      right_gyro_x = data.map(d => d.right_gyro_x).filter(d => d !== null)
      right_gyro_y = data.map(d => d.right_gyro_y).filter(d => d !== null)
      right_gyro_z = data.map(d => d.right_gyro_z).filter(d => d !== null)
      right_acc_x = data.map(d => d.right_acc_x).filter(d => d !== null)
      right_acc_y = data.map(d => d.right_acc_y).filter(d => d !== null)
      right_acc_z = data.map(d => d.right_acc_z).filter(d => d !== null)
      right_acc_mag = data.map(d => d.right_acc_mag).filter(d => d !== null)
      right_gyro_mag = data.map(d => d.right_gyro_mag).filter(d => d !== null)

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


      torso_gyro_x_FFT = getKeyFreqMag(getFFTPhasors(torso_gyro_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      torso_gyro_y_FFT = getKeyFreqMag(getFFTPhasors(torso_gyro_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      torso_gyro_z_FFT = getKeyFreqMag(getFFTPhasors(torso_gyro_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      torso_acc_x_FFT = getKeyFreqMag(getFFTPhasors(torso_acc_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      torso_acc_y_FFT = getKeyFreqMag(getFFTPhasors(torso_acc_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      torso_acc_z_FFT = getKeyFreqMag(getFFTPhasors(torso_acc_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      torso_acc_mag_FFT = getKeyFreqMag(getFFTPhasors(torso_acc_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      torso_gyro_mag_FFT = getKeyFreqMag(getFFTPhasors(torso_gyro_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_gyro_x_FFT = getKeyFreqMag(getFFTPhasors(head_gyro_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_gyro_y_FFT = getKeyFreqMag(getFFTPhasors(head_gyro_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_gyro_z_FFT = getKeyFreqMag(getFFTPhasors(head_gyro_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_acc_x_FFT = getKeyFreqMag(getFFTPhasors(head_acc_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_acc_y_FFT = getKeyFreqMag(getFFTPhasors(head_acc_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_acc_z_FFT = getKeyFreqMag(getFFTPhasors(head_acc_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_acc_mag_FFT = getKeyFreqMag(getFFTPhasors(head_acc_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      head_gyro_mag_FFT = getKeyFreqMag(getFFTPhasors(head_gyro_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_gyro_x_FFT = getKeyFreqMag(getFFTPhasors(left_gyro_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_gyro_y_FFT = getKeyFreqMag(getFFTPhasors(left_gyro_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_gyro_z_FFT = getKeyFreqMag(getFFTPhasors(left_gyro_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_acc_x_FFT = getKeyFreqMag(getFFTPhasors(left_acc_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_acc_y_FFT = getKeyFreqMag(getFFTPhasors(left_acc_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_acc_z_FFT = getKeyFreqMag(getFFTPhasors(left_acc_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_acc_mag_FFT = getKeyFreqMag(getFFTPhasors(left_acc_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      left_gyro_mag_FFT = getKeyFreqMag(getFFTPhasors(left_gyro_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_gyro_x_FFT = getKeyFreqMag(getFFTPhasors(right_gyro_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_gyro_y_FFT = getKeyFreqMag(getFFTPhasors(right_gyro_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_gyro_z_FFT = getKeyFreqMag(getFFTPhasors(right_gyro_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_acc_x_FFT = getKeyFreqMag(getFFTPhasors(right_acc_x.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_acc_y_FFT = getKeyFreqMag(getFFTPhasors(right_acc_y.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_acc_z_FFT = getKeyFreqMag(getFFTPhasors(right_acc_z.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_acc_mag_FFT = getKeyFreqMag(getFFTPhasors(right_acc_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)
      right_gyro_mag_FFT = getKeyFreqMag(getFFTPhasors(right_gyro_mag.slice(0, config.WINDOW_SIZE)), config.SAMPLE_RATE)


      var features = mean.concat(variance, median,
        torso_gyro_x_FFT,
        torso_gyro_y_FFT,
        torso_gyro_z_FFT,
        torso_acc_x_FFT,
        torso_acc_y_FFT,
        torso_acc_z_FFT,
        torso_acc_mag_FFT,
        torso_gyro_mag_FFT,
        head_gyro_x_FFT,
        head_gyro_y_FFT,
        head_gyro_z_FFT,
        head_acc_x_FFT,
        head_acc_y_FFT,
        head_acc_z_FFT,
        head_acc_mag_FFT,
        head_gyro_mag_FFT,
        left_gyro_x_FFT,
        left_gyro_y_FFT,
        left_gyro_z_FFT,
        left_acc_x_FFT,
        left_acc_y_FFT,
        left_acc_z_FFT,
        left_acc_mag_FFT,
        left_gyro_mag_FFT,
        right_gyro_x_FFT,
        right_gyro_y_FFT,
        right_gyro_z_FFT,
        right_acc_x_FFT,
        right_acc_y_FFT,
        right_acc_z_FFT,
        right_acc_mag_FFT,
        right_gyro_mag_FFT
      )

      // var phasors = getFFTPhasors(torso_gyro_x.slice(0, config.WINDOW_SIZE))
      // var fftMag = getKeyFreqMag(phasors, this.SAMPLE_RATE)
      // console.log(`fftMag: ${JSON.stringify(fftMag)}`)
      // console.log(features)
      // console.log(features.length)

      return features
    })

    var torsoHist = preprocessedDataDb.all(`
      SELECT
        round(torso_yaw/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS yaw_floor,
        round(torso_pitch/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS pitch_floor,
        round(torso_roll/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS roll_floor,
        count(*) AS count
      FROM Preprocessed100HZData
      WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH}
      GROUP BY 1, 2, 3
      ORDER BY 1, 2, 3`)
    .then(processHistGen(-180, 180, -90, 90, -180, 180))

    var headRelativeHist = preprocessedDataDb.all(`
      SELECT
        round(head_relative_yaw/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS yaw_floor,
        round(head_relative_pitch/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS pitch_floor,
        round(head_relative_roll/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS roll_floor,
        count(*) AS count
      FROM Preprocessed100HZData
      WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH} AND head_relative_yaw <= 90 AND head_relative_yaw >= -90 AND head_relative_roll < 45 AND head_relative_roll >= -45
      GROUP BY 1, 2, 3
      ORDER BY 1, 2, 3`)
    .then(processHistGen(-90, 90, -90, 90, -45, 45))

    var leftRelativeHist = preprocessedDataDb.all(`
      SELECT
        round(left_relative_yaw/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS yaw_floor,
        round(left_relative_pitch/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS pitch_floor,
        round(left_relative_roll/${config.HIST_BIN_SIZE} - 0.5)*${config.HIST_BIN_SIZE} AS roll_floor,
        count(*) AS count
      FROM Preprocessed100HZData
      WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH}
      GROUP BY 1, 2, 3
      ORDER BY 1, 2, 3`)
    .then(processHistGen(-180, 180, -90, 90, -180, 180))

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
    var features = []
    var hasNull = false
    Promise.map([[jobNum], rawDataProcess, torsoHist, headRelativeHist, leftRelativeHist, rightRelativeHist], feat => {
      if (feat === null) {
        hasNull = true
      }
      if (!hasNull) {
        features = features.concat(feat)
      }
    })
    .then(() => {
      if (hasNull) {
        process.send({'event': 'ready', id: process.pid})
      } else {
        process.send({'event': 'newRow', id: process.pid, feature: features})
      }
    })
  }
  function getRawDataQuery(jobNum) {
    return `SELECT * FROM Preprocessed100HZData WHERE interpolated_fixed_rate_time >= ${jobNum} AND interpolated_fixed_rate_time < ${jobNum + config.FEATURE_LENGTH}`
  }
}

function masterProcess () {
  console.log(`Master ${process.pid} is running`)
  var wstream = fs.createWriteStream(config.FEATURE_OUTPUT);
  var preprocessedDataDb
  var startTime
  var endTime
  var iterator
  var workers = {}
  function handleWorkerMsg(msg) {
    console.log(`master receive worker msg: ${JSON.stringify(msg.event)}`)
    switch (msg.event) {
      case 'newRow':
        wstream.write(`${msg.feature.join(',')}\n`)
      case 'ready':
        var jobNum = iterator.next()
        if (jobNum) {
          workers[msg.id].send({event: 'job', jobNum: jobNum})
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
    endTime = maxTimestamp[0]['MAX(interpolated_fixed_rate_time)']
    console.log(startTime)
    console.log(endTime)
    iterator = new Iterator(startTime, endTime, config.FEATURE_LENGTH / 2)
    for (let i = 1; i < numCPUs; i++) {
      console.log(`Forking process number ${i}...`)
      var worker = cluster.fork()
      workers[worker.process.pid] = worker
      worker.on('message', handleWorkerMsg)
    }
  })

  function Iterator(min, max, step) {
    this.min = min - step
    this.max = max
    this.step = step
    this.cur =  this.min
    this.next = function() {
      var ans
      this.cur += this.step
      if (this.cur <= this.max) {
        ans = this.cur
      } else {
        ans = null
      }
      return ans
    }
  }
}



function dbConnect() {
  return db.open(config.PROCESSED_DATA_PATH, {Promise})
}

