// Cents-safe money helpers. All amounts are S$ with 2 decimals.

/** Round a number to 2 decimal places using standard half-up rounding, cents-safe. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Round up to the nearest 0.50 (used for the default rest-day rate). */
export function roundUpToHalfDollar(value: number): number {
  return Math.ceil(value / 0.5 - 1e-9) * 0.5;
}
