import { describe, expect, it } from 'vitest';
import { QUESTIONS, type Question } from './questions';
import { validateAnswer } from './validation';

const byId = (id: string) => QUESTIONS.find((question) => question.id === id) as Question;

describe('validateAnswer', () => {
  it('requires an answer for required questions only', () => {
    expect(validateAnswer(byId('fullName'), '   ')).toBe('This field is required.');
    expect(validateAnswer(byId('skills'), '')).toBeNull();
  });

  it('checks the shape of email addresses', () => {
    expect(validateAnswer(byId('email'), 'not-an-email')).toMatch(/valid email/);
    expect(validateAnswer(byId('email'), ' ada@example.com ')).toBeNull();
  });

  it('only accepts listed options for choice questions', () => {
    expect(validateAnswer(byId('track'), 'Design')).toBeNull();
    expect(validateAnswer(byId('track'), 'Juggling')).toMatch(/Choose one/);
  });
});
