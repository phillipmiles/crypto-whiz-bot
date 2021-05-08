"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.percentageChange = void 0;
const percentageChange = (value1, value2) => {
    return ((value2 - value1) / value1) * 100;
};
exports.percentageChange = percentageChange;
exports.default = { percentageChange: exports.percentageChange };
