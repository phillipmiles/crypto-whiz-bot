"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const time_1 = require("../../utils/time");
const metrics_1 = require("../../metrics");
const api_1 = __importDefault(require("../../api"));
const config_1 = __importDefault(require("./config"));
const marketIds = [
    'DOGE-PERP',
    'XRP-PERP',
    'ADA-PERP',
    'KNC-PERP',
    'ZRX-PERP',
    'GRT-PERP',
    'IOTA-PERP',
    'ALGO-PERP',
    'BAT-PERP',
    'REN-PERP',
    'LRC-PERP',
    'MATIC-PERP',
    'ZIL-PERP',
    'RSR-PERP',
    'VET-PERP',
    'AUDIO-PERP',
    'STX-PERP',
    'STORJ-PERP',
    'CRV-PERP',
];
const hasEMACrossedInMarket = (marketId, timeframe) => __awaiter(void 0, void 0, void 0, function* () {
    const historicalData = yield api_1.default.getHistoricalPrices(marketId, timeframe);
    // Use marketData for more frequently updated current price.
    const marketData = yield api_1.default.getMarket(marketId);
    const data = [
        ...historicalData.slice(0, historicalData.length - 1),
        ...[{ close: marketData.price }],
    ];
    // console.log('MA', calculateMA(data.slice(data.length - 21)));
    // console.log(historicalData[historicalData.length - 1].close, marketData.price)
    // console.log('data', data)
    const previousLongEMA = metrics_1.calculateEMA(historicalData.slice(0, historicalData.length - 1), 21);
    const previousShortEMA = metrics_1.calculateEMA(historicalData.slice(0, historicalData.length - 1), 10);
    // const currentLongEMA = calculateEMA(historicalData.slice(0), 21);
    // const currentShortEMA = calculateEMA(historicalData.slice(0), 10);
    const currentLongEMA = metrics_1.calculateEMA(data, 21);
    const currentShortEMA = metrics_1.calculateEMA(data, 10);
    console.log(Math.sign(previousLongEMA - previousShortEMA), Math.sign(currentLongEMA - currentShortEMA), Math.floor((currentLongEMA - currentShortEMA) * 100000));
    // console.log(Math.sign(previousLongEMA - previousShortEMA), Math.sign(currentLongEMA - currentShortEMA));
    if (Math.sign(previousLongEMA - previousShortEMA) !==
        Math.sign(currentLongEMA - currentShortEMA)) {
        console.log('CROSSED');
        if (Math.sign(currentLongEMA - currentShortEMA) === 1) {
            console.log('GO SHORT');
            return 'short';
        }
        else {
            console.log('GO LONG');
            return 'long';
        }
    }
    return;
});
const search = () => __awaiter(void 0, void 0, void 0, function* () {
    // XXX TODO: Need to check that account has enough money to buy smallest amount
    // of coin.
    for (const marketId of marketIds) {
        console.log(`Checking market ${marketId}`);
        const emaCross = yield hasEMACrossedInMarket(marketId, time_1.secondsTo(15, 'minutes'));
        if (emaCross) {
            console.log(`Found EMA cross '${emaCross}' in market ${marketId}.`);
            const marketData = yield api_1.default.getMarket(marketId);
            // Can't short a spot market.
            if (emaCross === 'short' && marketData.type === 'spot') {
                return;
            }
            return {
                subaccount: config_1.default.name,
                marketId: marketId,
                side: emaCross === 'long' ? 'buy' : 'sell',
                price: marketData.price,
            };
        }
    }
    return;
});
exports.default = search;
