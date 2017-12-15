"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var ByteBuffer = require("byte-buffer");
var int64_buffer_1 = require("int64-buffer");
var messages_1 = require("./schema/messages");
var module_1 = require();
//Int64BE.prototype.inspect = function(depth, inspectArgs){
//  return this.toString()
//};
ByteBuffer.prototype.inspect = function (depth, inspectArgs) {
    return "[ " + this.raw.join(", ") + " ]";
};
var handshake = module_1.objWithSchema(module_1.HandshakeSchema, {
    appName: 'wavesT',
    version: { major: 0, minor: 8, patch: 0 },
    nodeName: 'name',
    nonce: new int64_buffer_1.Int64BE(0),
    declaredAddress: new Uint8Array(0),
    timestamp: new int64_buffer_1.Int64BE(new Date().getTime())
});
var client = new net.Socket();
client.connect(6863, '217.100.219.251', function () {
    console.log('Connected');
    var data = module_1.serialize(handshake);
    console.log('Sending handshake');
    client.write(data);
    console.log('Handshake sent');
});
client.on('error', function (err) {
    console.log('Error occured');
    console.log(err);
});
function tryToHandleHandshake(buffer) {
    buffer.front();
    if (buffer.available < 22)
        return;
    try {
        var handshake = module_1.deserialize(buffer, module_1.HandshakeSchema);
        buffer.clip(buffer.index);
        return handshake;
    }
    catch (ex) {
        return;
    }
}
function tryToFetchMessage(buffer) {
    buffer.front();
    if (buffer.available < 4)
        return;
    var size = buffer.readInt();
    if (size > buffer.available)
        return;
    var message = buffer.slice(0, size + 4);
    buffer.clip(message.length);
    return message;
}
function messageHandler(buffer) {
    console.log("Data reveiced:");
    var obj = module_1.deserializeMessage(buffer, function (code) { return messages_1.ByCode[code]; });
    console.log(obj.contentId);
    console.log(obj.content);
}
var handshakeWasReceived = false;
var incomingBuffer = new ByteBuffer(0, ByteBuffer.BIG_ENDIAN, true);
client.on('data', function (data) {
    incomingBuffer.end();
    incomingBuffer.write(data.buffer);
    if (!handshakeWasReceived && tryToHandleHandshake(incomingBuffer)) {
        handshakeWasReceived = true;
        //console.log("sending getPeers")
        //client.write(serializeMessage({}, GetPeersSchema))
        console.log('sending genesis signature');
        var m = module_1.serializeMessage({
            signatures: [{ signature: '5uqnLK3Z9eiot6FyYBfwUnbyid3abicQbAZjz38GQ1Q8XigQMxTK4C1zNkqS1SVw7FqSidbZKxWAKLVoEsp4nNqa' }]
        }, module_1.GetSignaturesSchema);
        client.write(m);
    }
    if (handshakeWasReceived) {
        do {
            var messageBuffer = tryToFetchMessage(incomingBuffer);
            if (messageBuffer)
                messageHandler(messageBuffer);
        } while (messageBuffer);
    }
});
client.on('close', function () {
    console.log('Connection closed');
});
//# sourceMappingURL=index.js.map