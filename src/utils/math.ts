export const percentageChange = (value1: number, value2: number): number => {
  return ((value2 - value1) / value1) * 100;
};

export default { percentageChange };
