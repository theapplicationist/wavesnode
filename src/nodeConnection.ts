import net = require('net')
import Base58 = require("base-58")
import { HandshakeSchema, Schema, MessageCode, Handshake, Block } from "./schema/messages"
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
import { write, IReadBuffer } from './binary/BufferBE';
import { IncomingBuffer } from './binary/IncomingBuffer';
import * as Long from 'long';
import * as fs from 'fs'

export interface NodeConnection {
  //props
  ip: () => string,

  //methods
  close: () => any,
  connectAndHandshake: () => Promise<Handshake>,
  getPeers: () => Promise<string[]>,
  getSignatures: (lastSignature: string) => Promise<string[]>,
  getBlock: (signature: string) => Promise<Block>
  onMessage: (handler: (buffer: IReadBuffer) => void) => void
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
    version: { major: 0, minor: 10, patch: 3 },
    nodeName: 'name',
    nonce: Long.fromInt(0),
    declaredAddress: [],
    timestamp: Long.fromNumber(new Date().getTime())
  }

  function tryToHandleHandshake(buffer: IncomingBuffer) {
    if (buffer.length() < 34)
      return

    const appNameLen = buffer.getByte(0)
    if (appNameLen <= 0) return
    const nodeNameLen = buffer.getByte(13 + appNameLen)
    if (nodeNameLen < 0) return
    const declaredAddressLen = buffer.getInt(22 + nodeNameLen + appNameLen)
    const totalHandshakeLen = 34 + appNameLen + nodeNameLen + declaredAddressLen

    const handshakeBuffer = buffer.tryGet(totalHandshakeLen)

    if (!handshakeBuffer)
      return

    try {
      var handshake = HandshakeSchema.decode(handshakeBuffer)
      return handshake
    }
    catch (ex) {
      return
    }
  }

  function tryToFetchMessage(buffer: IncomingBuffer): IReadBuffer {
    const available = buffer.length();
    if (available < 4)
      return

    var size = buffer.getInt()
    if (size > available)
      return

    var messageBuffer = buffer.tryGet(size + 4)
    return messageBuffer
  }

  function messageHandler(buffer: IReadBuffer) {
    const response = deserializeMessage(buffer)
    if (response) {
      if (response.code == MessageCode.GetSignaturesResponse) {
        const p = getPromise(MessageCode.GetSignatures, { lastSignature: response.content[0] }, false)
        if (p)
          p.onComplete(response.content)
      } else if (response.code == MessageCode.GetPeersResponse) {
        const r = response.content.map(x => x.address.join('.') + ':' + x.port)
        getPromise(MessageCode.GetPeers, {}).onComplete(r)
      } else if (response.code == MessageCode.Block) {
        const p = getPromise<Block>(MessageCode.GetBlock, { signature: response.content.signature }, false)
        if (p)
          p.onComplete(response.content)
        if (onMessageHandler) {
          onMessageHandler(buffer.slice())
        }
      }
      else {
        //console.log(`Unsupported message type: ${response.code}`)
        //console.log(response.content)
      }
    }
  }

  const client = new net.Socket()
  const connectAndHandshakePromise = CompletablePromise<Handshake>()
  const incomingBuffer = IncomingBuffer()
  const promises = LRU(100)
  var onCloseHandler
  var onMessageHandler

  const getPromise = <T>(code: MessageCode, params: any, createIfNotExists = true): ICompletablePromise<T> => {
    const key = `${code}_${Object.keys(params).map(p => p + '_' + params[p].toString()).join('$')}`
    let promise = promises.get(key)
    if (!promise) {
      if (!createIfNotExists)
        return
      promise = CompletablePromise()
      promises.set(key, promise)
    }
    return promise as ICompletablePromise<T>
  }

  client.on('data', function (data) {
    incomingBuffer.write(data)

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
          //console.log("connected")
          const buffer = write()
          HandshakeSchema.encode(buffer, handshake)
          client.write(buffer.raw())
        })
      })
    },

    close: () => {
      client.destroy()
    },

    onClose: handler => {
      onCloseHandler = handler
    },

    onMessage: handler => {
      onMessageHandler = handler
    },

    getPeers: () =>
      getPromise<string[]>(MessageCode.GetPeers, {}).startOrReturnExisting(() => {
        const m = serializeMessage({}, MessageCode.GetPeers)
        client.write(m)
      }),

    getSignatures: (lastSignature: string) =>
      getPromise<string[]>(MessageCode.GetSignatures, { lastSignature }).startOrReturnExisting(() => {
        client.write(serializeMessage([lastSignature], MessageCode.GetSignatures))
      }),

    getBlock: (signature: string) =>
      getPromise<Block>(MessageCode.GetBlock, { signature }).startOrReturnExisting(() => {
        client.write(serializeMessage(signature, MessageCode.GetBlock))
      })
  }
}