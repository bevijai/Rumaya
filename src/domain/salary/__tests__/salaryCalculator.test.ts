import { describe, expect, it } from 'vitest';
import { computeMonthSalary } from '../salaryCalculator';
import { DEFAULT_UNPAID_LEAVE_TYPES, type ApprovedLeavePeriod, type ContractTerms, type MonthInputs } from '../types';

const baseContract: ContractTerms = {
  helperName: 'Yanti',
  employerName: 'Meenakumari Vijai',
  basicSalary: 700,
  contractStart: new Date(2026, 8, 1),
  contractLengthMonths: 24,
  agreedRestDaysPerMonth: 1,
  homeLeaveAllowanceDays: 15,
  payDayWorkingDayN: 2,
  unpaidLeaveTypes: DEFAULT_UNPAID_LEAVE_TYPES,
};

describe('computeMonthSalary — spec worked example (Sep 2026)', () => {
  it('nets S$727 (basic 700 + rest-day pay 27)', () => {
    const homeLeave: ApprovedLeavePeriod = {
      id: 'l1',
      type: 'home',
      from: new Date(2026, 8, 12),
      to: new Date(2026, 8, 21),
    };
    const month: MonthInputs = {
      yyyymm: '2026-09',
      periodStart: new Date(2026, 8, 1),
      periodEnd: new Date(2026, 8, 30),
      restDaysTaken: 1,
      payFieldAdjustments: [],
    };

    const result = computeMonthSalary({
      contract: baseContract,
      month,
      approvedLeavesThisMonth: [homeLeave],
      allHomeLeavePeriodsInContract: [homeLeave],
    });

    expect(result.sundaysInPeriod).toBe(4);
    expect(result.sundaysDuringLeave).toBe(2);
    expect(result.restDaysTaken).toBe(1);
    expect(result.sundaysWorked).toBe(1);
    expect(result.restDayRate).toBe(27);
    expect(result.restDayPay).toBe(27);
    expect(result.unpaidLeaveDays).toBe(0);
    expect(result.unpaidDeduction).toBe(0);
    expect(result.proRatedBasic).toBe(700);
    expect(result.netPay).toBe(727);
  });
});

describe('computeMonthSalary — unpaid deduction', () => {
  it('rounds unpaid deduction to cents (3 unpaid days at basic/26 per day)', () => {
    const month: MonthInputs = {
      yyyymm: '2026-09',
      periodStart: new Date(2026, 8, 1),
      periodEnd: new Date(2026, 8, 30),
      restDaysTaken: 0,
      sundaysDuringLeaveOverride: 0,
      unpaidLeaveDaysOverride: 3,
      payFieldAdjustments: [],
    };

    const result = computeMonthSalary({
      contract: baseContract,
      month,
      approvedLeavesThisMonth: [],
      allHomeLeavePeriodsInContract: [],
    });

    // 3 * (700/26) = 80.7692... -> 80.77
    expect(result.unpaidDeduction).toBe(80.77);
  });
});

describe('computeMonthSalary — partial (pro-rated) month', () => {
  it('pro-rates basic salary by days in period / days in month', () => {
    // Contract starts 16 Sep 2026 -> partial first month, 15 of 30 days.
    const month: MonthInputs = {
      yyyymm: '2026-09',
      periodStart: new Date(2026, 8, 16),
      periodEnd: new Date(2026, 8, 30),
      restDaysTaken: 0,
      sundaysDuringLeaveOverride: 0,
      unpaidLeaveDaysOverride: 0,
      payFieldAdjustments: [],
    };

    const result = computeMonthSalary({
      contract: baseContract,
      month,
      approvedLeavesThisMonth: [],
      allHomeLeavePeriodsInContract: [],
    });

    // 15 days of 30 -> half of 700 = 350
    expect(result.proRatedBasic).toBe(350);
  });
});
