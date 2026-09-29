interface ProgressBarProps {
  /** 0–100. */
  value: number;
  label: string;
  /** Number of character cells. */
  cells?: number;
  /** Colour by value (>50 accent, 25–50 warn, <25 danger). Off for neutral progress. */
  tone?: 'auto' | 'accent';
  showValue?: boolean;
}

function toneFor(value: number): 'ok' | 'warn' | 'danger' {
  if (value > 50) return 'ok';
  if (value >= 25) return 'warn';
  return 'danger';
}

/** Character bar `[██████░░░░] 62%` with proper progressbar semantics. */
export function ProgressBar({
  value,
  label,
  cells = 10,
  tone = 'accent',
  showValue = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const filled = Math.round((clamped / 100) * cells);
  const toneClass = tone === 'auto' ? ` progress--${toneFor(clamped)}` : '';
  return (
    <div
      className={`progress${toneClass}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <span className="progress__bar" aria-hidden="true">
        [<span className="progress__fill">{'█'.repeat(filled)}</span>
        <span className="progress__empty">{'░'.repeat(cells - filled)}</span>]
      </span>
      {showValue && <span className="progress__value">{clamped}%</span>}
    </div>
  );
}
