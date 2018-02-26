import { BufferBe } from "../src/binary/BufferBE"
import { Buffer } from "buffer"
import * as Long from "long"
import { suite, test, slow, timeout } from "mocha-typescript"
import * as assert from "assert"
import { ObservableNodeConnection } from "../src/observableNodeConnection"
import { MessageCode } from "./schema/messages";

ObservableNodeConnection('34.253.153.4', 6868, 'W').filter(x => x.code == MessageCode.Block).subscribe(x => {
  console.log(x)
})