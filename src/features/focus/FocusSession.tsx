import * as Dialog from '@radix-ui/react-dialog';
import {
  Check,
  Coffee,
  Crosshair,
  Minimize2,
  Pause,
  Play,
  SkipForward,
  Square,
} from 'lucide-react';
import { useEffect } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useNow } from '@/hooks/useNow';
import { currentPhase, remainingMs, totalFocusMinutes } from '@/lib/focus';
import { play } from '@/lib/sound';
import { formatClock, formatMinutes } from '@/lib/time';
import { useFocusStore } from '@/store/focusStore';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import { PhaseStrip } from './PhaseStrip';

const TICK_MS = 250;

/**
 * Always mounted. Drives the timer (even while the overlay is minimised),
 * keeps the tab title live, and ends sessions whose task was deleted.
 */
export function FocusController() {
  const status = useFocusStore((s) => s.status);
  const taskId = useFocusStore((s) => s.taskId);
  const taskExists = useSheriffStore((s) => (taskId ? Boolean(s.tasks[taskId]) : true));

  useEffect(() => {
    if (status !== 'running') return;
    const { tick } = useFocusStore.getState();
    tick();
    const id = window.setInterval(() => tick(), TICK_MS);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (!taskExists) useFocusStore.getState().dismiss();
  }, [taskExists]);

  const now = useNow(1000, status === 'running' || status === 'paused');
  const phaseKind = useFocusStore((s) => currentPhase(s)?.kind);
  const left = useFocusStore((s) => remainingMs(s, now));
  useEffect(() => {
    const base = 'SHERIFF // Law & Order for Your Work';
    if (status === 'running' || status === 'paused') {
      const icon = status === 'paused' ? '❚❚' : phaseKind === 'break' ? '☕' : '◆';
      document.title = `${icon} ${formatClock(left)} · ${phaseKind === 'break' ? 'BREAK' : 'FOCUS'}`;
    } else {
      document.title = base;
    }
  }, [status, phaseKind, left]);

  return <FocusSession />;
}

export function FocusSession() {
  const focus = useFocusStore();
  const task = useSheriffStore((s) => (focus.taskId ? s.tasks[focus.taskId] : undefined));
  const toggleTask = useSheriffStore((s) => s.toggleTask);
  const minimized = useUIStore((s) => s.focusMinimized);
  const setMinimized = useUIStore((s) => s.setFocusMinimized);
  const toast = useUIStore((s) => s.toast);

  const live = focus.status === 'running' || focus.status === 'paused';
  const open = focus.status !== 'idle' && !minimized && Boolean(task);
  const now = useNow(TICK_MS, open && focus.status === 'running');

  useHotkeys(
    {
      Space: (e) => {
        e.preventDefault();
        focus.toggle();
        play('tick');
      },
      s: () => live && focus.skip(),
    },
    open && live,
  );

  if (!task || focus.status === 'idle') return null;

  const phase = currentPhase(focus);
  const phaseMs = (phase?.minutes ?? 0) * 60_000;
  // `now` can be briefly stale right after a phase starts; never show more than the phase length.
  const left = Math.min(remainingMs(focus, now), phaseMs);
  const phasePct = phaseMs ? ((phaseMs - left) / phaseMs) * 100 : 100;
  const rounds = focus.phases.filter((p) => p.kind === 'focus').length;
  const plannedFocus = totalFocusMinutes(focus.phases);
  const isBreak = phase?.kind === 'break';
  const finished = focus.status === 'finished';

  const abandon = () => {
    focus.stop();
    setMinimized(false);
    toast('warn', 'SESSION ABANDONED // served minutes were logged');
  };

  const close = () => {
    focus.dismiss();
    setMinimized(false);
  };

  const markComplete = () => {
    if (!task.completed) toggleTask(task.id);
    play('confirm');
    toast('ok', `TASK CLEARED // ${task.title}`);
    close();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (finished) close();
        else setMinimized(true);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="focus__backdrop" />
        <Dialog.Content
          className={`focus${isBreak ? ' focus--break' : ''}${finished ? ' focus--finished' : ''}`}
          data-testid="focus-session"
        >
          <header className="focus__header">
            <p className="eyebrow">
              {finished ? 'SESSION::COMPLETE' : isBreak ? 'SESSION::BREAK' : 'SESSION::FOCUS'}
              {focus.status === 'paused' && (
                <span className="tag tag--overdue"> [WARN] PAUSED</span>
              )}
            </p>
            {!finished && (
              <Dialog.Close className="btn btn--ghost btn--sm" aria-label="Minimise focus session">
                <Minimize2 aria-hidden="true" className="icon" /> Minimise{' '}
                <kbd className="kbd">Esc</kbd>
              </Dialog.Close>
            )}
          </header>

          <Dialog.Title className="focus__task">{task.title}</Dialog.Title>
          <Dialog.Description className="hint">
            {finished
              ? `// all ${formatMinutes(plannedFocus)} served. the sheriff is satisfied.`
              : `// ${isBreak ? 'stand up, stretch, hydrate' : 'one task. no distractions.'}`}
          </Dialog.Description>

          {finished ? (
            <div className="focus__done">
              <Check aria-hidden="true" className="focus__done-icon" />
              <p className="focus__phase">Duration exhausted</p>
              <div className="focus__controls">
                <button type="button" className="btn btn--solid" onClick={markComplete} autoFocus>
                  Mark task complete
                </button>
                <button type="button" className="btn btn--ghost" onClick={close}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="focus__phase" aria-live="polite">
                {isBreak ? (
                  <Coffee aria-hidden="true" className="icon" />
                ) : (
                  <Crosshair aria-hidden="true" className="icon" />
                )}
                {isBreak
                  ? `Break · ${phase?.minutes} min`
                  : `Focus round ${phase?.round} of ${rounds}`}
              </p>
              <p className="focus__clock" data-testid="focus-clock" role="timer" aria-live="off">
                {formatClock(left)}
              </p>
              <ProgressBar value={phasePct} label="Phase progress" cells={24} showValue={false} />
              <PhaseStrip phases={focus.phases} activeIndex={focus.phaseIndex} />

              <div className="focus__controls">
                {focus.status === 'running' ? (
                  <button
                    type="button"
                    className="btn btn--solid"
                    onClick={() => focus.pause()}
                    autoFocus
                  >
                    <Pause aria-hidden="true" className="icon" /> Pause{' '}
                    <kbd className="kbd">Space</kbd>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--solid"
                    onClick={() => focus.resume()}
                    autoFocus
                  >
                    <Play aria-hidden="true" className="icon" /> Resume{' '}
                    <kbd className="kbd">Space</kbd>
                  </button>
                )}
                <button type="button" className="btn" onClick={() => focus.skip()}>
                  <SkipForward aria-hidden="true" className="icon" /> Skip{' '}
                  {isBreak ? 'break' : 'round'} <kbd className="kbd">S</kbd>
                </button>
                <button type="button" className="btn btn--danger" onClick={abandon}>
                  <Square aria-hidden="true" className="icon" /> Abandon
                </button>
              </div>
              <p className="hint">
                {`// served ${formatMinutes(task.focusedMinutes)} of ${formatMinutes(task.durationMinutes)}`}
              </p>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
