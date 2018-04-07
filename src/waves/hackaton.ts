import axios from 'axios'
import * as JSPath from 'jspath'
import * as WavesAPI from 'waves-api'
import * as linq from 'linq'
import { BufferBe } from './BufferBE'
import * as Base58 from 'base-58'
import * as Long from 'long'
import * as Crypto from './crypto'
import { Sticker } from 'node-telegram-bot-api';
import { IPromise } from 'rx-core';

const apiBase = 'http://nodes.hacknet.wavesnodes.com:6869'

type IDataEntryType = 'integer' | 'boolean' | 'binary'

interface IDataEntry {
  key: string,
  type: IDataEntryType,
  value: number | boolean | string
}

interface IDataTransaction {
  version: number,
  senderPublicKey: string,
  data: IDataEntry[],
  fee: number,
  timestamp: number
}

interface ISignedDataTransacton {
  type: number,
  version: number,
  senderPublicKey: string,
  data: IDataEntry[],
  fee: number,
  timestamp: number,
  proofs: string[]
}

function signDataTransaction(tx: IDataTransaction, privateKey: string): ISignedDataTransacton {

  function writeEntry(buffer: BufferBe, entry: IDataEntry) {
    const keyBytes = new Buffer(entry.key)
    buffer.writeShortUnsigned(keyBytes.length)
    buffer.writeBytes(keyBytes)

    switch (entry.type) {
      case 'integer':
        buffer.writeByte(0)
        buffer.writeLong(Long.fromNumber(<number>entry.value))
        break
      case 'boolean':
        buffer.writeByte(1)
        buffer.writeByte(entry.value === true ? 1 : 0)
        break
      case 'binary':
        const bytes = Base58.decode(<string>entry.value)
        buffer.writeByte(2)
        buffer.writeShortUnsigned(bytes.length)
        buffer.writeBytes(bytes)
        break
    }
  }

  const buffer = BufferBe()
  buffer.writeByte(12)
  buffer.writeByte(tx.version)
  const senderPubKeyBytes = Base58.decode(tx.senderPublicKey)
  buffer.writeBytes(senderPubKeyBytes)
  buffer.writeShortUnsigned(tx.data.length)
  tx.data.forEach(entry => writeEntry(buffer, entry))
  buffer.writeLong(Long.fromNumber(tx.timestamp))
  buffer.writeLong(Long.fromNumber(tx.fee))
  const proof = Crypto.signBytes(buffer.raw(), privateKey)

  return {
    version: tx.version,
    data: tx.data,
    senderPublicKey: tx.senderPublicKey,
    proofs: [proof],
    timestamp: tx.timestamp,
    fee: tx.fee,
    type: 12
  }
}

//'tambourine'
export const setData = (seed: string, key: string, value: boolean | number | string) => new Promise<any>((resolve, reject) => {
  var type: IDataEntryType = 'boolean'
  if (typeof value == 'number')
    type = 'integer'
  else if (typeof value == 'string')
    type = 'binary'

  const keyPair = Crypto.createKeyPair(seed)
  const entry: IDataEntry = { key, type, value }
  const tx = {
    data: [entry],
    fee: 100000,
    senderPublicKey: keyPair.publicKey,
    timestamp: Date.now(),
    version: 1
  }

  const signedTransaction = signDataTransaction(tx, keyPair.privateKey)
  axios.post(`${apiBase}/transactions/broadcast`, signedTransaction).then(response => {
    resolve(response)
    console.log(response)
  }).catch(ex => {
    reject(ex.response.data.message)
  })
})


setData('tambourine', 'key', 'Fqyf8K8Jmq7bvNSMncUkTLvEGfxVf65w2GsYZL5SEg4y').then(x => console.log(x))

