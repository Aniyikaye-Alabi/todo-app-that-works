import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import { resetStores, validList, validTask } from '@/test/resetStores';

beforeEach(() => resetStores());
afterEach(() => {
  const { toasts, dismissToast } = useUIStore.getState();
  act(() => toasts.forEach((t) => dismissToast(t.id)));
});

async function createListViaUI(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  limit = '2',
) {
  await user.click(screen.getByRole('button', { name: /new list/i }));
  const form = screen.getByTestId('list-form');
  await user.type(within(form).getByLabelText(/list name/i), name);
  const limitInput = within(form).getByLabelText(/task limit/i);
  await user.clear(limitInput);
  await user.type(limitInput, limit);
  await user.click(within(form).getByRole('button', { name: /create list/i }));
}

describe('SHERIFF app', () => {
  it('shows the empty board', () => {
    render(<App />);
    expect(screen.getByTestId('board-empty')).toHaveTextContent(/no lists on the books/i);
  });

  it('shows the boot sequence on first visit and can skip it', async () => {
    resetStores({ bootSeen: false });
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(useSheriffStore.getState().settings.bootSeen).toBe(true);
  });

  it('creates a list, enters it, and adds tasks up to the limit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createListViaUI(user, 'Launch week', '1');

    expect(screen.getByTestId('list-title')).toHaveTextContent('Launch week');

    await user.click(screen.getByTestId('add-task'));
    const form = screen.getByTestId('task-form');
    await user.type(within(form).getByLabelText(/^task$/i), 'Ship it');
    await user.click(within(form).getByRole('button', { name: '1H 15M' }));
    expect(within(form).getByTestId('plan-summary')).toHaveTextContent('3 focus rounds');
    await user.click(within(form).getByRole('button', { name: /add task/i }));

    expect(screen.getAllByTestId('task-row')).toHaveLength(1);
    expect(screen.getByTestId('add-task')).toBeDisabled();
    expect(screen.getByText(/task limit reached/i)).toBeInTheDocument();
  });

  it('shows validation errors for an invalid list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /new list/i }));
    await user.click(screen.getByRole('button', { name: /create list/i }));
    expect(screen.getByText(/name required/i)).toBeInTheDocument();
    expect(useSheriffStore.getState().lists).toHaveLength(0);
  });

  it('warns that deleting a list removes its tasks, then deletes both', async () => {
    const s = useSheriffStore.getState();
    const list = s.createList(validList);
    if (!list.ok) throw new Error();
    s.addTask(list.value.id, validTask);
    s.addTask(list.value.id, validTask);

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: `Delete list ${validList.name}` }));

    const dialog = screen.getByTestId('confirm-dialog');
    expect(dialog).toHaveTextContent(/removes every task added to it \(2 tasks\)/i);
    await user.click(within(dialog).getByRole('button', { name: /remove list/i }));

    expect(useSheriffStore.getState().lists).toHaveLength(0);
    expect(useSheriffStore.getState().tasks).toEqual({});
  });

  it('cancelling the delete keeps the list', async () => {
    useSheriffStore.getState().createList(validList);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: `Delete list ${validList.name}` }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(useSheriffStore.getState().lists).toHaveLength(1);
  });

  it('starts a focus session from a task', async () => {
    const s = useSheriffStore.getState();
    const list = s.createList(validList);
    if (!list.ok) throw new Error();
    s.addTask(list.value.id, { ...validTask, title: 'Deep work', durationMinutes: 30 });

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /enter/i }));
    await user.click(screen.getByRole('button', { name: /start focus on deep work/i }));

    const session = screen.getByTestId('focus-session');
    expect(within(session).getByText(/focus round 1 of 2/i)).toBeInTheDocument();
    expect(within(session).getByTestId('focus-clock')).toHaveTextContent('25:00');
  });
});
