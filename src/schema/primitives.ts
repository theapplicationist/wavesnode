import * as Bignum from 'bignum'
import { ISchema } from './ISchema'
import * as Long from "long"
import { IVersion } from './messages';
const Base58 = require('base-58')
const Base64 = require('base64-js')

//Byte size and string contents
export const string: ISchema<string> = {
  encode: (b, v) => {
    b.writeByteUnsigned(v.length)
    b.writeString(v)
  },
  decode: b => b.readString(b.readByteUnsigned())
}

export const fixedStringBase58 = (size): ISchema<string> => ({
  encode: (b, v) => b.writeBytes(Base58.decode(v)),
  decode: b => Base58.encode(b.readBytes(size))
})
export const fixedStringBase64 = (size): ISchema<string> => ({
  encode: (b, v) => b.writeBytes(Base64.toByteArray(v)),
  decode: b => Base64.fromByteArray(b.readBytes(size))
})
//Sequence of three ints
export const version: ISchema<string> = {
  encode: (b, v) => v.split('.', 3).forEach(i => b.writeInt(parseInt(i))),
  decode: b => `${b.readInt()}.${b.readInt()}.${b.readInt()}`
}
export const long: ISchema<Long> = {
  encode: (b, v) => b.writeLong(v),
  decode: b => b.readLong()
}
export const int: ISchema<number> = {
  encode: (b, v) => b.writeInt(v),
  decode: b => b.readInt()
}
export const byte: ISchema<number> = {
  encode: (b, v) => b.writeByte(v),
  decode: b => b.readByte()
}
//Int size and bytes
export const bytes: ISchema<Uint8Array> = {
  encode: (b, v: Uint8Array | number[]) => {
    b.writeInt(v.length)
    b.writeBytes(v)
  },
  decode: b => b.readBytes(b.readInt())
}
export const fixedBytes = (size: number): ISchema<Uint8Array> => ({
  encode: (b, v) => b.writeBytes(v),
  decode: b => b.readBytes(size)
})
//Int size and schema
export const array = <T>(schema: ISchema<T>): ISchema<T[]> => ({
  encode: (b, v) => {
    b.writeInt(v.length)
    v.forEach(i => schema.encode(b, i))
  },
  decode: b => {
    var count = b.readInt()
    var result = []
    for (var i = 0; i < count; i++) {
      result.push(schema.decode(b))
    }
    return result
  }
})
export const bigInt = size => ({
  encode: (b, v) => b.write(v.toBuffer()),
  decode: b => Bignum.fromBuffer(b.read(size).raw)
})