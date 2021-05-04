const { createHmac } = require('crypto');

const credentials = {
  'BOT#1': {
    key: process.env.BOT_1_API_KEY,
    secret: process.env.BOT_1_API_SECRET
  }
}

const authenticateRestHeaders = (pathURL, method, subaccount, payload) => {

  if (method !== 'POST' && method !== 'GET') {
    throw new Error('Unknown method type found in authentication signing');
  }

  const timestamp = new Date().getTime();
  const payloadString = payload ? JSON.stringify(payload) : '';
  const sign = `${timestamp}${method}/api${pathURL}${payloadString}`;

  const hmac = createHmac('sha256', credentials[subaccount].secret).update(sign).digest("hex");

  return {
    'FTX-KEY': credentials[subaccount].key,
    'FTX-TS': timestamp,
    'FTX-SIGN': hmac,
    'FTX-SUBACCOUNT': subaccount,
  }
}




module.exports = { authenticateRestHeaders }