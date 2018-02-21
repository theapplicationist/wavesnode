import { array, int, string, byte, bytes, fixedBytes, fixedStringBase58, long, bigInt, fixedStringBase64 } from '../src/schema/primitives'
import { BufferBe } from '../src/binary/BufferBE'
import * as assert from 'assert'
import { createSchema, createMessageSchema } from '../src/schema/ISchema'
import { HandshakeSchema, IHandshake } from '../src/schema/messages'
import { suite, test, slow, timeout } from "mocha-typescript"
import * as Long from "long"

suite('Messages', () => {
  const buffer = BufferBe()

  beforeEach(() => {
    buffer.clear()
  })

  test('handshake', () => {
    const handshake : IHandshake = {
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
  
})