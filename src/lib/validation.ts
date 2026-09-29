import type { FieldErrors, ListInput, TaskInput } from '@/types';
import { isValidISODate } from './date';

export const LIMITS = {
  listName: 60,
  description: 280,
  taskTitle: 120,
  notes: 1000,
  minTaskLimit: 1,
  maxTaskLimit: 100,
  minDuration: 1,
  maxDuration: 24 * 60,
} as const;

export function validateList(input: ListInput, currentTaskCount = 0): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = 'NAME REQUIRED';
  else if (name.length > LIMITS.listName) errors.name = `MAX ${LIMITS.listName} CHARS`;

  if (input.description.length > LIMITS.description) {
    errors.description = `MAX ${LIMITS.description} CHARS`;
  }

  if (!isValidISODate(input.startDate)) errors.startDate = 'INVALID START DATE';
  if (!isValidISODate(input.endDate)) errors.endDate = 'INVALID END DATE';
  else if (!errors.startDate && input.endDate < input.startDate) {
    errors.endDate = 'END MUST BE ON/AFTER START';
  }

  if (!Number.isInteger(input.taskLimit)) errors.taskLimit = 'WHOLE NUMBER REQUIRED';
  else if (input.taskLimit < LIMITS.minTaskLimit || input.taskLimit > LIMITS.maxTaskLimit) {
    errors.taskLimit = `BETWEEN ${LIMITS.minTaskLimit} AND ${LIMITS.maxTaskLimit}`;
  } else if (input.taskLimit < currentTaskCount) {
    errors.taskLimit = `LIST ALREADY HOLDS ${currentTaskCount} TASKS`;
  }

  return errors;
}

export function validateTask(input: TaskInput): FieldErrors {
  const errors: FieldErrors = {};
  const title = input.title.trim();
  if (!title) errors.title = 'TITLE REQUIRED';
  else if (title.length > LIMITS.taskTitle) errors.title = `MAX ${LIMITS.taskTitle} CHARS`;

  if (input.notes.length > LIMITS.notes) errors.notes = `MAX ${LIMITS.notes} CHARS`;

  if (!Number.isInteger(input.durationMinutes)) errors.durationMinutes = 'WHOLE MINUTES REQUIRED';
  else if (
    input.durationMinutes < LIMITS.minDuration ||
    input.durationMinutes > LIMITS.maxDuration
  ) {
    errors.durationMinutes = `BETWEEN ${LIMITS.minDuration} AND ${LIMITS.maxDuration} MIN`;
  }

  return errors;
}

export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;
