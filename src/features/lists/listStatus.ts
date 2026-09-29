import { daysBetween, todayISO } from '@/lib/date';
import type { TaskList } from '@/types';

export type ListStatus = 'upcoming' | 'active' | 'overdue' | 'cleared';

export const STATUS_TAG: Record<ListStatus, string> = {
  upcoming: '[INFO] UPCOMING',
  active: '[OK] ACTIVE',
  overdue: '[WARN] OVERDUE',
  cleared: '[OK] CLEARED',
};

export function getListStatus(
  list: Pick<TaskList, 'startDate' | 'endDate'>,
  stats: { total: number; done: number },
  today = todayISO(),
): ListStatus {
  if (stats.total > 0 && stats.done === stats.total) return 'cleared';
  if (today < list.startDate) return 'upcoming';
  if (today > list.endDate) return 'overdue';
  return 'active';
}

/** `// 3 DAYS LEFT`, `// STARTS IN 2 DAYS`, `// ENDED 4 DAYS AGO`, `// DUE TODAY`. */
export function deadlineLabel(
  list: Pick<TaskList, 'startDate' | 'endDate'>,
  today = todayISO(),
): string {
  const plural = (n: number) => `${n} DAY${n === 1 ? '' : 'S'}`;
  if (today < list.startDate) return `STARTS IN ${plural(daysBetween(today, list.startDate))}`;
  const left = daysBetween(today, list.endDate);
  if (left > 0) return `${plural(left)} LEFT`;
  if (left === 0) return 'DUE TODAY';
  return `ENDED ${plural(-left)} AGO`;
}
