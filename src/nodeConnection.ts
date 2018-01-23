import net = require('net')
import ByteBuffer = require('byte-buffer')
import { Int64BE } from "int64-buffer"
import Base58 = require("base-58")
import { HandshakeSchema, Schema, MessageCode } from "./schema/messages"
import { serializeMessage, deserializeMessage } from "./schema/serialization"
import { connect } from 'net';
import Rx = require('rx-lite')
import { triggerAsyncId } from 'async_hooks';
import { loadavg } from 'os';
import { Observable } from 'rx-lite';
import { setInterval, setTimeout } from 'timers';
import * as Primitives from './schema/primitives';
import { IDictionary } from './generic/IDictionary';
import * as LRU from 'lru-cache'

export interface NodeConnection {
  //props
  ip: () => string,

  //methods
  close: () => any,
  connectAndHandshake: () => Promise<{}>,
  getPeers: () => Promise<string[]>,
  getSignatures: (lastSignature: string) => Promise<string[]>,
  getBlock: (signature: string) => Promise<any>

  //events
  onClose: (handler: () => any) => any
}

interface ICompletablePromise<T> {
  onComplete: (result: T) => void,
  onError: (error: any) => void,
  startOrReturnExisting: (func: any, timeout?: number) => Promise<T>
}

const CompletablePromise = function <T>(): ICompletablePromise<T> {
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
          setTimeout(() => {
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

export const NodeConnection = (ip: string, port: number, networkPrefix: string): NodeConnection => {
  var handshakeWasReceived = false;

  const handshake = {
    appName: 'waves' + networkPrefix,
    version: { major: 0, minor: 8, patch: 0 },
    nodeName: 'name',
    nonce: new Int64BE(0),
    declaredAddress: new Uint8Array(0),
    timestamp: new Int64BE(new Date().getTime())
  }

  function tryToHandleHandshake(buffer) {
    buffer.front()
    if (buffer.available < 22)
      return

    try {
      var handshake = HandshakeSchema.decode(buffer)
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
    const response = deserializeMessage(buffer)
    if (response) {
      if (response.code == MessageCode.GetSignaturesResponse) {
        const p = getPromise(MessageCode.GetSignatures, { lastSignature: response.content[0] })
        if (p)
          p.onComplete(response.content)
      }
      if (response.code == MessageCode.GetPeersResponse) {
        getPromise(MessageCode.GetPeers, {}).onComplete(response.content.map(x => x.address.raw.join('.')))
      }
      if (response.code == MessageCode.Block) {
        getPromise(MessageCode.GetBlock, {}).onComplete(response.content)
      }
    }
  }

  const client = new net.Socket()
  const connectAndHandshakePromise = CompletablePromise()
  const incomingBuffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
  const promises = LRU(100)
  var onCloseHandler

  const getPromise = <T>(code: MessageCode, params: any): ICompletablePromise<T> => {
    const key = `${code}_${Object.keys(params).map(p => p + '_' + params[p].toString()).join('$')}`
    let promise = promises.get(key)
    if (!promise) {
      promise = CompletablePromise()
      promises.set(key, promise)
    }
    return promise as ICompletablePromise<T>
  }

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
          //console.log(handshake)
          HandshakeSchema.encode(buffer, handshake)
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
      getPromise<string[]>(MessageCode.GetPeers, {}).startOrReturnExisting(() => {
        client.write(serializeMessage({}, MessageCode.GetPeers))
      }),

    getSignatures: (lastSignature: string) =>
      getPromise<string[]>(MessageCode.GetSignatures, { lastSignature }).startOrReturnExisting(() => {
        client.write(serializeMessage([lastSignature], MessageCode.GetSignatures))
      }),

    getBlock: (signature: string) =>
      getPromise<{}>(MessageCode.GetBlock, {}).startOrReturnExisting(() => {
        client.write(serializeMessage(signature, MessageCode.GetBlock))
      })
  }
}