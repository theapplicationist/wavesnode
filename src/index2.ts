import { BufferBe } from './binary/BufferBE'
import * as fs from 'fs'
import * as Long from 'long'
import { BlockSchema } from './schema/messages'
import * as linq from 'linq'

const blockSignature = '29qonotodMERYwkjstqK3cvqXStDT9p12t4sN5Xac7LhSs2PrCtBYHzKevH3WSLYvsEz8cEGVEGheFKtB7boMKjz'
const buffer = BufferBe(fs.readFileSync('./test/blocks/' + blockSignature))
const r = BlockSchema.decode(buffer)

Long.prototype.inspect = function (depth, inspectArgs) {
  return this.toString()
};

//console.log(Buffer.from(r.body).slice(4+1+64+1+32).map(v => v.toString()).join(" "))
//console.log(Buffer.from(r.body).readInt32BE(0))
//console.log(Buffer.from(r.body).length)
//console.log(linq.from(r.transactions).groupBy(x => x.type).select(x => ({ key: x.key(), value: x.count() })).toArray())
console.log(r.transactions)