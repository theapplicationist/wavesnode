import net = require('net')
import ByteBuffer = require('byte-buffer')
import { Int64BE, Int64 } from "int64-buffer"
import Base58 = require("base-58")
import { ByCode } from './schema/messages'
import { VersionSchema, HandshakeSchema, GetPeersSchema, GetSignaturesSchema } from "./schema/messages"
import { serializeMessage, deserializeMessage, objWithSchema, serialize, deserialize } from "./schema/serialization"
import { connect } from 'net';
import Rx = require('rx-lite')
import { triggerAsyncId } from 'async_hooks';
import { loadavg } from 'os';
import { Observable } from 'rx-lite';
import { createNodeConnection, NodeConnection } from './nodeConnection'
import levelup = require('levelup')
import leveldown = require('leveldown')
import { config } from './config-test'

//Int64BE.prototype.inspect = function(depth, inspectArgs){
//  return this.toString()
//};

ByteBuffer.prototype.inspect = function (depth, inspectArgs) {
  return `[ ${this.raw.join(", ")} ]`
};

const createPipe = (ip, signature, height) => {
  const timer = Rx.Observable.interval(1000).map(_ => new Date().getTime())
  const connection = Rx.Observable.create<{ getSignatures: (string) => Promise<string[]> }>(async observer => {
    const c = createNodeConnection(ip, 6863)
    await c.connectAndHandshake()
    observer.onNext(c)
    return Rx.Disposable.create(() => c.close())
  })

  var lastSignature = signature
  var loading = false;

  return Rx.Observable.combineLatest(timer, connection).flatMap(async x => {
    if (loading)
      return { height, signatures: [], fromSig: lastSignature }

    loading = true

    const fromSig = lastSignature
    var signatures = await x[1].getSignatures(fromSig)
    var l = signatures.length - 90
    if (l < 0)
      l = 0
    lastSignature = signatures[l]

    loading = false

    if (signatures.length == 0)
      return { height, signatures: [], fromSig }

    const h = height;
    height += l
    return { height: h, signatures, fromSig }
  }).where(x => x.signatures.length > 0)
}

const blocks = {}
const blocksByHeight = {}
var maxHeight = 0

function addBlocks(ids: string[], height: number, fromIp: string, fromSig: string) {

  if (!(ids[0] == fromSig))
    return

  var prevSig = fromSig
  var wasModified = false
  var h = height
  ids.forEach(id => {

    if (!blocks[id]) {
      const owners = {}
      owners[fromIp] = 1
      const block = {
        id,
        owners,
        parent: prevSig,
        height: h,
      };

      // db.get('name1', (err, value) => {
      //   if (err) return console.log('Ooops!', err) // likely the key was not found
      //   console.log('name=' + value)
      // })

      blocks[id] = block
      if (!blocksByHeight[block.height]) {
        blocksByHeight[block.height] = {}
      }

      wasModified = true
      blocksByHeight[block.height][block.id] = block

      if (maxHeight < block.height)
        maxHeight = block.height

    } else {
      if (!blocks[id].owners[fromIp]) {
        blocks[id].owners[fromIp] = 1
        wasModified = true
      }
    }
    prevSig = id
    h++
  })
  if (wasModified) {
    var b = lastBlocks(100)
    broadcast(server, b)
  }
}

function lastBlocks(howManyFromEnd) {
  const blocksMap = {}
  for (var i = maxHeight; i >= maxHeight - howManyFromEnd && i > 1; i--) {
    if (blocksByHeight[i - 1] && blocksByHeight[i]) {
      var parents = Object.keys(blocksByHeight[i]).map(k => blocksByHeight[i][k].parent)
      var blocks = Object.keys(blocksByHeight[i - 1]).map(k => blocksByHeight[i - 1][k]).filter(b => parents.findIndex(p => p == b.id) >= 0)
      var r = {}
      blocks.forEach(b => {
        r[b.id] = b
      })
      blocksMap[i - 1] = r
    }
  }

  return blocksMap
}

interface Dictionary<TValue> {
  [key: string]: TValue;
}

const peers = (initialPeers: string[]) => {
  const knownPeers = []
  const connectedPeers: Dictionary<NodeConnection> = {}
  knownPeers.push(...initialPeers)

  const fetch = () => {
    const p = knownPeers.shift()
    knownPeers.push(p)
    return p
  }

  return Rx.Observable.create<NodeConnection>(observer => {
    Rx.Observable.interval(1000).subscribe(async _ => {
      const peer = fetch()
      var c = connectedPeers[peer]
      if(!c) {
        c = createNodeConnection(peer, 6863)
        c.onClose(() => {
          delete connectedPeers[peer]
        })
        try {
          await c.connectAndHandshake()
          if (!connectedPeers[peer]) {
            connectedPeers[peer] = c
            observer.onNext(c)
          }
        } catch {}
      }

      const peers = await c.getPeers()
      const newPeers = peers.filter(p => !knownPeers.includes(p))
      knownPeers.unshift(...newPeers)
    })
  })
}

async function main() {
  peers(config.initialPeers).subscribe(p => {
    console.log(p.ip)
  })
  
  // .forEach(p => {
  //   try {
  //     createPipe(p, '5ETidnp9uyH3KmRcRZuqzMMVwgPitFMHxr8K1R197fzu4ATUr2v6vtbfQQpK8XTXdZLhy52HHwY7B18FALGz1MRX', 223343)
  //       .subscribe(
  //       n => {
  //         addBlocks(n.signatures, n.height, p, n.fromSig)
  //         //console.log(blocks)
  //       },
  //       err => {
  //         console.log('error!')
  //         console.log(err)
  //       })
  //   }
  //   catch (ex) {
  //     console.log(ex)
  //   }
  // })
}

const ws = require("nodejs-websocket")

const server = ws.createServer(function (conn) {
  console.log("New connection")
  var b = lastBlocks(100)
  conn.sendText(JSON.stringify(b))
  conn.on("text", function (str) {
    console.log("Received " + str)
  })
  conn.on("close", function (code, reason) {
    console.log("Connection closed")
  })
  conn.on("error", function (error) {
    console.log(error)
  })
}).listen(8080)


function broadcast(server, data) {
  const msg = JSON.stringify(data)
  server.connections.forEach(function (conn) {
    conn.sendText(msg)
  })
}

// const wss = new ws.Server({ port: 8080, timeout: 100 });
// wss.broadcast = function broadcast(data) {
//   const d = JSON.stringify(data)
//   wss.clients.forEach(function each(client) {
//     if (client.readyState === ws.OPEN) {
//       try {
//         client.send(d)
//       }
//       catch { }
//     }
//   });
// };

// wss.on('connection', function connection(ws) {
//   try {
//     //ws.send(JSON.stringify(blocksByHeight))
//   }
//   catch { }
// });

console.log("STARTED")

main()
