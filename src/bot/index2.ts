import { KeyValueStore } from "./KeyValueStore";
import { getLastBlockSignature } from "../wavesApi/getLastBlockSignature";
import { getAddressesFromBlock, getLastBlock, getBlock, getNextBlock } from "../wavesApi/blocks";
import { WavesNotifications } from "./WavesNotifications";
import { Database } from "./Database";

const db = Database()
async function main() {
  WavesNotifications(db).balances.subscribe({
    next: w => {
      
    }
  })
}

main()