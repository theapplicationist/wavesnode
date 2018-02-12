import { Buffer } from "buffer";
import { BufferBe } from "./BufferBE";

export interface IncomingBuffer {
  tryGet(length: number): BufferBe
  write(buffer: Buffer): void
  length(): number
  getInt(): number
}

export const IncomingBuffer = (): IncomingBuffer => {
  let length = 0
  let buffers: Buffer[] = []

  return {
    write(buffer: Buffer) {
      buffers.push(buffer)
      length += buffer.byteLength
    },
    length() {
      return length
    },
    tryGet(len: number) {
      if (length < len)
        return
      if (buffers.length == 0)
        return

      const r = Buffer.concat(buffers)
      buffers = [r.slice(len, length)]
      length -= len

      return BufferBe(r.slice(0, len))
    },
    getInt() {
      if (length < 4)
        return -1
      if (buffers.length == 0)
        return -1

      if (buffers[0].byteLength >= 4) {
        return buffers[0].readInt32BE(0)
      }

      buffers = [Buffer.concat(buffers)]

      return buffers[0].readInt32BE(0)
    }
  }
}