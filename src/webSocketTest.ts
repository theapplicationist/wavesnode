import { Buffer } from "buffer"
import * as Long from "long"
import { ObservableNodeConnection } from "./observableNodeConnection"
import { MessageCode } from "./schema/messages"
import * as WebSocket from "ws"
import * as http from "http";

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', function connection(ws) {

 ws.on('message', function incoming(message) {
   console.log('received: %s', message);
 });


});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    console.log(client);
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, function ack(error) {
       console.log(error);
      });
    }
  });
};

ObservableNodeConnection('46.101.104.167', 6868, 'W').subscribe(x => {
  //wss.broadcast(JSON.stringify(x));

  console.log(JSON.stringify(x));
  
}, 
e => { console.log(e)})
