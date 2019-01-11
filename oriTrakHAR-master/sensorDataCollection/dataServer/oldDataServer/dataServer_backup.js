'use strict'
const net = require('net')
const os = require('os')
const dataServer = net.createServer()
const config = require('./config')
// const dbService = require('./db_service')
// const Promise = require('bluebird')
// const realtimeVis = require('./realtimeVis')
// const express = require('express')

// var app = express()
var macAddr
const platform = os.platform()
if (platform === 'darwin') {
  macAddr = os.networkInterfaces().en3[0].mac
} else if (platform === 'linux') {
  try {
    macAddr = os.networkInterfaces().wlan0[0].mac // change wlan0 to what ever interface you are using
  } catch (e) {
    macAddr = os.networkInterfaces().wlan1[0].mac // change wlan0 to what ever interface you are using
  }
}
const machineId = mac2Id(macAddr)

var clients = {}
var clientIDList = []
var curPollClientID = 0

dataServer.on('connection', socket => {
  const clientId = socket.remoteAddress.split(':')[3]
  if (!clients.hasOwnProperty(clientId)) {
    clients[clientId] = {
      sock: socket,
      mac: ''
    }
  }
  clientIDList.push(clientId)
  socket.on('data', processDataGen(clientId))
  socket.on('end', () => { delClient(clientId) })
  socket.on('error', err => {
    console.log(err)
    socket.end()
    delClient(clientId)
  })
})

function delClient (clientId) {
  clientIDList = clientIDList.filter(id => id !== clientId)
  delete clients[clientId]
}

dataServer.listen(config.PORT)

setInterval(() => {
  if (clientIDList.length > 0) {
    var msg = Buffer.alloc(4)
    msg.writeFloatLE(new Date().valueOf(), 0)
    console.log(`${msg}  len-${msg.length}`)
    clients[clientIDList[curPollClientID]].sock.write(msg)
    curPollClientID++
    if (curPollClientID >= clientIDList.length) {
      curPollClientID = 0
    }
  }
}, config.POLL_INTERVAL)

function processDataGen (clientId) {
  return function processData (data) {
    console.log(`got data from id ${clientId} and data length: ${data.length}`)
  }
}

function mac2Id (mac) {
  return Buffer.from([Buffer.from(mac.substring(6, 8), 16), Buffer.from(mac.substring(9, 11), 16), Buffer.from(mac.substring(12, 14), 16), Buffer.from(mac.substring(15, 17), 16)].join('')).readUInt32LE(0)
}
