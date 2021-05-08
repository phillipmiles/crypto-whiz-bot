"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const manage_1 = __importDefault(require("./manage"));
const evaluateMarket_1 = __importDefault(require("./evaluateMarket"));
const config_1 = __importDefault(require("./config"));
const bot = Object.assign(Object.assign({}, config_1.default), { evaluateMarket: evaluateMarket_1.default, manage: manage_1.default });
exports.default = bot;
