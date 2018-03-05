import { KeyValueStore } from './KeyValueStore';

const encodeDecode = {
  encode: (obj: any): string => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64'),
  decode: (value: string): any => JSON.parse(Buffer.from(value, 'base64').toString('utf-8'))
}

const kvStore = KeyValueStore('testStore', encodeDecode)
const complexObject = { name: 'David', age: 24 }

const main = async () => {
  await kvStore.set('key', complexObject)
  const r = await kvStore.get('key')
  console.log(r)
}

main()


