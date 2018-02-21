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
    const blockSignature = '4w9qyAhXh6LXWPV2hf8QynfEbZJVymy8MnSv9LyVbDN1shcy7qJYNaETuHEaK7iZN4tnUCUEtvCvGoiWka7Yw7ph'
    const buffer = BufferBe(fs.readFileSync('./test/blocks/' + blockSignature))
    const r = BlockSchema.decode(buffer)
    
    //console.log(Buffer.from(r.body).slice(4+1+64+1+32).map(v => v.toString()).join(" "))
    //console.log(Buffer.from(r.body).readInt32BE(0))
    //console.log(Buffer.from(r.body).length)
    console.log(r)
    
  })
  
})