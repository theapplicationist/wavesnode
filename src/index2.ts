import { PeerStorage } from "./PeerStorage";
import { discoverPeers } from "./discoverPeers";
import { config } from "./config-test";
import { Observable } from "rx-lite";

const peers = []
peers.push(...config.initialPeers)
peers.push(PeerStorage.allPeers)

discoverPeers(1000, peers).flatMap(c => {
  const peer = c.ip()
  let isLoading = false
  return Observable.interval(5000).flatMap(async _ => {

    if (isLoading)
      return []

    isLoading = true

    const fromSignature = PeerStorage.getPeerSignature(peer)
    const signatures = await c.getSignatures(fromSignature)
    if (signatures[0] == fromSignature) {
      let l = signatures.length - 90
      if (l > 0) {
        PeerStorage.setPeerSignature(peer, signatures[l])
      }
    }

    isLoading = false

    return signatures
  }).where(x => x.length > 0)

}).subscribe()