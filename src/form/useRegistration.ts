import { useReducer, useRef } from 'react';
import type { Question } from './questions';
import { initialRegistration, registrationReducer } from './registration';
import { submitRegistration } from './submit';
import { validateAnswer } from './validation';

export function useRegistration(questions: readonly Question[]) {
  const [state, dispatch] = useReducer(registrationReducer, initialRegistration);
  const submitting = useRef(false);

  const question: Question | undefined = questions[state.step];
  const isLast = state.step === questions.length - 1;

  function setAnswer(value: string) {
    if (question) dispatch({ type: 'answer', questionId: question.id, value });
  }

  async function next() {
    if (!question || state.status !== 'editing' || submitting.current) return;

    const error = validateAnswer(question, state.answers[question.id] ?? '');
    if (error) return dispatch({ type: 'reject', error });
    if (!isLast) return dispatch({ type: 'advance' });

    submitting.current = true;
    dispatch({ type: 'submit' });
    try {
      await submitRegistration(state.answers);
      dispatch({ type: 'complete' });
    } catch (cause) {
      const detail = cause instanceof Error ? ` ${cause.message}` : '';
      dispatch({ type: 'reject', error: `We couldn’t submit your registration.${detail} Please try again.` });
    } finally {
      submitting.current = false;
    }
  }

  return {
    ...state,
    question,
    isLast,
    setAnswer,
    next,
    back: () => dispatch({ type: 'back' }),
    reset: () => dispatch({ type: 'reset' }),
  };
}

export type Registration = ReturnType<typeof useRegistration>;
