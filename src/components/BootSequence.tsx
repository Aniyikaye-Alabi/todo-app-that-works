import { useEffect, useState } from 'react';

const LINES = [
  '> INITIALIZING CORE........... [OK]',
  '> LOADING LAW BOOKS........... [OK]',
  '> CALIBRATING FOCUS TIMER..... [OK]',
  '> DEPUTISING KEYBOARD......... [OK]',
  '> SHERIFF IS IN TOWN.',
];
const LINE_MS = 280;
const HOLD_MS = 500; // total ≈ 1.9s, under the 2.5s cap in the style guide

/** First-visit boot screen. Skippable with any key, click, or the SKIP button. */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown < LINES.length) {
      const id = window.setTimeout(() => setShown((n) => n + 1), LINE_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(onDone, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [shown, onDone]);

  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [onDone]);

  return (
    <div className="boot" onClick={onDone} role="dialog" aria-label="Starting SHERIFF">
      <img src="/mr-sheriff-logo-horizontal.svg" alt="SHERIFF" className="boot__logo" />
      <pre className="boot__log" aria-live="polite">
        {LINES.slice(0, shown).join('\n')}
        <span className="cursor" aria-hidden="true" />
      </pre>
      <button type="button" className="btn btn--ghost btn--sm boot__skip" onClick={onDone}>
        Skip
      </button>
    </div>
  );
}
