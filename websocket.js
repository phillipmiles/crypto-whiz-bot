require('dotenv').config()
const WebSocket = require('ws');
const { createHmac } = require('crypto');


const ws = new WebSocket(process.env.WEBSOCKET_ENDPOINT);

function message(message) {
  return JSON.stringify(message);
}

function ping() {
  ws.send(message({ 'op': 'ping' }));
}

function setPingPong() {
  const interval = 15000; // 15 seconds as specified... https://docs.ftx.com/#request-process
  ping();
  const pingPongTimeout = setInterval(ping, interval)
}

ws.on('open', function open() {

  setPingPong();

  // Authenticate
  const time = new Date().getTime();

  // <time>websocket_login
  const sign = `${time}websocket_login`;
  // const hmac = createHmac(sign, process.env.FTX_READ_API_SECRET);
  const hmac = createHmac('sha256', process.env.FTX_READ_API_SECRET).update(sign)
    .digest("hex");

  ws.send(message({
    'op': 'login', 'args': {
      'key': process.env.FTX_READ_API_KEY, 'sign': hmac, 'time': time
    }
  }));

  ws.send(message({ 'op': 'subscribe', 'channel': 'trades', 'market': 'BTC-PERP' }));


});

ws.on('message', function incoming(data) {
  console.log(data);
});