import type { Question } from './questions';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message, or null when the answer can be accepted. */
export function validateAnswer(question: Question, value: string): string | null {
  const answer = value.trim();
  if (!answer) return question.required ? 'This field is required.' : null;

  if (question.type === 'email' && !EMAIL_PATTERN.test(answer)) {
    return 'Enter a valid email address, like name@example.com.';
  }
  if (question.type === 'choice' && !question.options.includes(answer)) {
    return 'Choose one of the options.';
  }
  return null;
}
