import axios from 'axios'
import * as JSPath from 'jspath';
import * as WavesAPI from 'waves-api';
import * as linq from 'linq';

const Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);

export const getAddressesFromBlock = async (signature: string): Promise<string[]> => {
  const data = await axios.get(`https://nodes.wavesnodes.com/blocks/signature/${signature}`)

  const result = linq.from(JSPath.apply('..sender | ..recipient | ..senderPublicKey', data.data)).distinct()
  .select((x: string) => x.startsWith('3P') ? x : Waves.tools.getAddressFromPublicKey(x)).distinct().toArray()

  return result
}
