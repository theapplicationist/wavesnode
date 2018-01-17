import net = require('net')
import ByteBuffer = require('byte-buffer')
import { Int64BE } from "int64-buffer"
import Base58 = require("base-58")
import { SignaturesSchema, PeersSchema, HandshakeSchema, GetPeersSchema, GetSignaturesSchema } from "./schema/messages"
import { serializeMessage, deserializeMessage } from "./schema/serialization"
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

  const handshake = {
    appName: 'wavesT',
    version: { major: 0, minor: 8, patch: 0 },
    nodeName: 'name',
    nonce: new Int64BE(0),
    declaredAddress: new Uint8Array(0),
    timestamp: new Int64BE(new Date().getTime())
  }

  const _HandshakeSchema = HandshakeSchema
  const _PeersSchema = PeersSchema
  const _SignaturesSchema = SignaturesSchema
  const _GetSignaturesSchema = GetSignaturesSchema
  const _GetPeersSchema = GetPeersSchema

  function tryToHandleHandshake(buffer) {
    buffer.front()
    if (buffer.available < 22)
      return

    try {
      var handshake = _HandshakeSchema.decode(buffer)
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
    var length = buffer.readInt();
    var magic = buffer.readInt();
    var contentId = buffer.readByte();

    //console.log("messageHandler: contentId -> " + response.contentId)
    if (contentId == 21) {
      const response = deserializeMessage(buffer, _SignaturesSchema)
      getSignaturesPromise.onComplete(response.signatures.map(x => x.signature))
    }
    if (contentId == 2) {
      const response = deserializeMessage(buffer, _PeersSchema)
      getPeersPromise.onComplete(response.peers.map(x => x.address.raw.join('.')))
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
          const buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
          _HandshakeSchema.encode(buffer, handshake)
          client.write(new Buffer(buffer.raw))
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
        client.write(serializeMessage({}, _GetPeersSchema))
      }),

    getSignatures: (lastSignature: string) =>
      getSignaturesPromise.startOrReturnExisting(() => {
        client.write(serializeMessage({
          signatures: [{ signature: lastSignature }]
        }, _GetSignaturesSchema))
      })
  }
}