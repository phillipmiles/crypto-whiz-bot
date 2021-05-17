import { percentageChange, hasValueChangedByPercentage } from './math';

describe('Math Util - percentageChange', () => {
  test('Percentage change 100%', async () => {
    const percentage = percentageChange(1, 2);
    expect(percentage).toBe(1);
  });
  test('Percentage change -50%', async () => {
    const percentage = percentageChange(2, 1);
    expect(percentage).toBe(-0.5);
  });
  test('Percentage change 1', async () => {
    const percentage = percentageChange(56000, 41000);
    expect(percentage).toBe(-0.26785714285714285);
  });
  test('Percentage change 3', async () => {
    const percentage = percentageChange(41000, 56000);
    expect(percentage).toBe(0.36585365853658536);
  });
  test('Percentage change 4', async () => {
    const percentage = percentageChange(41000, 26000);
    expect(percentage).toBe(-0.36585365853658536);
  });
});

describe('Math Util - hasValueChangedByPercentage', () => {
  test('Value changed by percentage high false', async () => {
    const percentage = hasValueChangedByPercentage(40000, 70000, 0.75);
    expect(percentage).toBe(false);
  });
  test('Value changed by percentage high true', async () => {
    const percentage = hasValueChangedByPercentage(40000, 70001, 0.75);
    expect(percentage).toBe(true);
  });
  test('Value changed by percentage low false', async () => {
    const percentage = hasValueChangedByPercentage(40000, 10000, 0.75);
    expect(percentage).toBe(false);
  });
  test('Value changed by percentage low true', async () => {
    const percentage = hasValueChangedByPercentage(40000, 9999, 0.75);
    expect(percentage).toBe(true);
  });
});
