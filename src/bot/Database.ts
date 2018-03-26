import { Database as sqlite } from 'sqlite3'
import { IAsset } from '../wavesApi/IAsset';
import { ISubscription } from './Interfaces/ISubscription';

export interface IUser {
  id,
  is_bot,
  first_name,
  last_name,
  username,
  language_code,
  email?: string
}

export interface IAssetBalance {
  $address: string,
  $assetId: string,
  $balance: string
}

export interface IDatabase {
  getWallets: () => Promise<string[]>
  addWallet: ($address: string, $userId: string) => Promise<boolean>
  addSubscription: ($address, $userId) => Promise<boolean>
  removeSubscription: ($address, $userId) => Promise<boolean>
  addUser: ($id, $is_bot, $first_name, $last_name, $username, $language_code) => Promise<boolean>
  addAsset: ($id, $alias, $decimals, $description, $issuer, $quantity, $reissuable, $timestamp) => Promise<boolean>
  updateUser: (user: IUser) => Promise<boolean>
  getUser: (id: string) => Promise<IUser>
  getUsers: () => Promise<IUser[]>
  getAsset: (id: string) => Promise<IAsset>
  updateBalance: ($address: string, $assetId: string, $balance: string) => Promise<{ $old: IAssetBalance, $new: IAssetBalance }>
  getUserSubscriptions: ($usedId: string) => Promise<ISubscription[]>
  getAddressSubscriptions: ($address: string) => Promise<ISubscription[]>
  updateUserSubscription: (subscription: ISubscription) => Promise<{ $old: ISubscription, $new: ISubscription }>
}

const tables = {
  wallets: 'wallets',
  subscriptions: 'subscriptions',
  balances: 'balances',
  users: 'users',
  assets: 'assets'
}



