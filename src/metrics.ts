interface Data {
  close: number;
}

// Calculate Simple Moving Average
export const calculateMA = (data: Data[]): number => {
  const total: number = data.reduce(
    (total: number, item) => total + item.close,
    0,
  );

  return total / data.length;
};

export const recursiveEMAStep = (
  data: Data[],
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
};

// Calculate Exponential Moving Average
export const calculateEMA = (data: Data[], observations: number): number => {
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
};
