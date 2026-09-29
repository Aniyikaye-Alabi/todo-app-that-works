import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/lib/id';
import { hasErrors, validateList, validateTask } from '@/lib/validation';
import type { ListInput, Result, Settings, Task, TaskInput, TaskList, ThemeName } from '@/types';

export const STORAGE_KEY = 'sheriff:v1';

export interface SheriffState {
  lists: TaskList[];
  tasks: Record<string, Task>;
  settings: Settings;

  createList: (input: ListInput) => Result<TaskList>;
  updateList: (id: string, input: ListInput) => Result<TaskList>;
  /** Removes the list and every task inside it. */
  deleteList: (id: string) => void;

  addTask: (listId: string, input: TaskInput) => Result<Task>;
  updateTask: (id: string, input: TaskInput) => Result<Task>;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (listId: string, fromIndex: number, toIndex: number) => void;
  /** Credits served focus minutes to a task (capped at its duration). */
  logFocus: (taskId: string, minutes: number) => void;

  setTheme: (theme: ThemeName) => void;
  setSoundOn: (on: boolean) => void;
  markBootSeen: () => void;
}

const defaultSettings: Settings = { theme: 'phosphor', soundOn: true, bootSeen: false };

function move<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

function cleanList(input: ListInput): ListInput {
  return { ...input, name: input.name.trim(), description: input.description.trim() };
}

function cleanTask(input: TaskInput): TaskInput {
  return { ...input, title: input.title.trim(), notes: input.notes.trim() };
}

export const useSheriffStore = create<SheriffState>()(
  persist(
    (set, get) => ({
      lists: [],
      tasks: {},
      settings: defaultSettings,

      createList: (input) => {
        const errors = validateList(input);
        if (hasErrors(errors)) return { ok: false, errors };
        const list: TaskList = {
          id: createId('list'),
          ...cleanList(input),
          taskIds: [],
          createdAt: Date.now(),
        };
        set((s) => ({ lists: [...s.lists, list] }));
        return { ok: true, value: list };
      },

      updateList: (id, input) => {
        const existing = get().lists.find((l) => l.id === id);
        if (!existing) return { ok: false, errors: { form: 'LIST NOT FOUND' } };
        const errors = validateList(input, existing.taskIds.length);
        if (hasErrors(errors)) return { ok: false, errors };
        const updated: TaskList = { ...existing, ...cleanList(input) };
        set((s) => ({ lists: s.lists.map((l) => (l.id === id ? updated : l)) }));
        return { ok: true, value: updated };
      },

      deleteList: (id) =>
        set((s) => {
          const list = s.lists.find((l) => l.id === id);
          if (!list) return s;
          const tasks = { ...s.tasks };
          for (const taskId of list.taskIds) delete tasks[taskId];
          return { lists: s.lists.filter((l) => l.id !== id), tasks };
        }),

      addTask: (listId, input) => {
        const list = get().lists.find((l) => l.id === listId);
        if (!list) return { ok: false, errors: { form: 'LIST NOT FOUND' } };
        if (list.taskIds.length >= list.taskLimit) {
          return { ok: false, errors: { form: `TASK LIMIT REACHED (${list.taskLimit})` } };
        }
        const errors = validateTask(input);
        if (hasErrors(errors)) return { ok: false, errors };
        const task: Task = {
          id: createId('task'),
          listId,
          ...cleanTask(input),
          focusedMinutes: 0,
          completed: false,
          completedAt: null,
          createdAt: Date.now(),
        };
        set((s) => ({
          tasks: { ...s.tasks, [task.id]: task },
          lists: s.lists.map((l) =>
            l.id === listId ? { ...l, taskIds: [...l.taskIds, task.id] } : l,
          ),
        }));
        return { ok: true, value: task };
      },

      updateTask: (id, input) => {
        const existing = get().tasks[id];
        if (!existing) return { ok: false, errors: { form: 'TASK NOT FOUND' } };
        const errors = validateTask(input);
        if (hasErrors(errors)) return { ok: false, errors };
        const updated: Task = {
          ...existing,
          ...cleanTask(input),
          focusedMinutes: Math.min(existing.focusedMinutes, input.durationMinutes),
        };
        set((s) => ({ tasks: { ...s.tasks, [id]: updated } }));
        return { ok: true, value: updated };
      },

      deleteTask: (id) =>
        set((s) => {
          const task = s.tasks[id];
          if (!task) return s;
          const tasks = { ...s.tasks };
          delete tasks[id];
          return {
            tasks,
            lists: s.lists.map((l) =>
              l.id === task.listId ? { ...l, taskIds: l.taskIds.filter((t) => t !== id) } : l,
            ),
          };
        }),

      toggleTask: (id) =>
        set((s) => {
          const task = s.tasks[id];
          if (!task) return s;
          const completed = !task.completed;
          return {
            tasks: {
              ...s.tasks,
              [id]: { ...task, completed, completedAt: completed ? Date.now() : null },
            },
          };
        }),

      reorderTasks: (listId, from, to) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId ? { ...l, taskIds: move(l.taskIds, from, to) } : l,
          ),
        })),

      logFocus: (taskId, minutes) =>
        set((s) => {
          const task = s.tasks[taskId];
          if (!task || minutes <= 0) return s;
          const focusedMinutes = Math.min(task.durationMinutes, task.focusedMinutes + minutes);
          return { tasks: { ...s.tasks, [taskId]: { ...task, focusedMinutes } } };
        }),

      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setSoundOn: (soundOn) => set((s) => ({ settings: { ...s.settings, soundOn } })),
      markBootSeen: () => set((s) => ({ settings: { ...s.settings, bootSeen: true } })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lists: s.lists, tasks: s.tasks, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SheriffState>;
        return { ...current, ...p, settings: { ...defaultSettings, ...p.settings } };
      },
    },
  ),
);

// ── Selectors ───────────────────────────────────────────────────────────────

export const selectList = (id: string | null) => (s: SheriffState) =>
  id ? s.lists.find((l) => l.id === id) : undefined;

export function listStats(list: TaskList, tasks: Record<string, Task>) {
  const items = list.taskIds.map((id) => tasks[id]).filter((t): t is Task => Boolean(t));
  const done = items.filter((t) => t.completed).length;
  const plannedMinutes = items.reduce((sum, t) => sum + t.durationMinutes, 0);
  const focusedMinutes = items.reduce((sum, t) => sum + t.focusedMinutes, 0);
  return {
    total: items.length,
    done,
    open: items.length - done,
    plannedMinutes,
    focusedMinutes,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
    full: items.length >= list.taskLimit,
  };
}
