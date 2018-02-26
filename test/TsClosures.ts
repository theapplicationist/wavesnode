import * as assert from 'assert'
import { suite, test, slow, timeout } from "mocha-typescript"

suite('TsClosures', () => {
  test('primitives passed byRef', (done) => {
    var closureVar = 1

    setTimeout(() => {
      closureVar += 1
    }, 1)

    setTimeout(() => {
      closureVar += 1
    }, 2)

    setTimeout(() => {
      assert.equal(closureVar, 3)
      done()
    }, 10)
  })
})