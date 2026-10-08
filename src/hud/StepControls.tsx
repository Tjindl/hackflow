import { ChevronDownIcon, ChevronUpIcon } from '../ui/icons';
import styles from './StepControls.module.css';

interface StepControlsProps {
  canGoBack: boolean;
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function StepControls({ canGoBack, busy, onBack, onNext }: StepControlsProps) {
  return (
    <nav className={styles.controls} aria-label="Question navigation">
      <button
        type="button"
        className={styles.control}
        onClick={onBack}
        disabled={!canGoBack}
        title="Previous question"
      >
        <ChevronUpIcon />
        <span className="sr-only">Previous question</span>
      </button>
      <button type="button" className={styles.control} onClick={onNext} disabled={busy} title="Next question">
        <ChevronDownIcon />
        <span className="sr-only">Next question</span>
      </button>
    </nav>
  );
}
