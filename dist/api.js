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
var axios = require('axios');
var authenticateRestHeaders = require('./authenticate').authenticateRestHeaders;
var createAxiosError = function (axiosError) {
    var error = new Error();
    error.code = axiosError.response.status;
    error.codeText = axiosError.response.statusText;
    error.request = axiosError.response.config;
    error.response = axiosError.response.data;
    error.message = axiosError.response.data.error;
    return error;
};
function makeApiCall(apiCall) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiCall()];
                case 1:
                    response = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.log(error_1);
                    throw createAxiosError(error_1);
                case 3: return [2 /*return*/, response.data.result];
            }
        });
    });
}
// PUBLIC API CALLS
function getHistoricalPrices(marketId, timeframe) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.get(process.env.API_ENDPOINT + "/markets/" + marketId + "/candles", {
                        params: {
                            resolution: timeframe,
                            limit: 100,
                        }
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
function getMarket(marketId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.get(process.env.API_ENDPOINT + "/markets/" + marketId)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
// PRIVATE API CALLS
function getAccount(subaccount) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.get(process.env.API_ENDPOINT + "/account", {
                        headers: authenticateRestHeaders('/account', 'GET', subaccount)
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
function getBalances(subaccount) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.get(process.env.API_ENDPOINT + "/wallet/balances", {
                        headers: authenticateRestHeaders('/wallet/balances', 'GET', subaccount)
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
function getOpenOrders(subaccount) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.get(process.env.API_ENDPOINT + "/orders", {
                        headers: authenticateRestHeaders('/orders', 'GET', subaccount)
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
// Returns all trigger orders which have a status of 'open'.
function getOpenTriggerOrders(subaccount, marketId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.get(process.env.API_ENDPOINT + "/conditional_orders?market=" + marketId, {
                        // params: {
                        //   market: marketId,
                        // },
                        headers: authenticateRestHeaders("/conditional_orders?market=" + marketId, 'GET', subaccount)
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
// https://docs.ftx.com/#get-order-history
function getOrderHistory(subaccount, marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, makeApiCall(function () { return axios.get(process.env.API_ENDPOINT + "/orders/history?market=" + marketId, {
                    headers: authenticateRestHeaders("/orders/history?market=" + marketId, 'GET', subaccount)
                }); })];
        });
    });
}
// https://docs.ftx.com/#get-trigger-order-history
function getTriggerOrderHistory(subaccount, marketId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, makeApiCall(function () { return axios.get(process.env.API_ENDPOINT + "/conditional_orders/history?market=" + marketId, {
                    headers: authenticateRestHeaders("/conditional_orders/history?market=" + marketId, 'GET', subaccount)
                }); })];
        });
    });
}
function getOrderStatus(subaccount, orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.get(process.env.API_ENDPOINT + "/orders/" + orderId, {
                        headers: authenticateRestHeaders("/orders/" + orderId, 'GET', subaccount)
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
function placeOrder(subaccount, payload) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, makeApiCall(function () { return axios.post(process.env.API_ENDPOINT + "/orders", payload, {
                    headers: authenticateRestHeaders('/orders', 'POST', subaccount, payload)
                }); })
                // // console.log('do')
                // let response;
                // try {
                //   response = await axios.post(`${process.env.API_ENDPOINT}/orders`, payload, {
                //     headers: authenticateRestHeaders('/orders', 'POST', subaccount, payload)
                //   });
                // } catch (error) {
                //   throw createAxiosError(error);
                // }
                // return response.data.result;
            ];
        });
    });
}
function placeConditionalOrder(subaccount, payload) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, makeApiCall(function () { return axios.post(process.env.API_ENDPOINT + "/conditional_orders", payload, {
                    headers: authenticateRestHeaders('/conditional_orders', 'POST', subaccount, payload)
                }); })];
        });
    });
}
function cancelOrder(subaccount, orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.delete(process.env.API_ENDPOINT + "/orders/" + orderId, {
                        headers: authenticateRestHeaders("/orders/" + orderId, 'DELETE', subaccount)
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data.result];
            }
        });
    });
}
function cancelOpenTriggerOrder(subaccount, orderId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, makeApiCall(function () { return axios.delete(process.env.API_ENDPOINT + "/conditional_orders/" + orderId, {
                    headers: authenticateRestHeaders("/conditional_orders/" + orderId, 'DELETE', subaccount)
                }); })];
        });
    });
}
module.exports = { getHistoricalPrices: getHistoricalPrices, getMarket: getMarket, getAccount: getAccount, getBalances: getBalances, getOpenOrders: getOpenOrders, getTriggerOrderHistory: getTriggerOrderHistory, getOpenTriggerOrders: getOpenTriggerOrders, getOrderHistory: getOrderHistory, getOrderStatus: getOrderStatus, placeOrder: placeOrder, placeConditionalOrder: placeConditionalOrder, cancelOrder: cancelOrder, cancelOpenTriggerOrder: cancelOpenTriggerOrder };
