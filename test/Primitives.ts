import { array, int, string, byte, bytes, fixedBytes, fixedStringBase58, long, bigInt, fixedStringBase64 } from '../src/schema/primitives'
import { BufferBe } from '../src/binary/BufferBE'
import * as assert from 'assert'
import { createSchema, createMessageSchema } from '../src/schema/ISchema'
import { suite, test, slow, timeout } from "mocha-typescript"
import * as Long from "long"

suite('Primitives', () => {
  const buffer = BufferBe()
  
  beforeEach(() => {
    buffer.clear()
  })

  test('roundtrip int', () => {
    int.encode(buffer, 10)
    buffer.seek(0)
    assert.equal(int.decode(buffer), 10)
  })

  test('roundtrip string', () => {
    string.encode(buffer, 'hello')
    buffer.seek(0)
    assert.equal(string.decode(buffer), 'hello')
  })

  test('roundtrip int array', () => {
    const s = array(int)
    s.encode(buffer, [1, 2, 3, 4])
    buffer.seek(0)
    assert.deepEqual(s.decode(buffer), [1, 2, 3, 4])
  })

  test('schema roundtrip', () => {
    const childSchema = createSchema({
      name: string,
    })
    const rootSchema = createSchema({
      int,
      long,
      string,
      byte,
      children: array(childSchema)
    })

    const obj = {
      int: 1,
      long: Long.fromString('928475287456'),
      string: 'hello',
      byte: 10,
      children: [
        { name: 'childOne' },
        { name: 'childTwo' }
      ]
    }

    rootSchema.encode(buffer, obj)
    buffer.seek(0)
    assert.deepEqual(rootSchema.decode(buffer), obj)
  })

})