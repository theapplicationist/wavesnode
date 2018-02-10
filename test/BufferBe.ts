import { BufferBe } from "../src/binary/BufferBE"
import { Buffer } from "buffer"
import * as Long from "long"
import { suite, test, slow, timeout } from "mocha-typescript"
import * as assert from "assert"

suite("BufferBe", () => {

  const buffer = BufferBe()

  beforeEach(() => {
    buffer.seek(0)
  })

  test("roundtrip", () => {
    buffer.writeString('buff')
    buffer.writeByte(231)
    buffer.writeBytes(Uint8Array.from([240, 3, 111]))
    buffer.writeInt(53967)
    buffer.writeLong(Long.fromString('382752837568822'))

    buffer.seek(0)

    const string = buffer.readString('buff'.length)
    const byte = buffer.readByte()
    const bytes = buffer.readBytes(3)
    const int = buffer.readInt()
    const long = buffer.readLong()

    assert.equal(string, 'buff')
    assert.equal(byte, 231)
    assert.deepEqual(bytes, [240, 3, 111])
    assert.equal(int, 53967)
    assert.equal(long.toString(), '382752837568822')
  }),
  
  test("should seek", () => {
    buffer.writeBytes(Uint8Array.from([0,1,2,3,4,5,6,7,8]))
    buffer.seek(4)
    assert.equal(buffer.position(), 4)
  }),

  test("should increase position when writing", () => {
    buffer.writeByte(100)
    assert.equal(buffer.position(), 1)
  })
})
