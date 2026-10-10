import { describe, expect, it } from 'vitest';
import { canMarkAsPaid, computeTallyState, shouldInvalidateAgreement } from '../tally';

describe('computeTallyState', () => {
  it('is "not_recorded" when the month has no saved figures', () => {
    expect(
      computeTallyState({
        hasMonthRecord: false,
        monthEnded: false,
        confirmedInPerson: false,
        wasAgreedThenNumbersChanged: false,
      }),
    ).toBe('not_recorded');
  });

  it('is "month_not_ended" before the salary month finishes', () => {
    expect(
      computeTallyState({
        hasMonthRecord: true,
        monthEnded: false,
        confirmedInPerson: false,
        wasAgreedThenNumbersChanged: false,
      }),
    ).toBe('month_not_ended');
  });

  it('is "waiting_for_her" once the month ends and she has not responded', () => {
    expect(
      computeTallyState({
        hasMonthRecord: true,
        monthEnded: true,
        confirmedInPerson: false,
        wasAgreedThenNumbersChanged: false,
      }),
    ).toBe('waiting_for_her');
  });

  it('is "agreed" when she confirms the numbers are correct', () => {
    expect(
      computeTallyState({
        hasMonthRecord: true,
        monthEnded: true,
        confirmedInPerson: false,
        helperResponse: 'agree',
        wasAgreedThenNumbersChanged: false,
      }),
    ).toBe('agreed');
  });

  it('is "disputed" when she says the numbers are not correct', () => {
    expect(
      computeTallyState({
        hasMonthRecord: true,
        monthEnded: true,
        confirmedInPerson: false,
        helperResponse: 'disagree',
        wasAgreedThenNumbersChanged: false,
      }),
    ).toBe('disputed');
  });

  it('is "confirmed_in_person" when the employer ticks that box', () => {
    expect(
      computeTallyState({
        hasMonthRecord: true,
        monthEnded: true,
        confirmedInPerson: true,
        wasAgreedThenNumbersChanged: false,
      }),
    ).toBe('confirmed_in_person');
  });

  it('is "needs_recheck" when the employer edits numbers after she had agreed', () => {
    expect(
      computeTallyState({
        hasMonthRecord: true,
        monthEnded: true,
        confirmedInPerson: false,
        helperResponse: 'agree',
        wasAgreedThenNumbersChanged: true,
      }),
    ).toBe('needs_recheck');
  });
});

describe('shouldInvalidateAgreement', () => {
  it('voids a prior agreement when the employer changes the numbers', () => {
    expect(shouldInvalidateAgreement('agreed', true)).toBe(true);
  });

  it('does not invalidate if nothing changed', () => {
    expect(shouldInvalidateAgreement('agreed', false)).toBe(false);
  });

  it('does not apply to states other than "agreed"', () => {
    expect(shouldInvalidateAgreement('disputed', true)).toBe(false);
  });
});

describe('canMarkAsPaid', () => {
  it('allows paying once agreed or confirmed in person', () => {
    expect(canMarkAsPaid('agreed')).toBe(true);
    expect(canMarkAsPaid('confirmed_in_person')).toBe(true);
  });

  it('blocks paying in every other tally state', () => {
    expect(canMarkAsPaid('waiting_for_her')).toBe(false);
    expect(canMarkAsPaid('disputed')).toBe(false);
    expect(canMarkAsPaid('needs_recheck')).toBe(false);
    expect(canMarkAsPaid('not_recorded')).toBe(false);
    expect(canMarkAsPaid('month_not_ended')).toBe(false);
  });
});
