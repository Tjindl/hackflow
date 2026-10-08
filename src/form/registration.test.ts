import { describe, expect, it } from 'vitest';
import { initialRegistration, registrationReducer, type RegistrationAction } from './registration';

const run = (...actions: RegistrationAction[]) => actions.reduce(registrationReducer, initialRegistration);

describe('registrationReducer', () => {
  it('records answers and clears the error', () => {
    const state = run(
      { type: 'reject', error: 'Nope' },
      { type: 'answer', questionId: 'email', value: 'a@b.co' },
    );
    expect(state.answers).toEqual({ email: 'a@b.co' });
    expect(state.error).toBeNull();
  });

  it('moves between steps but never above the first', () => {
    expect(run({ type: 'advance' }, { type: 'advance' }, { type: 'back' }).step).toBe(1);
    expect(run({ type: 'back' }).step).toBe(0);
  });

  it('locks navigation while submitting and moves past the last question on completion', () => {
    const submitting = run({ type: 'advance' }, { type: 'submit' });
    expect(registrationReducer(submitting, { type: 'back' })).toBe(submitting);
    expect(registrationReducer(submitting, { type: 'complete' })).toMatchObject({
      status: 'complete',
      step: 2,
    });
  });

  it('returns to editing when a submission is rejected', () => {
    expect(run({ type: 'submit' }, { type: 'reject', error: 'Offline' })).toMatchObject({
      status: 'editing',
      error: 'Offline',
    });
  });

  it('starts over on reset', () => {
    expect(run({ type: 'answer', questionId: 'x', value: 'y' }, { type: 'advance' }, { type: 'reset' })).toBe(
      initialRegistration,
    );
  });
});
