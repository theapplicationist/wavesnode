var {Schema, createSchema} = require("./index");


var GetPeersSchema = createSchema({

})

var payloadCodec = {
  encode: (b, v) => "",
  decode: b => {
    var contentId = b.readByte()
    var contentLenght = b.readInt()
    var checksum = b.readInt()
    
    switch(contentId) {
      case 1:
        return {contentId: 1, content: {}}  
        break;
      default:
    }
  }
}

var MessageSchema = createSchema({
  length: Schema.int,
  magic: Schema.bytes(4),
  payload: payloadCodec
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

function message(payloadSchema, payloadObj) {
  //var payload = new ByteBuffer()
  return {
    length: payload.length,

  }
}

module.exports = {VersionSchema, HandshakeSchema, MessageSchema, GetPeersSchema}
  
