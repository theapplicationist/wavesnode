import ByteBuffer = require('byte-buffer');
import * as Primitives from './primitives'
import { createSchema, createMessageSchema } from './serialization'

const IpAddressSchema = createSchema({
  address: Primitives.fixedBytes(4),
  port: Primitives.int,
})

export const VersionSchema = createSchema({
  major: Primitives.int,
  minor: Primitives.int,
  patch: Primitives.int,
})

const SignatureSchema = createSchema({
  signature: Primitives.fixedStringBase58(64)
})

export const HandshakeSchema = createSchema({
  appName: Primitives.string,
  version: VersionSchema,
  nodeName: Primitives.string,
  nonce: Primitives.long,
  declaredAddress: Primitives.bytes,
  timestamp: Primitives.long,
})

export const GetPeersSchema = createMessageSchema(1, {})
export const ScoreSchema = size => createMessageSchema(24, {
  score: Primitives.bigInt(size)
})
export const PeersSchema = createMessageSchema(2, {
  peers: Primitives.array(IpAddressSchema),
})
export const GetSignaturesSchema = createMessageSchema(20, {
  signatures: Primitives.array(SignatureSchema)
})

export const SignaturesSchema = createMessageSchema(21, {
  signatures: Primitives.array(SignatureSchema)
})
export const ByCode = {
  1: GetPeersSchema,
  2: PeersSchema,
  20: GetSignaturesSchema,
  21: SignaturesSchema
}
