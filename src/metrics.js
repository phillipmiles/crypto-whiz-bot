// Calculate Simple Moving Average
function calculateMA(data) {
  const total = data.reduce((total, item) => total + item.close, 0);

  return total / data.length;
}

function recursiveEMAStep(data, previousMA, smoothing, step) {
  // console.log('step', step, data.length);

  if (step < data.length) {
    const ema = (data[step].close * smoothing) + (previousMA * (1 - smoothing));
    return recursiveEMAStep(data, ema, smoothing, step + 1);
  }
  return previousMA;

}

// Calculate Exponential Moving Average
function calculateEMA(data, observations) {
  // Smoothing / Weighting
  const smoothing = 2 / (observations + 1);
  const initMA = calculateMA(data.slice(data.length - (observations * 2), data.length - observations));

  return recursiveEMAStep(data.slice(data.length - observations), initMA, smoothing, 0);

}

module.exports = { calculateMA, recursiveEMAStep, calculateEMA }