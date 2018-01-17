import net = require('net')
import ByteBuffer = require('byte-buffer')
import { Int64BE } from "int64-buffer"
import Base58 = require("base-58")
import { ByCode } from './schema/messages'
import { VersionSchema, HandshakeSchema, GetPeersSchema, GetSignaturesSchema } from "./schema/messages"
import { serializeMessage, deserializeMessage, objWithSchema, serialize, deserialize } from "./schema/serialization"
import { connect } from 'net';
import Rx = require('rx-lite')
import { triggerAsyncId } from 'async_hooks';
import { loadavg } from 'os';
import { Observable } from 'rx-lite';
import { setInterval } from 'timers';

export interface NodeConnection {
  //props
  ip: () => string,

  //methods
  close: () => any,
  connectAndHandshake: () => Promise<{}>,
  getPeers: () => Promise<string[]>,
  getSignatures: (lastSignature: string) => Promise<string[]>,

  //events
  onClose: (handler: () => any) => any
}

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
    startOrReturnExisting: (func, timeout?) => {
      if (!isExecuted) {
        isExecuted = true
        isFinished = false
        promise = newPromise()
        if (timeout) {
          const p = promise
          setInterval(() => {
            if (promise == p)
              onError("timeout")
          }, timeout)
        }
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

export const NodeConnection = (ip: string, port: number): NodeConnection => {

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
    //console.log("messageHandler: contentId -> " + response.contentId)
    if (response.contentId == 21) {
      getSignaturesPromise.onComplete(response.content.signatures.map(x => x.signature))
    }
    if (response.contentId == 2) {
      getPeersPromise.onComplete(response.content.peers.map(x => x.address.raw.join('.')))
    }
  }

  const client = new net.Socket()
  const connectAndHandshakePromise = CompletablePromise()
  const getSignaturesPromise = CompletablePromise<string[]>()
  const getPeersPromise = CompletablePromise<string[]>()
  const incomingBuffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
  var onCloseHandler

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
    //console.log('Error occured');
    //console.log(err)
    connectAndHandshakePromise.onError(err)
  })

  client.on('close', function () {
    connectAndHandshakePromise.onError('Connection closed')
    //console.log('Connection closed');
    if (onCloseHandler)
      onCloseHandler()
  })

  return {
    ip: () => ip,

    connectAndHandshake: () => {
      return connectAndHandshakePromise.startOrReturnExisting(() => {
        client.connect(port, ip, () => {
          client.write(serialize(handshake))
        })
      })
    },

    close: () => {
      client.destroy()
    },

    onClose: handler => {
      onCloseHandler = handler
    },

    getPeers: () =>
      getPeersPromise.startOrReturnExisting(() => {
        client.write(serializeMessage({}, GetPeersSchema))
      }),

    getSignatures: (lastSignature: string) =>
      getSignaturesPromise.startOrReturnExisting(() => {
        client.write(serializeMessage({
          signatures: [{ signature: lastSignature }]
        }, GetSignaturesSchema))
      })
  }
}