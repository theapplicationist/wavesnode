import { PeerStorage } from "./PeerStorage";
import { discoverPeers } from "./discoverPeers";
import { config } from "./config-test";
import { Observable } from "rx-lite";
import { BlockStorage } from "./BlockStorage";

const peers = []
peers.push(...config.initialPeers)
peers.push(PeerStorage.allPeers().except(peers))

discoverPeers(1000, peers).flatMap(c => {
  const peer = c.ip()
  let isLoading = false
  return Observable.interval(5000).flatMap(async _ => {

    if (isLoading)
      return { signatures: [], height: 0 }

    isLoading = true
    const { signature, height } = PeerStorage.getPeerSignatureAndHeight(peer)
    const signatures = await c.getSignatures(signature)
    console.log(`BLOCKS LOADED -> peer: ${peer}, count: ${signatures.length - 1}`)
    if (signatures[0] == signature) {
      const l = signatures.length - 90
      if (l > 0) {
        PeerStorage.setPeerSignatureAndHeight(peer, signatures[l], height + l)
      }
      isLoading = false
      return { signatures, height }
    }

    isLoading = false
    return { signatures: [], height: 0 }
  }).where(x => x.signatures.length > 0)

}).subscribe(x => {
  var parent = x.signatures.shift()
  var height = x.height
  x.signatures.forEach(s => {
    height++
    BlockStorage.put(s, parent, height)
    parent = s
  })
})