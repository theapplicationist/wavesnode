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
function objWithSchema(schema, obj) {
    Object.defineProperty(obj, 'schema', { value: schema });
    if (schema.contentId) {
        Object.defineProperty(obj, 'contentId', { value: schema.contentId });
    }
    return obj;
}
exports.objWithSchema = objWithSchema;
exports._serialize = function (buffer, obj, schema) {
    if (!schema)
        schema = obj.schema;
    if (!schema)
        throw "Schema not found";
    for (var prop in obj) {
        if (!schema[prop]) {
            console.error("No such " + prop + " property found in schema");
            continue;
        }
        if (schema[prop].schema) {
            exports._serialize(buffer, obj[prop], schema[prop]);
        }
        else {
            schema[prop].encode(buffer, obj[prop]);
        }
    }
    return new Buffer(buffer.raw);
};
function serialize(obj, schema) {
    var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
    return exports._serialize(buffer, obj, schema);
}
exports.serialize = serialize;
function deserialize(buffer, schema) {
    var obj = {};
    // Object.keys(schema).forEach(key => {})
    for (var prop in schema) {
        if (schema[prop].schema) {
            obj[prop] = deserialize(buffer, schema[prop]);
        }
        else {
            obj[prop] = schema[prop].decode(buffer);
        }
    }
    return objWithSchema(schema, obj);
}
exports.deserialize = deserialize;
function createSchema(schema) {
    Object.defineProperty(schema, 'schema', { value: {} });
    return schema;
}
exports.createSchema = createSchema;
function createMessageSchema(contentId, schema) {
    Object.defineProperty(schema, 'schema', { value: {} });
    Object.defineProperty(schema, 'contentId', { value: contentId });
    return schema;
}
exports.createMessageSchema = createMessageSchema;
function serializeMessage(obj, messageSchema) {
    if (!messageSchema)
        messageSchema = obj.schema;
    if (!messageSchema)
        throw "MessageSchema not found";
    if (!messageSchema.contentId)
        throw "Invalid messageSchema: contentId not found";
    var buffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
    var payload = serialize(obj, messageSchema);
    buffer.writeInt(305419896);
    buffer.writeByte(messageSchema.contentId);
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
function deserializeMessage(buffer, schemaResolver) {
    var length = buffer.readInt();
    var magic = buffer.readInt();
    var contentId = buffer.readByte();
    var payloadLenght = buffer.readInt();
    if (payloadLenght > 0) {
        var payloadChecksum = buffer.readInt();
        var payload = buffer.slice(buffer.index, buffer.index + payloadLenght);
        var computedChecksum = checksum(payload.raw);
        if (payloadChecksum != computedChecksum)
            throw "Invalid checksum";
    }
    var content = {};
    var schema = schemaResolver(contentId);
    if (schema) {
        content = deserialize(buffer, schema);
    }
    return {
        contentId: contentId,
        content: content
    };
}
exports.deserializeMessage = deserializeMessage;
//# sourceMappingURL=serialization.js.map