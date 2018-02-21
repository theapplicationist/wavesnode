import { BufferBe } from "../src/binary/BufferBE"
import { Buffer } from "buffer"
import * as Long from "long"
import { suite, test, slow, timeout } from "mocha-typescript"
import * as assert from "assert"

suite("BufferBe", () => {

  const buffer = BufferBe()

  beforeEach(() => {
    buffer.clear()
  })

  test("should inialize with buffer properly", () => {
    const b = BufferBe(Buffer.from([1, 2, 3, 4]))
    assert.deepEqual(b.raw(), [1, 2, 3, 4])
    assert.equal(b.position(), 0)
  })

  test("should seek", () => {
    buffer.writeBytes(Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]))
    buffer.seek(4)

    assert.equal(buffer.position(), 4)
  })

  test("should seekEnd", () => {
    buffer.writeBytes(Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]))
    buffer.seekEnd()

    assert.equal(buffer.position(), 9)
  })

  test("should seek from end with negative values", () => {
    buffer.writeBytes(Uint8Array.from([0, 1, 2, 0, 0, 0, 1, 7, 8]))
    buffer.seek(-6)

    assert.equal(buffer.position(), 3)
    assert.equal(buffer.readInt(), 1)
  })

  test("should throw on invalid seek", () => {
    buffer.writeInt(1)
    assert.throws(() => {
      buffer.seek(100)
    })
    assert.throws(() => {
      buffer.seek(-10)
    })
  })

  test("should increase position when writing", () => {
    buffer.writeByte(100)
    buffer.writeBytes(Uint8Array.from([84, 31]))

    assert.equal(buffer.position(), 3)
    assert.deepEqual(buffer.raw(), [100, 84, 31])
    assert.equal(buffer.raw().length, 3)
  })

  test("should clear", () => {
    buffer.writeString('hello')
    buffer.clear()

    assert.equal(buffer.position(), 0)
    assert.equal(buffer.raw().length, 0)
  })

  test("roundtrip", () => {
    buffer.writeString('buff')
    buffer.writeByte(81)
    buffer.writeByteUnsigned(231)
    buffer.writeBytes(Uint8Array.from([240, 3, 111]))
    buffer.writeInt(53967)
    buffer.writeLong(Long.fromString('382752837568822'))

    buffer.seek(0)

    const string = buffer.readString('buff'.length)
    const byte = buffer.readByte()
    const byteUnsigned = buffer.readByteUnsigned()
    const bytes = buffer.readBytes(3)
    const int = buffer.readInt()
    const long = buffer.readLong()

    assert.equal(string, 'buff')
    assert.equal(byte, 81)
    assert.equal(byteUnsigned, 231)
    assert.deepEqual(bytes, [240, 3, 111])
    assert.equal(int, 53967)
    assert.equal(long.toString(), '382752837568822')
  })
})
