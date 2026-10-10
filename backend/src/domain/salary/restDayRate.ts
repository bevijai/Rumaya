import { roundUpToHalfDollar, round2 } from './money';

export class RestDayRateBelowMinimumError extends Error {
  constructor(override_: number, minimum: number) {
    super(
      `Rest-day rate override (S$${override_.toFixed(2)}) is below the MOM minimum of S$${minimum.toFixed(2)} (basic ÷ 26).`,
    );
    this.name = 'RestDayRateBelowMinimumError';
  }
}

/** MOM minimum rest-day rate: basic ÷ 26, not rounded. */
export function restDayRateMinimum(basicSalary: number): number {
  return basicSalary / 26;
}

/**
 * Default rest-day rate: basic ÷ 26, rounded UP to the nearest S$0.50.
 * An owner override is allowed but must never fall below the MOM minimum.
 */
export function computeRestDayRate(basicSalary: number, override?: number): number {
  const minimum = restDayRateMinimum(basicSalary);
  if (override !== undefined) {
    if (override < minimum - 1e-9) {
      throw new RestDayRateBelowMinimumError(override, minimum);
    }
    return round2(override);
  }
  return roundUpToHalfDollar(minimum);
}
