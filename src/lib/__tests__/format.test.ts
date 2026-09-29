import { getListStatus, deadlineLabel } from '@/features/lists/listStatus';
import { addDays, daysBetween, isValidISODate } from '../date';
import { formatClock, formatMinutes } from '../time';

describe('time formatting', () => {
  it.each([
    [0, '00:00'],
    [999, '00:01'],
    [25 * 60_000, '25:00'],
    [61 * 60_000 + 5_000, '1:01:05'],
    [-5, '00:00'],
  ])('formatClock(%i) → %s', (ms, out) => expect(formatClock(ms)).toBe(out));

  it.each([
    [25, '25M'],
    [60, '1H'],
    [100, '1H 40M'],
  ])('formatMinutes(%i) → %s', (m, out) => expect(formatMinutes(m)).toBe(out));
});

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-09-01', '2026-09-08')).toBe(7);
    expect(daysBetween('2026-09-08', '2026-09-01')).toBe(-7);
  });

  it('validates ISO dates', () => {
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('28/02/2026')).toBe(false);
  });
});

describe('list status', () => {
  const list = { startDate: '2026-09-10', endDate: '2026-09-20' };
  const some = { total: 2, done: 1 };

  it('is upcoming before the start date', () => {
    expect(getListStatus(list, some, '2026-09-01')).toBe('upcoming');
    expect(deadlineLabel(list, '2026-09-08')).toBe('STARTS IN 2 DAYS');
  });

  it('is active inside the window', () => {
    expect(getListStatus(list, some, '2026-09-15')).toBe('active');
    expect(deadlineLabel(list, '2026-09-19')).toBe('1 DAY LEFT');
    expect(deadlineLabel(list, '2026-09-20')).toBe('DUE TODAY');
  });

  it('is overdue after the end date with open tasks', () => {
    expect(getListStatus(list, some, '2026-09-21')).toBe('overdue');
  });

  it('is cleared once every task is done, regardless of date', () => {
    expect(getListStatus(list, { total: 2, done: 2 }, '2026-12-01')).toBe('cleared');
  });
});
