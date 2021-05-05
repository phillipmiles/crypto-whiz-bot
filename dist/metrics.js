// Calculate Simple Moving Average
function calculateMA(data) {
    var total = data.reduce(function (total, item) { return total + item.close; }, 0);
    return total / data.length;
}
function recursiveEMAStep(data, previousMA, smoothing, step) {
    // console.log('step', step, data.length);
    if (step < data.length) {
        var ema = (data[step].close * smoothing) + (previousMA * (1 - smoothing));
        return recursiveEMAStep(data, ema, smoothing, step + 1);
    }
    return previousMA;
}
// Calculate Exponential Moving Average
function calculateEMA(data, observations) {
    // Smoothing / Weighting
    var smoothing = 2 / (observations + 1);
    var initMA = calculateMA(data.slice(data.length - (observations * 2), data.length - observations));
    return recursiveEMAStep(data.slice(data.length - observations), initMA, smoothing, 0);
}
module.exports = { calculateMA: calculateMA, recursiveEMAStep: recursiveEMAStep, calculateEMA: calculateEMA };
