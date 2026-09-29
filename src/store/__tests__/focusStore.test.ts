import { resetStores, validList, validTask } from '@/test/resetStores';
import { useFocusStore } from '../focusStore';
import { useSheriffStore } from '../sheriffStore';

const MIN = 60_000;
const T0 = 5_000_000;

function setupTask(durationMinutes: number) {
  const list = useSheriffStore.getState().createList(validList);
  if (!list.ok) throw new Error();
  const task = useSheriffStore.getState().addTask(list.value.id, { ...validTask, durationMinutes });
  if (!task.ok) throw new Error();
  return task.value.id;
}

const focused = (id: string) => useSheriffStore.getState().tasks[id]?.focusedMinutes;

beforeEach(() => resetStores());

describe('focus store', () => {
  it('credits the task as focus rounds complete', () => {
    const id = setupTask(60);
    const focus = useFocusStore.getState();
    expect(focus.start(id, T0)).toBe(true);

    focus.tick(T0 + 25 * MIN);
    expect(focused(id)).toBe(25);
    expect(useFocusStore.getState().phases[useFocusStore.getState().phaseIndex]?.kind).toBe(
      'break',
    );

    focus.tick(T0 + 70 * MIN); // 60 focus + 2 breaks
    expect(focused(id)).toBe(60);
    expect(useFocusStore.getState().status).toBe('finished');
  });

  it('only plans the unserved remainder of a task', () => {
    const id = setupTask(60);
    useSheriffStore.getState().logFocus(id, 50);
    useFocusStore.getState().start(id, T0);
    expect(useFocusStore.getState().phases).toEqual([{ kind: 'focus', minutes: 10, round: 1 }]);
  });

  it('refuses to start a fully served task', () => {
    const id = setupTask(25);
    useSheriffStore.getState().logFocus(id, 25);
    expect(useFocusStore.getState().start(id, T0)).toBe(false);
    expect(useFocusStore.getState().status).toBe('idle');
  });

  it('stopping credits partial minutes', () => {
    const id = setupTask(25);
    const focus = useFocusStore.getState();
    focus.start(id, T0);
    focus.stop(T0 + 9 * MIN);
    expect(focused(id)).toBe(9);
    expect(useFocusStore.getState().status).toBe('idle');
  });

  it('starting a new task stops the current session first', () => {
    const a = setupTask(25);
    const b = setupTask(25);
    const focus = useFocusStore.getState();
    focus.start(a, T0);
    focus.start(b, T0 + 5 * MIN);
    expect(focused(a)).toBe(5);
    expect(useFocusStore.getState().taskId).toBe(b);
  });
});
