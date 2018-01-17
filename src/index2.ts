import { NodeConnection } from "./nodeConnection";

async function main() {
  const h = await NodeConnection("52.19.134.24", 6863).connectAndHandshake()
  console.log(h)
}

main()