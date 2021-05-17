export const percentageChange = (value1: number, value2: number): number => {
  return (value2 - value1) / value1;
};

export const hasValueChangedByPercentage = (
  value1: number,
  value2: number,
  comparePercentage: number, // Number between 0 and 1
): boolean => {
  const percentageChangeInValue = percentageChange(value1, value2);

  return Math.abs(percentageChangeInValue) > comparePercentage;
};

export default { percentageChange, hasValueChangedByPercentage };
