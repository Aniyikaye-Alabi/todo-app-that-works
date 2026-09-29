import {
  idleFocusState,
  pauseFocus,
  planPhases,
  remainingMs,
  resumeFocus,
  skipPhase,
  startFocus,
  stopFocus,
  tickFocus,
  totalFocusMinutes,
  type FocusEvent,
} from '../focus';

const MIN = 60_000;
const T0 = 1_000_000;
const describePlan = (m: number) =>
  planPhases(m)
    .map((p) => `${p.kind[0]}${p.minutes}`)
    .join(' ');

describe('planPhases', () => {
  it.each([
    [0, ''],
    [10, 'f10'],
    [25, 'f25'],
    [26, 'f25 b5 f1'],
    [50, 'f25 b5 f25'],
    [60, 'f25 b5 f25 b5 f10'],
    [100, 'f25 b5 f25 b5 f25 b5 f25'],
  ])('%i minutes → %s', (minutes, expected) => {
    expect(describePlan(minutes)).toBe(expected);
  });

  it('never ends on a break', () => {
    for (let m = 1; m <= 300; m++) expect(planPhases(m).at(-1)?.kind).toBe('focus');
  });

  it('focus time always equals the requested duration', () => {
    for (let m = 1; m <= 300; m++) expect(totalFocusMinutes(planPhases(m))).toBe(m);
  });

  it('numbers rounds from 1', () => {
    expect(
      planPhases(60)
        .filter((p) => p.kind === 'focus')
        .map((p) => p.round),
    ).toEqual([1, 2, 3]);
  });

  it('ignores negative and fractional input', () => {
    expect(planPhases(-5)).toEqual([]);
    expect(describePlan(25.9)).toBe('f25');
  });
});

describe('focus state machine', () => {
  const credited = (events: FocusEvent[]) =>
    events.reduce((sum, e) => sum + ('focusedMinutes' in e ? e.focusedMinutes : 0), 0);

  it('starts on the first focus phase', () => {
    const { state, events } = startFocus('t1', 60, T0);
    expect(state.status).toBe('running');
    expect(state.phaseEndsAt).toBe(T0 + 25 * MIN);
    expect(events).toEqual([
      { type: 'phase-start', phase: { kind: 'focus', minutes: 25, round: 1 } },
    ]);
  });

  it('stays idle when there is nothing left to serve', () => {
    expect(startFocus('t1', 0, T0).state).toBe(idleFocusState);
  });

  it('advances focus → break → focus on tick and credits focus minutes', () => {
    let s = startFocus('t1', 60, T0).state;
    let t = tickFocus(s, T0 + 25 * MIN);
    s = t.state;
    expect(s.phaseIndex).toBe(1);
    expect(s.phases[s.phaseIndex]?.kind).toBe('break');
    expect(credited(t.events)).toBe(25);

    t = tickFocus(s, T0 + 30 * MIN);
    expect(t.state.phases[t.state.phaseIndex]?.kind).toBe('focus');
    expect(credited(t.events)).toBe(0); // breaks credit nothing
  });

  it('catches up through several phases after a long gap and finishes', () => {
    const s = startFocus('t1', 60, T0).state;
    const t = tickFocus(s, T0 + 999 * MIN);
    expect(t.state.status).toBe('finished');
    expect(credited(t.events)).toBe(60);
    expect(t.events.at(-1)).toEqual({ type: 'finished' });
  });

  it('pause freezes the remaining time; resume continues from it', () => {
    let s = startFocus('t1', 25, T0).state;
    s = pauseFocus(s, T0 + 10 * MIN).state;
    expect(s.status).toBe('paused');
    expect(remainingMs(s, T0 + 60 * MIN)).toBe(15 * MIN);
    expect(tickFocus(s, T0 + 60 * MIN).state).toBe(s); // paused sessions do not tick

    s = resumeFocus(s, T0 + 60 * MIN).state;
    expect(s.phaseEndsAt).toBe(T0 + 75 * MIN);
  });

  it('skipping a focus round credits only served whole minutes', () => {
    const s = startFocus('t1', 50, T0).state;
    const t = skipPhase(s, T0 + 7.5 * MIN);
    expect(credited(t.events)).toBe(7);
    expect(t.state.phases[t.state.phaseIndex]?.kind).toBe('break');
    expect(t.state.phaseEndsAt).toBe(T0 + 12.5 * MIN);
  });

  it('skipping while paused keeps the next phase paused', () => {
    let s = startFocus('t1', 50, T0).state;
    s = pauseFocus(s, T0 + MIN).state;
    const next = skipPhase(s, T0 + 2 * MIN).state;
    expect(next.status).toBe('paused');
    expect(next.pausedRemainingMs).toBe(5 * MIN);
  });

  it('stop credits served minutes and returns to idle', () => {
    const s = startFocus('t1', 25, T0).state;
    const t = stopFocus(s, T0 + 12 * MIN + 30_000);
    expect(t.state).toBe(idleFocusState);
    expect(t.events).toEqual([{ type: 'stopped', focusedMinutes: 12 }]);
  });

  it('stop during a break credits nothing', () => {
    let s = startFocus('t1', 50, T0).state;
    s = tickFocus(s, T0 + 26 * MIN).state;
    expect(stopFocus(s, T0 + 27 * MIN).events).toEqual([{ type: 'stopped', focusedMinutes: 0 }]);
  });
});
