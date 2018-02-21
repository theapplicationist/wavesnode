import { BufferBe } from "../src/binary/BufferBE"
import { IncomingBuffer } from "../src/binary/IncomingBuffer"
import { Buffer } from "buffer"
import * as assert from "assert";
import { suite, test, slow, timeout } from "mocha-typescript"

suite("IncomingBuffer", () => {
  let incomingBuffer: IncomingBuffer

  beforeEach(() => {
    incomingBuffer = IncomingBuffer()
  })

  test('should write data', () => {
    incomingBuffer.write(Buffer.from([1, 2]))
    assert.equal(incomingBuffer.length(), 2)

    incomingBuffer.write(Buffer.from([1, 2]))
    assert.equal(incomingBuffer.length(), 4)
    assert.deepEqual(incomingBuffer.tryGet(4).raw(), [1, 2, 1, 2])
  })

  test('should read int if possible', () => {
    const b1 = Buffer.from([0, 0])
    const b2 = Buffer.from([0, 10])

    incomingBuffer.write(b1)
    assert.equal(incomingBuffer.getInt(), undefined)

    incomingBuffer.write(b2)
    assert.equal(incomingBuffer.getInt(), 10)
  })

  test('should read byte if possible', () => {
    assert.equal(incomingBuffer.getByte(), undefined)
    incomingBuffer.write(Buffer.from([10]))
    assert.equal(incomingBuffer.getByte(), 10)
  })

  test('should read int on offset', () => {
    incomingBuffer.write(Buffer.from([0, 0]))
    incomingBuffer.write(Buffer.from([0, 1, 0, 0]))
    incomingBuffer.write(Buffer.from([0, 2]))
    assert.equal(incomingBuffer.getInt(0), 1)
    assert.equal(incomingBuffer.getInt(4), 2)
  })

  test('should get bytes when availabe', () => {
    incomingBuffer.write(Buffer.from([1, 2]))
    assert.equal(incomingBuffer.tryGet(4), undefined)

    incomingBuffer.write(Buffer.from([3, 4, 0, 0, 0, 10]))
    assert.deepEqual(incomingBuffer.tryGet(4).raw(), [1, 2, 3, 4])
    assert.equal(incomingBuffer.getInt(), 10)
    assert.deepEqual(incomingBuffer.tryGet(4).raw(), [0, 0, 0, 10])
    assert.equal(incomingBuffer.length(), 0)
  })

})