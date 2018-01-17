"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var int64_buffer_1 = require("int64-buffer");
var Bignum = require("bignum");
var Base58 = require('base-58');
//Byte size and string contents
exports.string = {
    encode: function (b, v) {
        b.writeUnsignedByte(v.length);
        b.writeString(v);
    },
    decode: function (b) { return b.readString(b.readUnsignedByte()); }
};
exports.fixedStringBase58 = function (size) { return ({
    encode: function (b, v) { return b.write(Base58.decode(v)); },
    decode: function (b) { return Base58.encode(b.read(size).raw); }
}); };
//Sequence of three ints
exports.version = {
    encode: function (b, v) { return v.split('.', 3).forEach(function (i) { return b.writeInt(i); }); },
    decode: function (b) { return b.readInt() + "." + b.readInt() + "." + b.readInt(); }
};
exports.long = {
    encode: function (b, v) { return b.write(v.toArrayBuffer()); },
    decode: function (b) { return new int64_buffer_1.Int64BE(b.read(8).raw); }
};
exports.int = {
    encode: function (b, v) { return b.writeInt(v); },
    decode: function (b) { return b.readInt(); }
};
exports.byte = {
    encode: function (b, v) { return b.writeByte(v); },
    decode: function (b) { return b.readByte(); }
};
//Int size and bytes
exports.bytes = {
    encode: function (b, v) {
        b.writeInt(v.length);
        b.write(v);
    },
    decode: function (b) { return b.read(b.readInt()); }
};
exports.fixedBytes = function (size) { return ({
    encode: function (b, v) { return b.write(v); },
    decode: function (b) { return b.read(size); }
}); };
//Int size and schema
exports.array = function (schema) { return ({
    encode: function (b, v) {
        b.writeInt(v.length);
        v.forEach(function (i) { return schema.encode(b, i); });
    },
    decode: function (b) {
        var count = b.readInt();
        var result = [];
        for (var i = 0; i < count; i++) {
            result.push(schema.decode(b));
        }
        return result;
    }
}); };
exports.bigInt = function (size) { return ({
    encode: function (b, v) { return b.write(v.toBuffer()); },
    decode: function (b) { return Bignum.fromBuffer(b.read(size).raw); }
}); };
//# sourceMappingURL=primitives.js.map