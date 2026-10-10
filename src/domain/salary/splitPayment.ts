import { round2 } from './money';
import type { PaymentLine } from './types';

export interface SplitPaymentValidation {
  ok: boolean;
  allocated: number;
  remainder: number;
  /** Amount assigned to the single blank "remainder" line, if any. */
  resolvedRemainderAmount?: number;
  error?: string;
}

/**
 * Validates a set of split-payment lines against the net pay for the month.
 * At most one line may be left blank (amount undefined) to absorb the remainder;
 * all provided amounts must sum, together with the resolved remainder, to exactly net pay.
 */
export function validateSplitPayments(lines: PaymentLine[], netPay: number): SplitPaymentValidation {
  const blankLines = lines.filter((l) => l.amount === undefined);
  if (blankLines.length > 1) {
    return {
      ok: false,
      allocated: 0,
      remainder: 0,
      error: 'Only one payment line may be left blank to take the remainder.',
    };
  }

  const allocated = round2(
    lines.filter((l) => l.amount !== undefined).reduce((sum, l) => sum + (l.amount ?? 0), 0),
  );
  const remainder = round2(netPay - allocated);

  if (blankLines.length === 1) {
    if (remainder < 0) {
      return {
        ok: false,
        allocated,
        remainder,
        error: `S$${Math.abs(remainder).toFixed(2)} over-allocated.`,
      };
    }
    return { ok: true, allocated, remainder: 0, resolvedRemainderAmount: remainder };
  }

  if (Math.abs(remainder) > 0.001) {
    return {
      ok: false,
      allocated,
      remainder,
      error:
        remainder > 0
          ? `S$${remainder.toFixed(2)} not allocated.`
          : `S$${Math.abs(remainder).toFixed(2)} over-allocated.`,
    };
  }

  return { ok: true, allocated, remainder: 0 };
}
