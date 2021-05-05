var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
require('dotenv').config();
var api = require('./api');
var secondsTo = require('./utils/time').secondsTo;
var _a = require('./order'), calcBreakeven = _a.calcBreakeven, hasOrderSuccessfullyFilled = _a.hasOrderSuccessfullyFilled, calcStoplossTriggerPrice = _a.calcStoplossTriggerPrice, hasPriceDeviatedFromBidOrder = _a.hasPriceDeviatedFromBidOrder, cancelAllTradeOrders = _a.cancelAllTradeOrders, calcSellPrice = _a.calcSellPrice;
var _b = require('./metrics'), calculateMA = _b.calculateMA, recursiveEMAStep = _b.recursiveEMAStep, calculateEMA = _b.calculateEMA;
var config = require('./config');
// const Trade = require('./src/Trade');
var subaccount = 'BOT-1';
var processingInterval = false;
var trade = {};
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
// XXXXXXX
// LINITING
// XXXXXXX
// XXXXXXX
// Typescript
// XXXXXXX
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
    return __awaiter(this, void 0, void 0, function () {
        var historicalData, marketData, data, previousLongEMA, previousShortEMA, currentLongEMA, currentShortEMA;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, api.getHistoricalPrices(marketId, timeframe)];
                case 1:
                    historicalData = _a.sent();
                    return [4 /*yield*/, api.getMarket(marketId)];
                case 2:
                    marketData = _a.sent();
                    data = __spreadArray(__spreadArray([], historicalData.slice(0, historicalData.length - 1)), [{ close: marketData.price }]);
                    previousLongEMA = calculateEMA(historicalData.slice(0, historicalData.length - 1), 21);
                    previousShortEMA = calculateEMA(historicalData.slice(0, historicalData.length - 1), 10);
                    currentLongEMA = calculateEMA(data, 21);
                    currentShortEMA = calculateEMA(data, 10);
                    console.log(Math.sign(previousLongEMA - previousShortEMA), Math.sign(currentLongEMA - currentShortEMA), Math.floor((currentLongEMA - currentShortEMA) * 100000));
                    // console.log(Math.sign(previousLongEMA - previousShortEMA), Math.sign(currentLongEMA - currentShortEMA));
                    if (Math.sign(previousLongEMA - previousShortEMA) !== Math.sign(currentLongEMA - currentShortEMA)) {
                        console.log("CROSSED");
                        if (Math.sign(currentLongEMA - currentShortEMA) === 1) {
                            console.log('GO SHORT');
                            return [2 /*return*/, 'short'];
                        }
                        else {
                            console.log('GO LONG');
                            return [2 /*return*/, 'long'];
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// If can't find stoploss order. Returns undefined.
function getTriggerOrder(subaccount, marketId, orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var triggerOrders;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, api.getTriggerOrderHistory(subaccount, marketId)];
                case 1:
                    triggerOrders = _a.sent();
                    return [2 /*return*/, triggerOrders.find(function (order) { return order.id === orderId; })];
            }
        });
    });
}
function isStoplossTriggered(subaccount, marketId, stoplossOrderId) {
    return __awaiter(this, void 0, void 0, function () {
        var stoplossOrder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getTriggerOrder(subaccount, marketId, stoplossOrderId)];
                case 1:
                    stoplossOrder = _a.sent();
                    return [2 /*return*/, stoplossOrder.status === 'triggered'];
            }
        });
    });
}
function findTradeOpportunity(subaccount) {
    return __awaiter(this, void 0, void 0, function () {
        var marketIds, _i, marketIds_1, marketId, emaCross, marketData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    marketIds = config[subaccount].markets;
                    _i = 0, marketIds_1 = marketIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < marketIds_1.length)) return [3 /*break*/, 5];
                    marketId = marketIds_1[_i];
                    console.log("Checking market " + marketId);
                    return [4 /*yield*/, hasEMACrossedInMarket(marketId, secondsTo(15, 'minutes'))];
                case 2:
                    emaCross = _a.sent();
                    if (!emaCross) return [3 /*break*/, 4];
                    console.log("Found EMA cross '" + emaCross + "' in market " + marketId + ".");
                    return [4 /*yield*/, api.getMarket(marketId)];
                case 3:
                    marketData = _a.sent();
                    // Can't short a spot market.
                    if (emaCross === 'short' && marketData.type === 'spot') {
                        return [2 /*return*/];
                    }
                    return [2 /*return*/, {
                            marketId: marketId,
                            side: emaCross === 'long' ? 'buy' : 'sell',
                            price: marketData.price,
                        }];
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function startNewTrade(subaccount, marketId, side, price) {
    return __awaiter(this, void 0, void 0, function () {
        var openOrders, marketData_1, accountData, balances, usdBalance, volume, order;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, api.getOpenOrders(subaccount)];
                case 1:
                    openOrders = _a.sent();
                    if (!(openOrders.length === 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, api.getMarket(marketId)];
                case 2:
                    marketData_1 = _a.sent();
                    return [4 /*yield*/, api.getAccount(subaccount)];
                case 3:
                    accountData = _a.sent();
                    return [4 /*yield*/, api.getBalances(subaccount)];
                case 4:
                    balances = _a.sent();
                    usdBalance = balances.find(function (balance) { return balance.coin === marketData_1.quoteCurrency; });
                    volume = void 0;
                    if (marketData_1.type === 'spot') {
                        if (!usdBalance) {
                            throw new Error('Missing USD balance when attempting to open a trade.');
                        }
                        volume = Math.floor(usdBalance.free / price);
                    }
                    else if (marketData_1.type === 'future') {
                        volume = Math.floor(accountData.freeCollateral / price);
                    }
                    return [4 /*yield*/, api.placeOrder(subaccount, {
                            "market": marketId,
                            "side": side,
                            "price": price,
                            "type": "limit",
                            "size": volume,
                            "reduceOnly": false,
                            "ioc": false,
                            "postOnly": false,
                            "clientId": null
                        })
                            .catch(function (error) {
                            error.message = "Error placing order. " + error.message;
                            throw error;
                        })];
                case 5:
                    order = _a.sent();
                    console.log("New " + (side === 'buy' ? 'LONG' : 'SHORT') + " trade started for market " + marketId + ".");
                    console.log("Bid size set for " + volume + " at $" + price + ".");
                    // const trade = new Trade();
                    return [2 /*return*/, {
                            orderId: order.id,
                            status: 'pending',
                            positionType: side === 'buy' ? 'long' : 'short',
                            side: side,
                            timeOfOrder: new Date().getTime(),
                            coin: marketData_1.baseCurrency,
                            currency: marketData_1.quoteCurrency,
                            subaccount: subaccount,
                            marketId: marketId,
                            marketType: marketData_1.type,
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function runInterval() {
    return __awaiter(this, void 0, void 0, function () {
        var tradeOpportunity, fillOrder, triggerPrice, stoplossOrder, closeOrder, marketData, openOrder, openStoplossOrder, historicalPrices, marketData, accountData, sellPrice, order, orderHistory, closeOrder, openStoplossOrder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=== Polling FTX | " + new Date().toISOString() + " ===");
                    // If still processing from last interval then don't process this interval.
                    if (processingInterval) {
                        console.log('Skipping interval');
                        return [2 /*return*/];
                    }
                    processingInterval = true;
                    if (!!trade.status) return [3 /*break*/, 4];
                    return [4 /*yield*/, findTradeOpportunity(subaccount)];
                case 1:
                    tradeOpportunity = _a.sent();
                    if (!tradeOpportunity) return [3 /*break*/, 3];
                    console.log(tradeOpportunity);
                    return [4 /*yield*/, startNewTrade(subaccount, tradeOpportunity.marketId, tradeOpportunity.side, tradeOpportunity.price).catch(function (error) { throw error; })];
                case 2:
                    trade = _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 27];
                case 4:
                    if (!(trade.status === 'pending')) return [3 /*break*/, 14];
                    return [4 /*yield*/, api.getOrderStatus(trade.subaccount, trade.orderId)];
                case 5:
                    fillOrder = _a.sent();
                    if (!hasOrderSuccessfullyFilled(fillOrder)) return [3 /*break*/, 10];
                    console.log("Trade order has been filled for market " + trade.marketId + ".");
                    console.log("Filled " + fillOrder.filledSize + " with average fill price of $" + fillOrder.avgFillPrice + ".");
                    triggerPrice = calcStoplossTriggerPrice(fillOrder.avgFillPrice, fillOrder.side, config[subaccount].stoplossDeviation);
                    return [4 /*yield*/, api.placeConditionalOrder(trade.subaccount, {
                            market: trade.marketId,
                            side: fillOrder.side === 'buy' ? 'sell' : 'buy',
                            size: fillOrder.size,
                            type: 'stop',
                            reduceOnly: trade.marketType === 'future' ? true : false,
                            retryUntilFilled: true,
                            triggerPrice: triggerPrice,
                        })];
                case 6:
                    stoplossOrder = _a.sent();
                    console.log("Stoploss order set at " + triggerPrice);
                    if (!!stoplossOrder.id) return [3 /*break*/, 8];
                    console.log('Oh shit cant set stoploss');
                    return [4 /*yield*/, api.placeOrder(trade.subaccount, {
                            market: trade.marketId,
                            side: trade.positionType === 'long' ? 'sell' : 'buy',
                            price: null,
                            type: "market",
                            size: fillOrder.size,
                            reduceOnly: trade.marketType === 'future' ? true : false,
                            ioc: false,
                            postOnly: false,
                            clientId: null
                        })];
                case 7:
                    closeOrder = _a.sent();
                    // If can't set stop loss close trade at market value
                    if (closeOrder.id) {
                        trade.status = "closed";
                    }
                    return [3 /*break*/, 9];
                case 8:
                    trade.status = 'filled';
                    trade.stoplossOrderId = stoplossOrder.id;
                    trade.avgFillPrice = fillOrder.avgFillPrice;
                    trade.size = fillOrder.size;
                    trade.stoplossTriggerPrice = triggerPrice;
                    _a.label = 9;
                case 9: return [3 /*break*/, 13];
                case 10:
                    if (!(fillOrder.status === 'open')) return [3 /*break*/, 13];
                    return [4 /*yield*/, api.getMarket(trade.marketId)];
                case 11:
                    marketData = _a.sent();
                    if (!hasPriceDeviatedFromBidOrder(fillOrder.side, fillOrder.price, marketData.price, config[subaccount].cancelBidDeviation)) return [3 /*break*/, 13];
                    return [4 /*yield*/, api.cancelOrder(trade.subaccount, fillOrder.id)];
                case 12:
                    _a.sent();
                    _a.label = 13;
                case 13: return [3 /*break*/, 27];
                case 14:
                    if (!(trade.status === 'filled')) return [3 /*break*/, 24];
                    return [4 /*yield*/, api.getOrderStatus(trade.subaccount, trade.orderId)];
                case 15:
                    openOrder = _a.sent();
                    return [4 /*yield*/, getTriggerOrder(trade.subaccount, trade.marketId, trade.stoplossOrderId)
                        // Check if its hit stop loss
                    ];
                case 16:
                    openStoplossOrder = _a.sent();
                    if (!(openStoplossOrder.status === 'open')) return [3 /*break*/, 22];
                    return [4 /*yield*/, api.getHistoricalPrices(trade.marketId, secondsTo(15, 'minutes'))];
                case 17:
                    historicalPrices = _a.sent();
                    if (!(trade.timeOfOrder < new Date(historicalPrices[historicalPrices.length - 1].startTime).getTime())) return [3 /*break*/, 21];
                    console.log('Looking for profit');
                    return [4 /*yield*/, api.getMarket(trade.marketId)];
                case 18:
                    marketData = _a.sent();
                    return [4 /*yield*/, api.getAccount(trade.subaccount)];
                case 19:
                    accountData = _a.sent();
                    sellPrice = calcSellPrice(trade.side, trade.avgFillPrice, trade.size, config[trade.subaccount].profitDeviation, accountData.takerFee);
                    console.log('sellPrice', trade.side, trade.avgFillPrice, trade.size, config[trade.subaccount].profitDeviation, accountData.takerFee, sellPrice);
                    console.log(marketData.price > sellPrice, marketData.price < sellPrice);
                    if (!(trade.side === 'buy' ? marketData.price > sellPrice : marketData.price < sellPrice)) return [3 /*break*/, 21];
                    console.log('TAKING PROFIT');
                    return [4 /*yield*/, api.placeOrder(trade.subaccount, {
                            market: trade.marketId,
                            side: trade.positionType === 'long' ? 'sell' : 'buy',
                            price: marketData.price,
                            type: "limit",
                            // Do a search of order histories and locate the buy order!!!!
                            // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!
                            size: openOrder.size,
                            // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!
                            reduceOnly: trade.marketType === 'future' ? true : false,
                            ioc: false,
                            postOnly: false,
                            clientId: null
                        })];
                case 20:
                    order = _a.sent();
                    trade.status = 'closing';
                    trade.closeOrderId = order.id;
                    _a.label = 21;
                case 21: return [3 /*break*/, 23];
                case 22:
                    console.log('HIT STOPLOSS');
                    trade.status = 'closed';
                    _a.label = 23;
                case 23: return [3 /*break*/, 27];
                case 24:
                    if (!(trade.status === 'closing')) return [3 /*break*/, 27];
                    return [4 /*yield*/, api.getOrderHistory(trade.subaccount, trade.marketId)];
                case 25:
                    orderHistory = _a.sent();
                    closeOrder = orderHistory.find(function (order) { return order.id === trade.closeOrderId; });
                    return [4 /*yield*/, getTriggerOrder(trade.subaccount, trade.marketId, trade.stoplossOrderId)
                        // If close order can't be found. Then profit was taken.
                    ];
                case 26:
                    openStoplossOrder = _a.sent();
                    // If close order can't be found. Then profit was taken.
                    if (closeOrder && closeOrder.status === 'closed') {
                        console.log('PROFIT TAKEN - TRADE CLOSED');
                        trade.status = 'closed';
                    }
                    else if (openStoplossOrder.status !== 'open') {
                        // If open stoploss isn't found then stoploss was hit.
                        console.log('HIT STOPLOSS');
                        trade.status = 'closed';
                    }
                    _a.label = 27;
                case 27:
                    if (!(trade.status === 'closed')) return [3 /*break*/, 29];
                    return [4 /*yield*/, cancelAllTradeOrders(trade)];
                case 28:
                    _a.sent();
                    // Reset trade object.
                    trade = {};
                    _a.label = 29;
                case 29:
                    console.log("Trade status: " + trade.status);
                    processingInterval = false;
                    return [2 /*return*/];
            }
        });
    });
}
function runBot() {
    return __awaiter(this, void 0, void 0, function () {
        var pollingInterval;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, runInterval().catch(function (error) {
                        throw error;
                    })];
                case 1:
                    _a.sent();
                    pollingInterval = setInterval(function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, runInterval().catch(function (error) {
                                            clearInterval(pollingInterval);
                                            throw error;
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    }, 15000);
                    return [2 /*return*/];
            }
        });
    });
}
// An emergency cleanup function to attempt to cleanup any active orders.
function criticalErrorCleanup() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, cancelAllTradeOrders(trade)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    return [4 /*yield*/, runBot()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    console.error('===== CRITICAL ERROR =====');
                    console.error(error_1);
                    console.log('Trying to cleanup.');
                    return [4 /*yield*/, criticalErrorCleanup().catch(function (error) {
                            console.log(error);
                            console.log('!!!!!!!!!!!!!!!');
                            console.log('FAILED TO CLEANUP AFTER CRITICAL ERROR');
                            console.log('TRADES MIGHT STILL BE ACTIVE');
                            console.log('!!!!!!!!!!!!!!!');
                        })];
                case 3:
                    _a.sent();
                    console.log('Successfully cleaned up.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
main();
