import { NodeConnection } from './nodeConnection'
import { Observable } from 'rx-lite';
import { IDictionary } from './generic/IDictionary';
import { RecurringTask } from './generic/RecurringTask';
import { connect } from 'http2';

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

const nodeConnections: IDictionary<NodeConnection> = {}
const knownPeers = []

const getConnection = async (peer, port, networkPrefix): Promise<{ isNew: boolean, connection: NodeConnection }> => {
  let isNew = false
  if (!nodeConnections[peer]) {
    const c = NodeConnection(peer, port, networkPrefix)
    c.onClose(() => {
      delete nodeConnections[peer]
    })

    try {
      await c.connectAndHandshake()
      nodeConnections[peer] = c
      isNew = true
      if (isNew) {
        console.log(`NEW PEER -> ${peer}`);
      }
    }
    catch {
      console.log(`PEER FAILED -> ${peer}`);
    }
  }
  return { isNew, connection: nodeConnections[peer] }
}

export const PeerDiscoverer = (initialPeers: string[], port: number, networkPrefix: string) => {
  knownPeers.push(...initialPeers)
  RecurringTask(1, async (done) => {
    const peer = knownPeers.rotate()[0]
    try {
      const { isNew, connection } = await getConnection(peer, port, networkPrefix)
      const peers = await connection.getPeers()
      knownPeers.push(...peers.except(knownPeers))
      if (isNew) {
        done(connection)
      }
    } catch { }

    done()
  }).subscribe()

  let active = 0
  return {
    getConnection: () => {
      var c = Object.keys(nodeConnections) 
      active++
      return nodeConnections[c[active % c.length]]
    }
  }
}

