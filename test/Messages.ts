import { array, int, string, byte, bytes, fixedBytes, fixedStringBase58, long, bigInt, fixedStringBase64 } from '../src/schema/primitives'
import { BufferBe } from '../src/binary/BufferBE'
import * as assert from 'assert'
import { createSchema, createMessageSchema } from '../src/schema/ISchema'
import { HandshakeSchema, Handshake, BlockSchema } from '../src/schema/messages'
import { suite, test, slow, timeout } from "mocha-typescript"
import * as Long from "long"
import * as fs from 'fs'

suite('Messages', () => {
  const buffer = BufferBe()

  beforeEach(() => {
    buffer.clear()
  })

  test('handshake', () => {
    const handshake : Handshake = {
      appName: 'waves' + 'W',
      version: { major: 0, minor: 8, patch: 0 },
      nodeName: 'name',
      nonce: Long.fromInt(0),
      declaredAddress: [],
      timestamp: Long.fromNumber(new Date().getTime())
    }

    HandshakeSchema.encode(buffer, handshake)
    buffer.seek(0)

    assert.deepEqual(HandshakeSchema.decode(buffer), handshake)
  })

  test('block', () => {
    const blockSignature = '4uZ6ji8SMYgzA1AK8xSUnufxFNhV65oiom4WCc89i8Ng6gVjjZZFJWUJpb8a4GdbjCgbJ6geNYzMjyC18JSCwoCQ'
    const buffer = BufferBe(fs.readFileSync('./test/blocks/' + blockSignature))
    const block = BlockSchema.decode(buffer)
    assert.equal(block.signature, blockSignature)
  })
  
})