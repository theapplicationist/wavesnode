import { IDictionary } from "../generic/IDictionary";
import { IAsset } from "./IAsset";

export interface IWalletBalances {
  address: string,
  balances: IDictionary<string>
  assets?: IDictionary<IAsset>
}