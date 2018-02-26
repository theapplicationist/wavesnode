import { array, int, string, byte, bytes, fixedBytes, fixedStringBase58, long, bigInt, fixedStringBase64 } from '../src/schema/primitives'
import { BufferBe } from '../src/binary/BufferBE'
import * as assert from 'assert'
import { createSchema, createMessageSchema } from '../src/schema/ISchema'
import { HandshakeSchema, Handshake, BlockSchema, PaymentTransaction } from '../src/schema/messages'
import { suite, test, slow, timeout } from "mocha-typescript"
import * as Long from "long"
import * as fs from 'fs'

suite('Messages', () => {
  const buffer = BufferBe()

  beforeEach(() => {
    buffer.clear()
  })

  test('handshake', () => {
    const handshake: Handshake = {
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

  test('large block', () => {
    const blockSignature = '4Jk7PLSzQ1utkzxftrS8PHA82v3zfPCCfZ4Mr4wonfuq9HWNSa6YucpmVWfWSdBJDwC6KhvvT9PpgYLaed6K13eR'
    const buffer = BufferBe(fs.readFileSync('./test/blocks/' + blockSignature))
    const block = BlockSchema.decode(buffer)
    assert.equal(block.signature, blockSignature)
  })

  test('block v2', () => {
    const blockSignature = 'fb6v1LnMiqWQKYXcG3HTqZhKRK64nkFVZrcNGuEqq5xFHUyBKEzoG22faxEHxagubnXMnTGEg7mAXKE3CSkZbd2'
    const buffer = BufferBe(fs.readFileSync('./test/blocks/' + blockSignature))
    const block = BlockSchema.decode(buffer)
    assert.equal(block.signature, blockSignature)
    assert.deepEqual((<PaymentTransaction>block.transactions[0].body).amount, Long.fromNumber(7200000000))
  })

  test('genesis block', () => {
    const blockSignature = 'FSH8eAAzZNqnG8xgTZtz5xuLqXySsXgAjmFEC25hXMbEufiGjqWPnGCZFt6gLiVLJny16ipxRNAkkzjjhqTjBE2'
    const buffer = BufferBe(fs.readFileSync('./test/blocks/' + blockSignature))
    const block = BlockSchema.decode(buffer)
    assert.equal(block.signature, blockSignature)
  })

})