import { useEffect, useRef, type KeyboardEvent } from 'react';
import { cx } from '../lib/cx';
import { CheckIcon } from '../ui/icons';
import { OPTION_KEYS, type ChoiceQuestion } from './questions';
import styles from './ChoiceField.module.css';

interface ChoiceFieldProps {
  question: ChoiceQuestion;
  value: string;
  invalid: boolean;
  labelledBy: string;
  describedBy?: string;
  onChange: (value: string) => void;
}

const ARROW_STEPS: Partial<Record<string, number>> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

/** A single-select radio group with roving focus, arrow-key and letter shortcuts. */
export function ChoiceField({
  question,
  value,
  invalid,
  labelledBy,
  describedBy,
  onChange,
}: ChoiceFieldProps) {
  const { options } = question;
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const group = useRef<HTMLDivElement>(null);
  const focusable = Math.max(0, options.indexOf(value));

  // Letter shortcuts change the selection from outside; keep focus on the checked option.
  useEffect(() => {
    if (group.current?.contains(document.activeElement)) buttons.current[focusable]?.focus();
  }, [focusable]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = ARROW_STEPS[event.key];
    if (step) {
      event.preventDefault();
      const next = (index + step + options.length) % options.length;
      onChange(options[next]);
      buttons.current[next]?.focus();
    } else if (event.key === ' ') {
      event.preventDefault();
      onChange(options[index]);
    }
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      className={styles.group}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-required={question.required || undefined}
      aria-invalid={invalid || undefined}
    >
      {options.map((option, index) => {
        const checked = option === value;
        return (
          <button
            key={option}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === focusable ? 0 : -1}
            data-autofocus={index === focusable ? '' : undefined}
            className={cx(styles.option, checked && styles.checked)}
            onClick={() => onChange(option)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className={styles.key} aria-hidden="true">
              {OPTION_KEYS[index]}
            </span>
            <span className={styles.label}>{option}</span>
            <CheckIcon className={styles.check} />
          </button>
        );
      })}
    </div>
  );
}
