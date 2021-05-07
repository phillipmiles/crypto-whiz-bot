"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    // URI-encoded name of the subaccount to use.
    name: 'BOT-1',
    credentials: {
        key: process.env.BOT_1_API_KEY,
        secret: process.env.BOT_1_API_SECRET,
    },
    description: "Buys on a 15 minutes EMA cross. Waits till next candle at which point it will just sell it if it's in profit",
    // marketBlacklist: [],
    // marketWhitelist: [],
    // marketBlacklist: [],
    // marketWhitelist: ['perpetual'],
};
