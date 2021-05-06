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
exports.cancelAllTradeOrders = exports.hasPriceDeviatedFromBidOrder = exports.hasOrderSuccessfullyFilled = exports.calcStoplossTriggerPrice = exports.calcSellPrice = exports.calcBreakeven = void 0;
const api_1 = __importDefault(require("./api"));
const math_1 = require("./utils/math");
const calcBreakeven = (side, price, volume, fee) => {
    const value = price * volume;
    const cost = value * fee * 2;
    return side === 'buy' ? (value + cost) / volume : (value - cost) / volume;
};
exports.calcBreakeven = calcBreakeven;
const calcSellPrice = (side, fillPrice, size, requiredProfitPercentage, fees) => {
    const breakeven = exports.calcBreakeven(side, fillPrice, size, fees);
    const requiredProfit = breakeven * (requiredProfitPercentage / 100);
    return side === 'buy'
        ? breakeven + requiredProfit
        : breakeven - requiredProfit;
};
exports.calcSellPrice = calcSellPrice;
const calcStoplossTriggerPrice = (fillPrice, side, deviationPercentage) => {
    const stoplossPercentage = fillPrice * (deviationPercentage / 100);
    return side === 'buy'
        ? fillPrice - stoplossPercentage
        : fillPrice + stoplossPercentage;
};
exports.calcStoplossTriggerPrice = calcStoplossTriggerPrice;
// Order must be of type Order as recieved from FTX api.
const hasOrderSuccessfullyFilled = (order) => {
    return order.status === 'closed' && order.size === order.filledSize;
    // return order.status === 'closed' && order.remainingSize === 0;
};
exports.hasOrderSuccessfullyFilled = hasOrderSuccessfullyFilled;
const hasPriceDeviatedFromBidOrder = (side, bidPrice, marketPrice, allowedDeviationPercentage) => {
    const percentageChangeFromBidPrice = math_1.percentageChange(bidPrice, marketPrice);
    // If shorting, inverse percentage change to make comparison easier.
    const normalisedChangeFromBidPrice = side === 'buy'
        ? percentageChangeFromBidPrice
        : percentageChangeFromBidPrice * -1;
    return normalisedChangeFromBidPrice > allowedDeviationPercentage;
};
exports.hasPriceDeviatedFromBidOrder = hasPriceDeviatedFromBidOrder;
// Cancel orders left on a trade.
const cancelAllTradeOrders = (trade) => __awaiter(void 0, void 0, void 0, function* () {
    const orderHistory = yield api_1.default.getOrderHistory(trade.subaccount, trade.marketId);
    const triggerOrderHistory = yield api_1.default.getTriggerOrderHistory(trade.subaccount, trade.marketId);
    if (trade.orderId) {
        const order = orderHistory.find((order) => order.id === trade.orderId);
        if (order && (order.status === 'new' || order.status === 'open')) {
            yield api_1.default.cancelOrder(trade.subaccount, order.id);
        }
    }
    if (trade.stoplossOrderId) {
        const order = triggerOrderHistory.find((order) => order.id === trade.stoplossOrderId);
        if (order && order.status === 'open') {
            yield api_1.default.cancelOpenTriggerOrder(trade.subaccount, order.id);
        }
    }
    if (trade.closeOrderId) {
        const order = orderHistory.find((order) => order.id === trade.closeOrderId);
        if (order && (order.status === 'new' || order.status === 'open')) {
            yield api_1.default.cancelOrder(trade.subaccount, order.id);
        }
    }
});
exports.cancelAllTradeOrders = cancelAllTradeOrders;
