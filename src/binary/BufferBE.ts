import { Buffer } from "buffer";
import * as Long from "long";
import * as assert from "assert";

const encoding = 'utf8'
const chunk = 2048

export interface IReadBuffer {
  readLong(): Long
  readInt(): number
  readShort(): number
  readShortUnsigned(): number
  readByte(): number
  readShorts(length: number): Uint16Array
  readByteUnsigned(): number
  readBytes(length: number): Uint8Array
  readString(length: number): string

  position(): number
  length(): number

  slice(from?: number, to?: number): IReadBuffer

  goTo(position: number): void
  goToEnd(): void
}

export interface IWriteBuffer {
  writeZeros(length: number): void
  writeLong(v: Long): void
  writeInt(v: number): void
  writeShort(v: number): void
  writeShortUnsigned(v: number): void
  writeByte(v: number): void
  writeBytes(v: Uint8Array | number[], from?: number, to?: number): void
  writeByteUnsigned(v: number): void
  writeShorts(v: Uint16Array | number[], from?: number, to?: number): void
  writeBytes(v: Uint8Array): void
  writeString(v: string): void

  goTo(position: number): void
  goToEnd(): void

  position(): number
  length(): number

  raw(from?: number, to?: number): Buffer
  slice(from?: number, to?: number): IWriteBuffer

  clear(): void
}

export const read = (buffer: Buffer): IReadBuffer => {
  let position = 0
  return {
    position(): number { return position },
    goTo(pos: number): void {
      if (pos < 0)
        pos = buffer.length + pos
      assert(Math.abs(pos) <= buffer.length, `Position ${pos} is out of bounds, buffer ends at ${buffer.length}`)
      assert(Math.abs(pos) > 0, `Position ${pos} is out of bounds`)
      position = pos
    },
    goToEnd(): void {
      position = buffer.length
    },
    readLong(): Long {
      const i1 = buffer.readInt32BE(position)
      const i2 = buffer.readInt32BE(position + 4)
      position += 8
      return Long.fromBits(i2, i1)
    },
    readShort(): number {
      const r = buffer.readInt16BE(position)
      position += 2
      return r
    },
    readInt(): number {
      const r = buffer.readInt32BE(position)
      position += 4
      return r
    },
    readShortUnsigned(): number {
      const r = buffer.readUInt16BE(position)
      position += 2
      return r
    },
    readByte(): number {
      const r = buffer.readInt8(position)
      position += 1
      return r
    },
    readByteUnsigned(): number {
      const r = buffer.readUInt8(position)
      position += 1
      return r
    },
    readBytes(length: number): Uint8Array {
      const r = Uint8Array.from(buffer.slice(position, position + length))
      position += length
      return r
    },
    readShorts(length: number): Uint16Array {
      const r = Uint16Array.from(buffer.slice(position, position + length))
      position += length
      return r
    },
    readString(length: number): string {
      const r = buffer.slice(position, position + length).toString(encoding)
      position += length
      return r
    },
    slice(from?: number, to?: number) {
      if (!from) from = 0
      if (!to) to = buffer.length
      return read(buffer.slice(from, to))
    },
    length(): number {
      return buffer.length
    }
  }
}

export const write = (b?: Buffer): IWriteBuffer => {
  const buffer = b ? b : Buffer.allocUnsafe(chunk)
  let position = 0
  let end = b ? b.length : 0

  const incPos = (i: number) => {
    position += i
    if (end < position)
      end = position
  }

  return {
    position(): number { return position },
    goTo(pos: number): void {
      if (pos < 0)
        pos = end + pos
      assert(Math.abs(pos) <= buffer.length, `Position ${pos} is out of bounds, buffer ends at ${buffer.length}`)
      assert(Math.abs(pos) > 0, `Position ${pos} is out of bounds`)
      position = pos
    },
    goToEnd(): void {
      position = end
    },
    clear(): void {
      position = 0
      end = 0
    },
    raw(from?: number, to?: number) {
      if (!from) from = 0
      if (!to) to = end
      return buffer.slice(from, to)
    },
    slice(from?: number, to?: number) {
      if (!from) from = 0
      if (!to) to = end
      return write(buffer.slice(from, to))
    },
    length(): number { return end },
    writeInt(v: number) {
      buffer.writeInt32BE(v, position)
      incPos(4)
    },
    writeShort(v: number) {
      buffer.writeInt16BE(v, position)
      incPos(2)
    },
    writeShortUnsigned(v: number) {
      buffer.writeUInt16BE(v, position)
      incPos(2)
    },
    writeByte(v: number) {
      buffer.writeInt8(v, position)
      incPos(1)
    },
    writeByteUnsigned(v: number) {
      buffer.writeUInt8(v, position)
      incPos(1)
    },
    writeBytes(v: Uint8Array | number[], from?: number, to?: number) {
      for (let i = (from ? from : 0); i < (to ? to : v.length); i++)
        buffer.writeUInt8(v[i], position + i)
      incPos(v.length)
    },
    writeShorts(v: Uint16Array | number[], from?: number, to?: number) {
      for (let i = (from ? from : 0); i < (to ? to : v.length); i++)
        buffer.writeUInt16BE(v[i], position + i)
      incPos(v.length)
    },
    writeString(v: string) {
      buffer.write(v, position, v.length, encoding)
      incPos(v.length)
    },
    writeZeros(length: number) {
      incPos(length)
    },
    writeLong(v: Long) {
      const b1 = v.getLowBits()
      const b2 = v.getHighBits()
      buffer.writeInt32BE(b2, position)
      buffer.writeInt32BE(b1, position + 4)
      incPos(8)
    },
  }
}