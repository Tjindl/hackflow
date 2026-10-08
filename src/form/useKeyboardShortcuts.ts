import { useEffect, useLayoutEffect, useRef } from 'react';

interface Shortcuts {
  /** Enter (Shift+Enter still inserts a newline in long answers). */
  onSubmit: () => void;
  /** A–Z, with 0 for A. Ignored while typing in a text field. */
  onLetter: (index: number) => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts, enabled: boolean): void {
  const latest = useRef({ shortcuts, enabled });
  useLayoutEffect(() => {
    latest.current = { shortcuts, enabled };
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { shortcuts, enabled } = latest.current;
      if (!enabled || event.defaultPrevented || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      // Buttons and links keep their native Enter behaviour; option buttons don't.
      const control = target?.closest('button, a') && target.getAttribute('role') !== 'radio';

      if (event.key === 'Enter' && !event.shiftKey) {
        if (control) return;
        event.preventDefault();
        shortcuts.onSubmit();
      } else if (!typing && /^[a-z]$/i.test(event.key)) {
        shortcuts.onLetter(event.key.toUpperCase().charCodeAt(0) - 65);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
