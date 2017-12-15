"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Primitives = require("./primitives");
var serialization_1 = require("./serialization");
var array = Primitives.array(serialization_1._serialize, serialization_1.deserialize);
var IpAddressSchema = serialization_1.createSchema({
    address: Primitives.fixedBytes(4),
    port: Primitives.int,
});
var VersionSchema = serialization_1.createSchema({
    major: Primitives.int,
    minor: Primitives.int,
    patch: Primitives.int,
});
var SignatureSchema = serialization_1.createSchema({
    signature: Primitives.fixedStringBase58(64)
});
var HandshakeSchema = serialization_1.createSchema({
    appName: Primitives.string,
    version: VersionSchema,
    nodeName: Primitives.string,
    nonce: Primitives.long,
    declaredAddress: Primitives.bytes,
    timestamp: Primitives.long,
});
exports.GetPeersSchema = serialization_1.createMessageSchema(1, {});
exports.ScoreSchema = function (size) { return serialization_1.createMessageSchema(24, {
    score: Primitives.bigInt(size)
}); };
exports.PeersSchema = serialization_1.createMessageSchema(2, {
    peers: array(IpAddressSchema),
});
exports.GetSignaturesSchema = serialization_1.createMessageSchema(20, {
    signatures: array(SignatureSchema)
});
exports.SignaturesSchema = serialization_1.createMessageSchema(21, {
    signatures: array(SignatureSchema)
});
exports.ByCode = {
    1: exports.GetPeersSchema,
    2: exports.PeersSchema,
    20: exports.GetSignaturesSchema,
    21: exports.SignaturesSchema
};
//# sourceMappingURL=messages.js.map