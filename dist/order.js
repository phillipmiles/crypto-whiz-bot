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
var api = require('./api');
var percentageChange = require('./utils/math').percentageChange;
function calcBreakeven(side, price, volume, fee) {
    var value = price * volume;
    var cost = value * fee * 2;
    return side === 'buy' ? (value + cost) / volume : (value - cost) / volume;
}
function calcSellPrice(side, fillPrice, size, requiredProfitPercentage, fees) {
    var breakeven = calcBreakeven(side, fillPrice, size, fees);
    var requiredProfit = breakeven * (requiredProfitPercentage / 100);
    return side === 'buy' ? breakeven + requiredProfit : breakeven - requiredProfit;
}
function calcStoplossTriggerPrice(fillPrice, side, deviationPercentage) {
    var stoplossPercentage = fillPrice * (deviationPercentage / 100);
    return side === 'buy' ? fillPrice - stoplossPercentage : fillPrice + stoplossPercentage;
}
// Order must be of type Order as recieved from FTX api.
function hasOrderSuccessfullyFilled(order) {
    return order.status === 'closed' && order.size === order.filledSize;
    // return order.status === 'closed' && order.remainingSize === 0;
}
function hasPriceDeviatedFromBidOrder(side, bidPrice, marketPrice, allowedDeviationPercentage) {
    var percentageChangeFromBidPrice = percentageChange(bidPrice, marketPrice);
    // If shorting, inverse percentage change to make comparison easier.
    var normalisedChangeFromBidPrice = side === 'buy' ? percentageChangeFromBidPrice : percentageChangeFromBidPrice * -1;
    return normalisedChangeFromBidPrice > allowedDeviationPercentage;
}
// Cancel orders left on a trade.
function cancelAllTradeOrders(trade) {
    return __awaiter(this, void 0, void 0, function () {
        var orderHistory, triggerOrderHistory, order, order, order;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, api.getOrderHistory(trade.subaccount, trade.marketId)];
                case 1:
                    orderHistory = _a.sent();
                    return [4 /*yield*/, api.getTriggerOrderHistory(trade.subaccount, trade.marketId)];
                case 2:
                    triggerOrderHistory = _a.sent();
                    if (!trade.orderId) return [3 /*break*/, 4];
                    order = orderHistory.find(function (order) { return order.id === trade.orderId; });
                    if (!(order.status === 'new' || order.status === 'open')) return [3 /*break*/, 4];
                    return [4 /*yield*/, api.cancelOrder(order.id)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    if (!trade.stoplossOrderId) return [3 /*break*/, 6];
                    order = triggerOrderHistory.find(function (order) { return order.id === trade.stoplossOrderId; });
                    if (!(order.status === 'open')) return [3 /*break*/, 6];
                    return [4 /*yield*/, api.cancelOpenTriggerOrder(trade.subaccount, order.id)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    if (!trade.closeOrderId) return [3 /*break*/, 8];
                    order = orderHistory.find(function (order) { return order.id === trade.closeOrderId; });
                    if (!(order.status === 'new' || order.status === 'open')) return [3 /*break*/, 8];
                    return [4 /*yield*/, api.cancelOrder(trade.subaccount, order.id)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
module.exports = { calcSellPrice: calcSellPrice, calcBreakeven: calcBreakeven, calcStoplossTriggerPrice: calcStoplossTriggerPrice, hasOrderSuccessfullyFilled: hasOrderSuccessfullyFilled, hasPriceDeviatedFromBidOrder: hasPriceDeviatedFromBidOrder, cancelAllTradeOrders: cancelAllTradeOrders };
