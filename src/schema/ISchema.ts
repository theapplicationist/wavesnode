import { encode } from 'punycode';
import { BufferBe } from '../binary/BufferBE';
import { IDictionary } from '../generic/IDictionary';

export interface ISchema<T> {
  encode(buffer: BufferBe, obj: T): void
  decode(buffer: BufferBe): T
}

export interface IMessageSchema<T> extends ISchema<T> {
  contentId: number
}

export const EmptySchema: ISchema<void> = { encode: (b, o) => { }, decode: b => { } }

export const FallbackSchema: ISchema<Uint8Array> = { encode: (b, o) => {  }, decode: b => { return b.readBytes(b.length()) } }

export const LeaveBytesFromEnd = (size: number): ISchema<void> => { return { encode: (b, o) => { }, decode: b => { b.seekEnd(); b.seek(-size) } } }

export type SchemaFactory<Self, T> = ((self: Self) => ISchema<T>)

export function createSchema<T>(namedSchemas: IDictionary<ISchema<any> | SchemaFactory<T, any>>): ISchema<T> {
  const keys = Object.keys(namedSchemas)
  return {
    encode: (buffer: BufferBe, obj) => {
      keys.forEach(k => {
        let schema = namedSchemas[k]
        if (typeof schema === 'function')
          schema = (schema as SchemaFactory<T, any>)(obj) as ISchema<any>
        //console.log(`encoding: ${k} = ${obj[k]}`)
        schema.encode(buffer, obj[k])
      })
    },
    decode: (buffer: BufferBe) => {
      const obj = {}
      keys.forEach(k => {
        let schema = namedSchemas[k]
        if (typeof schema === 'function')
          schema = (schema as SchemaFactory<T, any>)(obj as T) as ISchema<any>
        obj[k] = schema.decode(buffer)
      })
      return obj as T
    }
  }
}

export function createMessageSchema<T>(contentId: number, namedSchemas: IDictionary<ISchema<any>>): IMessageSchema<T> {
  const schema = createSchema(namedSchemas)
  schema['contentId'] = contentId
  const r = schema as IMessageSchema<T>
  return r
}
