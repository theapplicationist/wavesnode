import { BufferBe } from "../src/binary/BufferBE"
import { Buffer } from "buffer"
import * as Long from "long"
import { suite, test, slow, timeout } from "mocha-typescript"
import * as assert from "assert"
import { NodeConnection } from "../src/nodeConnection"

suite('NodeConnection', function() {
  this.timeout(15000);
  
  const connection = NodeConnection('195.206.55.218', 6868, 'W')
  test('should handshake', async () => {
    const h = await connection.connectAndHandshake()
    assert.equal(h.appName, 'wavesW')
    connection.close()
  })

  // test('should get peers', async () => {
  //   const p = await connection.getPeers()
  //   console.log(p)
  // })
})
