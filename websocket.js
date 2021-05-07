require('dotenv').config();
const WebSocket = require('ws');
const { createHmac } = require('crypto');
const axios = require('axios');

const ws = new WebSocket(process.env.WEBSOCKET_ENDPOINT);

function message(message) {
  return JSON.stringify(message);
}

function ping() {
  ws.send(message({ op: 'ping' }));
}

function setPingPong() {
  const interval = 15000; // 15 seconds as specified... https://docs.ftx.com/#request-process
  ping();
  const pingPongTimeout = setInterval(ping, interval);
}

ws.on('open', async function open() {
  setPingPong();

  // Authenticate
  const time = new Date().getTime();

  // <time>websocket_login
  const sign = `${time}websocket_login`;
  // const hmac = createHmac(sign, process.env.FTX_READ_API_SECRET);
  const hmac = createHmac('sha256', process.env.FTX_READ_API_SECRET)
    .update(sign)
    .digest('hex');

  ws.send(
    message({
      op: 'login',
      args: {
        key: process.env.FTX_READ_API_KEY,
        sign: hmac,
        time: time,
      },
    }),
  );

  const markets = await axios.get(`${process.env.API_ENDPOINT}/markets`);

  console.log(markets.data);
  // const MARKET_IDS = [
  //   'BTC-PERP',
  //   'ETH-PERP',
  //   'LTC-PERP',
  //   'DOGE-PERP',
  //   'XRP-PERP',
  //   'ADA-PERP',
  //   'KNC-PERP',
  //   'ZRX-PERP',
  //   'GRT-PERP',
  //   'IOTA-PERP',
  //   'ALGO-PERP',
  //   'BAT-PERP',
  //   'REN-PERP',
  //   'LRC-PERP',
  //   'MATIC-PERP',
  //   'ZIL-PERP',
  //   'RSR-PERP',
  //   'VET-PERP',
  //   'AUDIO-PERP',
  //   'STX-PERP',
  //   'STORJ-PERP',
  //   'CRV-PERP',
  // ];
  for (const market of markets.data.result) {
    ws.send(
      message({ op: 'subscribe', channel: 'ticker', market: market.name }),
    );
  }
});

ws.on('message', function incoming(data) {
  console.log(data);
});
