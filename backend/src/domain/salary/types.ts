// Shared domain types for the salary/leave calculation engine.
// NOTE: kept in sync by hand with src/domain/salary/types.ts (frontend) until the
// engine is extracted into a shared package — see architecture.md repo memory.

export type LeaveType = 'home' | 'extra_day_off' | 'sick' | 'other';

export interface UnpaidLeaveTypeSettings {
  home: boolean;
  extra_day_off: boolean;
  sick: boolean;
  other: boolean;
}

export const DEFAULT_UNPAID_LEAVE_TYPES: UnpaidLeaveTypeSettings = {
  home: false,
  extra_day_off: true,
  sick: false,
  other: true,
};

export interface ContractTerms {
  helperName: string;
  employerName: string;
  /** Basic monthly salary in S$. */
  basicSalary: number;
  /** Owner override for rest-day rate; must be >= basicSalary / 26. */
  restDayRateOverride?: number;
  contractStart: Date;
  contractLengthMonths: number;
  /** Agreed rest days (Sundays off) per month, minimum 1. */
  agreedRestDaysPerMonth: number;
  /** Paid home-leave days allowed across the whole contract (default 15). */
  homeLeaveAllowanceDays: number;
  /** Pay day = Nth working day of the following month (default 2). */
  payDayWorkingDayN: number;
  unpaidLeaveTypes: UnpaidLeaveTypeSettings;
}

/** An approved leave period, using the decision snapshot dates (immutable). */
export interface ApprovedLeavePeriod {
  id: string;
  type: LeaveType;
  from: Date;
  to: Date;
}

export interface Holiday {
  /** ISO date string, yyyy-MM-dd. */
  date: string;
  name: string;
}

export type PayFieldDirection = 'add' | 'subtract';

export interface PayFieldAdjustment {
  name: string;
  direction: PayFieldDirection;
  amount: number;
}

export interface MonthPeriod {
  /** yyyymm, e.g. "2026-09". */
  yyyymm: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface MonthInputs extends MonthPeriod {
  /** Employer override for Sundays during leave; undefined = auto-calculated. */
  sundaysDuringLeaveOverride?: number;
  /** Sundays taken off as rest days; defaults to agreedRestDaysPerMonth (capped). */
  restDaysTaken?: number;
  /** Employer override for unpaid leave days; undefined = auto-calculated. */
  unpaidLeaveDaysOverride?: number;
  payFieldAdjustments: PayFieldAdjustment[];
}

export interface MonthSalaryResult {
  yyyymm: string;
  sundaysInPeriod: number;
  sundaysDuringLeave: number;
  restDaysTaken: number;
  sundaysWorked: number;
  restDayRate: number;
  restDayPay: number;
  unpaidLeaveDays: number;
  unpaidDeduction: number;
  proRatedBasic: number;
  additions: number;
  deductions: number;
  netPay: number;
}

export type PaymentMethod = 'cash' | 'bank' | 'mother_account' | 'other';

export interface PaymentLine {
  method: PaymentMethod;
  /** undefined amount = this line absorbs the remainder. */
  amount?: number;
}

export type TallyState =
  | 'not_recorded'
  | 'month_not_ended'
  | 'waiting_for_her'
  | 'agreed'
  | 'disputed'
  | 'needs_recheck'
  | 'confirmed_in_person';
