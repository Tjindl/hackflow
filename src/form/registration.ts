import type { Answers } from './questions';

export interface RegistrationState {
  /** Index of the current question; equals the question count once submitted. */
  step: number;
  answers: Answers;
  error: string | null;
  status: 'editing' | 'submitting' | 'complete';
}

export type RegistrationAction =
  | { type: 'answer'; questionId: string; value: string }
  | { type: 'advance' }
  | { type: 'back' }
  | { type: 'reject'; error: string }
  | { type: 'submit' }
  | { type: 'complete' }
  | { type: 'reset' };

export const initialRegistration: RegistrationState = {
  step: 0,
  answers: {},
  error: null,
  status: 'editing',
};

export function registrationReducer(state: RegistrationState, action: RegistrationAction): RegistrationState {
  switch (action.type) {
    case 'answer':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value }, error: null };
    case 'advance':
      return state.status === 'editing' ? { ...state, step: state.step + 1, error: null } : state;
    case 'back':
      return state.status === 'editing' && state.step > 0
        ? { ...state, step: state.step - 1, error: null }
        : state;
    case 'reject':
      return { ...state, status: 'editing', error: action.error };
    case 'submit':
      return { ...state, status: 'submitting', error: null };
    case 'complete':
      return { ...state, status: 'complete', step: state.step + 1, error: null };
    case 'reset':
      return initialRegistration;
  }
}
