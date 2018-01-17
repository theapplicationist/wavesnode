import { NodeConnection } from "./nodeConnection";

async function main() {
  const h = await NodeConnection("52.77.111.219", 6863).getSignatures('dfdfd')
  console.log(h)
}

main()