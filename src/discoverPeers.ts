import { createNodeConnection, NodeConnection } from './nodeConnection'
import { Observable } from 'rx-lite';

interface Dictionary<TValue> {
  [key: string]: TValue;
}

declare global {
  interface Array<T> {
    except(items: T[]): Array<T>
    rotate(): Array<T>
  }
}

if (!Array.prototype.except) {
  Array.prototype.except = function <T>(items: T[]): T[] {
    return this.filter(e => !items.includes(e))
  }
}
if (!Array.prototype.rotate) {
  Array.prototype.rotate = function <T>(): T[] {
    this.push(this.shift())
    return this
  }
}

const nodeConnections: Dictionary<NodeConnection> = {}
const knownPeers = []

const getConnection = async (peer): Promise<{ isNew: boolean, connection: NodeConnection }> => {
  let isNew = false
  if (!nodeConnections[peer]) {
    const c = createNodeConnection(peer, 6863)
    c.onClose(() => {
      delete nodeConnections[peer]
    })
    try {
      await c.connectAndHandshake()
      nodeConnections[peer] = c
      isNew = true
      if(isNew) {
        console.log(`NEW PEER -> ${peer}`);
      }
    }
    catch { 
      console.log(`PEER FAILED -> ${peer}`);
    }
  }

  return { isNew, connection: nodeConnections[peer] }
}

export const discoverPeers = (interval: number, initialPeers: string[]): Observable<NodeConnection> => {
  knownPeers.push(...initialPeers)
  return Observable.create(o => {
    Observable.interval(interval).subscribe(async _ => {
      const peer = knownPeers.rotate()[0]
      const { isNew, connection } = await getConnection(peer)
      try {
        const peers = await connection.getPeers()
        knownPeers.push(...peers.except(knownPeers))
        if (isNew) {
          o.onNext(connection)
        }
      } catch  {
       }
    })
  })
}

