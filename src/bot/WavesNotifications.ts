import { IDictionary } from '../generic/IDictionary';
import { IWalletBalances } from '../wavesApi/IWalletBalances';
import { getBalance } from '../wavesApi/getBalance'
import { ObservableNodeConnection } from '../observableNodeConnection';
import { MessageCode } from '../schema/messages';
import { Observable, Subscription, Subscriber, Subject, ReplaySubject } from 'rxjs/Rx';
import { IDatabase } from './Database';
import { KeyValueStoreTyped } from "./KeyValueStore";
import { getLastBlockSignature } from "../wavesApi/getLastBlockSignature";
import { getAddressesFromBlock, getLastBlock, getBlock, getNextBlock, getLastSolidBlock, getNextSolidBlock } from "../wavesApi/blocks";

export interface IWalletNotifications {
  balances: Observable<IWalletBalances>
  addWallet: (address: string) => void
}

export const WavesNotifications = (db: IDatabase): IWalletNotifications => {

  const storage = KeyValueStoreTyped<string>('storage')
  const accountsToUpdate = KeyValueStoreTyped<string>('accountsToUpdate')

  let started = false

  async function discoverAccounts() {
    while (true) {
      let lastSignature = await storage.get('lastSignature')
      let block
      if (!lastSignature) {
        console.log('Clean run, retrieving last block')
        block = await getLastSolidBlock()
      } else {
        block = await getNextSolidBlock(lastSignature.value)
      }

      if (!block)
        break

      try {
        const addresses = await getAddressesFromBlock(block)
        let count = 0
        const p = addresses.map(async a => {
          const subscriptions = await db.getAddressSubscriptions(a)
          if (subscriptions && subscriptions.length > 0) {
            await accountsToUpdate.insert(a, '')
            count++
          }
        })

        await Promise.all(p)

        console.log(`Got block with: ${addresses.length} addresses, ${count} with active subscriptions`)

        if (count > 0)
          update()

        await storage.update('lastSignature', block.signature)
        console.log(`Last signature is now: ${block.signature}`)

      } catch (ex) {
        console.log(ex)
        break
      }
    }

    console.log('No solid block yet, next attempt in 30 seconds')
    setTimeout(discoverAccounts, 1000 * 30)
  }

  const balances = new ReplaySubject<IWalletBalances>()
  let isUpdateRunning = false
  async function update() {
    if (isUpdateRunning)
      return

    isUpdateRunning = true
    const account = await accountsToUpdate.get(undefined, true)
    if (!account) {
      console.log('No addresses to update')
      isUpdateRunning = false
      return
    }

    console.log(`Updating address: ${account.key}`)

    try {
      const b = await getBalance(account.key)
      balances.next(b)
    } catch (ex) {
      console.log(ex)
    }

    isUpdateRunning = false
    setImmediate(update)
  }

  discoverAccounts()
  update()

  return {
    balances,
    addWallet: async (wallet: string) => {
      await accountsToUpdate.insert(wallet, '')
      update()
    }
  }
}
