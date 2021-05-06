"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRestHeaders = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("./config"));
const authenticateRestHeaders = (pathURL, method, subaccount, payload) => {
    if (method !== 'POST' && method !== 'GET' && method !== 'DELETE') {
        throw new Error('Unknown method type found in authentication signing');
    }
    const key = config_1.default['BOT-1'].credentials.key;
    const secret = config_1.default['BOT-1'].credentials.secret;
    if (!key || !secret) {
        throw new Error('Missing credentials key or secret.');
    }
    const timestamp = new Date().getTime();
    const payloadString = payload ? JSON.stringify(payload) : '';
    const sign = `${timestamp}${method}/api${pathURL}${payloadString}`;
    const hmac = crypto_1.default.createHmac('sha256', secret).update(sign).digest('hex');
    return {
        'FTX-KEY': key,
        'FTX-TS': timestamp,
        'FTX-SIGN': hmac,
        'FTX-SUBACCOUNT': subaccount,
    };
};
exports.authenticateRestHeaders = authenticateRestHeaders;
