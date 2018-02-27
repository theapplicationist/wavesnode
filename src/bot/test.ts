import { Database } from './Database'
const db = Database()

async function main() {
  const address = '123'
  const assetId = 'WAVES'
  const newBalance = '10000'
  const { $old, $new } = await db.updateBalance(address, assetId, newBalance)
  console.log($old)
  console.log($new)
}

main()