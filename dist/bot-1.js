"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const api_1 = __importDefault(require("./api"));
const order_1 = require("./order");
const bots_1 = __importDefault(require("./bots/bots"));
// Sentry error tracking
const Sentry = __importStar(require("@sentry/node"));
const time_1 = require("./utils/time");
// Don't know if I need Tracing!?!?!
// import * as Tracing from '@sentry/tracing';
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});
// Performance monitoring somehow with sentry.
// Need to learn more on this before using it.
// const transaction = Sentry.startTransaction({
//   op: 'test',
//   name: 'My First Test Transaction',
// });
// TODO
// - Firebase trade saving
// XXXX
// ON MA 100/200 thats on a downward trend - immediantly take profit
// on new candle that's above breakeven. On upward trend can be more liberal.
// XXXX
// Also could hold off selling on the next candle to instead sell on the next subsequent candle
// where the open price was higher then the previous candle's close price. IE Immeidantly
// after having a read candle. This would let the bot take advantage of any green candle streaks.
// XXXXX
// ERROR HANDLING
// XXXXXX
// Calculate funding rate into PnL
// XXXXXX
// Use Jest - test individual parts and maybe even FTXs api but defininetly MA and EMA functions.
// XXXXXXX
// Could chart bots performances against one another from Firebase. Overlay them
// and overlay them over the respective markets as well and see if any market trends
// make certain bots more performant then at other times.
// XXXXX
// Use CRON to restart server after crash and do any cleanup before switching off for me
// to later bug fix.
// XXXXXXX
// Consider taking profit after a certain percentage even if new candle hasn't started.
// Ie after 0.6%. OTherwise I tend to get 0.4%s only.
// XXXXXXX
// Consider preventing getting straight back into a trade in the same market that was just sold
// Especially if I implement take profit 0.6% automatically from above.
// XXXXXXX
// Consider instead of using percentage to set stoploss to instead shift it to just above/below
// previous candle. It would have prevented the ZIL-PERP stoploss hit losing 12 cents
// which otherwise would have been a good profit if it was left to run down. This might also be necessary
// for markets with more volatility despite volatitly having no impact on chart movement
// and ema predictions that the candles will move in a particular direction overall.
// XXXXXXX
// NEed a fallback plan for when ftx goes down for maintainence. How do I even detect
// that it's down for maintainence.
// -
// MAYBE RESPONSE COMES BACK WITH AN ERROR CODE STATUS I COULD USE!!!!
// -
// Could store current trade data in a database so I can retreive it on a CRON server restart.
// XXXXXX
// Manually translate what's returned from FTX into typed interfaces rather then assume
// FTX is giving me the correct data now and for always. This can happen because I'm using
// the 'any' type definintion on what's returned from apis which is fine but throws a risk
// that the data I working with in the app might be bad.
// XXXXXX
// Could improve EMA check by getting the tangent line at the cross point or something.
// Essentially find out the angle of the cross, perhaps taking in multiple data points.
// Sharper angles might be more reliable.
// XXXXXX
// Bot variant - Sell on reverse EMA cross before letting it hit stop loss.
// XXXXXX
// Bot variant - Only get into EMA crosses if current ptice is or ema is a certain disatnce from the cloest long MA line.
// For this variant may want to hold on until ema crosses back again.
// XXXXXX
// For variant waiting for returning ema cross, probably should be shifting stoploss
// higher as it goes. This will protect it on those moonshots that return back down again.
// XXXXX
// BUG!!!! - In the past have recieved not logged in error with an unauthorided error
// code - forgot to take it down. But need to reattempt loggin when this happens as
// this was likily a discrepency with the timestamp sent in the authorisation headers.
// and not a real fail.
// XXXXXX
// Test miniumum coin purchase size with BTT - minimum purchase 1000 but it only costs $0.0087 for 1.
// XXXXXX
// Variant idea: if only making EMA cross trades when distant from MAs, maybe also check if
// the MA is above or below. If above on take long positions. If the MA is below, only take
// short positions.
// XXXXXX
// function recursiveHistoricalEMAStep(data, previousMA, smoothing, step, num) {
//   if (step < data.length) {
//     const ema = data[step].close * smoothing + previousMA * (1 - smoothing);
//     console.log(num, data.length, step)
//     if (num >= data.length - step) {
//       return [...recursiveHistoricalEMAStep(data, ema, smoothing, step + 1, num), { time: data[step].time, ema: ema }];
//     } else {
//       return recursiveHistoricalEMAStep(data, ema, smoothing, step + 1, num);
//     }
//   } else {
//     return [];
//   }
// }
// function calculateHistoricalEMA(data, observations, num) {
//   // Smoothing / Weighting
//   const smoothing = 2 / (observations + 1);
//   const initMA = calculateMA(data.slice(data.length - num - (observations * 2) + 1, data.length - num - observations + 1));
//   return recursiveHistoricalEMAStep(data.slice(data.length - observations), initMA, smoothing, 0, num);
// }
const MARKET_IDS = [
    'BTC-PERP',
    'ETH-PERP',
    'LTC-PERP',
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
const openTrade = (tradeOrder) => __awaiter(void 0, void 0, void 0, function* () {
    const { marketId, side, subaccount, price } = tradeOrder;
    const openOrders = yield api_1.default.getOpenOrders(subaccount);
    console.log(openOrders);
    if (openOrders.length === 0) {
        const marketData = yield api_1.default.getMarket(marketId);
        const accountData = yield api_1.default.getAccount(subaccount);
        const balances = yield api_1.default.getBalances(subaccount);
        const usdBalance = balances.find((balance) => balance.coin === marketData.quoteCurrency);
        let volume;
        if (marketData.type === 'spot') {
            if (!usdBalance) {
                throw new Error('Missing USD balance when attempting to open a trade.');
            }
            // volume = Math.floor(usdBalance.free / price);
        }
        else if (marketData.type === 'future') {
            // volume = Math.floor(
            //   (accountData.freeCollateral * accountData.leverage) / price,
            // );
            volume = (accountData.freeCollateral * accountData.leverage) / price;
        }
        console.log(volume, marketData.sizeIncrement, accountData.freeCollateral, accountData.leverage, price);
        if (!volume || volume <= marketData.sizeIncrement) {
            console.log('ERROR - NOT ENOUGH MONEY FOR TRADE');
            return;
        }
        const order = yield api_1.default
            .placeOrder(subaccount, {
            market: marketId,
            side: side,
            price: price,
            type: 'limit',
            size: volume,
            reduceOnly: false,
            ioc: false,
            postOnly: false,
            clientId: null,
        })
            .catch((error) => {
            error.message = `Error placing order. ${error.message}`;
            throw error;
        });
        console.log(`New ${side === 'buy' ? 'LONG' : 'SHORT'} trade started for market ${marketId}.`);
        console.log(`Bid size set for ${volume} at $${price}.`);
        return {
            orderId: order.id,
            status: 'pending',
            positionType: side === 'buy' ? 'long' : 'short',
            side: side,
            timeOfOrder: new Date().getTime(),
            // coin: marketData.baseCurrency,
            // currency: marketData.quoteCurrency,
            subaccount: subaccount,
            marketId: marketId,
            marketType: marketData.type,
        };
    }
});
const canAffordMarket = (capital, price, minimumVolume) => capital > price * minimumVolume;
function runBot() {
    return __awaiter(this, void 0, void 0, function* () {
        const POLL_INTERVAL = 5000;
        const openTrades = [];
        const subaccountsData = {};
        let marketsData = yield api_1.default.getMarkets();
        const historicalMarketsData = {};
        let marketDataLastUpdatedAt = new Date().getTime();
        let poll = true;
        while (poll) {
            console.log(`=== Polling FTX | ${new Date().toISOString()} ===`);
            try {
                if (marketDataLastUpdatedAt + time_1.millisecondsTo(1, 'minutes') <
                    new Date().getTime()) {
                    console.log('Updating local market data.');
                    marketsData = yield api_1.default.getMarkets();
                    marketDataLastUpdatedAt = new Date().getTime();
                }
                // // XXXXCreate a generic waitfor interval function and move out the interval
                // // is finished check into that.
                // change while loop to
                // while !trade {
                // interval searchMarketForTrade()
                // }
                // Instead of bots call them and think of them as subaccounts!!!!
                // Instead of bots call them and think of them as subaccounts!!!!
                // Instead of bots call them and think of them as subaccounts!!!!
                // This way of editing the openTrade array seems overengineered. Maybe use class instances...??
                for (const subaccount of bots_1.default) {
                    const filteredMarketData = marketsData.filter((market) => MARKET_IDS.find((id) => market.name === id));
                    // console.log(subaccountsData);
                    if (!subaccountsData[subaccount.name] ||
                        subaccountsData[subaccount.name].lastUpdatedAt +
                            time_1.millisecondsTo(1, 'minutes') <
                            new Date().getTime()) {
                        console.log(`Updating stored local data for subaccount '${subaccount.name}'.`);
                        // DON"T AWAIT THESE UOPDATEWSSS
                        subaccountsData[subaccount.name] = yield api_1.default.getAccount(subaccount.name);
                    }
                    const trade = openTrades.find((trade) => trade.subaccount === subaccount.name);
                    if (!trade) {
                        console.log('Started search');
                        // Look for a trade order.
                        // XXXXXXX
                        // Pass available captial to bots search function so we dno't return
                        // a trade we can't afford.
                        // ...
                        // To make this even better. Skip searching a market if the stored historical
                        // prices suggest we are unlikely to be able to afford the smallest price of this.
                        // This prevents unecessary quering of the market.
                        // XXXXXXX
                        for (const market of filteredMarketData) {
                            // console.log(market);
                            // if(historicalMarketsData.lastUpdatedAt <  new Date().getTime() + millisecondsTo(1, 'minutes'))
                            if (canAffordMarket(subaccountsData[subaccount.name].freeCollateral, market.price, market.sizeIncrement)) {
                                console.log(`Checking market ${market.name}`);
                                const tradeOrder = yield subaccount.evaluateMarket(market.name);
                                // }
                                console.log('Finished search');
                                // If a trade order was made, start a new trade.
                                if (tradeOrder) {
                                    const newTrade = yield openTrade(tradeOrder);
                                    if (newTrade) {
                                        openTrades.push(newTrade);
                                        break;
                                    }
                                }
                            }
                            else {
                                console.log(`Skipping market ${market.name}. ${subaccount.name} doesn't have enough capital.`);
                            }
                        }
                    }
                    else {
                        // XXXXXXXX
                        // XXX Need to detect a successful trade here so I
                        // can automatically post to Firebase without needing
                        // to include it in every bots manage function.
                        // XXXXXXXX
                        const updatedTrade = yield subaccount.manage(trade);
                        const openTradeIndex = openTrades.findIndex((item) => item.subaccount === updatedTrade.subaccount);
                        // Stop observing trade if it's closed otherwise update it.
                        if (updatedTrade.status === 'closed') {
                            // XXXXXX When trade is closed we should requery and update whatever it is
                            // that's storing subaccount's total capital value.
                            openTrades.splice(openTradeIndex, 1);
                        }
                        else {
                            openTrades.splice(openTradeIndex, 1, updatedTrade);
                        }
                    }
                }
                yield new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
            }
            catch (error) {
                poll = false;
                // await criticalErrorCleanup(trade).catch((error) => {
                console.log(error);
                console.log('!!!!!!!!!!!!!!!');
                console.log('FAILED TO CLEANUP AFTER CRITICAL ERROR');
                console.log('TRADES MIGHT STILL BE ACTIVE');
                console.log('!!!!!!!!!!!!!!!');
                if (process.env.NODE_ENV === 'production') {
                    Sentry.captureException(error);
                    // Performance monitoring somehow with sentry.
                    // Need to learn more on this before using it.
                    // transaction.finish();
                }
                throw new Error(error);
                // });
                // console.log('Successfully cleaned up.');
            }
        }
        // // XXXXCreate a generic waitfor interval function and move out the interval
        // // is finished check into that.
    });
}
// An emergency cleanup function to attempt to cleanup any active orders.
// XXXX TODO - WIll not yet try to sell out of any positions!!!! Maybe won't
// need to if I store trades in database. Restarting server can just
// continue from where it left off.
function criticalErrorCleanup(trade) {
    return __awaiter(this, void 0, void 0, function* () {
        if (trade) {
            yield order_1.cancelAllTradeOrders(trade);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield runBot();
        }
        catch (error) {
            console.error('===== CRITICAL ERROR =====');
            console.error(error);
        }
    });
}
main();
