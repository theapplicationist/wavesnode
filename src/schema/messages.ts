import ByteBuffer = require('byte-buffer');
import { array, int, string, byte, bytes, fixedBytes, fixedStringBase58, long, bigInt, fixedStringBase64 } from './primitives'
import { createSchema, createMessageSchema } from './serialization'
import { EmptySchema, LeaveBytesFromEnd } from './ISchema';

const IpAddress = createSchema({
  address: fixedBytes(4),
  port: int,
})

const TransactionSchema = createSchema({

})

const BlockSchema = createSchema({
  version: byte,
  timestamp: long,
  parent: fixedStringBase58(64),
  consenusSize: int,
  baseTarget: long,
  generationSignature: fixedStringBase58(32),
  transactionsCount: int,
  body: LeaveBytesFromEnd(32 + 64),
  generatorPublicKey: fixedStringBase58(32),
  signature: fixedStringBase58(64)
})

export const VersionSchema = createSchema({
  major: int,
  minor: int,
  patch: int,
})

export const HandshakeSchema = createSchema({
  appName: string,
  version: VersionSchema,
  nodeName: string,
  nonce: long,
  declaredAddress: bytes,
  timestamp: long,
})

export const ScoreSchema = size => createMessageSchema(24, {
  score: bigInt(size)
})

export enum MessageCode {
  GetPeers = 1,
  GetPeersResponse = 2,
  GetSignatures = 20,
  GetSignaturesResponse = 21,
  GetBlock = 22,
  Block = 23
}

export function Schema(code: MessageCode) {
  switch (code) {
    case MessageCode.GetPeers:
      return EmptySchema
    case MessageCode.GetPeersResponse:
      return array(IpAddress)
    case MessageCode.GetSignatures:
      return array(fixedStringBase58(64))
    case MessageCode.GetSignaturesResponse:
      return array(fixedStringBase58(64))
    case MessageCode.GetBlock:
      return fixedStringBase58(64)
    case MessageCode.Block:
      return BlockSchema
    default:
      break;
  }
}