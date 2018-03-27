import axios from 'axios'
import * as JSPath from 'jspath';
import * as WavesAPI from 'waves-api';
import * as linq from 'linq';
import { validateAddress } from '../bot/WavesCrypto';

const Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);

export const getLastBlock = async (): Promise<any> => {
  const data = await axios.get(`https://nodes.wavesnodes.com/blocks/last`)
  return data.data
}

export const getLastSolidBlock = async (): Promise<any> => {
  try {
    const data = await axios.get(`https://nodes.wavesnodes.com/blocks/headers/last`)
    if (data.status != 200) {
      return undefined
    }
    return await getBlock(data.data.reference)
  }
  catch (ex) {
    return undefined
  }
}

export const getNextSolidBlock = async (signature: string): Promise<any> => {
  try {
    const block = await getNextBlock(signature)

    if (!block)
      return undefined

    const nextBlock = await getNextBlock(block.signature)

    if (nextBlock) {
      return block
    }

    return undefined
  }
  catch (ex) {
    return undefined
  }
}

export const getBlock = async (signature: string): Promise<any> => {
  try {
    const data = await axios.get(`https://nodes.wavesnodes.com/blocks/signature/${signature}`)
    if (data.status != 200 || data.data.status == 'error') {
      return undefined
    }

    return data.data
  } catch (error) {
    return undefined
  }
}

export const getNextBlock = async (signature: string): Promise<any> => {
  try {
    const data = await axios.get(`https://nodes.wavesnodes.com/blocks/child/${signature}`)
    if (data.status != 200 || data.data.status == 'error') {
      return undefined
    }

    return data.data
  } catch (error) {
    return undefined
  }
}

export const getAddressesFromBlock = async (block): Promise<string[]> => {
  const result = linq.from(JSPath.apply('..sender | ..recipient | ..senderPublicKey', block)).distinct()
    .select((x: string) => {
      if (!x.startsWith('3P')) {
        try {
          return Waves.tools.getAddressFromPublicKey(x)
        } catch (error) {
        }
      }
    }).where(x => x).distinct().toArray()

  return result
}
