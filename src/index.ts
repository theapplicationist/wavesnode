import net = require('net')
import ByteBuffer = require('byte-buffer')
import { Int64BE } from "int64-buffer"
import Base58 = require("base-58")
import { ByCode } from './schema/messages'
import { VersionSchema, HandshakeSchema, GetPeersSchema, GetSignaturesSchema } from "./schema/messages"
import { serializeMessage, deserializeMessage, objWithSchema, serialize, deserialize } from "./schema/serialization"
import { connect } from 'net';
import Rx = require('rx-lite')


//Int64BE.prototype.inspect = function(depth, inspectArgs){
//  return this.toString()
//};

ByteBuffer.prototype.inspect = function (depth, inspectArgs) {
  return `[ ${this.raw.join(", ")} ]`
};

const CompletablePromise = function <T>() {
  var onComplete
  var onError

  const newPromise = () => new Promise<T>((resolve, reject) => {
    onComplete = resolve
    onError = reject
  })

  var promise = newPromise()
  var isExecuted = false;
  var isFinished = false;
  return {
    onComplete: result => { if (!isFinished) { isFinished = true; isExecuted = false; onComplete(result) } },
    onError: error => { if (!isFinished) { isFinished = true; isExecuted = false; onError(error) } },
    startOrReturnExisting: func => {
      if (!isExecuted) {
        isExecuted = true
        isFinished = false
        promise = newPromise()
        try {
          func()
        }
        catch (ex) {
          onError(ex)
        }
      } return promise
    }
  }
}

const NodeConenction = (ip: string, port: number) => {

  var handshakeWasReceived = false;

  const handshake = objWithSchema(HandshakeSchema, {
    appName: 'wavesT',
    version: { major: 0, minor: 8, patch: 0 },
    nodeName: 'name',
    nonce: new Int64BE(0),
    declaredAddress: new Uint8Array(0),
    timestamp: new Int64BE(new Date().getTime())
  })

  function tryToHandleHandshake(buffer) {
    buffer.front()
    if (buffer.available < 22)
      return

    try {
      var handshake = deserialize(buffer, HandshakeSchema)
      buffer.clip(buffer.index)
      return handshake
    }
    catch (ex) {
      return
    }
  }

  function tryToFetchMessage(buffer) {
    buffer.front()

    if (buffer.available < 4)
      return

    var size = buffer.readInt()
    if (size > buffer.available)
      return

    var message = buffer.slice(0, size + 4)
    buffer.clip(message.length)

    return message
  }

  function messageHandler(buffer) {
    var response = deserializeMessage(buffer, code => ByCode[code])
    console.log("messageHandler: contentId -> " + response.contentId)
    if (response.contentId == 21) {
      getSignaturesPromise.onComplete(response.content.signatures.map(x => x.signature))
    }
  }

  const client = new net.Socket()
  const connectAndHandshakePromise = CompletablePromise()
  const getSignaturesPromise = CompletablePromise<string[]>()
  const incomingBuffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
  var connection
  client.on('data', function (data) {
    incomingBuffer.end()
    incomingBuffer.write(data.buffer)

    const handshakeResponse = tryToHandleHandshake(incomingBuffer)
    if (!handshakeWasReceived && handshakeResponse) {
      handshakeWasReceived = true
      connectAndHandshakePromise.onComplete(handshakeResponse)
    }

    if (handshakeWasReceived) {
      do {
        var messageBuffer = tryToFetchMessage(incomingBuffer)
        if (messageBuffer)
          messageHandler(messageBuffer)
      } while (messageBuffer)
    }
  })

  client.on('error', err => {
    console.log('Error occured');
    console.log(err)
    connectAndHandshakePromise.onError("error")
  })

  client.on('close', function () {
    connectAndHandshakePromise.onError("closed")
    console.log('Connection closed');
  })

  return {
    connectAndHandshake: () => {
      return connectAndHandshakePromise.startOrReturnExisting(() => {
        connection = client.connect(port, ip, () => {
          client.write(serialize(handshake));
        });
      })
    },

    close: () => {
      if (connection)
        connection.close()
    },

    getSignatures: (lastSignature: string) => {
      return getSignaturesPromise.startOrReturnExisting(() => {
        var m = serializeMessage({
          signatures: [{ signature: lastSignature }]
        }, GetSignaturesSchema)
        client.write(m)
      })
    }
  }
}

