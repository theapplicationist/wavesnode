import { Observable, Disposable } from "rx-lite";
import { setTimeout } from "timers";

export const RecurringTask = <T>(limit: number, task: (done: (result?: any) => void) => any) => {
  let counter = 0

  return Observable.create<T>(observer => {

    const id = setInterval(() => {

      if (counter >= limit)
        return

      let doneCalled = false
      const doneCallback = (result?: any) => {
        if (doneCalled)
          return

        doneCalled = true

        counter -= 1
        if (result)
          observer.onNext(result)
      }

      const counterBeforeRun = counter

      const timeout = setTimeout(() => doneCallback(), 10000)

      try {
        counter += 1
        task(r => { clearTimeout(timeout); doneCallback(r) })
      } catch (error) {
        if (counterBeforeRun != counter)
          counter = counterBeforeRun
      }

    }, 1000)

    return Disposable.create(() => clearInterval(id))
  })
}