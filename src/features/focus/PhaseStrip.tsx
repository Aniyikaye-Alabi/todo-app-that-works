import type { Phase } from '@/lib/focus';

interface PhaseStripProps {
  phases: Phase[];
  /** Index of the live phase; earlier phases render as done. Omit for a static preview. */
  activeIndex?: number;
}

/** Proportional timeline of focus / break phases: `█F25 ░B5 █F25 ░B5 █F10`. */
export function PhaseStrip({ phases, activeIndex }: PhaseStripProps) {
  const total = phases.reduce((sum, p) => sum + p.minutes, 0) || 1;
  return (
    <ol className="phase-strip" aria-label="Session plan">
      {phases.map((p, i) => {
        const state =
          activeIndex === undefined
            ? ''
            : i < activeIndex
              ? ' is-done'
              : i === activeIndex
                ? ' is-active'
                : '';
        return (
          <li
            key={i}
            className={`phase-strip__seg phase-strip__seg--${p.kind}${state}`}
            style={{ flexGrow: p.minutes / total }}
            title={`${p.kind === 'focus' ? 'Focus' : 'Break'} ${p.minutes} min`}
          >
            <span className="phase-strip__label">
              {p.kind === 'focus' ? 'F' : 'B'}
              {p.minutes}
            </span>
            <span className="sr-only">
              {p.kind === 'focus' ? `Focus round ${p.round}` : 'Break'}, {p.minutes} minutes
              {state === ' is-done' ? ', done' : state === ' is-active' ? ', in progress' : ''}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
