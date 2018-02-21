import { BufferBe } from "../src/binary/BufferBE"
import { Buffer } from "buffer"
import * as Long from "long"
import { suite, test, slow, timeout } from "mocha-typescript"
import * as assert from "assert"
import { NodeConnection } from "../src/nodeConnection"

return

suite('NodeConnection', function () {
  this.timeout(15000);

  const connection = NodeConnection('34.253.153.4', 6868, 'W')
  test('should handshake', async () => {
    const h = await connection.connectAndHandshake()
    assert.equal(h.appName, 'wavesW')
  })

  test('should get signatures', async () => {
    const genesisBlock = 'FSH8eAAzZNqnG8xgTZtz5xuLqXySsXgAjmFEC25hXMbEufiGjqWPnGCZFt6gLiVLJny16ipxRNAkkzjjhqTjBE2'
    const secondBlock = '62ruZoatk3Wvs1pkWH1VB2utacPSyYdCfdAiMaYygJn6jUFGyGVg9F5i1SqDjimJvGhi8FhyT7LuRQusbHRXMnjp'
    const p = await connection.getSignatures(genesisBlock)
    assert.equal(p[0], genesisBlock)
    assert.equal(p[1], secondBlock)
  })

  test('should get block', async () => {
    const block = '4w9qyAhXh6LXWPV2hf8QynfEbZJVymy8MnSv9LyVbDN1shcy7qJYNaETuHEaK7iZN4tnUCUEtvCvGoiWka7Yw7ph'
    const p = await connection.getBlock(block)
    assert.equal(p.signature, block)
  })

  test('should get peers', async () => {
    const p = await connection.getPeers()
    assert(p.length > 0)
    connection.close()
  })
})
