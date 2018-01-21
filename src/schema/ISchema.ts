import { ByteBuffer } from 'byte-buffer'
import { encode } from 'punycode';

export interface ISchema {
  encode(buffer: ByteBuffer, obj: any)
  decode(buffer: ByteBuffer): any
}

export interface IMessageSchema extends ISchema {
  contentId: number
}

export const EmptySchema: ISchema = { encode: (b, o) => { }, decode: b => { } }

export const LeaveBytesFromEnd = (size: number): ISchema => { return { encode: (b, o) => { }, decode: b => { b.end(); b.seek(-size) } } }