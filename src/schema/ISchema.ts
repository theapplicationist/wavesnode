import { ByteBuffer } from 'byte-buffer'

export interface ISchema {
  encode(buffer: ByteBuffer, obj: any)
  decode(buffer: ByteBuffer): any
}

export interface IMessageSchema extends ISchema {
  contentId: number
}

export const EmptySchema: ISchema = { encode: (b,o) => {}, decode: b => {} }