import { padStep } from '../lib/format';
import { Button } from '../ui/Button';
import { AlertIcon, ArrowDownIcon, LockIcon, ReturnIcon } from '../ui/icons';
import { Kbd } from '../ui/Kbd';
import { ChoiceField } from './ChoiceField';
import type { Question } from './questions';
import { TextField } from './TextField';
import styles from './QuestionPanel.module.css';

interface QuestionPanelProps {
  question: Question;
  index: number;
  value: string;
  error: string | null;
  isLast: boolean;
  submitting: boolean;
  onChange: (value: string) => void;
  onNext: () => void;
}

export function QuestionPanel({
  question,
  index,
  value,
  error,
  isLast,
  submitting,
  onChange,
  onNext,
}: QuestionPanelProps) {
  const titleId = `${question.id}-title`;
  const descriptionId = question.description ? `${question.id}-description` : undefined;
  const errorId = error ? `${question.id}-error` : undefined;
  const field = {
    value,
    onChange,
    invalid: Boolean(error),
    labelledBy: titleId,
    describedBy: [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
  };

  return (
    <div className={styles.panel}>
      <p className={styles.eyebrow}>
        <span className={styles.index}>{padStep(index + 1)}</span>
        <span className={styles.rule} aria-hidden="true" />
        {question.section}
      </p>
      <h1 id={titleId} className={styles.title}>
        {question.title}
        {question.required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </h1>
      {question.description && (
        <p id={descriptionId} className={styles.description}>
          {question.description}
        </p>
      )}

      <div className={styles.field}>
        {question.type === 'choice' ? (
          <ChoiceField question={question} {...field} />
        ) : (
          <TextField question={question} {...field} />
        )}
      </div>

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          <AlertIcon size={15} />
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <Button icon={<ArrowDownIcon />} loading={submitting} onClick={onNext}>
          {isLast ? 'Submit' : 'Continue'}
        </Button>
        <span className={styles.hint}>
          {question.type === 'longtext' ? (
            <>
              <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
              for a new line
            </>
          ) : (
            <>
              or press
              <Kbd>
                Enter <ReturnIcon size={11} />
              </Kbd>
            </>
          )}
        </span>
      </div>

      {(question.type === 'text' || question.type === 'longtext') && (
        <p className={styles.footnote}>
          <LockIcon size={13} />
          Never submit passwords.
        </p>
      )}
    </div>
  );
}