const createPipe = (ip, signature, height) => {
  const timer = Rx.Observable.interval(10000).map(_ => new Date().getTime())
  const connection = Rx.Observable.create<{ getSignatures: (string) => Promise<string[]> }>(async observer => {
    const c = NodeConenction(ip, 6863)
    await c.connectAndHandshake()
    observer.onNext(c)
    return Rx.Disposable.create(() => c.close())
  })

  var lastSignature = signature

  return Rx.Observable.combineLatest(timer, connection).flatMap(async x => {
    const fromSig = lastSignature
    var signatures = await x[1].getSignatures(fromSig)
    lastSignature = signatures[signatures.length - 1]
    if (signatures[0] == fromSig) {
      signatures.splice(0, 1)
    }

    if (signatures.length == 0)
      return { height, signatures: [], fromSig }

    const h = height;
    height += signatures.length
    return { height: h, signatures, fromSig }
  }).distinctUntilChanged(x => x.signatures[0]).where(x => x.signatures.length > 0)
}

const blocks = {}
const blocksByHeight = {}
var maxHeight = 0

function addBlocks(ids: string[], height: number, fromIp: string, fromSig: string) {
  var prevSig = fromSig
  var wasModified = false
  ids.forEach(id => {
    if (!blocks[id]) {
      const owners = {}
      owners[fromIp] = 1
      const block = {
        id,
        owners,
        parent: prevSig,
        height: height++,
      };
      blocks[id] = block
      if (!blocksByHeight[block.height])
        blocksByHeight[block.height] = {}

      wasModified = true
      blocksByHeight[block.height][block.id] = block

      if (maxHeight < block.height)
        maxHeight = block.height

    } else {
      blocks[id].owners[fromIp] = 1
    }
    prevSig = id
  })
  if (wasModified) {
    broadcastBlocks(30)
  }
}

function broadcastBlocks(howManyFromEnd) {
  const blocksMap = {}
  for (var i = maxHeight; i >= maxHeight - howManyFromEnd && i > 0; i--) {
    if (blocksByHeight[i]) {
      blocksMap[i] = blocksByHeight[i]
    }
  }
  wss.broadcast(blocksMap)
}


const peers =
  ['109.134.67.25',
    '24.207.12.103',
    '156.57.150.176',
    '5.189.180.179',
    '35.157.226.19',
    '18.194.251.3',
    '52.28.66.217',
    '5.189.150.22',
    '213.136.80.84',
    '94.130.39.139',
    '35.158.143.161',
    '136.243.249.142',
    '79.147.170.8',
    '92.27.160.113',
    '103.90.250.197',
    '52.19.134.24',
    '52.30.47.67',
    '52.51.92.182',
    '217.100.219.253',
    '217.100.219.254',
    '217.100.219.251',
    '84.25.113.195',
    '88.208.3.82',
    '217.100.219.251',
    '178.236.245.176',
    '185.189.101.225',
    '95.220.223.162',
    '85.173.179.143',
    '194.67.213.139',
    '52.77.111.219',
    '78.190.148.98',
    '194.126.180.98',
    '188.163.169.62',
    '91.218.97.200',
    '85.203.23.68',
    '192.168.10.142',
    '24.15.186.187',
    '13.59.242.131',
    '183.80.30.0']

async function main() {
  peers.forEach(p => {
    try {
      createPipe(p, '4bMtjosxJh274CmnQCFV3Ypg7xfqzyAQzkvGz3RW8gua9c7zyJAky7VL44ss8qAUtQuPfoYdMxaPYicwxGn6hM4X', 1)
        .subscribe(
        n => {
          addBlocks(n.signatures, n.height, p, n.fromSig)
          //console.log(blocks)
        },
        err => {
          console.log('error!')
          console.log(err)
        })
    }
    catch (ex) {
      console.log(ex)
    }
  })
}

const ws = require('ws');

const wss = new ws.Server({ port: 8080 });

wss.broadcast = function broadcast(data) {
  const d = JSON.stringify(data)
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      try {
        client.send(d)
      }
      catch { }
    }
  });
};

wss.on('connection', function connection(ws) {
  try {
    //ws.send(JSON.stringify(blocksByHeight))
  }
  catch { }
});

console.log("STARTED")

main()
