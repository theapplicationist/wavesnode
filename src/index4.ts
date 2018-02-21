import { int } from "./schema/primitives";
import { NodeConnection } from "./nodeConnection";
import * as net from "net";

// const client = new net.Socket()
// client.connect(6868, "13.228.86.201", (err) => {
//   console.log(err)
// })



async function main() {

  const connection = NodeConnection('127.0.0.1', 6868, 'W')
  const h = await connection.connectAndHandshake()
  const p = await connection.getPeers()
  console.log(h)
  console.log(p)
}

main()
