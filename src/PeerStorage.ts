import * as exitHook from 'exit-hook'
import * as fs from 'fs'
import { config } from './config-test';

const file = fs.existsSync('./peers') ? fs.readFileSync('./peers').toString() : ''
const peerToSignature = file.length > 0 ? JSON.parse(file) : {}

const save = () => {
  fs.writeFileSync('./peers', JSON.stringify(peerToSignature))
}

exitHook(save)

export const PeerStorage = {
  getPeerSignatureAndHeight: peer => {
    if (!peerToSignature[peer]) {
      peerToSignature[peer] = { signature: config.rootSignature, height: config.rootHeight }
    }
    return peerToSignature[peer]
  },

  setPeerSignatureAndHeight: (peer, signature, height) => {
    peerToSignature[peer] = { signature, height }
    save()
  },

  allPeers: () => {
    const r = Object.keys(peerToSignature)
    return r
  }
}