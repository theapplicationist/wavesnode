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
        })
    })
  }
}

BlockStorage.put("adfafd", "adfa", 1)

db.each("SELECT * FROM blocks", function(err, row) {
  console.log(row);
});

//db.close();

