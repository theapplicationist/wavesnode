import { Database as sqlite } from 'sqlite3'

type ObjToStringEncoderDecoder = { encode: <T>(obj: T) => string, decode: <T>(str: string) => T }

export const KeyValueStore = (fileName: string, encodeDecode: ObjToStringEncoderDecoder) => {
  const db = new sqlite(fileName)
  const { encode, decode } = encodeDecode

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS kvstore (
    key TEXT PRIMARY KEY,
    value TEXT)`)
  })

  const set = <T>(key: string, value: T): Promise<void> => new Promise((resolve, reject) => {
    const $value = encode(value)
    db.serialize(() => {
      db.run('INSERT OR IGNORE INTO kvstore (key, value) VALUES ($key, $value)', { $key: key, $value }, function (err) {
        if (err) reject(err)
        else resolve()
      })
    })
  })

  const get = <T>(key: string): Promise<T | undefined> => new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get('SELECT * FROM kvstore WHERE key == $key', { $key: key }, function (err, row) {
        if (err) {
          console.log(err)
          resolve(undefined)
        }
        else {
          try {
            resolve(decode<T>(row.value))
          }
          catch (ex) {
            console.log(ex)
            resolve(undefined)
          }
        }
      })
    })
  })

  return { get, set }
}
