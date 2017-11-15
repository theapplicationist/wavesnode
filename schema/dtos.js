var ByteBuffer = require('byte-buffer');
var {Schema, createSchema, createMessageSchema, deserialize, serialize} = require("./index");

var GetPeersSchema = createMessageSchema(1, {})

var IpAddressSchema = createSchema({
  address: Schema.fixedBytes(4),
  port: Schema.int,
})

var PeersSchema = createMessageSchema(2, {
  peers: Schema.array(IpAddressSchema),
})
  
var VersionSchema = createSchema({
  major: Schema.int, 
  minor: Schema.int,
  patch: Schema.int,
})

var HandshakeSchema = createSchema({
  appName: Schema.string,
  version: VersionSchema,
  nodeName: Schema.string,
  nonce: Schema.long,
  declaredAddress: Schema.bytes,
  timestamp: Schema.long,
})

var serializeMessage = function(obj, messageSchema) {
  if(!messageSchema)
    messageSchema = obj.schema

  if(!messageSchema)
    throw "MessageSchema not found"

  if(!messageSchema.contentId)
    throw "Invalid messageSchema: contentId not found"

  var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
  var payload = serialize(obj, messageSchema)
  buffer.writeInt(305419896) 
  buffer.writeByte(messageSchema.contentId)
  buffer.writeInt(payload.length)
  buffer.writeInt(0)
  buffer.write(payload)

  var length = buffer.length
  buffer.prepend(4)
  buffer.index = 0
  buffer.writeInt(length)

  return new Buffer(buffer.raw)
}

var deserializeMessage = function(buffer) {
  var length = buffer.readInt()
  var magic = buffer.readInt()
  var contentId = buffer.readByte()
  var payloadLenght = buffer.readInt()
  var payloadChecksum = buffer.readInt()
  
  if(contentId == 2){
    return deserialize(buffer, PeersSchema)
  }

  return {}
}

module.exports = {VersionSchema, HandshakeSchema, GetPeersSchema, serializeMessage, deserializeMessage}
