import { RecurringTask } from '../src/generic/RecurringTask'
import { Observable, Subscription } from 'rxjs/Rx';
import * as assert from 'assert'
import { suite, test, slow, timeout } from "mocha-typescript"
import { Scheduler } from 'rxjs/Scheduler';
import { CompletionObserver } from 'rxjs/Observer';

suite('RecurringTask', () => {
  test('basic', done => {
    let count = 0
    RecurringTask(1, d => {
      d(count)
      count += 1
    }).take(10).bufferCount(10).subscribe(x => {
      try {
        assert.equal(count, 9)
        assert.deepEqual(x, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        done()

      } catch (error) {
        done(error)
      }
    })
  })

  test('should not emmit more often than required', done => {
    let count = 0
    let prevRun = Date.now()
    const delay = 10
    RecurringTask(delay, result => {
      if (Date.now() - prevRun < delay)
        done('error')

      result(true)
    }).take(3).subscribe({ complete: () => done() })
  })

  test('should not run more than one task in parallel', done => {
    let count = 0
    let prevRun = Date.now()
    const delay = 1
    RecurringTask(delay, result => {
      count += 1
      if (count > 1)
        done('error')
      setTimeout(() => {
        count -= 1
        result(true)
      }, 20)
    }).take(3).subscribe({ complete: () => done() })
  })
})
