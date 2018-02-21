import { NodeConnection } from "../src/nodeConnection"
import { Observable } from "rx-lite";
import * as fs from 'fs'
import { open } from "inspector";
import * as args from 'command-line-args'
import { BufferBe } from "../src/binary/BufferBE";
import { BlockSchema } from "../src/schema/messages";

const optionDefinitions = [
  { name: 'sig', alias: 's', type: String, defaultValue: false, defaultOption: true },
]

const options = args(optionDefinitions)

if(!options.sig) {
  console.log('sig is required')
}

async function main(signature: string) {
  const connection = NodeConnection('34.253.153.4', 6868, 'W');
  const h = await connection.connectAndHandshake()
  connection.onMessage( (buffer: BufferBe) => {
    const b = buffer.raw(17)
    fs.writeFileSync(signature, b, { encoding: 'binary'})
    console.log(`Block saved ${signature}`)
    console.log(b.toString('hex'))
  })
  const block = await connection.getBlock(signature)
  connection.close()
}

main(options.sig)