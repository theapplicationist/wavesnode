import { Database } from 'sqlite3'
import * as linq from "linq";
import * as guid from "uuid/v4";
import { Observable } from 'rx-lite';

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
          if (err) {
            console.log(err)
          }
          if (this.changes && this.changes > 0) {
            console.log(`NEW BLOCK -> ${$signature}, height: ${$height}, parent: ${$parent}`)
          }
        })
    })
  },

  addBranch: (height, length) => {
    db.serialize(() => {
      db.all(`SELECT * FROM blocks WHERE height = ${height}`, function (err, rows) {
        let row = rows[Math.floor(Math.random() * rows.length)]
        let parent = row.signature
        let h = height
        for (let i = 0; i < length; i++) {
          h++
          const id = `FAKE_BLOCK_${guid()}`
          BlockStorage.put(id, parent, h)
          parent = id
        }
      })
    })
  },

  getHeight: () => new Promise<number>((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT MAX(height) as height FROM blocks`, function (err, row) {
        resolve(row.height)
      })
    })
  }),

  getRecentBlocks: () => new Promise((resolve, reject) => {
    db.serialize(() => {
      const blocksByHeight = {}
      const branches = []

      const branchForBlock = (signature, height) => {
        let branch = branches.find(b => b.blocks[signature] || b.parent == signature)
        if (!branch) {
          branch = { id: branches.length, blocks: {}, open: height }
          branches.push(branch)
        }

        return branch
      }

      const checkBranchesAndClose = (signature, height) => {
        linq.from(branches).where(b => b.parent == signature)
          .orderByDescending(b => Object.keys(b.blocks).length)
          .skip(1).forEach(b => b.closed = height)
      }

      const openBranchesCount = height => branches.filter(b => b.close ? b.close < height : true)
      .filter(b => b.open > height).filter(b => Object.keys(b.blocks).length > 1).length

      db.all(`select * from blocks where height > (select max(height) from blocks) - 100 order by height desc`, function (err, rows) {
        rows.forEach(block => {
          if (!blocksByHeight[block.height]) {
            blocksByHeight[block.height] = {}
          }
          checkBranchesAndClose(block.signature, block.height)
          const branch = branchForBlock(block.signature, block.height)
          block.branch = branch.id
          branch.blocks[block.signature] = true
          branch.parent = block.parent
          blocksByHeight[block.height][block.signature] = block
        })

        //branches.forEach(b => b.blocks = Object.keys(b.blocks))
        const activeBranches = branches.filter(b => Object.keys(b.blocks).length > 1)

        for (let height in blocksByHeight) {
          const blocksAtHeight = blocksByHeight[height]
          blocksByHeight[height] = linq.from(Object.keys(blocksAtHeight))
            .where(id => activeBranches.find(b => b.blocks[id]))
            .orderByDescending(id => Object.keys(branchForBlock(id, -1).blocks).length)
            .select(id => blocksAtHeight[id]).toArray()
        }

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

