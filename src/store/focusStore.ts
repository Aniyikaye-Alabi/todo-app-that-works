import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  idleFocusState,
  pauseFocus,
  resumeFocus,
  skipPhase,
  startFocus,
  stopFocus,
  tickFocus,
  type FocusEvent,
  type FocusState,
  type Transition,
} from '@/lib/focus';
import { play } from '@/lib/sound';
import { useSheriffStore } from './sheriffStore';

export const FOCUS_STORAGE_KEY = 'sheriff:focus:v1';

interface FocusActions {
  /** Starts a session over the task's remaining (unserved) duration. */
  start: (taskId: string, now?: number) => boolean;
  pause: (now?: number) => void;
  resume: (now?: number) => void;
  toggle: (now?: number) => void;
  skip: (now?: number) => void;
  stop: (now?: number) => void;
  tick: (now?: number) => void;
  /** Clears a finished session. */
  dismiss: () => void;
}

export type FocusStore = FocusState & FocusActions;

/** Applies side effects of a transition: credit focus minutes, play cues. */
function handleEvents(taskId: string | null, events: FocusEvent[]) {
  const { logFocus } = useSheriffStore.getState();
  let cue: 'focus' | 'break' | 'finish' | null = null;
  for (const e of events) {
    if ((e.type === 'phase-complete' || e.type === 'stopped') && taskId && e.focusedMinutes > 0) {
      logFocus(taskId, e.focusedMinutes);
    }
    if (e.type === 'phase-start') cue = e.phase.kind;
    if (e.type === 'finished') cue = 'finish';
  }
  if (cue) play(cue);
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => {
      const apply = (t: Transition) => {
        const taskId = get().taskId ?? t.state.taskId;
        set(t.state);
        handleEvents(taskId, t.events);
      };

      return {
        ...idleFocusState,

        start: (taskId, now = Date.now()) => {
          const task = useSheriffStore.getState().tasks[taskId];
          if (!task) return false;
          if (get().status !== 'idle') apply(stopFocus(get(), now));
          const t = startFocus(taskId, task.durationMinutes - task.focusedMinutes, now);
          if (t.state.status === 'idle') return false;
          apply(t);
          return true;
        },
        pause: (now = Date.now()) => apply(pauseFocus(get(), now)),
        resume: (now = Date.now()) => apply(resumeFocus(get(), now)),
        toggle: (now = Date.now()) => {
          const { status } = get();
          if (status === 'running') get().pause(now);
          else if (status === 'paused') get().resume(now);
        },
        skip: (now = Date.now()) => apply(skipPhase(get(), now)),
        stop: (now = Date.now()) => apply(stopFocus(get(), now)),
        tick: (now = Date.now()) => {
          if (get().status !== 'running') return;
          const t = tickFocus(get(), now);
          if (t.events.length) apply(t);
        },
        dismiss: () => set(idleFocusState),
      };
    },
    {
      name: FOCUS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ status, taskId, phases, phaseIndex, phaseEndsAt, pausedRemainingMs }) => ({
        status,
        taskId,
        phases,
        phaseIndex,
        phaseEndsAt,
        pausedRemainingMs,
      }),
    },
  ),
);
