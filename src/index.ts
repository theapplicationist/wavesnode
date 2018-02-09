import { PeerDiscoverer } from "./PeerDiscoverer";
import { config as cfg } from "./config";
import { Observable } from "rx-lite";
import { BlockStorage } from "./BlockStorage";
import * as fs from 'fs'
import { open } from "inspector";
import { RecurringTask } from "./generic/RecurringTask";


const optionDefinitions = [
  { name: 'clear', alias: 'c', type: Boolean, defaultValue: false },
  { name: 'net', type: String, multiple: false, defaultOption: true, defaultValue: 'main' },
  { name: 'port', alias: 'p', type: Number, multiple: false, defaultValue: 3001 },
]

const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)

console.log(`STARTING config: ${options.net}`)

if (options.clear) {
  try {
    fs.unlinkSync('./db')
    fs.unlinkSync('./peers')
  }
  catch { }
}

const config = cfg(options.net)

const PeerStorage = require("./PeerStorage").PeerStorage(config)

const peers = []
peers.push(...config.initialPeers)
peers.push(...PeerStorage.allPeers().except(peers))
console.log(config)

const peerDiscoverer = PeerDiscoverer(peers, config.port, config.networkPrefix)

RecurringTask(3, async done => {
  const c = peerDiscoverer.getConnection()
  if (c) {
    try {
      const signatureToFill = await BlockStorage.getSignatureToFill()
      if (signatureToFill) {
        const block = await c.getBlock(signatureToFill)
        BlockStorage.putBlock(block.signature, block.timestamp.toString(), block.baseTarget.toString(), block.generatorPublicKey)
      }
    } catch (error) { }
  }
  done()
}).subscribe()

RecurringTask<{ signatures, height }>(4, async done => {

  const c = peerDiscoverer.getConnection()

  if (c) {
    const peer = c.ip()
    const { signature, height } = PeerStorage.getPeerSignatureAndHeight(peer)
    console.log(`LOADING BLOCKS -> ${peer}`)
    try {
      const signatures = await c.getSignatures(signature)
      console.log(`BLOCKS LOADED -> peer: ${peer}, count: ${signatures.length - 1}`)
      if (signatures.length > 1) {
        if (signatures[0] == signature) {
          signatures.pop()
          const l = signatures.length - 90
          if (l > 0) {
            PeerStorage.setPeerSignatureAndHeight(peer, signatures[l], height + l)
          }
          var parent = signatures.shift()
          var h = height
          signatures.forEach(s => {
            h++
            BlockStorage.put(s, parent, h)
            parent = s
          })
        }
      }
    } catch (ex) {
      console.log(ex)
    }
  }
  done()
}).subscribe()

var express = require('express')
var app = express()

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/blocks', async function (req, res) {
  //var id = req.query.id; // $_GET["id"]
  console.log('---get-blocks---')
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(await BlockStorage.getRecentBlocks(1000)))
  console.log('---get-blocks-complete---')
})

var root = __dirname + "/web/";

app.use('/', express.static(root));
app.listen(options.port)

console.log(`LISTENING port: ${options.port}, content folder: ${root}`)

