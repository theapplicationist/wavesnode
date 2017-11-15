var net = require('net');
var ByteBuffer = require('byte-buffer');
var Int64BE = require("int64-buffer").Int64BE;
var {Schema, createSchema, objWithSchema, deserialize, serialize} = require("./schema")
var {VersionSchema, HandshakeSchema, MessageSchema, GetPeersSchema} = require("./schema/dtos")

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

var getPeers = objWithSchema(GetPeersSchema, {})

var client = new net.Socket();
client.connect(6863, '52.28.66.217', function() {
  console.log('Connected');
  var data = serialize(handshake)
  client.write(data);
});

client.on('error', err => {
  console.log(err)
})

function handshakeHandler(data) {
  console.log('Handshake');
  var buffer = new ByteBuffer(data.buffer)
  var obj = deserialize(buffer, HandshakeSchema)
  console.log(obj)
}

function messageHandler(data) {
  var buffer = new ByteBuffer(data.buffer)
  var obj = deserialize(buffer, MessageSchema)
  console.log(obj.payload.contentId)
}

client.once('data', function(data) {
  handshakeHandler(data)
	client.on('data', messageHandler)
});

client.on('close', function() {
	console.log('Connection closed');
});