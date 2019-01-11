var net = require('net')

var server = net.createServer()

function processData (data) {
  console.log(data)
}
server.on('connection', client => {
  console.log(client.server._connectionKey)
  client.on('data', processData)
})

server.listen(9000, '127.0.0.1')
