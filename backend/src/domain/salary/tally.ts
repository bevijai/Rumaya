import type { TallyState } from './types';

export interface TallyStateInput {
  /** Whether this month's salary figures have been saved at all. */
  hasMonthRecord: boolean;
  /** Whether the salary month itself has ended. */
  monthEnded: boolean;
  /** Employer ticked "Confirmed with her in person". */
  confirmedInPerson: boolean;
  helperResponse?: 'agree' | 'disagree';
  /** True if the employer edited Sunday/leave numbers after the helper had already agreed. */
  wasAgreedThenNumbersChanged: boolean;
}

/** Derives the current tally state from the month/tally facts. */
export function computeTallyState(input: TallyStateInput): TallyState {
  if (!input.hasMonthRecord) return 'not_recorded';
  if (!input.monthEnded) return 'month_not_ended';
  if (input.confirmedInPerson) return 'confirmed_in_person';
  if (input.wasAgreedThenNumbersChanged) return 'needs_recheck';
  if (input.helperResponse === 'agree') return 'agreed';
  if (input.helperResponse === 'disagree') return 'disputed';
  return 'waiting_for_her';
}

/** An employer edit to the Sunday/leave numbers voids a prior helper agreement. */
export function shouldInvalidateAgreement(previousState: TallyState, numbersChanged: boolean): boolean {
  return numbersChanged && previousState === 'agreed';
}

/** "Mark as paid" is blocked unless the tally has been agreed one way or another. */
export function canMarkAsPaid(state: TallyState): boolean {
  return state === 'agreed' || state === 'confirmed_in_person';
}
