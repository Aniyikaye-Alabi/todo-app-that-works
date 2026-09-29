/**
 * Focus-session planning and the timer state machine.
 *
 * Everything here is pure: time is always passed in as `now` (epoch ms) so the
 * logic is deterministic under test. `store/focusStore.ts` is a thin wrapper.
 */

export const FOCUS_MINUTES = 25;
export const BREAK_MINUTES = 5;
const MINUTE_MS = 60_000;

export type PhaseKind = 'focus' | 'break';

export interface Phase {
  kind: PhaseKind;
  minutes: number;
  /** 1-based focus round this phase belongs to. */
  round: number;
}

/**
 * Splits `totalMinutes` of work into 25-minute focus phases with 5-minute
 * breaks *between* them. The final focus phase takes whatever is left and no
 * break follows it: the session ends when the duration is exhausted.
 *
 *   planPhases(60) -> F25 . B5 . F25 . B5 . F10
 */
export function planPhases(
  totalMinutes: number,
  focusMinutes = FOCUS_MINUTES,
  breakMinutes = BREAK_MINUTES,
): Phase[] {
  const phases: Phase[] = [];
  let remaining = Math.max(0, Math.floor(totalMinutes));
  let round = 1;
  while (remaining > 0) {
    const minutes = Math.min(focusMinutes, remaining);
    phases.push({ kind: 'focus', minutes, round });
    remaining -= minutes;
    if (remaining > 0 && breakMinutes > 0)
      phases.push({ kind: 'break', minutes: breakMinutes, round });
    round++;
  }
  return phases;
}

export function totalFocusMinutes(phases: Phase[]): number {
  return phases.filter((p) => p.kind === 'focus').reduce((sum, p) => sum + p.minutes, 0);
}

export function totalPlanMinutes(phases: Phase[]): number {
  return phases.reduce((sum, p) => sum + p.minutes, 0);
}

// ── State machine ────────────────────────────────────────────────────────────

export type FocusStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface FocusState {
  status: FocusStatus;
  taskId: string | null;
  phases: Phase[];
  phaseIndex: number;
  /** Epoch ms the current phase ends at, while running. */
  phaseEndsAt: number | null;
  /** Ms left in the current phase, while paused. */
  pausedRemainingMs: number | null;
}

/** Emitted by transitions so callers can log progress and play sounds. */
export type FocusEvent =
  | { type: 'phase-complete'; phase: Phase; focusedMinutes: number }
  | { type: 'phase-start'; phase: Phase }
  | { type: 'finished' }
  | { type: 'stopped'; focusedMinutes: number };

export interface Transition {
  state: FocusState;
  events: FocusEvent[];
}

export const idleFocusState: FocusState = {
  status: 'idle',
  taskId: null,
  phases: [],
  phaseIndex: 0,
  phaseEndsAt: null,
  pausedRemainingMs: null,
};

const minutesMs = (m: number) => m * MINUTE_MS;

export function currentPhase(state: FocusState): Phase | undefined {
  return state.phases[state.phaseIndex];
}

export function startFocus(taskId: string, remainingMinutes: number, now: number): Transition {
  const phases = planPhases(remainingMinutes);
  const first = phases[0];
  if (!first) return { state: idleFocusState, events: [] };
  return {
    state: {
      status: 'running',
      taskId,
      phases,
      phaseIndex: 0,
      phaseEndsAt: now + minutesMs(first.minutes),
      pausedRemainingMs: null,
    },
    events: [{ type: 'phase-start', phase: first }],
  };
}

export function remainingMs(state: FocusState, now: number): number {
  if (state.status === 'paused') return state.pausedRemainingMs ?? 0;
  if (state.status === 'running' && state.phaseEndsAt !== null) {
    return Math.max(0, state.phaseEndsAt - now);
  }
  return 0;
}

export function pauseFocus(state: FocusState, now: number): Transition {
  if (state.status !== 'running') return { state, events: [] };
  return {
    state: {
      ...state,
      status: 'paused',
      pausedRemainingMs: remainingMs(state, now),
      phaseEndsAt: null,
    },
    events: [],
  };
}

export function resumeFocus(state: FocusState, now: number): Transition {
  if (state.status !== 'paused') return { state, events: [] };
  return {
    state: {
      ...state,
      status: 'running',
      phaseEndsAt: now + (state.pausedRemainingMs ?? 0),
      pausedRemainingMs: null,
    },
    events: [],
  };
}

/** Moves to the phase after the current one, starting it at `startAt`. */
function advance(state: FocusState, startAt: number, focusedMinutes: number): Transition {
  const done = currentPhase(state)!;
  const events: FocusEvent[] = [{ type: 'phase-complete', phase: done, focusedMinutes }];
  const nextIndex = state.phaseIndex + 1;
  const next = state.phases[nextIndex];
  if (!next) {
    events.push({ type: 'finished' });
    return {
      state: {
        ...state,
        status: 'finished',
        phaseIndex: nextIndex,
        phaseEndsAt: null,
        pausedRemainingMs: null,
      },
      events,
    };
  }
  events.push({ type: 'phase-start', phase: next });
  const running = state.status === 'running';
  return {
    state: {
      ...state,
      phaseIndex: nextIndex,
      phaseEndsAt: running ? startAt + minutesMs(next.minutes) : null,
      pausedRemainingMs: running ? null : minutesMs(next.minutes),
    },
    events,
  };
}

/**
 * Advances through every phase whose end time has passed. Long gaps (a
 * sleeping laptop, a reloaded tab) catch up several phases at once.
 */
export function tickFocus(state: FocusState, now: number): Transition {
  let current = state;
  const events: FocusEvent[] = [];
  while (
    current.status === 'running' &&
    current.phaseEndsAt !== null &&
    current.phaseEndsAt <= now
  ) {
    const phase = currentPhase(current)!;
    const t = advance(current, current.phaseEndsAt, phase.kind === 'focus' ? phase.minutes : 0);
    current = t.state;
    events.push(...t.events);
  }
  return { state: current, events };
}

/** Ends the current phase early. Skipping focus credits only the minutes actually served. */
export function skipPhase(state: FocusState, now: number): Transition {
  if (state.status !== 'running' && state.status !== 'paused') return { state, events: [] };
  const phase = currentPhase(state)!;
  const credited = phase.kind === 'focus' ? servedMinutes(state, now) : 0;
  return advance(state, now, credited);
}

/** Abandons the session, crediting whole minutes served in the current focus phase. */
export function stopFocus(state: FocusState, now: number): Transition {
  if (state.status === 'idle') return { state, events: [] };
  const phase = currentPhase(state);
  const credited =
    state.status !== 'finished' && phase?.kind === 'focus' ? servedMinutes(state, now) : 0;
  return { state: idleFocusState, events: [{ type: 'stopped', focusedMinutes: credited }] };
}

function servedMinutes(state: FocusState, now: number): number {
  const phase = currentPhase(state);
  if (!phase) return 0;
  return Math.floor((minutesMs(phase.minutes) - remainingMs(state, now)) / MINUTE_MS);
}
