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
const order_1 = require("../../order");
const api_1 = __importDefault(require("../../api"));
// Percentage change that market price can move away from ther bid price before cancelling order.
const CANCEL_BID_DEFINITION = 0.75;
// Percentage change from fill price that a stoploss will be set.
const STOPLOSS_DEVIATION = 1.5;
// Percentage change from breakeven price required to trigger sell order.
const PROFIT_DEVIATION = 0.2;
// If can't find stoploss order. Returns undefined.
const getTriggerOrder = (subaccount, marketId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const triggerOrders = yield api_1.default.getTriggerOrderHistory(subaccount, marketId);
    return triggerOrders.find((order) => order.id === orderId);
});
const mange = (trade) => __awaiter(void 0, void 0, void 0, function* () {
    if (trade && trade.status === 'pending' && trade.orderId) {
        const fillOrder = yield api_1.default.getOrderStatus(trade.subaccount, trade.orderId);
        // XXXX  looks like hasOrderSuccessfullyFilled(fillOrder) return true after an
        // order was cancelled due to market price deviating away from bid.
        // placeConditionalOrder return error 'Negative trigger price'
        // Check to see if trade has been filled.
        console.log(fillOrder, order_1.hasOrderSuccessfullyFilled(fillOrder));
        if (order_1.hasOrderSuccessfullyFilled(fillOrder)) {
            console.log(`Trade order has been filled for market ${trade.marketId}.`);
            console.log(`Filled ${fillOrder.filledSize} with average fill price of $${fillOrder.avgFillPrice}.`);
            // Set stoploss
            const triggerPrice = order_1.calcStoplossTriggerPrice(fillOrder.avgFillPrice, fillOrder.side, STOPLOSS_DEVIATION);
            const stoplossOrder = yield api_1.default.placeConditionalOrder(trade.subaccount, {
                market: trade.marketId,
                side: fillOrder.side === 'buy' ? 'sell' : 'buy',
                size: fillOrder.size,
                type: 'stop',
                reduceOnly: trade.marketType === 'future' ? true : false,
                retryUntilFilled: true,
                triggerPrice: triggerPrice,
            });
            console.log(`Stoploss order set at ${triggerPrice}`);
            // XXXX THIS EMERGENCY CHECK PROBABLY DOESN'T WORK -> IF API ERRORS OUT
            // IT'LL STILL RETURN SOMETHING THAT MIGHT RESULT IN UNEXPECTED CONCEQUENCES.
            // If can't set stop loss close trade at market value. Need to wrap above in
            // try catch and react to that with this.
            if (!stoplossOrder.id) {
                console.log('Oh shit cant set stoploss');
                const closeOrder = yield api_1.default.placeOrder(trade.subaccount, {
                    market: trade.marketId,
                    side: trade.positionType === 'long' ? 'sell' : 'buy',
                    price: null,
                    type: 'market',
                    size: fillOrder.size,
                    reduceOnly: trade.marketType === 'future' ? true : false,
                    ioc: false,
                    postOnly: false,
                    clientId: null,
                });
                // If can't set stop loss close trade at market value
                if (closeOrder.id) {
                    trade.status = 'closed';
                }
            }
            else {
                trade.status = 'filled';
                trade.stoplossOrderId = stoplossOrder.id;
                trade.avgFillPrice = fillOrder.avgFillPrice;
                trade.size = fillOrder.size;
                trade.stoplossTriggerPrice = triggerPrice;
            }
        }
        else if (fillOrder.status === 'open' && trade.marketId) {
            // Cancel open order if market moves away from the buy order too much.
            const marketData = yield api_1.default.getMarket(trade.marketId);
            if (order_1.hasPriceDeviatedFromBidOrder(fillOrder.side, fillOrder.price, marketData.price, CANCEL_BID_DEFINITION)) {
                yield api_1.default.cancelOrder(trade.subaccount, fillOrder.id);
                trade.status = 'closed';
            }
        }
    }
    else if (trade.status === 'filled') {
        // Require typescript aborter
        if (!trade.stoplossOrderId ||
            !trade.orderId ||
            !trade.timeOfOrder ||
            !trade.avgFillPrice ||
            !trade.size) {
            throw new Error('Something went wrong. Missing required trade data.');
        }
        const openOrder = yield api_1.default.getOrderStatus(trade.subaccount, trade.orderId);
        const openStoplossOrder = yield getTriggerOrder(trade.subaccount, trade.marketId, trade.stoplossOrderId);
        // Check if its hit stop loss
        if (openStoplossOrder && openStoplossOrder.status === 'open') {
            const historicalPrices = yield api_1.default.getHistoricalPrices(trade.marketId, time_1.secondsTo(15, 'minutes'));
            // XXXX!!!!! if(hasNewCandleStarted) {}
            if (trade.timeOfOrder <
                new Date(historicalPrices[historicalPrices.length - 1].startTime).getTime()) {
                console.log('Looking for profit');
                const marketData = yield api_1.default.getMarket(trade.marketId);
                const accountData = yield api_1.default.getAccount(trade.subaccount);
                const sellPrice = order_1.calcSellPrice(trade.side, trade.avgFillPrice, trade.size, PROFIT_DEVIATION, accountData.takerFee);
                console.log('sellPrice', trade.side, trade.avgFillPrice, trade.size, PROFIT_DEVIATION, accountData.takerFee, sellPrice);
                console.log(marketData.price > sellPrice, marketData.price < sellPrice);
                if (trade.side === 'buy'
                    ? marketData.price > sellPrice
                    : marketData.price < sellPrice) {
                    console.log('TAKING PROFIT');
                    const order = yield api_1.default.placeOrder(trade.subaccount, {
                        market: trade.marketId,
                        side: trade.positionType === 'long' ? 'sell' : 'buy',
                        price: marketData.price,
                        type: 'limit',
                        // Do a search of order histories and locate the buy order!!!!
                        // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!
                        size: openOrder.size,
                        // XXX ARE WE MISSING THIS PARMAETER!!!?!?!?!?!
                        reduceOnly: trade.marketType === 'future' ? true : false,
                        ioc: false,
                        postOnly: false,
                        clientId: null,
                    });
                    trade.status = 'closing';
                    trade.closeOrderId = order.id;
                }
            }
        }
        else {
            console.log('HIT STOPLOSS');
            trade.status = 'closed';
        }
    }
    else if (trade.status === 'closing') {
        if (!trade || !trade.closeOrderId || !trade.stoplossOrderId) {
            throw new Error('Something went wrong. Missing required trade data.');
        }
        const orderHistory = yield api_1.default.getOrderHistory(trade.subaccount, trade.marketId);
        const closeOrder = orderHistory.find((order) => {
            if (trade) {
                return order.id === trade.closeOrderId;
            }
            else {
                return false;
            }
        });
        const openStoplossOrder = yield getTriggerOrder(trade.subaccount, trade.marketId, trade.stoplossOrderId);
        // If close order can't be found. Then profit was taken.
        if (closeOrder && closeOrder.status === 'closed') {
            console.log('PROFIT TAKEN - TRADE CLOSED');
            trade.status = 'closed';
        }
        else if (openStoplossOrder && openStoplossOrder.status !== 'open') {
            // If open stoploss isn't found then stoploss was hit.
            console.log('HIT STOPLOSS');
            trade.status = 'closed';
        }
    }
    // Cancel remaining trade orders and reset trade object.
    if (trade && trade.status === 'closed') {
        yield order_1.cancelAllTradeOrders(trade);
        // Reset trade object.
    }
    console.log(`Trade status: ${trade ? trade.status : 'unknown'}`);
    return trade;
});
exports.default = mange;
