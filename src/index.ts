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

const CompletablePromise = () => {
  var onComplete
  var onError
  const promise = new Promise((resolve, reject) => {
    onComplete = resolve
    onError = reject
  })

  var isExecuted = false;
  var isFinished = false;
  return {
    onComplete: result => { if (!isFinished) { isFinished = true; isExecuted = false; onComplete(result) } },
    onError: error => { if (!isFinished) { isFinished = true; isExecuted = false; onError(error) } },
    startOrReturnExisting: func => { if (!isExecuted) { isExecuted = true; isFinished = false; func(); return promise } }
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
      getSignaturesPromise.onComplete(response.content)
    }
  }

  const client = new net.Socket()
  const connectAndHandshakePromise = CompletablePromise()
  const getSignaturesPromise = CompletablePromise()
  const incomingBuffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)

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
        client.connect(port, ip, () => {
          client.write(serialize(handshake));
        });
      })
    },

    getSignatures: lastSignature => {
      return getSignaturesPromise.startOrReturnExisting(() => {
        var m = serializeMessage({
          signatures: [{ signature: lastSignature }]
        }, GetSignaturesSchema)
        client.write(m)
      })
    }
  }
}

async function main() {
  const connection = NodeConenction('195.37.209.147', 6863)
  try {
    const handshake = await connection.connectAndHandshake()
    console.log("connectAndHandshake succesfull")
    console.log(handshake)

    const signatures = await connection.getSignatures('5uqnLK3Z9eiot6FyYBfwUnbyid3abicQbAZjz38GQ1Q8XigQMxTK4C1zNkqS1SVw7FqSidbZKxWAKLVoEsp4nNqa')
    console.log(signatures)
    const signatures2 = await connection.getSignatures(signatures.signatures[signatures.signatures.length-1].signature)
    console.log(signatures2)
  }
  catch (ex) {
    console.log(ex)
  }
}

main()


