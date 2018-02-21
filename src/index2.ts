import { NodeConnection } from "./nodeConnection";

async function main() {
  const connection = NodeConnection('34.253.153.4', 6868, 'W');
  const h = await connection.connectAndHandshake()
  connection.getBlock('XTDkt9UW4y76WUHJoQcRx2RrWnwtoZNiQhCrtbvcmSqv8Y8t3dUdtUCQuANwsvVzir7DVEK6R3h2RSJZ2cYYMbS')
}

main()