import { Database } from 'sqlite3'
var db = new Database('./db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS blocks (
    signature TEXT PRIMARY KEY,
    parent TEXT,
    height INTEGER)`)
  db.run(`CREATE INDEX IF NOT EXISTS blockHeightIndex ON blocks(height)`)
});

export const BlockStorage = {
  put: ($signature, $parent, $height) => {
    db.serialize(() => {
      db.run(`INSERT OR IGNORE INTO blocks (signature, parent, height) VALUES ($signature, $parent, $height)`,
        {
          $signature,
          $parent,
          $height
        },
        function (err) {
          if (this.changes && this.changes > 0) {
            console.log(`NEW BLOCK -> ${$signature}`)
          }
        })
    })
  },

  getHeight: () => new Promise<Number>((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT MAX(height) as height FROM blocks`, function (err, row) {
        resolve(row.height)
      })
    })
  }),

  getRecentBlocks: () => new Promise((resolve, reject) => {
    db.serialize(() => {
      const blocksByHeight = {}
      db.all(`select * from blocks where height > (select max(height) from blocks) - 100 order by height desc`, function (err, rows) {
        rows.forEach(row => {
          if(!blocksByHeight[row.height]) {
            blocksByHeight[row.height] = {}
          }
          blocksByHeight[row.height][row.signature] = row
        })
        resolve(blocksByHeight)
      })
    })
  })
}

//BlockStorage.put("adfafd", "adfa", 1)

//db.each("SELECT * FROM blocks", function(err, row) {
//  console.log(row);
//});

//db.close();

