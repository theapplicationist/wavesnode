"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var blake2b = require("blake2b");
var ByteBuffer = require("byte-buffer");
var buffer_1 = require("buffer");
var messages_1 = require("./messages");
function checksum(bytes) {
    var hash = blake2b(32);
    hash.update(bytes);
    var output = new Uint8Array(32);
    hash.digest(output);
    return new ByteBuffer(output).readInt();
}
exports.checksum = checksum;
function createSchema(namedSchemas) {
    var keys = Object.keys(namedSchemas);
    return {
        encode: function (buffer, obj) {
            keys.forEach(function (k) {
                var schema = namedSchemas[k];
                if (typeof schema === 'function')
                    schema = schema(obj);
                //console.log(`encoding: ${k} = ${obj[k]}`)
                schema.encode(buffer, obj[k]);
            });
        },
        decode: function (buffer) {
            var obj = {};
            keys.forEach(function (k) {
                var schema = namedSchemas[k];
                if (typeof schema === 'function')
                    schema = schema(obj);
                obj[k] = schema.decode(buffer);
            });
            return obj;
        }
    };
}
exports.createSchema = createSchema;
function createMessageSchema(contentId, namedSchemas) {
    var schema = createSchema(namedSchemas);
    schema['contentId'] = contentId;
    var r = schema;
    return r;
}
exports.createMessageSchema = createMessageSchema;
function serializeMessage(obj, code) {
    var schema = messages_1.Schema(code);
    var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
    schema.encode(buffer, obj);
    var payload = new buffer_1.Buffer(buffer.raw);
    buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
    buffer.writeInt(305419896);
    buffer.writeByte(code);
    buffer.writeInt(payload.length);
    if (payload.length > 0)
        buffer.writeInt(checksum(payload));
    buffer.write(payload);
    var length = buffer.length;
    buffer.prepend(4);
    buffer.index = 0;
    buffer.writeInt(length);
    return new buffer_1.Buffer(buffer.raw);
}
exports.serializeMessage = serializeMessage;
function deserializeMessage(buffer) {
    var length = buffer.readInt();
    var magic = buffer.readInt();
    var code = buffer.readByte();
    var payloadLength = buffer.readInt();
    if (payloadLength > 0) {
        var payloadChecksum = buffer.readInt();
        var payload = buffer.slice(buffer.index, buffer.index + payloadLength);
        //var computedChecksum = checksum(payload.raw)
        //if (payloadChecksum != computedChecksum)
        //  throw "Invalid checksum"
    }
    var schema = messages_1.Schema(code);
    if (schema)
        return { code: code, content: schema.decode(buffer) };
}
exports.deserializeMessage = deserializeMessage;
