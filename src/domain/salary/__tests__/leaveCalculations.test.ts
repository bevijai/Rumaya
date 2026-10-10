import { describe, expect, it } from 'vitest';
import { countHomeLeaveOverflowDays, countSundaysDuringLeave, countUnpaidTypeLeaveDays } from '../leaveCalculations';
import { DEFAULT_UNPAID_LEAVE_TYPES, type ApprovedLeavePeriod } from '../types';

describe('countSundaysDuringLeave', () => {
  it('counts Sundays inside an approved leave range (Sep 2026 worked example)', () => {
    const periodStart = new Date(2026, 8, 1);
    const periodEnd = new Date(2026, 8, 30);
    const leaves: ApprovedLeavePeriod[] = [
      { id: 'l1', type: 'home', from: new Date(2026, 8, 12), to: new Date(2026, 8, 21) },
    ];
    expect(countSundaysDuringLeave(periodStart, periodEnd, leaves)).toBe(2); // Sep 13 & Sep 20
  });
});

describe('countUnpaidTypeLeaveDays', () => {
  it('does not count leave types that are marked paid (sick, by default)', () => {
    const leaves: ApprovedLeavePeriod[] = [
      { id: 'l1', type: 'sick', from: new Date(2026, 8, 8), to: new Date(2026, 8, 10) },
    ];
    expect(
      countUnpaidTypeLeaveDays(
        new Date(2026, 8, 1),
        new Date(2026, 8, 30),
        leaves,
        DEFAULT_UNPAID_LEAVE_TYPES,
      ),
    ).toBe(0);
  });

  it('counts non-Sunday days of an unpaid-type leave (extra day off, default unpaid)', () => {
    // Tue 8 - Thu 10 Sep 2026: 3 weekdays, no Sunday involved.
    const leaves: ApprovedLeavePeriod[] = [
      { id: 'l1', type: 'extra_day_off', from: new Date(2026, 8, 8), to: new Date(2026, 8, 10) },
    ];
    expect(
      countUnpaidTypeLeaveDays(
        new Date(2026, 8, 1),
        new Date(2026, 8, 30),
        leaves,
        DEFAULT_UNPAID_LEAVE_TYPES,
      ),
    ).toBe(3);
  });
});

describe('countHomeLeaveOverflowDays (15-day cap across months)', () => {
  it('carries cumulative consumption from an earlier month into the next month', () => {
    // Earlier home leave: Oct 5 - Oct 14 2026 (10 days) -> consumes allowance idx 1-10.
    // Later home leave: Nov 2 - Nov 21 2026 (20 days) -> idx 11-30, overflow starts at idx 16.
    const allHomeLeavePeriods: ApprovedLeavePeriod[] = [
      { id: 'oct', type: 'home', from: new Date(2026, 9, 5), to: new Date(2026, 9, 14) },
      { id: 'nov', type: 'home', from: new Date(2026, 10, 2), to: new Date(2026, 10, 21) },
    ];

    // October period: nothing overflows yet (only 10 of 15 allowance days consumed).
    const octOverflow = countHomeLeaveOverflowDays({
      allHomeLeavePeriods,
      homeLeaveAllowanceDays: 15,
      periodStart: new Date(2026, 9, 1),
      periodEnd: new Date(2026, 9, 31),
    });
    expect(octOverflow).toBe(0);

    // November period: idx 16-30 (Nov 7 - Nov 21) overflow, minus the 2 Sundays in that
    // range (Nov 8, Nov 15) which are excluded to avoid double-counting rest-day loss.
    const novOverflow = countHomeLeaveOverflowDays({
      allHomeLeavePeriods,
      homeLeaveAllowanceDays: 15,
      periodStart: new Date(2026, 10, 1),
      periodEnd: new Date(2026, 10, 30),
    });
    expect(novOverflow).toBe(13);
  });
});
