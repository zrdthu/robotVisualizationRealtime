'use strict'
const net = require('net')
const os = require('os')
const dataServer = net.createServer()
const config = require('./config')
// const dbService = require('./db_service')
const arpScanner = require('arpscan/promise')
const Promise = require('bluebird')
// const realtimeVis = require('./realtimeVis')
// const express = require('express')

// var app = express()
var macAddr
var arpOption
const platform = os.platform()
if (platform === 'darwin') {
  macAddr = os.networkInterfaces().en3[0].mac
  arpOption = {
    interface: 'bridge100'
  }
} else if (platform === 'linux') {
  try {
    macAddr = os.networkInterfaces().wlan0[0].mac // change wlan0 to what ever interface you are using
    arpOption = {
      interface: 'wlan0'
    }
  } catch (e) {
    macAddr = os.networkInterfaces().wlan1[0].mac // change wlan0 to what ever interface you are using
    arpOption = {
      interface: 'wlan1'
    }
  }
}
const machineId = mac2Id(macAddr)
var pollQueue = Promise.resolve()

var clients = {}

dataServer.on('connection', client => {
  // console.log(client.remoteAddress)
  // console.log('--------------------------')
  const clientId = client.remoteAddress.split(':')[3]

  if (!clients.hasOwnProperty(clientId)) {
    clients[clientId] = {
      sock: client,
      mac: ''
    }
  }
  client.on('data', processDataGen(clientId))
  pollQueue = pollQueue.then(() => {
    return arpScanner(arpOption)
      .then(data => {
        if (data) {
          data.forEach(res => {
            if (res.ip === clientId) {
              // console.log(`arp scan ip: ${res.ip}, clientId: ${clientId}`)
              clients[clientId].mac = mac2Id(res.ip)
            }
          })
        }
      })
  })
})

dataServer.listen(config.PORT)

poll()

function poll () {
  pollQueue
  .then(() => {
    // console.log('poll')
    var clientIds = Object.keys(clients)
    if (clientIds.length > 0) {
      clientIds.forEach(clientId => {
        if (clients[clientId].mac) {
          pollQueue = pollQueue.then(() => {
            // console.log(clientId)
            clients[clientId].sock.write(Buffer.from([0]))
            console.log('write')
          }).delay(config.POLL_INTERVAL)
        }
      })
    } else {
      pollQueue = pollQueue.then().delay(config.POLL_INTERVAL * 10)
    }

    return pollQueue
  })
  .then(poll)
}

function processDataGen (clientId) {
  return function processData (data) {
    // console.log(`got data from id ${clientId} and data length: ${data.length}`)
  }
}

function mac2Id (mac) {
  return Buffer.from([Buffer.from(mac.substring(6, 8), 16), Buffer.from(mac.substring(9, 11), 16), Buffer.from(mac.substring(12, 14), 16), Buffer.from(mac.substring(15, 17), 16)].join('')).readUInt32LE(0)
}
