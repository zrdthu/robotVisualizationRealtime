// TODO: Add this to the preprocessedDB data file
const Sqlite = require('sqlite-pool')
const config = require('./config')
const fs = require('fs')
Promise = require('bluebird')
const csv = require('csv-stream')
const cluster_name = 'histogram'
const dbInit = fs.readFileSync('./initClusteringResult.sql').toString()
var csvStream = csv.createStream({})

var preprocssedDB = new Sqlite(config.PROCESSED_DATA_PATH, {Promise})
var resultDB = new Sqlite(config.CLUSTER_DB_PATH, {Promise})
var resultDBPromise = Promise.resolve()
resultDB.exec(dbInit)
.then(() => {
  return resultDB.all(`INSERT OR REPLACE INTO ClusteringName(name) VALUES("${cluster_name}")`)
})
.then(() => {
  return resultDB.all(`SELECT id FROM ClusteringName WHERE name = "${cluster_name}"`)
})
.then(data => {
  console.log('finished init')
  clustering_id = data[0].id
  var resolve
  var reject
  var promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  fs.createReadStream(config.CLUSTER_RESULT_FILE)
  .pipe(csvStream)
  .on('error', err => {
    reject(err)
    console.error(err)
  })
  .on('data', data => {
    resultDBPromise = resultDBPromise.then(() => {
      return resultDB.all(`INSERT OR REPLACE INTO ClusteringData(cluster_id, timestamp, cluster) VALUES (${clustering_id}, ${data.timestamp / 1000}, ${data.Cluster.match(/\d+/)[0]})`)
    })
  })
  .on('end', () => {
    resultDBPromise = resultDBPromise.then(() => {
      resolve()
    })
  })
  return promise
})
.then(() => {
  var resolve
  var reject
  var promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  console.log('get GPS data')
  preprocssedDB.all(`SELECT location_timestamp, location_latitude, location_longitude FROM GPSData`)
  .then(data => {
    console.log(data.length)
    for(var i = 0; i < data.length - 1; i++) {
      resultDBPromise = resultDBPromise.then((i => {
        console.log(i)
        console.log(`${data[i].location_timestamp * 1000} - ${data[i + 1].location_timestamp * 1000}`)
        return resultDB.exec(`UPDATE ClusteringData set location_latitude = ${data[i].location_latitude}, location_longitude = ${data[i].location_longitude} WHERE timestamp >= ${data[i].location_timestamp * 1000} AND timestamp < ${data[i+1].location_timestamp * 1000}`)
      }).bind(this, i))
      if (i === data.length - 2) {
        resultDBPromise = resultDBPromise.then(() => {
          resolve()
        })
      }
    }
  })
  return promise
})

process.on('exit',cleanUp)
process.on('SIGINT', cleanUp)

function cleanUp() {
  console.log('clean up')
  preprocssedDB.close()
  resultDB.close()
}