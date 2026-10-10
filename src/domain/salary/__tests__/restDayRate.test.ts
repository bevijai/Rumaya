import { describe, expect, it } from 'vitest';
import { computeRestDayRate, RestDayRateBelowMinimumError, restDayRateMinimum } from '../restDayRate';

describe('restDayRate rounding', () => {
  it('rounds basic 700 up to S$27.00 (700/26 = 26.92)', () => {
    expect(computeRestDayRate(700)).toBe(27);
  });

  it('rounds up to nearest 0.50 even when already just above a step', () => {
    // 780/26 = 30.0 exactly -> stays 30.00, no rounding needed
    expect(computeRestDayRate(780)).toBe(30);
  });

  it('rounds a value just over a 0.50 step up to the next step', () => {
    // 690/26 = 26.5384... -> rounds up to 27.00
    expect(computeRestDayRate(690)).toBeCloseTo(27, 5);
  });

  it('accepts an override at or above the MOM minimum', () => {
    const minimum = restDayRateMinimum(700); // 26.9230...
    expect(computeRestDayRate(700, 27)).toBe(27);
    // Override is stored to cents precision (2dp), not the raw fractional minimum.
    expect(computeRestDayRate(700, minimum)).toBe(26.92);
  });

  it('rejects an override below the MOM minimum (basic / 26)', () => {
    expect(() => computeRestDayRate(700, 20)).toThrow(RestDayRateBelowMinimumError);
  });
});
