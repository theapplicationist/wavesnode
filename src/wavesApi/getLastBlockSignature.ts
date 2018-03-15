import axios from 'axios'
import * as JSPath from 'jspath';
import * as WavesAPI from 'waves-api';

const Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);

export const getLastBlockSignature = async (): Promise<string> => {
  const data = await axios.get(`https://nodes.wavesnodes.com/blocks/headers/last`)
  const result = JSPath.apply('..signature', data.data)[0]
  return result
}
