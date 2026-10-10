import { eachDateInRange, isDateWithinRange, isSunday } from './calendar';
import type { ApprovedLeavePeriod, LeaveType, UnpaidLeaveTypeSettings } from './types';

function isDateInAnyLeave(date: Date, leaves: ApprovedLeavePeriod[]): boolean {
  return leaves.some((leave) => isDateWithinRange(date, leave.from, leave.to));
}

/** Sundays in the period that fall inside ANY approved leave (regardless of type). */
export function countSundaysDuringLeave(
  periodStart: Date,
  periodEnd: Date,
  approvedLeaves: ApprovedLeavePeriod[],
): number {
  return eachDateInRange(periodStart, periodEnd).filter(
    (date) => isSunday(date) && isDateInAnyLeave(date, approvedLeaves),
  ).length;
}

/** Non-Sunday (Mon-Sat) days in the period inside approved leave of an unpaid-type. */
export function countUnpaidTypeLeaveDays(
  periodStart: Date,
  periodEnd: Date,
  approvedLeaves: ApprovedLeavePeriod[],
  unpaidLeaveTypes: UnpaidLeaveTypeSettings,
): number {
  const unpaidLeaves = approvedLeaves.filter((leave) => unpaidLeaveTypes[leave.type]);
  return eachDateInRange(periodStart, periodEnd).filter(
    (date) => !isSunday(date) && isDateInAnyLeave(date, unpaidLeaves),
  ).length;
}

interface HomeLeaveOverflowOptions {
  /** All approved home-leave periods across the WHOLE contract (any order). */
  allHomeLeavePeriods: ApprovedLeavePeriod[];
  /** Paid home-leave days allowed across the whole contract (default 15). */
  homeLeaveAllowanceDays: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Home-leave days beyond the paid allowance, counted cumulatively oldest-first across
 * the whole contract, restricted to the given month's period and excluding Sundays
 * (Sundays inside leave already earn no rest-day pay via countSundaysDuringLeave, so
 * they are not double-counted here as an additional unpaid deduction).
 */
export function countHomeLeaveOverflowDays(options: HomeLeaveOverflowOptions): number {
  const { allHomeLeavePeriods, homeLeaveAllowanceDays, periodStart, periodEnd } = options;

  const sortedHomeLeaves = [...allHomeLeavePeriods].sort(
    (a, b) => a.from.getTime() - b.from.getTime(),
  );

  let consumed = 0;
  let overflowCount = 0;

  for (const leave of sortedHomeLeaves) {
    const days = eachDateInRange(leave.from, leave.to);
    for (const day of days) {
      consumed++;
      const isOverflow = consumed > homeLeaveAllowanceDays;
      if (isOverflow && !isSunday(day) && isDateWithinRange(day, periodStart, periodEnd)) {
        overflowCount++;
      }
    }
  }

  return overflowCount;
}

export function filterLeavesByType(
  leaves: ApprovedLeavePeriod[],
  type: LeaveType,
): ApprovedLeavePeriod[] {
  return leaves.filter((leave) => leave.type === type);
}
