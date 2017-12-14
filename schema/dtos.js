var ByteBuffer = require('byte-buffer');
var {Schema, createSchema, createMessageSchema, deserialize, serialize} = require("./index");
var blake2b = require('blake2b')

function checksum(bytes){
  var hash = blake2b(32)
  hash.update(bytes)
  var output = new Uint8Array(32)
  hash.digest(output)
  return new ByteBuffer(output).readInt()
}

var GetPeersSchema = createMessageSchema(1, {})
var ScoreSchema = size => createMessageSchema(24, {
  score: Schema.bigInt(size)
})

var IpAddressSchema = createSchema({
  address: Schema.fixedBytes(4),
  port: Schema.int,
})

var PeersSchema = createMessageSchema(2, {
  peers: Schema.array(IpAddressSchema),
})

var signatureSchema = createSchema({
  signature: Schema.fixedStringBase58(64)
})

var GetSignaturesSchema = createMessageSchema(20, {
  signatures: Schema.array(signatureSchema)
})

var SignaturesSchema = createMessageSchema(21, {
  signatures: Schema.array(signatureSchema)
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

var Messages = {
  1: GetPeersSchema,
  2: PeersSchema,
}

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
  if(payload.length > 0)
    buffer.writeInt(checksum(payload))
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
  if(payloadLenght > 0) {
    var payloadChecksum = buffer.readInt()
    var payload = buffer.slice(buffer.index, buffer.index + payloadLenght)
    var computedChecksum = checksum(payload.raw)
    if(payloadChecksum != computedChecksum)
      throw "Invalid checksum"
  }

  var content = {}
  if(contentId == 1)
    content = deserialize(buffer, GetPeersSchema)
  else if(contentId == 2)
    content =  deserialize(buffer, PeersSchema)
  else if(contentId == 21)
    content =  deserialize(buffer, SignaturesSchema)
  else if(contentId == 24)
    content =  deserialize(buffer, ScoreSchema(payloadLenght))

  return {
    contentId,
    content
  }
}

module.exports = {VersionSchema, HandshakeSchema, GetPeersSchema, ScoreSchema, GetSignaturesSchema, SignaturesSchema, serializeMessage, deserializeMessage}
