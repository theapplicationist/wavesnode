import * as exitHook from 'exit-hook'
import * as fs from 'fs'

const genesisSignature = '5uqnLK3Z9eiot6FyYBfwUnbyid3abicQbAZjz38GQ1Q8XigQMxTK4C1zNkqS1SVw7FqSidbZKxWAKLVoEsp4nNqa'
const genesisHeight = 1
const file = fs.existsSync('./peers') ? fs.readFileSync('./peers').toString() : ''
const peerToSignature = file.length > 0 ? JSON.parse(file) : {}

const save = () => {
  fs.writeFileSync('./peers', JSON.stringify(peerToSignature))
}

exitHook(save)

export const PeerStorage = {
  getPeerSignature: peer => {
    if (!peerToSignature[peer]) {
      peerToSignature[peer] = genesisSignature
    }
    return peerToSignature[peer]
  },
  
  setPeerSignature: (peer, signature) => {
    peerToSignature[peer] = signature
    save()
  },

  allPeers: () => Object.keys(peerToSignature)
}