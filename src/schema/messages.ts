import ByteBuffer = require('byte-buffer');
import { array, int, string, byte, bytes, fixedBytes, fixedStringBase58, long, bigInt } from './primitives'
import { createSchema, createMessageSchema } from './serialization'
import { EmptySchema } from './ISchema';

const IpAddress = createSchema({
  address: fixedBytes(4),
  port: int,
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
    default:
      break;
  }
}