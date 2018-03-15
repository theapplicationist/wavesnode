import { KeyValueStore } from './KeyValueStore';
import { validateAddress } from './WavesCrypto';
const WavesAPI = require('waves-api');
const Waves = WavesAPI.create(WavesAPI.MAINNET_CONFIG);
const pk = '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy'
const address = Waves.tools.getAddressFromPublicKey(pk);
console.log(address); // '3N1JKsPcQ5x49utR79Maey4tbjssfrn2RYp'

const c = validateAddress('3PNrgtrYxmQYwFydrdE2YojrQyX7XLuDUyH')
console.log(c)