import {createNodeConnection, NodeConnection} from './nodeConnection'

export interface Dictionary<TValue> {
  [key: string]: TValue;
}

export const peersDiscovery = (initialPeers: string[]) => {
  const knownPeers = []
  const connectedPeers: Dictionary<NodeConnection> = {}
  knownPeers.push(...initialPeers)

  const fetch = () => {
    const p = knownPeers.shift()
    knownPeers.push(p)
    return p
  }

  return Rx.Observable.create<NodeConnection>(observer => {
    Rx.Observable.interval(1000).subscribe(async _ => {
      const peer = fetch()
      var c = connectedPeers[peer]
      if(!c) {
        c = createNodeConnection(peer, 6863)
        c.onClose(() => {
          delete connectedPeers[peer]
        })
        try {
          await c.connectAndHandshake()
          if (!connectedPeers[peer]) {
            connectedPeers[peer] = c
            observer.onNext(c)
          }
        } catch {}
      }

      const peers = await c.getPeers()
      const newPeers = peers.filter(p => !knownPeers.includes(p))
      knownPeers.unshift(...newPeers)
    })
  })
}