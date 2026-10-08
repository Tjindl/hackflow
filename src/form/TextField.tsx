import type { ChangeEvent } from 'react';
import type { TextQuestion } from './questions';
import styles from './TextField.module.css';

interface TextFieldProps {
  question: TextQuestion;
  value: string;
  invalid: boolean;
  labelledBy: string;
  describedBy?: string;
  onChange: (value: string) => void;
}

export function TextField({ question, value, invalid, labelledBy, describedBy, onChange }: TextFieldProps) {
  const shared = {
    className: styles.input,
    value,
    placeholder: question.placeholder,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
    'aria-required': question.required || undefined,
    'data-autofocus': '',
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };

  if (question.type === 'longtext') return <textarea {...shared} rows={3} />;

  const isEmail = question.type === 'email';
  return (
    <input
      {...shared}
      type={question.type}
      inputMode={isEmail ? 'email' : undefined}
      autoComplete={question.autoComplete ?? 'off'}
      autoCapitalize={isEmail ? 'off' : 'words'}
      spellCheck={isEmail ? false : undefined}
      enterKeyHint="next"
    />
  );
}
