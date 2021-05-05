var createHmac = require('crypto').createHmac;
var config = require('./config');
var authenticateRestHeaders = function (pathURL, method, subaccount, payload) {
    if (method !== 'POST' && method !== 'GET' && method !== 'DELETE') {
        throw new Error('Unknown method type found in authentication signing');
    }
    var timestamp = new Date().getTime();
    var payloadString = payload ? JSON.stringify(payload) : '';
    var sign = "" + timestamp + method + "/api" + pathURL + payloadString;
    var hmac = createHmac('sha256', config[subaccount].credentials.secret).update(sign).digest("hex");
    return {
        'FTX-KEY': config[subaccount].credentials.key,
        'FTX-TS': timestamp,
        'FTX-SIGN': hmac,
        'FTX-SUBACCOUNT': subaccount
    };
};
module.exports = { authenticateRestHeaders: authenticateRestHeaders };
