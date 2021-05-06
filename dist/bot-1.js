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
const metrics_1 = require("./metrics");
// import bot from './bots/bot-1';
const bots_1 = __importDefault(require("./bots/bots"));
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
function hasEMACrossedInMarket(marketId, timeframe) {
    return __awaiter(this, void 0, void 0, function* () {
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
}
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
            volume = Math.floor(usdBalance.free / price);
        }
        else if (marketData.type === 'future') {
            volume = Math.floor(accountData.freeCollateral / price);
        }
        if (!volume || volume <= 1) {
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
            coin: marketData.baseCurrency,
            currency: marketData.quoteCurrency,
            subaccount: subaccount,
            marketId: marketId,
            marketType: marketData.type,
        };
    }
});
function runBot() {
    return __awaiter(this, void 0, void 0, function* () {
        const POLL_INTERVAL = 5000;
        const openTrades = [];
        let poll = true;
        // .XXXXXX
        // const pol = async (fn, intervalBetween: number) => {
        //   const executePol = async (resolve: any, reject: any) => {
        //     const result = await fn();
        //     setTimeout(executePoll, intervalBetween, resolve, reject);
        //   };
        //   return new Promise(executePol);
        // };
        while (poll) {
            console.log(`=== Polling FTX | ${new Date().toISOString()} ===`);
            try {
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                //
                // // XXXXCould seperate out to searchMarketForTrade and then manageTrade
                // // as two seperate intervals
                //
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // X!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // // XXXXCreate a generic waitfor interval function and move out the interval
                // // is finished check into that.
                // change while loop to
                // while !trade {
                // interval searchMarketForTrade()
                // }
                // We could then transition straight into buying without waiting 5 seconds
                // on polling interval cooldown.
                // Instead of bots call them and think of them as subaccounts!!!!
                // Instead of bots call them and think of them as subaccounts!!!!
                // Instead of bots call them and think of them as subaccounts!!!!
                // This way of editing the openTrade array seems overengineered.
                for (const subaccount of bots_1.default) {
                    // await bots.forEach(async (subaccount) => {
                    const trade = openTrades.find((trade) => trade.subaccount === subaccount.name);
                    if (trade) {
                        const updatedTrade = yield subaccount.manage(trade);
                        const openTradeIndex = openTrades.findIndex((item) => item.subaccount === updatedTrade.subaccount);
                        if (updatedTrade.status === 'closed') {
                            openTrades.splice(openTradeIndex, 1);
                        }
                        else {
                            openTrades.splice(openTradeIndex, 1, updatedTrade);
                            // trade = await runInterval(subaccount, trade);
                        }
                    }
                    else {
                        console.log('Started search');
                        const tradeOrder = yield subaccount.search();
                        console.log('Finished search');
                        if (tradeOrder) {
                            const newTrade = yield openTrade(tradeOrder);
                            if (newTrade) {
                                openTrades.push(newTrade);
                            }
                        }
                    }
                }
                console.log('TimeoutStart');
                yield new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
                console.log('TimeoutOver');
            }
            catch (error) {
                poll = false;
                // await criticalErrorCleanup(trade).catch((error) => {
                console.log(error);
                console.log('!!!!!!!!!!!!!!!');
                console.log('FAILED TO CLEANUP AFTER CRITICAL ERROR');
                console.log('TRADES MIGHT STILL BE ACTIVE');
                console.log('!!!!!!!!!!!!!!!');
                throw new Error(error);
                // });
                // console.log('Successfully cleaned up.');
            }
        }
        // await poll({
        //   fn: () => runInterval(subaccount, trade),
        //   validate: () => false,
        //   interval: POLL_INTERVAL,
        // });
        // .XXXXXX
        // await runInterval(subaccount).catch((error) => {
        //   throw error;
        // });
        // // let trade: Trade | undefined;
        // // XXXXCould seperate out to searchMarketForTrade and then manageTrade
        // // as two seperate intervals
        // // XXXXCreate a generic waitfor interval function and move out the interval
        // // is finished check into that.
        // const pollingInterval = setInterval(async function () {
        //   await runInterval(subaccount).catch((error) => {
        //     clearInterval(pollingInterval);
        //     throw error;
        //   });
        // }, 15000);
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
