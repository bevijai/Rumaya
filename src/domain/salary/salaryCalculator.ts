import { countSundaysInRange, daysInMonth, daysInPeriod } from './calendar';
import {
  countHomeLeaveOverflowDays,
  countSundaysDuringLeave,
  countUnpaidTypeLeaveDays,
  filterLeavesByType,
} from './leaveCalculations';
import { round2 } from './money';
import { computeRestDayRate } from './restDayRate';
import type {
  ApprovedLeavePeriod,
  ContractTerms,
  MonthInputs,
  MonthSalaryResult,
} from './types';

export interface ComputeMonthSalaryOptions {
  contract: ContractTerms;
  month: MonthInputs;
  /** Approved leave overlapping this month's period (any type). */
  approvedLeavesThisMonth: ApprovedLeavePeriod[];
  /**
   * ALL approved home-leave periods across the whole contract (any month), needed to
   * compute the cumulative oldest-first 15-day allowance overflow correctly.
   */
  allHomeLeavePeriodsInContract: ApprovedLeavePeriod[];
}

export function computeMonthSalary(options: ComputeMonthSalaryOptions): MonthSalaryResult {
  const { contract, month, approvedLeavesThisMonth, allHomeLeavePeriodsInContract } = options;
  const { periodStart, periodEnd } = month;

  const sundaysInPeriod = countSundaysInRange(periodStart, periodEnd);

  const sundaysDuringLeave =
    month.sundaysDuringLeaveOverride ??
    countSundaysDuringLeave(periodStart, periodEnd, approvedLeavesThisMonth);

  const sundaysNotOnLeave = Math.max(0, sundaysInPeriod - sundaysDuringLeave);
  const restDaysTaken = Math.min(
    month.restDaysTaken ?? contract.agreedRestDaysPerMonth,
    sundaysNotOnLeave,
  );

  const sundaysWorked = Math.max(0, sundaysInPeriod - sundaysDuringLeave - restDaysTaken);

  const restDayRate = computeRestDayRate(contract.basicSalary, contract.restDayRateOverride);
  const restDayPay = round2(sundaysWorked * restDayRate);

  const homeLeavesThisMonth = filterLeavesByType(approvedLeavesThisMonth, 'home');
  const otherLeavesThisMonth = approvedLeavesThisMonth.filter((l) => l.type !== 'home');

  const unpaidFromOtherTypes = countUnpaidTypeLeaveDays(
    periodStart,
    periodEnd,
    otherLeavesThisMonth,
    contract.unpaidLeaveTypes,
  );

  // "All home leave" unpaid: every non-Sunday home-leave day counts (not just overflow).
  // Otherwise only home-leave days beyond the cumulative allowance are unpaid.
  const unpaidFromHome = contract.unpaidLeaveTypes.home
    ? countUnpaidTypeLeaveDays(periodStart, periodEnd, homeLeavesThisMonth, {
        home: true,
        extra_day_off: false,
        sick: false,
        other: false,
      })
    : countHomeLeaveOverflowDays({
        allHomeLeavePeriods: allHomeLeavePeriodsInContract,
        homeLeaveAllowanceDays: contract.homeLeaveAllowanceDays,
        periodStart,
        periodEnd,
      });

  const unpaidLeaveDays =
    month.unpaidLeaveDaysOverride ?? unpaidFromOtherTypes + unpaidFromHome;

  const dailyRate = contract.basicSalary / 26;
  const unpaidDeduction = round2(unpaidLeaveDays * dailyRate);

  const totalDaysInMonth = daysInMonth(periodStart);
  const totalDaysInPeriod = daysInPeriod(periodStart, periodEnd);
  const proRatedBasic = round2(
    (contract.basicSalary * totalDaysInPeriod) / totalDaysInMonth,
  );

  const additions = round2(
    month.payFieldAdjustments
      .filter((f) => f.direction === 'add')
      .reduce((sum, f) => sum + f.amount, 0),
  );
  const deductions = round2(
    month.payFieldAdjustments
      .filter((f) => f.direction === 'subtract')
      .reduce((sum, f) => sum + f.amount, 0),
  );

  const netPay = round2(proRatedBasic + restDayPay + additions - deductions - unpaidDeduction);

  return {
    yyyymm: month.yyyymm,
    sundaysInPeriod,
    sundaysDuringLeave,
    restDaysTaken,
    sundaysWorked,
    restDayRate,
    restDayPay,
    unpaidLeaveDays,
    unpaidDeduction,
    proRatedBasic,
    additions,
    deductions,
    netPay,
  };
}
