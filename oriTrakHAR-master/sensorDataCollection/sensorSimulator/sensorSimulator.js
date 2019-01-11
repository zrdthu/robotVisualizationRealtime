const net = require('net')
const client = new net.Socket()

const PORT = 9000
const ADDR = '127.0.0.1' // change this to the router address of android wifi hotspot
var offset100 = 0
var offset20 = 0
var offset1 = 0

client.connect(PORT, ADDR, () => {
  console.log('connect...')
  setInterval(() => {
    var buffer = Buffer.alloc(60)
    buffer.writeUInt32LE(11111000, 0)
    buffer.writeUInt32LE(new Date().valueOf() - 1517381000000, 4)
    buffer.writeFloatLE(0.1 + offset100, 8)
    buffer.writeFloatLE(0.2 + offset100, 12)
    buffer.writeFloatLE(0.3 + offset100, 16)
    buffer.writeFloatLE(0.4 + offset100, 20)
    buffer.writeFloatLE(1.1 + offset100, 24)
    buffer.writeFloatLE(1.2 + offset100, 28)
    buffer.writeFloatLE(1.3 + offset100, 32)
    buffer.writeFloatLE(2.1 + offset100, 36)
    buffer.writeFloatLE(2.2 + offset100, 40)
    buffer.writeFloatLE(2.3 + offset100, 44)
    buffer.writeFloatLE(3.1 + offset100, 48)
    buffer.writeFloatLE(3.2 + offset100, 52)
    buffer.writeFloatLE(3.3 + offset100, 56)
    client.write(buffer)
    offset100 += 0.000000001
  }, 10)

  setInterval(() => {
    var buffer = Buffer.alloc(20)
    buffer.writeUInt32LE(11111000, 0)
    buffer.writeUInt32LE(new Date().valueOf() - 1517381000000, 4)
    buffer.writeFloatLE(4.1 + offset20, 8)
    buffer.writeFloatLE(4.2 + offset20, 12)
    buffer.writeFloatLE(4.3 + offset20, 16)
    client.write(buffer)
    offset20 += 0.000000001
  }, 50)

  setInterval(() => {
    var buffer = Buffer.alloc(12)
    buffer.writeUInt32LE(11111000, 0)
    buffer.writeUInt32LE(new Date().valueOf() - 1517381000000, 4)
    buffer.writeFloatLE(8.1 + offset1, 8)
    client.write(buffer)
    offset1 += 0.000000001
  }, 1000)

  client.on('error', (e) => {
    console.log(e)
  })
})
