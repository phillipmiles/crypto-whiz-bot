const { createHmac } = require('crypto');
const config = require('./config');

const authenticateRestHeaders = (pathURL, method, subaccount, payload) => {

  if (method !== 'POST' && method !== 'GET' && method !== 'DELETE') {
    throw new Error('Unknown method type found in authentication signing');
  }

  const timestamp = new Date().getTime();
  const payloadString = payload ? JSON.stringify(payload) : '';
  const sign = `${timestamp}${method}/api${pathURL}${payloadString}`;

  const hmac = createHmac('sha256', config[subaccount].credentials.secret).update(sign).digest("hex");

  return {
    'FTX-KEY': config[subaccount].credentials.key,
    'FTX-TS': timestamp,
    'FTX-SIGN': hmac,
    'FTX-SUBACCOUNT': subaccount,
  }
}




module.exports = { authenticateRestHeaders }