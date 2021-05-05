import crypto from 'crypto';
import config, { Subaccount } from './config';

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

interface CredentialsHeaders {
  'FTX-KEY': string;
  'FTX-TS': number;
  'FTX-SIGN': string;
  'FTX-SUBACCOUNT': Subaccount;
}

const authenticateRestHeaders = (
  pathURL: string,
  method: HttpMethod,
  subaccount: Subaccount,
  payload?: unknown,
): CredentialsHeaders => {
  if (method !== 'POST' && method !== 'GET' && method !== 'DELETE') {
    throw new Error('Unknown method type found in authentication signing');
  }

  const key = config['BOT-1'].credentials.key;
  const secret = config['BOT-1'].credentials.secret;

  if (!key || !secret) {
    throw new Error('Missing credentials key or secret.');
  }

  const timestamp = new Date().getTime();
  const payloadString = payload ? JSON.stringify(payload) : '';
  const sign = `${timestamp}${method}/api${pathURL}${payloadString}`;

  const hmac = crypto.createHmac('sha256', secret).update(sign).digest('hex');

  return {
    'FTX-KEY': key,
    'FTX-TS': timestamp,
    'FTX-SIGN': hmac,
    'FTX-SUBACCOUNT': subaccount,
  };
};

export { authenticateRestHeaders };
