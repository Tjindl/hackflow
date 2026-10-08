import { Button } from '../ui/Button';
import { ArrowDownIcon, ArrowUpIcon } from '../ui/icons';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  canGoBack: boolean;
  isLast: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
}

/** Thumb-reachable navigation for small screens. */
export function ActionBar({ canGoBack, isLast, submitting, onBack, onNext }: ActionBarProps) {
  return (
    <div className={styles.bar}>
      <Button
        className={styles.back}
        variant="secondary"
        icon={<ArrowUpIcon />}
        disabled={!canGoBack}
        onClick={onBack}
        aria-label="Previous question"
      />
      <Button className={styles.next} icon={<ArrowDownIcon />} loading={submitting} onClick={onNext}>
        {isLast ? 'Submit' : 'Continue'}
      </Button>
    </div>
  );
}
