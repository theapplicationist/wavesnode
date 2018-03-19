import axios from 'axios'
import * as JSPath from 'jspath';
import * as WavesAPI from 'waves-api';
import * as linq from 'linq';
import { IAsset } from './IAsset';

function trimStart(str: string, symbol) {
  while (str.startsWith(symbol)) {
    str = str.substr(symbol.length)
  }
  return str
}

export const formatAssetBalance = (asset: IAsset, balance: string): string => {
  const d = new Array(asset.decimals + 1).join('0') + balance
  const afterDot = d.substr(d.length - asset.decimals)
  const beforeDot = trimStart(d.substr(0, d.length - asset.decimals), '0')

  return (beforeDot.length == 0 ? '0' : beforeDot) + (afterDot.length > 0 ? '.' : '') + afterDot
}

export const formatAsset = (asset: IAsset, balance: string): string => {
  return formatAssetBalance(asset, balance) + ' ' + asset.alias
}
