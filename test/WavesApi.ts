import * as assert from 'assert'
import { suite, test, slow, timeout } from "mocha-typescript"
import { formatAsset } from '../src/wavesApi/formatAsset'
import { IAsset } from '../src/wavesApi/IAsset'

suite('WavesApi', () => {
  const wavesAsset: IAsset = {
    alias: 'WAVES',
    decimals: 8,
    quantity: '100000000',
    description: 'Waves offical',
    id: 'WAVES',
    issuer: 'WAVES',
    reissuable: false,
    timestamp: '0'
  }

  test('should format asset', () => {
    assert.equal(formatAsset(wavesAsset, '10'), '0.00000010 WAVES')
    assert.equal(formatAsset(wavesAsset, '-10'), '-0.00000010 WAVES')
    assert.equal(formatAsset(wavesAsset, '260496971786'), '2604.96971786 WAVES')
  })
})
