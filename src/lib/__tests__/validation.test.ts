import { validList, validTask } from '@/test/resetStores';
import { hasErrors, validateList, validateTask } from '../validation';

describe('validateList', () => {
  it('accepts a valid list', () => {
    expect(validateList(validList)).toEqual({});
  });

  it('requires a non-blank name', () => {
    expect(validateList({ ...validList, name: '   ' }).name).toBe('NAME REQUIRED');
  });

  it('rejects an end date before the start date', () => {
    expect(validateList({ ...validList, endDate: '2026-08-31' }).endDate).toMatch(/AFTER START/);
  });

  it('allows a single-day list', () => {
    expect(validateList({ ...validList, endDate: validList.startDate })).toEqual({});
  });

  it('rejects impossible dates', () => {
    expect(validateList({ ...validList, startDate: '2026-02-30' }).startDate).toBeDefined();
  });

  it.each([0, -1, 101, 2.5, NaN])('rejects task limit %p', (taskLimit) => {
    expect(validateList({ ...validList, taskLimit }).taskLimit).toBeDefined();
  });

  it('rejects a limit lower than the tasks already in the list', () => {
    expect(validateList({ ...validList, taskLimit: 2 }, 3).taskLimit).toBe(
      'LIST ALREADY HOLDS 3 TASKS',
    );
  });
});

describe('validateTask', () => {
  it('accepts a valid task', () => {
    expect(hasErrors(validateTask(validTask))).toBe(false);
  });

  it('requires a title', () => {
    expect(validateTask({ ...validTask, title: '' }).title).toBe('TITLE REQUIRED');
  });

  it.each([0, -5, 1441, 12.5, NaN])('rejects duration %p', (durationMinutes) => {
    expect(validateTask({ ...validTask, durationMinutes }).durationMinutes).toBeDefined();
  });
});
