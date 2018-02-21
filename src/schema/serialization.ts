import blake2b = require('blake2b')
import ByteBuffer = require('byte-buffer');
import { IDictionary } from '../generic/IDictionary';
import { ISchema, IMessageSchema } from './ISchema';
import { Buffer } from 'buffer';
import { MessageCode, Schema } from './messages';
import { BufferBe } from '../binary/BufferBE';

export function checksum(bytes) {
  var hash = blake2b(32)
  hash.update(bytes)
  var output = new Uint8Array(32)
  hash.digest(output)
  return new ByteBuffer(output).readInt()
}

export function serializeMessage<T>(obj: T, code: MessageCode) {
  const schema = Schema(code) as ISchema<T>
  const buffer = BufferBe()
  buffer.writeZeros(4 + 4 + 1 + 4 + 4)
  const beforePayload = buffer.position()
  schema.encode(buffer, obj)
  const afterPayload = buffer.position()
  const payloadLength = afterPayload - beforePayload
  const offset = payloadLength == 0 ? 4 : 0
  buffer.seek(offset+4)
  buffer.writeInt(305419896)
  buffer.writeByte(code)
  buffer.writeInt(payloadLength)
  if (payloadLength > 0) {
    const payload = buffer.raw(beforePayload, afterPayload)
    buffer.writeInt(checksum(payload))
  }
  buffer.seek(offset)
  buffer.writeInt(buffer.length() - offset - 4)

  return buffer.raw(offset)
}

export function deserializeMessage(buffer: BufferBe): { code: MessageCode, content: any } {
  var length = buffer.readInt()
  var magic = buffer.readInt()
  var code = buffer.readByte() as MessageCode

  var payloadLength = buffer.readInt()
  if (payloadLength > 0) {
    var payloadChecksum = buffer.readInt()
    //var payload = buffer.slice(buffer.index, buffer.index + payloadLength)
    //var computedChecksum = checksum(payload.raw)
    //if (payloadChecksum != computedChecksum)
    //  throw "Invalid checksum"
  }

  const schema = Schema(code)
  if (schema){
    const content = schema.decode(buffer)
    return { code, content }
  }
}
