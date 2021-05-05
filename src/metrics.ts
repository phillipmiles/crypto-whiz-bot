// Calculate Simple Moving Average
export const calculateMA = (data: Array<unknown>) => {
  const total = data.reduce(
    (total: number, item: <unknown>) => total + item.close,
    0,
  );

  return total / data.length;
}

export const recursiveEMAStep = (
  data,
  previousMA: number,
  smoothing: number,
  step: number,
): number => {
  // console.log('step', step, data.length);

  if (step < data.length) {
    const ema = data[step].close * smoothing + previousMA * (1 - smoothing);
    return recursiveEMAStep(data, ema, smoothing, step + 1);
  }
  return previousMA;
}

// Calculate Exponential Moving Average
export const calculateEMA = (data, observations: number): number => {
  // Smoothing / Weighting
  const smoothing = 2 / (observations + 1);
  const initMA = calculateMA(
    data.slice(data.length - observations * 2, data.length - observations),
  );

  return recursiveEMAStep(
    data.slice(data.length - observations),
    initMA,
    smoothing,
    0,
  );
}

