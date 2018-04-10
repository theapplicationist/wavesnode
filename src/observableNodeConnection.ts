import net = require('net')
import Base58 = require("base-58")
import { HandshakeSchema, Schema, MessageCode, Handshake, Block } from "./schema/messages"
import { serializeMessage, deserializeMessage } from "./schema/serialization"
import { connect } from 'net';
import { triggerAsyncId } from 'async_hooks';
import { loadavg } from 'os';
import { setInterval, setTimeout } from 'timers';
import * as Primitives from './schema/primitives';
import { IDictionary } from './generic/IDictionary';
import * as LRU from 'lru-cache'
import { write, IReadBuffer } from './binary/BufferBE';
import { IncomingBuffer } from './binary/IncomingBuffer';
import * as Long from 'long';
import * as fs from 'fs'
import { Observable, Subscription, Subscriber } from 'rxjs/Rx';

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

export const ObservableNodeConnection = (ip: string, port: number, networkPrefix: string): Observable<any> => {

  var handshakeWasReceived = false;

  return new Observable<any>((observer: Subscriber<any>) => {

    const client = new net.Socket()
    const incomingBuffer = IncomingBuffer()

    client.on('data', function (data) {
      incomingBuffer.write(data)

      const handshakeResponse = tryToHandleHandshake(incomingBuffer)
      if (!handshakeWasReceived && handshakeResponse) {
        handshakeWasReceived = true
        observer.next({ code: 0, content: handshakeResponse })
      }

      if (handshakeWasReceived) {
        do {
          var messageBuffer = tryToFetchMessage(incomingBuffer)
          if (messageBuffer) {
            const message = deserializeMessage(messageBuffer)
            if (message) {
              observer.next({ code: message.code, content: message.content })
            }
          }
        } while (messageBuffer)
      }
    })

    client.on('error', err => {
      observer.error(err)
    })

    client.on('close', function () {
      observer.complete()
    })

    client.connect(port, ip, () => {
      const buffer = write()

      const handshake = {
        appName: 'waves' + networkPrefix,
        version: { major: 0, minor: 9, patch: 0 },
        nodeName: 'name',
        nonce: Long.fromInt(0),
        declaredAddress: [],
        timestamp: Long.fromNumber(new Date().getTime())
      }

      HandshakeSchema.encode(buffer, handshake)
      client.write(buffer.raw())
    })
  })
}