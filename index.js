var net = require('net');
var ByteBuffer = require('byte-buffer');
var Int64BE = require("int64-buffer").Int64BE;
var {Schema, createSchema, objWithSchema, deserialize, serialize} = require("./schema")
var {VersionSchema, HandshakeSchema, GetPeersSchema, serializeMessage, deserializeMessage} = require("./schema/dtos")

Int64BE.prototype.inspect = function(depth, inspectArgs){
  return this.toString()
};

ByteBuffer.prototype.inspect = function(depth, inspectArgs){
  return `[ ${this.raw.join(", ")} ]`
};

var handshake = objWithSchema(HandshakeSchema, {
  appName: 'wavesT',
  version: {major: 0, minor: 8, patch: 0},
  nodeName: 'name',
  nonce: new Int64BE(0),
  declaredAddress: new Uint8Array(0),
  timestamp: new Int64BE(new Date().getTime())
})

var client = new net.Socket()
client.connect(6863, '127.0.0.1', function(){
  console.log('Connected');
  var data = serialize(handshake)
  console.log('Sending handshake')
  client.write(data);
  console.log('Handshake sent')
});

client.on('error', err => {
  console.log('Error occured');
  console.log(err)
})

function tryToHandleHandshake(buffer) {
  buffer.front()
  if(buffer.available < 22)
    return

  try {
    var handshake = deserialize(buffer, HandshakeSchema)
    buffer.clip(buffer.index)
    return handshake
  }
  catch(ex) {
    return
  }
  
  var getPeers = serializeMessage({}, GetPeersSchema)
  client.write(getPeers)
}

function tryToFetchMessage(buffer) {
  buffer.front()

  if(buffer.available < 4)
    return
  
  var size = buffer.readInt()
  if(size > buffer.available)
    return

  var message = buffer.slice(0, size + 4)
  buffer.clip(message.length)

  return message
}

function messageHandler(buffer) {
  console.log("Data reveiced:")
  var obj = deserializeMessage(buffer)
  console.log(obj)
}

var handshakeWasReceived = false;
var incomingBuffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
client.on('data', function(data) {
  
  incomingBuffer.end()
  incomingBuffer.write(data.buffer)

  if(!handshakeWasReceived && tryToHandleHandshake(incomingBuffer)) {
    handshakeWasReceived = true
    client.write(serializeMessage({}, GetPeersSchema))
  }

  if(handshakeWasReceived) {
    do {
      var messageBuffer = tryToFetchMessage(incomingBuffer)
      if(messageBuffer)
        messageHandler(messageBuffer)
    } while(messageBuffer)
  }
})

client.on('close', function() {
	console.log('Connection closed');
})