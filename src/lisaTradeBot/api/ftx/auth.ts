import crypto from 'crypto';

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export interface AuthConfig {
  subaccount: string;
  key: string;
  secret: string;
}

interface CredentialsHeaders {
  'FTX-KEY': string;
  'FTX-TS': number;
  'FTX-SIGN': string;
  'FTX-SUBACCOUNT': string;
}

const generateAuthApiHeaders = (
  pathURL: string,
  method: HttpMethod,
  authConfig: AuthConfig,
  payload?: unknown,
): CredentialsHeaders => {
  if (method !== 'POST' && method !== 'GET' && method !== 'DELETE') {
    throw new Error('Unknown method type found in authentication signing');
  }

  if (!authConfig.key || !authConfig.secret) {
    throw new Error('Missing credentials key or secret.');
  }

  const timestamp = new Date().getTime();
  const payloadString = payload ? JSON.stringify(payload) : '';
  const sign = `${timestamp}${method}/api${pathURL}${payloadString}`;

  const hmac = crypto
    .createHmac('sha256', authConfig.secret)
    .update(sign)
    .digest('hex');

  return {
    'FTX-KEY': authConfig.key,
    'FTX-TS': timestamp,
    'FTX-SIGN': hmac,
    'FTX-SUBACCOUNT': authConfig.subaccount,
  };
};

export { generateAuthApiHeaders };
