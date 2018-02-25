import { NodeConnection } from "../src/nodeConnection"
import { Observable } from "rx-lite";
import * as fs from 'fs'
import { open } from "inspector";
import * as args from 'command-line-args'
import { BufferBe } from "../src/binary/BufferBE";
import { BlockSchema } from "../src/schema/messages";

const optionDefinitions = [
  { name: 'sig', alias: 's', type: String, defaultOption: true },
  { name: 'path', alias: 'p', type: String, defaultValue: '' },
]

const options = args(optionDefinitions)

if (!options.sig)
  throw 'sig is required'

if(!options.path.endsWith('/'))
  options.path += '/'

async function main(signature: string) {
  const connection = NodeConnection('34.253.153.4', 6868, 'W');
  const h = await connection.connectAndHandshake()
  connection.onMessage((buffer: BufferBe) => {
    const b = buffer.raw(17)
    fs.writeFileSync(options.path + signature, b, { encoding: 'binary' })
    console.log(`Block saved ${signature}`)
  })
  const block = await connection.getBlock(signature)
  connection.close()
}

main(options.sig)