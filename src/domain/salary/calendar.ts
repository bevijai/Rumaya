import {
  eachDayOfInterval,
  getDay,
  isWithinInterval,
  format,
  getDaysInMonth,
  differenceInCalendarDays,
  addDays,
  startOfMonth,
} from 'date-fns';
import type { Holiday } from './types';

/** date-fns getDay(): 0 = Sunday. */
export function isSunday(date: Date): boolean {
  return getDay(date) === 0;
}

export function isWeekendDay(date: Date): boolean {
  const day = getDay(date);
  return day === 0 || day === 6;
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function eachDateInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function countSundaysInRange(start: Date, end: Date): number {
  return eachDateInRange(start, end).filter(isSunday).length;
}

/** Inclusive day count between two dates. */
export function daysInPeriod(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start) + 1;
}

export function daysInMonth(anyDateInMonth: Date): number {
  return getDaysInMonth(anyDateInMonth);
}

export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const iso = toIsoDate(date);
  return holidays.some((h) => h.date === iso);
}

/** Mon-Fri, and not in the given public holiday list. */
export function isWorkingDay(date: Date, holidays: Holiday[]): boolean {
  return !isWeekendDay(date) && !isHoliday(date, holidays);
}

/**
 * The Nth working day (Mon-Fri excluding holidays) of the month containing `monthAnchor`.
 * N is 1-based (N=1 is the first working day of that month).
 */
export function nthWorkingDayOfMonth(monthAnchor: Date, n: number, holidays: Holiday[]): Date {
  if (n < 1) throw new Error('n must be >= 1');
  let cursor = startOfMonth(monthAnchor);
  let count = 0;
  // A month has at most 31 days; bound the loop generously to avoid infinite loops.
  for (let i = 0; i < 62; i++) {
    if (isWorkingDay(cursor, holidays)) {
      count++;
      if (count === n) return cursor;
    }
    cursor = addDays(cursor, 1);
  }
  throw new Error('Could not find nth working day within the month');
}

export function isDateWithinRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end });
}