export const Database = (): IDatabase => {
  var db = new sqlite('./wavesbalance')

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ${tables.wallets} (
    address TEXT PRIMARY KEY,
    userId TEXT,
    timestamp TEXT)`)
    db.run(`CREATE TABLE IF NOT EXISTS ${tables.subscriptions} (
    address TEXT,
    userId TEXT,
    alias TEXT,
    disabled INTEGER,
    PRIMARY KEY (address, userId))`)
    db.run(`CREATE TABLE IF NOT EXISTS ${tables.balances} (
    address TEXT,
    assetId TEXT,
    balance TEXT,
    PRIMARY KEY (address, assetId))`)
    db.run(`CREATE TABLE IF NOT EXISTS ${tables.assets} (
    id TEXT PRIMARY KEY,
    alias TEXT,
    decimals INTEGER,
    description TEXT,
    issuer TEXT,
    quantity TEXT,
    reissuable INTEGER,
    timestamp TEXT)`)
    db.run(`CREATE TABLE IF NOT EXISTS ${tables.users} (
    id TEXT PRIMARY KEY,
    is_bot INTEGER,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    language_code TEXT)`)
  })

  const dbSelect = <T>(sql: string, projection: (any) => T): Promise<T[]> =>
    new Promise<T[]>((resolve, reject) => {
      db.all(sql, function (err, rows) {
        if (err)
          reject(err)
        else
          resolve(rows.map(projection))
      })
    })

  const dbGet = <T>(sql: string, projection: (any) => T, obj?: any): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const f = function (err, row) {
        if (err)
          reject(err)
        else
          if (row)
            resolve(projection(row))
          else
            resolve(undefined)
      }
      if (obj)
        db.get(sql, obj, f)
      else
        db.get(sql, f)
    })

  const dbRun = (sql: string, obj: any, onChanges?: () => void): Promise<boolean> =>
    new Promise<boolean>((resolve, reject) => {
      db.run(sql, obj, function (err) {
        if (err) {
          reject(err)
        }
        if (this.changes && this.changes > 0) {
          if (onChanges) onChanges()
          resolve(true)
        }
        else {
          resolve(false)
        }
      })
    })

  const makeSqlObj = (obj: any) => {
    if (Object.keys(obj).every(c => !c.startsWith('$'))) {
      const o = {}
      Object.keys(obj).forEach(c => o[`$${c}`] = obj[c])
      return o
    }
    return obj
  }

  const dbInsert = <T>(table: string, obj: T, onNew?: () => void): Promise<boolean> => {
    obj = makeSqlObj(obj)
    const columns = Object.keys(obj).filter(k => k.startsWith('$'))
    const sql = `INSERT OR IGNORE INTO ${table} (${columns.map(c => c.substr(1)).join(', ')}) VALUES (${columns.join(', ')})`
    return dbRun(sql, obj, onNew)
  }

  const dbUpdate = <T>(table: string, id: string[], obj: T, onNew?: () => void): Promise<boolean> => {
    obj = makeSqlObj(obj)
    id = id.map(c => c.startsWith('$') ? c : `$${c}`)
    const columns = Object.keys(obj).filter(k => k.startsWith('$') && !id.includes(k))
    const where = id.map(c => `${c.substr(1)} = ${c}`).join(' and ')
    const sql = `UPDATE ${table} SET ${columns.map(c => `${c.substr(1)} = ${c}`).join(', ')} WHERE ${where}`
    return dbRun(sql, obj, onNew)
  }

  const dbInsertOrReplace = <T>(table: string, id: string[], obj: T, onChanges?: ($old: T, $new: T) => void): Promise<{ $old: T, $new: T }> => new Promise<{ $old: T, $new: T }>(async (resolve, reject) => {
    obj = makeSqlObj(obj)
    id = id.map(c => c.startsWith('$') ? c : `$${c}`)
    const columns = Object.keys(obj).filter(k => k.startsWith('$'))
    const where = id.map(c => `${c.substr(1)} = ${c}`).join(' and ')
    const p = {}
    id.forEach(c => p[c] = obj[c])

    const select = await dbGet(`SELECT * FROM ${table} WHERE ${where}`, x => x, p)
    if (!select) {
      await dbInsert(table, obj)
      if (onChanges) onChanges(undefined, obj)
      resolve({ $old: undefined, $new: obj })
      return
    }
    const values = columns.map(c => id.includes(c) ? `(SELECT ${c.substr(1)} FROM ${table} WHERE ${c.substr(1)} = ${c})` : c).join(', ')
    const sql = `INSERT OR REPLACE INTO ${table} (${columns.map(c => `${c.substr(1)}`).join(', ')}) VALUES (${values})`
    try {
      let old = select
      if (old)
        old = makeSqlObj(old)
      await dbRun(sql, obj)
      if (onChanges) onChanges(old, obj)
      resolve({ $old: old, $new: obj })
    } catch (err) {
      reject(err)
    }
  })

  const dbDelete = (table: string, id: any, onDeleted?: () => void): Promise<boolean> => {
    id = makeSqlObj(id)
    const columns = Object.keys(id).filter(k => k.startsWith('$'))
    const sql = `DELETE FROM ${table} WHERE ${columns.map(c => `${c.substr(1)} = ${c}`).join(' and ')}`
    return dbRun(sql, id, onDeleted)
  }

  let onNewSubscriptionHandler: (address: string, userId: string) => void

  return {
    getWallets: (): Promise<string[]> =>
      dbSelect(`SELECT address FROM wallets`, x => x.address),

    addWallet: ($address: string, $userId: string): Promise<boolean> =>
      dbInsert(tables.wallets, { $address, $userId }, () => {
        console.log(`NEW WALLET -> ${$address}`)
      }),

    addSubscription: ($address, $userId): Promise<boolean> =>
      dbInsert(tables.subscriptions, { $address, $userId }, () => {
        console.log(`NEW SUBSCRIPTION -> ${$userId} to ${$address}`)
        if (onNewSubscriptionHandler)
          onNewSubscriptionHandler($address, $userId)
      }),

    removeSubscription: ($address, $userId): Promise<boolean> =>
      dbDelete(tables.subscriptions, { $address, $userId }, () => {
        console.log(`SUBSCRIPTION REMOVED -> ${$userId} to ${$address}`)
      }),

    addUser: ($id, $is_bot, $first_name, $last_name, $username, $language_code): Promise<boolean> => {
      const params = { $id, $is_bot, $first_name, $last_name, $username, $language_code }
      params.$language_code = new RegExp('ru', 'i').test(params.$language_code) ? 'ru' : 'en'

      return dbInsert(tables.users, params, () => {
        console.log(`NEW USER -> ${$id}, ${$first_name} ${$last_name}`)
      })
    },

    updateUser: (user: IUser): Promise<boolean> =>
      dbUpdate(tables.users, ['id'], user, () => {
        console.log(`USER UPDATED -> ${user.id}, language_code: ${user.language_code}, email: ${user.email}`)
      }),

    getUser: (id): Promise<IUser> =>
      dbGet(`SELECT * FROM ${tables.users} WHERE id = '${id}'`, x => x),

    getUsers: (): Promise<IUser[]> =>
      dbSelect(`SELECT * FROM ${tables.users}`, x => x),

    updateBalance: ($address: string, $assetId: string, $balance: string): Promise<{ $old: IAssetBalance, $new: IAssetBalance }> =>
      dbInsertOrReplace<IAssetBalance>(tables.balances, ['address', 'assetId'], { $address, $assetId, $balance }, ($old, $new) => {
        if (!$old || $old.$balance != $new.$balance)
          console.log(`BALANCE CHANGED -> ${$address}, asset: ${$assetId} balance: ${$balance}`)
      }),

    addAsset: ($id, $alias, $decimals, $description, $issuer, $quantity, $reissuable, $timestamp): Promise<boolean> =>
      dbInsert(tables.assets, { $id, $alias, $decimals, $description, $issuer, $quantity, $reissuable, $timestamp }, () => {
        console.log(`NEW ASSET -> ${$id}, ${$alias}`)
      }),

    getAsset: ($id: string): Promise<IAsset> =>
      dbGet(`SELECT * FROM ${tables.assets} WHERE id = '${$id}'`, x => x),

    getUserSubscriptions: ($userId: string): Promise<ISubscription[]> =>
      dbSelect(`SELECT * FROM ${tables.subscriptions} WHERE userId = '${$userId}'`, x => x),

    getAddressSubscriptions: ($address: string): Promise<ISubscription[]> =>
      dbSelect(`SELECT * FROM ${tables.subscriptions} WHERE address = '${$address}' and disabled is not 1`, x => x),

    updateUserSubscription: (subscription: ISubscription): Promise<{ $old: ISubscription, $new: ISubscription }> =>
      dbInsertOrReplace<ISubscription>(tables.subscriptions, ['address', 'userId'], subscription),

  }
}