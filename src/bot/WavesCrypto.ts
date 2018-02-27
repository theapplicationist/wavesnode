import * as base58 from 'base-58'
import blake2b = require('blake2b-wasm')
import createKeccakHash = require('keccak')

function blake(input) {
  return blake2b(32)
    .update(input)
    .digest()
}

function keccak(input) {
  return Uint8Array.from(createKeccakHash('keccak256').update(Buffer.from(input)).digest())
}

function hashChain(input: Uint8Array) {
  return keccak(blake(input));
}

export const validateAddress = (base58Address: string) => {
  try {
    const addressBytes = base58.decode(base58Address)
    const version = addressBytes[0]

    if (addressBytes[0] != 1 || addressBytes[1] != 'W'.charCodeAt(0))
      return false

    const key = addressBytes.slice(0, 22)
    const check = addressBytes.slice(22, 26)
    const keyHash = hashChain(key).slice(0, 4)

    for (let i = 0; i < 4; i++) {
      if (check[i] != keyHash[i])
        return false
    }
    return true
  } catch (ex) {

  }
}