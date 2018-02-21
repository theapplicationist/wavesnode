import { Buffer } from "buffer";
import * as Long from "long";
import * as assert from "assert";

export interface BufferBe {
  position(): number
  seek(position: number): void
  seekEnd(): void
  clear(): void
  raw(from?: number, to?: number): Buffer
  length(): number
  writeZeros(length: number): void
  writeLong(v: Long): void
  readLong(): Long
  writeInt(v: number): void
  readInt(): number
  writeByte(v: number): void
  readByte(): number
  writeBytes(v: Uint8Array | number[]): void
  writeByteUnsigned(v: number): void
  readByteUnsigned(): number
  writeBytes(v: Uint8Array): void
  readBytes(length: number): Uint8Array
  writeString(v: string): void
  readString(length: number): string
}

export const BufferBe = (initialBuffer?: Buffer): BufferBe => {

  const encoding = 'utf8'
  const chunk = 2048
  const buffer = initialBuffer ? initialBuffer : Buffer.allocUnsafe(chunk)
  let position = 0
  let end = initialBuffer ? initialBuffer.length : 0

  const incPos = (i: number) => {
    position += i
    if (end < position)
      end = position
  }

  return {
    position(): number { return position },
    seek(pos: number): void {
      assert(Math.abs(pos) <= end, `Position ${pos} is out of bounds, buffer ends at ${end}`)
      if (pos < 0)
        pos = end + pos
      position = pos
    },
    seekEnd(): void {
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
    length(): number { return end },
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
    readLong(): Long {
      const i1 = buffer.readInt32BE(position)
      const i2 = buffer.readInt32BE(position + 4)
      position += 8
      return Long.fromBits(i2, i1)
    },
    writeInt(v: number) {
      buffer.writeInt32BE(v, position)
      incPos(4)
    },
    readInt(): number {
      const r = buffer.readInt32BE(position)
      position += 4
      return r
    },
    writeByte(v: number) {
      buffer.writeInt8(v, position)
      incPos(1)
    },
    readByte(): number {
      const r = buffer.readInt8(position)
      position += 1
      return r
    },
    writeByteUnsigned(v: number) {
      buffer.writeUInt8(v, position)
      incPos(1)
    },
    readByteUnsigned(): number {
      const r = buffer.readUInt8(position)
      position += 1
      return r
    },
    writeBytes(v: Uint8Array | number[], from?: number, to?: number) {
      for (let i = (from ? from : 0); i < (to ? to : v.length); i++)
        buffer.writeUInt8(v[i], position + i)
      incPos(v.length)
    },
    readBytes(length: number): Uint8Array {
      const r = Uint8Array.from(buffer.slice(position, position + length))
      position += length
      return r
    },
    writeString(v: string) {
      buffer.write(v, position, v.length, encoding)
      incPos(v.length)
    },
    readString(length: number): string {
      const r = buffer.slice(position, position + length).toString(encoding)
      position += length
      return r
    }
  }
}