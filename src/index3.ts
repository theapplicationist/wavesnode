import * as JSPath from 'jspath';
import * as WavesAPI from 'waves-api';
import * as linq from 'linq';
import { getAddressesFromBlock } from './wavesApi/getAddressesFromBlock';
import { getBalance } from './wavesApi/getBalance';

const r = JSON.stringify({
  name: "John",
  value: 1304,
  children: [
    {
      name: "Sarah",
      age: 10
    }
  ],
})

console.log(r)