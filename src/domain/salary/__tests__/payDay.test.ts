import { describe, expect, it } from 'vitest';
import { computeMonthPaidStatus, computePayDay } from '../payDay';
import type { Holiday } from '../types';

describe('computePayDay (Nth working day of the following month)', () => {
  it('finds the 2nd working day of October 2026 with no holidays', () => {
    // Sep 2026 salary month -> pay day is in October 2026.
    // Oct 1, 2026 is a Thursday, Oct 2 a Friday -> 2nd working day = Oct 2.
    const payDay = computePayDay(new Date(2026, 8, 1), 2, []);
    expect(payDay.getFullYear()).toBe(2026);
    expect(payDay.getMonth()).toBe(9); // October (0-indexed)
    expect(payDay.getDate()).toBe(2);
  });

  it('skips a public holiday when finding the Nth working day', () => {
    const holidays: Holiday[] = [{ date: '2026-10-01', name: 'Test Holiday' }];
    // With Oct 1 excluded: 1st working day = Oct 2, 2nd = Oct 5 (Mon, since Oct 3-4 is a weekend).
    const payDay = computePayDay(new Date(2026, 8, 1), 2, holidays);
    expect(payDay.getMonth()).toBe(9);
    expect(payDay.getDate()).toBe(5);
  });
});

describe('computeMonthPaidStatus', () => {
  const monthPeriodEnd = new Date(2026, 8, 30);
  const payDay = new Date(2026, 9, 2);

  it('is "paid" once marked paid, regardless of dates', () => {
    expect(computeMonthPaidStatus(monthPeriodEnd, payDay, new Date(2026, 9, 10), true)).toBe('paid');
  });

  it('is "upcoming" while the salary month has not ended', () => {
    expect(computeMonthPaidStatus(monthPeriodEnd, payDay, new Date(2026, 8, 15), false)).toBe('upcoming');
  });

  it('is "due" after month end but on/before pay day', () => {
    expect(computeMonthPaidStatus(monthPeriodEnd, payDay, new Date(2026, 9, 1), false)).toBe('due');
  });

  it('is "overdue" after pay day if still unpaid', () => {
    expect(computeMonthPaidStatus(monthPeriodEnd, payDay, new Date(2026, 9, 3), false)).toBe('overdue');
  });
});
