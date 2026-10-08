import { padStep } from '../lib/format';
import { Logo } from '../ui/Logo';
import styles from './Header.module.css';

interface HeaderProps {
  step: number;
  total: number;
  complete: boolean;
}

export function Header({ step, total, complete }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Logo />
        <span className={styles.wordmark}>hackflow</span>
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.context}>Hackathon registration</span>
      </div>

      <div className={styles.progress}>
        <p className={styles.count}>
          {complete ? (
            'Complete'
          ) : (
            <>
              <span className="sr-only">
                Question {step + 1} of {total}
              </span>
              <span aria-hidden="true">
                {padStep(step + 1)}
                <span className={styles.total}> / {padStep(total)}</span>
              </span>
            </>
          )}
        </p>
        <ol className={styles.segments} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <li key={i} data-state={complete || i < step ? 'done' : i === step ? 'current' : 'upcoming'} />
          ))}
        </ol>
      </div>
    </header>
  );
}
