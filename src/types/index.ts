/** ISO calendar date, `YYYY-MM-DD` (no time component). */
export type ISODate = string;

export type Priority = 'low' | 'med' | 'high';

export interface TaskList {
  id: string;
  name: string;
  description: string;
  startDate: ISODate;
  endDate: ISODate;
  /** Maximum number of tasks this list may hold. */
  taskLimit: number;
  /** Task ids in display order. */
  taskIds: string[];
  createdAt: number;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  notes: string;
  priority: Priority;
  /** Planned effort in minutes. Split into focus sessions by `planPhases`. */
  durationMinutes: number;
  /** Focus minutes already served against `durationMinutes`. */
  focusedMinutes: number;
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
}

export type ThemeName = 'phosphor' | 'amber' | 'cyberpunk' | 'clean';

export interface Settings {
  theme: ThemeName;
  soundOn: boolean;
  bootSeen: boolean;
}

export type ListInput = Pick<
  TaskList,
  'name' | 'description' | 'startDate' | 'endDate' | 'taskLimit'
>;
export type TaskInput = Pick<Task, 'title' | 'notes' | 'priority' | 'durationMinutes'>;

export type FieldErrors = Partial<Record<string, string>>;

/** Result type for store actions that can be rejected by a business rule. */
export type Result<T = void> = { ok: true; value: T } | { ok: false; errors: FieldErrors };
