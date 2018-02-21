import { NodeConnection } from "../src/nodeConnection"
import { Observable } from "rx-lite";
import * as fs from 'fs'
import { open } from "inspector";
import * as args from 'command-line-args'

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
  connection.getBlock('XTDkt9UW4y76WUHJoQcRx2RrWnwtoZNiQhCrtbvcmSqv8Y8t3dUdtUCQuANwsvVzir7DVEK6R3h2RSJZ2cYYMbS')
}

main(options.sig)