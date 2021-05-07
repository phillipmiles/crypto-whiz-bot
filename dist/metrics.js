"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEMA = exports.recursiveEMAStep = exports.calculateMA = void 0;
// Calculate Simple Moving Average
const calculateMA = (data) => {
    const total = data.reduce((total, item) => total + item.close, 0);
    return total / data.length;
};
exports.calculateMA = calculateMA;
const recursiveEMAStep = (data, previousMA, smoothing, step) => {
    if (step < data.length) {
        const ema = data[step].close * smoothing + previousMA * (1 - smoothing);
        return exports.recursiveEMAStep(data, ema, smoothing, step + 1);
    }
    return previousMA;
};
exports.recursiveEMAStep = recursiveEMAStep;
// Calculate Exponential Moving Average
const calculateEMA = (data, observations) => {
    // Smoothing / Weighting
    const smoothing = 2 / (observations + 1);
    const initMA = exports.calculateMA(data.slice(data.length - observations * 2, data.length - observations));
    return exports.recursiveEMAStep(data.slice(data.length - observations), initMA, smoothing, 0);
};
exports.calculateEMA = calculateEMA;
