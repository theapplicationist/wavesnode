import { NodeConnection } from "./nodeConnection"
import ByteBuffer = require('byte-buffer')
import { Int64BE } from "int64-buffer";

Int64BE.prototype.inspect = function(depth, inspectArgs){
  return this.toString()
};


//const buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
const sig = '4kK4yUydwUA12KhVfXMqRkiao4jsScJfWJVSWHqXafoPphrqLXoefKDjpEKR7Pz7bgHbLY6XEBPAuxJy89MGwWmN'
const obj = { signatures: [{ signature: sig }] }
//GetSignaturesSchema.encode(buffer, obj)
//const buffer = serialize(obj, GetSignaturesSchema)
//console.log(buffer.join(','))

async function main() {
  const c = NodeConnection("52.28.66.217", 6863)
  const h = await c.connectAndHandshake()
  const s = await c.getBlock(sig)
  console.log(s)
  c.close()
}

main()

