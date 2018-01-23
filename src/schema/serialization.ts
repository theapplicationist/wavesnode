import blake2b = require('blake2b')
import ByteBuffer = require('byte-buffer');
import { IDictionary } from '../generic/IDictionary';
import { ISchema, IMessageSchema } from './ISchema';
import { Buffer } from 'buffer';
import { MessageCode, Schema } from './messages';

export function checksum(bytes) {
  var hash = blake2b(32)
  hash.update(bytes)
  var output = new Uint8Array(32)
  hash.digest(output)
  return new ByteBuffer(output).readInt()
}


type SchemaFactory = ((self: any) => ISchema)

export function createSchema(namedSchemas: IDictionary<ISchema | SchemaFactory>): ISchema {
  const keys = Object.keys(namedSchemas)
  return {
    encode: (buffer, obj) => {
      keys.forEach(k => {
        let schema = namedSchemas[k]
        if (typeof schema === 'function')
          schema = (schema as SchemaFactory)(obj)
        //console.log(`encoding: ${k} = ${obj[k]}`)
        schema.encode(buffer, obj[k])
      })
    },
    decode: buffer => {
      const obj = {}
      keys.forEach(k => {
        let schema = namedSchemas[k]
        if (typeof schema === 'function')
          schema = (schema as SchemaFactory)(obj)
        obj[k] = schema.decode(buffer)
      })
      return obj
    }
  }
}

export function createMessageSchema(contentId: number, namedSchemas: IDictionary<ISchema>): IMessageSchema {
  const schema = createSchema(namedSchemas)
  schema['contentId'] = contentId
  const r = schema as IMessageSchema
  return r
}

export function serializeMessage(obj, code: MessageCode) {
  const schema = Schema(code)
  var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
  schema.encode(buffer, obj)
  const payload = new Buffer(buffer.raw)
  buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
  buffer.writeInt(305419896)
  buffer.writeByte(code)
  buffer.writeInt(payload.length)
  if (payload.length > 0)
    buffer.writeInt(checksum(payload))
  buffer.write(payload)

  var length = buffer.length
  buffer.prepend(4)
  buffer.index = 0
  buffer.writeInt(length)

  return new Buffer(buffer.raw)
}

export function deserializeMessage(buffer): { code: MessageCode, content: any } {
  var length = buffer.readInt()
  var magic = buffer.readInt()
  var code = buffer.readByte() as MessageCode

  var payloadLength = buffer.readInt()
  if (payloadLength > 0) {
    var payloadChecksum = buffer.readInt()
    var payload = buffer.slice(buffer.index, buffer.index + payloadLength)
    //var computedChecksum = checksum(payload.raw)
    //if (payloadChecksum != computedChecksum)
    //  throw "Invalid checksum"
  }

  const schema = Schema(code)
  if (schema)
    return { code, content: schema.decode(buffer) }
}
