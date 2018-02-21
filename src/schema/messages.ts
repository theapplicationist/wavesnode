import { array, int, string, byte, bytes, fixedBytes, fixedStringBase58, long, bigInt, fixedStringBase64, short, fixedString, fixedBytesWithSchema } from './primitives'
import { createSchema, createMessageSchema, ISchema, FallbackSchema } from './ISchema'
import { EmptySchema, LeaveBytesFromEnd } from './ISchema';
import { Buffer } from 'buffer';
import { version } from 'punycode';
import * as Long from 'long';

export interface IpAddress {
  address: string,
  port: number
}

const IpAddressSchema = createSchema<IpAddress>({
  address: fixedBytes(4),
  port: int,
})

export interface Transaction {
  size: number,
  type: number,
  body: TransferTransaction
}

export interface AddressOrAlias {
  version: number
  address: string
}

const AddressOrAliasSchema = createSchema<AddressOrAlias>({
  version: byte,
  address: (x) => x.version == 1 ? fixedStringBase58(25) : createSchema<any>({
    scheme: byte,
    length: short,
    address: (y) => fixedString(y.length)
  })
})

export interface TransferTransaction {
  signature: string,
  type: number,
  sender: string,
  amountIsAsset: number,
  assetId?: string,
  feeIsAsset: number,
  feeAssetId?: string,
  timestamp: Long,
  amount: Long
  fee: Long
  recipient: string,
  attachmentLength: number
  attachment: Uint8Array
}

const TransferTransactionSchema = createSchema<TransferTransaction>({
  signature: fixedStringBase58(64),
  type: byte,
  sender: fixedStringBase58(32),
  amountIsAsset: byte,
  assetId: (x) => x.amountIsAsset == 1 ? fixedBytes(32) : EmptySchema,
  feeIsAsset: byte,
  feeAssetId: (x) => x.feeIsAsset == 1 ? fixedBytes(32) : EmptySchema,
  timestamp: long,
  amount: long,
  fee: long,
  recipient: AddressOrAliasSchema,
  attachmentLength: short,
  attachment: (x) => fixedBytes(x.attachmentLength)
})

const TransactionDiscriminatorSchema = createSchema<Transaction>({
  size: int,
  type: byte,
  body: (x) => {
    console.log(x.type)
    return x.type == 4 ? TransferTransactionSchema : fixedBytes(x.size - 1)
  }
})

export interface Block {
  version: number
  timestamp: Long
  parent: string
  consensusSize: number
  baseTarget: Long
  generationSignature: string
  transactionsBlockSize: number
  transactionsCount: number
  body: Uint8Array
  generatorPublicKey: string
  signature: string
}

export const BlockSchema = createSchema<Block>({
  version: byte,
  timestamp: long,
  parent: fixedStringBase58(64),
  consenusSize: int,
  baseTarget: long,
  generationSignature: fixedStringBase58(32),
  transactionsBlockSize: int,
  transactionsCount: int,
  //body: (x) => LeaveBytesFromEnd(32+64),
  body: (x) => fixedBytesWithSchema(x.transactionsBlockSize, TransactionDiscriminatorSchema),
  //body: (x) => fixedBytes(x.transactionsBlockSize),
  generatorPublicKey: fixedStringBase58(32),
  signature: fixedStringBase58(64)
})

export interface Version {
  major: number,
  minor: number,
  patch: number
}

export const VersionSchema = createSchema<Version>({
  major: int,
  minor: int,
  patch: int,
})

export interface Handshake {
  appName: string
  version: Version
  nodeName: string
  nonce: Long
  declaredAddress: Uint8Array | number[]
  timestamp: Long
}

export const HandshakeSchema = createSchema<Handshake>({
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

export type SchemaTypes = IpAddress[] | string[] | Block | void

export function Schema(code: MessageCode): ISchema<SchemaTypes> {
  switch (code) {
    case MessageCode.GetPeers:
      return EmptySchema
    case MessageCode.GetPeersResponse:
      return array(IpAddressSchema)
    case MessageCode.GetSignatures:
      return array(fixedStringBase58(64))
    case MessageCode.GetSignaturesResponse:
      return array(fixedStringBase58(64))
    case MessageCode.GetBlock:
      return fixedStringBase58(64)
    case MessageCode.Block:
      return BlockSchema
    default:
      return FallbackSchema
  }
}