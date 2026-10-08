interface QuestionBase {
  id: string;
  title: string;
  /** Short heading shown above the question. */
  section: string;
  /** Label used in the summary on the completion screen. */
  label: string;
  description?: string;
  required?: boolean;
}

export type TextQuestion = QuestionBase & {
  type: 'text' | 'email' | 'longtext';
  placeholder?: string;
  autoComplete?: string;
};

export type ChoiceQuestion = QuestionBase & {
  type: 'choice';
  options: readonly string[];
};

export type Question = TextQuestion | ChoiceQuestion;

export type Answers = Readonly<Record<string, string>>;

export const QUESTIONS: readonly Question[] = [
  {
    id: 'fullName',
    type: 'text',
    section: 'About you',
    label: 'Name',
    title: 'What is your full name?',
    required: true,
    placeholder: 'Type your answer here…',
    autoComplete: 'name',
  },
  {
    id: 'email',
    type: 'email',
    section: 'Contact',
    label: 'Email',
    title: 'What is your email address?',
    required: true,
    placeholder: 'name@example.com',
    autoComplete: 'email',
  },
  {
    id: 'skills',
    type: 'longtext',
    section: 'Experience',
    label: 'Skills',
    title: 'Which skills do you bring to the hackathon?',
    description: 'Languages, frameworks, design tools: anything a teammate should know.',
    placeholder: 'e.g. TypeScript, React, Figma',
  },
  {
    id: 'track',
    type: 'choice',
    section: 'Track',
    label: 'Track',
    title: 'Select your preferred hackathon track:',
    required: true,
    options: ['Web Development', 'Data Science', 'Machine Learning', 'Design', 'Other'],
  },
  {
    id: 'support',
    type: 'choice',
    section: 'Logistics',
    label: 'Support',
    title: 'Will you need any specific resources or support?',
    options: ['I need a mentor', 'I need access to software', 'I need workspace', 'None'],
  },
];

export const ENDING_TITLE = 'Thank you for registering!';

/** Keyboard letters for choice options, in order. */
export const OPTION_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
