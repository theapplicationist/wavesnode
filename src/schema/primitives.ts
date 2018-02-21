import * as Bignum from 'bignum'
import { ISchema } from './ISchema'
import * as Long from "long"
import { Version } from './messages';
import * as Base58 from 'base-58'
import * as Base64 from 'base64-js'

//Byte size and string contents
export const string: ISchema<string> = {
  encode: (b, v) => {
    b.writeByteUnsigned(v.length)
    b.writeString(v)
  },
  decode: b => b.readString(b.readByteUnsigned())
}
export const fixedString = (size: number): ISchema<string> => ({
  encode: (b, v) => {
    b.writeByteUnsigned(size)
    b.writeString(v)
  },
  decode: b => b.readString(size)
})
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
export const short: ISchema<number> = {
  encode: (b, v) => b.writeShort(v),
  decode: b => b.readShort()
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
export const fixedBytesWithSchema = <T>(size: number, schema: ISchema<T>): ISchema<T[]> => ({
  encode: (b, v) => { },
  decode: b => {
    const buf = b.slice(b.position(), b.position() + size)
    const r: T[] = []
    while (buf.position() < buf.length()) {
      r.push(schema.decode(buf))
    }
    return r;
  }
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
export const bigInt = (size: number): ISchema<Bignum> => ({
  encode: (b, v) => b.writeBytes(v.toBuffer()),
  decode: b => Bignum.fromBuffer(b.readBytes(size))
})