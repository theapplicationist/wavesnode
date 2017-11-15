var ByteBuffer = require('byte-buffer');
var Int64BE = require("int64-buffer").Int64BE;

var serialize = function(obj, schema) {
  if(!schema)
    schema = obj.schema

  var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true)
  for(var prop in obj) {
    if(!schema[prop]){
      console.error(`No such ${prop} property found in schema`)
      continue
    }
    if(schema[prop].schema) {
      buffer.write(serialize(obj[prop], schema[prop]))
    }
    else {
      schema[prop].encode(buffer, obj[prop])
    }
  }

  return new Buffer(buffer.raw)
}

var deserialize = function(buffer, schema) {
  var obj = { }
  for(var prop in schema) {
    if(schema[prop].schema){
      obj[prop] = deserialize(buffer, schema[prop])
    }
    else {
      obj[prop] = schema[prop].decode(buffer)
    }
  }

  return obj
}

module.exports = {
  Schema : {
    //Byte size and string contents
    string: { 
      encode: (b, v) => {
        b.writeUnsignedByte(v.length)
        b.writeString(v)
      },
      decode: b => b.readString(b.readUnsignedByte())
    },
    //Sequence of three ints
    version: {
      encode: (b, v) => v.split('.', 3).forEach(i => b.writeInt(i)),
      decode: b => `${b.readInt()}.${b.readInt()}.${b.readInt()}`
    },
    long: {
      encode: (b, v) => b.write(v.toArrayBuffer()),
      decode: b => new Int64BE(b.read(8).raw)
    },
    int: {
      encode: (b, v) => b.writeInt(v),
      decode: b => b.readInt()
    },
    byte: {
      encode: (b, v) => b.writeByte(v),
      decode: b => b.readByte()
    },
    //Int size and bytes
    bytes: {
      encode: (b, v) => {
        b.writeInt(v.length)
        b.write(v)
      },
      decode: b => b.read(b.readInt())
    },
    bytes: function(size) {
      return {
        encode: (b, v) => {
          b.write(v)
        },
        decode: b => b.read(size)
      }
    }
  },

  createSchema: function(schema){
    Object.defineProperty(schema, 'schema', {value: {}})
    return schema
  },

  objWithSchema: function(schema, obj) {
    Object.defineProperty(obj, 'schema', {value: schema})
    return obj
  },

  serialize,
  deserialize
}