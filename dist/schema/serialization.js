"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var blake2b = require("blake2b");
var ByteBuffer = require("byte-buffer");
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
            keys.forEach(function (k) { return namedSchemas[k].encode(buffer, obj[k]); });
        },
        decode: function (buffer) {
            var obj = {};
            keys.forEach(function (k) { return obj[k] = namedSchemas[k].decode(buffer); });
            return obj;
        }
    };
}
exports.createSchema = createSchema;
function createMessageSchema(contentId, namedSchemas) {
    var schema = createSchema(namedSchemas);
    schema[contentId] = contentId;
    return schema;
}
exports.createMessageSchema = createMessageSchema;
function serializeMessage(obj, schema) {
    var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
    var payload = schema.encode(buffer, obj);
    buffer.writeInt(305419896);
    buffer.writeByte(schema.contentId);
    buffer.writeInt(payload.length);
    if (payload.length > 0)
        buffer.writeInt(checksum(payload));
    buffer.write(payload);
    var length = buffer.length;
    buffer.prepend(4);
    buffer.index = 0;
    buffer.writeInt(length);
    return new Buffer(buffer.raw);
}
exports.serializeMessage = serializeMessage;
function deserializeMessage(buffer, schema) {
    var payloadLenght = buffer.readInt();
    if (payloadLenght > 0) {
        var payloadChecksum = buffer.readInt();
        var payload = buffer.slice(buffer.index, buffer.index + payloadLenght);
        var computedChecksum = checksum(payload.raw);
        if (payloadChecksum != computedChecksum)
            throw "Invalid checksum";
    }
    return schema.decode(buffer);
}
exports.deserializeMessage = deserializeMessage;
//# sourceMappingURL=serialization.js.map