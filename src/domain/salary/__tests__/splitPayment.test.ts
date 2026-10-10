import { describe, expect, it } from 'vitest';
import { validateSplitPayments } from '../splitPayment';
import type { PaymentLine } from '../types';

describe('validateSplitPayments', () => {
  it('accepts fully-specified lines that add up exactly', () => {
    const lines: PaymentLine[] = [
      { method: 'cash', amount: 200 },
      { method: 'bank', amount: 527 },
    ];
    const result = validateSplitPayments(lines, 727);
    expect(result.ok).toBe(true);
    expect(result.remainder).toBe(0);
  });

  it('resolves a single blank line to the remainder', () => {
    const lines: PaymentLine[] = [
      { method: 'cash', amount: 200 },
      { method: 'bank' }, // blank -> takes the remainder
    ];
    const result = validateSplitPayments(lines, 727);
    expect(result.ok).toBe(true);
    expect(result.resolvedRemainderAmount).toBe(527);
  });

  it('flags under-allocation with the missing amount', () => {
    const lines: PaymentLine[] = [{ method: 'cash', amount: 200 }];
    const result = validateSplitPayments(lines, 727);
    expect(result.ok).toBe(false);
    expect(result.remainder).toBe(527);
  });

  it('flags over-allocation', () => {
    const lines: PaymentLine[] = [
      { method: 'cash', amount: 500 },
      { method: 'bank', amount: 300 },
    ];
    const result = validateSplitPayments(lines, 727);
    expect(result.ok).toBe(false);
  });

  it('rejects more than one blank line', () => {
    const lines: PaymentLine[] = [{ method: 'cash' }, { method: 'bank' }];
    const result = validateSplitPayments(lines, 727);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/only one/i);
  });
});
