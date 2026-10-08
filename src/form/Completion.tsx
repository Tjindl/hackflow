import { formatDepth } from '../lib/format';
import { CHALLENGER_DEEP_DEPTH } from '../ocean/zones';
import { Button } from '../ui/Button';
import { ArrowUpIcon, CheckIcon } from '../ui/icons';
import { ENDING_TITLE, type Answers, type Question } from './questions';
import styles from './Completion.module.css';

interface CompletionProps {
  questions: readonly Question[];
  answers: Answers;
  onRestart: () => void;
}

export function Completion({ questions, answers, onRestart }: CompletionProps) {
  return (
    <div className={styles.completion}>
      <p className={styles.eyebrow}>
        <CheckIcon size={14} />
        Registration received
      </p>
      <h1 className={styles.title} tabIndex={-1} data-autofocus="">
        {ENDING_TITLE}
      </h1>
      <p className={styles.lede}>
        You’ve reached the floor of the Challenger Deep, {formatDepth(CHALLENGER_DEEP_DEPTH)} down. Here’s
        what we received.
      </p>

      <dl className={styles.summary}>
        {questions.map((question) => {
          const answer = answers[question.id]?.trim();
          return (
            <div key={question.id} className={styles.row}>
              <dt>{question.label}</dt>
              <dd>{answer || <span className={styles.empty}>Not provided</span>}</dd>
            </div>
          );
        })}
      </dl>

      <Button className={styles.restart} variant="ghost" icon={<ArrowUpIcon />} onClick={onRestart}>
        Register another participant
      </Button>
    </div>
  );
}
