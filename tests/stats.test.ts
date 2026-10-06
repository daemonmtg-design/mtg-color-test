import { describe, it, expect } from 'vitest';
import { cronbachAlpha, mean, stdDev, pearsonCorrelation } from '../lib/stats';

describe('Statistics Utilities', () => {
  it('computes mean and standard deviation correctly', () => {
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(mean(data)).toBe(5);
    expect(stdDev(data)).toBeCloseTo(2.138, 3);
  });

  it('computes Pearson correlation correctly', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(x, y)).toBe(1);

    const y2 = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(x, y2)).toBe(-1);

    const x3 = [1, 2, 3, 4, 5];
    const y3 = [1, 1, 1, 1, 1];
    expect(pearsonCorrelation(x3, y3)).toBeNull(); // SD is 0
  });

  it('computes Cronbach\\'s alpha correctly on a known example', () => {
    // Known example: 4 items, 5 respondents
    // Respondent 1: 1, 2, 1, 2
    // Respondent 2: 2, 3, 2, 3
    // Respondent 3: 3, 4, 3, 4
    // Respondent 4: 4, 5, 4, 5
    // Respondent 5: 5, 5, 5, 5
    const matrix = [
      [1, 2, 1, 2],
      [2, 3, 2, 3],
      [3, 4, 3, 4],
      [4, 5, 4, 5],
      [5, 5, 5, 5]
    ];
    const alpha = cronbachAlpha(matrix);
    expect(alpha).toBeGreaterThan(0.9); // High reliability
  });
});
