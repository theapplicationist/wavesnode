import { Database as sqlite } from 'sqlite3'

const encodeDecode = {
  encode: <T>(obj: T): string => JSON.stringify(obj),
  decode: <T>(value: string): T => JSON.parse(value)
}

export const KeyValueStore = <T>(fileName: string) => {
  const db = new sqlite(fileName)
  const { encode, decode } = encodeDecode

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS kvstore (
    key TEXT PRIMARY KEY,
    value TEXT)`)
  })

  const insert = (key: string, value: T): Promise<boolean> => new Promise((resolve, reject) => {
    const $value = encode(value)
    db.serialize(() => {
      db.run(`INSERT OR IGNORE INTO kvstore (key, value) VALUES ($key, $value)`, { $key: key, $value }, function (err) {
        if (err) resolve(false)
        else resolve(this.changes > 0)
      })
    })
  })

  const update = (key: string, value: T, insertIfNotExists: boolean = true): Promise<boolean> => new Promise((resolve, reject) => {
    const $value = encode(value)
    db.serialize(() => {
      let sql = 'UPDATE kvstore SET value = $value WHERE key = $key'
      if (insertIfNotExists)
        sql = 'INSERT OR REPLACE INTO kvstore (key, value) VALUES ($key, $value)'
      db.run(sql, { $key: key, $value }, function (err) {
        if (err) resolve(false)
        else resolve(true)
      })
    })
  })

  const get = (key: string, remove: boolean = false): Promise<{ key: string, value: T } | undefined> => new Promise((resolve, reject) => {
    db.serialize(() => {
      const params = key ? { $key: key } : undefined
      db.get(`SELECT * FROM kvstore${key ? ' WHERE key == $key ' : ' '}LIMIT 1`, params, function (err, row) {
        if (err) {
          console.log(err)
          resolve(undefined)
        }
        else {
          const result = (err, row) => {
            if (err) {
              console.log(err)
              resolve(undefined)
              return
            }
            if (!row) {
              resolve(undefined)
              return
            }
            try {
              resolve({ key: row.key, value: decode<T>(row.value) })
            }
            catch (ex) {
              console.log(ex)
              resolve(undefined)
            }
          }
          if (remove && row) {
            db.run('DELETE FROM kvstore WHERE key = $key', { $key: row.key }, function (err, _) {
              result(err, row)
            })
          }
          else {
            result(undefined, row)
          }
        }
      })
    })
  })

  return { get, insert, update }
}
