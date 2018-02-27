import { IDictionary } from '../generic/IDictionary';
import { IWalletBalances } from '../wavesApi/IWalletBalances';
import { getBalance } from '../wavesApi/getBalance'
import { ObservableNodeConnection } from '../observableNodeConnection';
import { MessageCode } from '../schema/messages';
import { Observable, Subscription, Subscriber, Subject } from 'rxjs/Rx';
import { IDatabase } from './Database';
import { getAddressesFromBlock } from '../wavesApi/getAddressesFromBlock';

export interface IWalletNotifications {
  balances: Observable<IWalletBalances>
  addWallet: (address: string) => void
}

export const WavesNotifications = (db: IDatabase): IWalletNotifications => {

  const updateWallet = async (wallet: string): Promise<IWalletBalances> => {
    const s = await db.getAddressSubscriptions(wallet)
    if (s && s.length > 0) {
      console.log("UPDATING WALLET: " + wallet)
      const r = await getBalance(wallet)
      return r
    }

    return undefined
  }

  const balances = new Observable<IWalletBalances>(observer => {

    const updateWallets = async (wallets: string[]) => {
      wallets.forEach(async w => {
        try {
          const r = await updateWallet(w)
          if (r)
            observer.next(r)
        } catch (error) {

        }
      })
    }

    const updateAllWallets = async () => {
      const wallets = await db.getWallets()
      updateWallets(wallets)
    }

    ObservableNodeConnection('34.253.153.4', 6868, 'W').filter(x => x.code == MessageCode.Block).subscribe(async x => {
      try {
        const adresses = await getAddressesFromBlock(x.content.parent)
        updateWallets(adresses)
      } catch (ex) {

      }
    })

    updateAllWallets()
  })

  const s = new Subject<IWalletBalances>()

  return {
    balances: s.merge(balances),
    addWallet: async (wallet: string) => {
      try {
        const r = await updateWallet(wallet)
        if (r)
          s.next(r)
      } catch (ex) {

      }
    }
  }
}