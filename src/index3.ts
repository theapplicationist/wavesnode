import * as JSPath from 'jspath';
import * as WavesAPI from 'waves-api';
import * as linq from 'linq';
import { getAddressesFromBlock } from './wavesApi/getAddressesFromBlock';
import { getBalance } from './wavesApi/getBalance';

const Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);

async function main() {
  //console.time('get')
  const b = await getBalance('3PPvyMuGsNxjGkCaTJvWEGYsgTMWyLG4oJY ')
  //const a = await getAddressesFromBlock('4Jk7PLSzQ1utkzxftrS8PHA82v3zfPCCfZ4Mr4wonfuq9HWNSa6YucpmVWfWSdBJDwC6KhvvT9PpgYLaed6K13eR')
  //console.timeEnd('get')
  console.log(b)
}

main()