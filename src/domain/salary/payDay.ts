import { addMonths } from 'date-fns';
import { nthWorkingDayOfMonth } from './calendar';
import type { Holiday } from './types';

export type MonthPaidStatus = 'paid' | 'due' | 'overdue' | 'upcoming';

/** Pay day = the Nth working day of the month AFTER the salary month. */
export function computePayDay(salaryMonthAnchor: Date, payDayWorkingDayN: number, holidays: Holiday[]): Date {
  const followingMonth = addMonths(salaryMonthAnchor, 1);
  return nthWorkingDayOfMonth(followingMonth, payDayWorkingDayN, holidays);
}

/**
 * Paid / Due / Overdue / Upcoming, per the spec's status rules:
 * - Upcoming: the salary month itself hasn't ended yet.
 * - Due: the month has ended and today is on/before the pay day.
 * - Overdue: today is after the pay day and still not marked paid.
 */
export function computeMonthPaidStatus(
  monthPeriodEnd: Date,
  payDay: Date,
  today: Date,
  isPaid: boolean,
): MonthPaidStatus {
  if (isPaid) return 'paid';
  if (today.getTime() < monthPeriodEnd.getTime()) return 'upcoming';
  if (today.getTime() <= payDay.getTime()) return 'due';
  return 'overdue';
}
