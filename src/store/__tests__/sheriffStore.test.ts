import { resetStores, validList, validTask } from '@/test/resetStores';
import { listStats, STORAGE_KEY, useSheriffStore } from '../sheriffStore';

const store = () => useSheriffStore.getState();

function createList(overrides = {}) {
  const r = store().createList({ ...validList, ...overrides });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
}

beforeEach(() => resetStores());

describe('lists', () => {
  it('creates a list with trimmed fields', () => {
    const list = createList({ name: '  Sprint  ' });
    expect(list.name).toBe('Sprint');
    expect(store().lists).toHaveLength(1);
  });

  it('rejects invalid input without mutating state', () => {
    const r = store().createList({ ...validList, name: '' });
    expect(r.ok).toBe(false);
    expect(store().lists).toHaveLength(0);
  });

  it('updates a list but not below its current task count', () => {
    const list = createList({ taskLimit: 5 });
    store().addTask(list.id, validTask);
    store().addTask(list.id, validTask);
    expect(store().updateList(list.id, { ...validList, taskLimit: 1 }).ok).toBe(false);
    expect(store().updateList(list.id, { ...validList, taskLimit: 2 }).ok).toBe(true);
  });

  it('deleting a list removes every task in it', () => {
    const a = createList();
    const b = createList();
    store().addTask(a.id, validTask);
    store().addTask(a.id, validTask);
    const kept = store().addTask(b.id, validTask);
    store().deleteList(a.id);
    expect(store().lists.map((l) => l.id)).toEqual([b.id]);
    expect(Object.keys(store().tasks)).toEqual([kept.ok && kept.value.id]);
  });
});

describe('tasks', () => {
  it('enforces the list task limit', () => {
    const list = createList({ taskLimit: 2 });
    expect(store().addTask(list.id, validTask).ok).toBe(true);
    expect(store().addTask(list.id, validTask).ok).toBe(true);
    const third = store().addTask(list.id, validTask);
    expect(third).toEqual({ ok: false, errors: { form: 'TASK LIMIT REACHED (2)' } });
  });

  it('frees a slot when a task is deleted', () => {
    const list = createList({ taskLimit: 1 });
    const r = store().addTask(list.id, validTask);
    if (!r.ok) throw new Error();
    store().deleteTask(r.value.id);
    expect(store().lists[0]?.taskIds).toEqual([]);
    expect(store().addTask(list.id, validTask).ok).toBe(true);
  });

  it('toggles completion with a timestamp', () => {
    const list = createList();
    const r = store().addTask(list.id, validTask);
    if (!r.ok) throw new Error();
    store().toggleTask(r.value.id);
    expect(store().tasks[r.value.id]).toMatchObject({
      completed: true,
      completedAt: expect.any(Number),
    });
    store().toggleTask(r.value.id);
    expect(store().tasks[r.value.id]).toMatchObject({ completed: false, completedAt: null });
  });

  it('reorders tasks within a list', () => {
    const list = createList();
    const ids = ['a', 'b', 'c'].map((title) => {
      const r = store().addTask(list.id, { ...validTask, title });
      return r.ok ? r.value.id : '';
    });
    store().reorderTasks(list.id, 0, 2);
    expect(store().lists[0]?.taskIds).toEqual([ids[1], ids[2], ids[0]]);
  });

  it('caps logged focus at the task duration, and trims it when duration shrinks', () => {
    const list = createList();
    const r = store().addTask(list.id, { ...validTask, durationMinutes: 30 });
    if (!r.ok) throw new Error();
    store().logFocus(r.value.id, 25);
    store().logFocus(r.value.id, 25);
    expect(store().tasks[r.value.id]?.focusedMinutes).toBe(30);
    store().updateTask(r.value.id, { ...validTask, durationMinutes: 10 });
    expect(store().tasks[r.value.id]?.focusedMinutes).toBe(10);
  });
});

describe('persistence & stats', () => {
  it('persists to localStorage', () => {
    createList({ name: 'Persisted' });
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(raw.state.lists[0].name).toBe('Persisted');
  });

  it('computes list stats', () => {
    const list = createList({ taskLimit: 2 });
    const r = store().addTask(list.id, { ...validTask, durationMinutes: 40 });
    store().addTask(list.id, { ...validTask, durationMinutes: 20 });
    if (r.ok) store().toggleTask(r.value.id);
    const fresh = store().lists[0]!;
    expect(listStats(fresh, store().tasks)).toMatchObject({
      total: 2,
      done: 1,
      percent: 50,
      plannedMinutes: 60,
      full: true,
    });
  });
});
