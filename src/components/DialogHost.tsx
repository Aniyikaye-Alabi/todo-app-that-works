import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { ListFormDialog } from '@/features/lists/ListFormDialog';
import { TaskFormDialog } from '@/features/tasks/TaskFormDialog';
import { play } from '@/lib/sound';
import { useFocusStore } from '@/store/focusStore';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';

const SHORTCUTS: [keys: string, action: string][] = [
  ['Ctrl/⌘ K', 'Command palette'],
  ['N', 'New list (board) / new task (inside a list)'],
  ['G then H', 'Go to board'],
  ['M', 'Mute / unmute sound'],
  ['?', 'Show this help'],
  ['Space', 'Pause / resume focus session'],
  ['S', 'Skip current focus round or break'],
  ['Esc', 'Close dialog / minimise focus session'],
];

/** Renders whichever dialog `uiStore.dialog` points at. One dialog at a time. */
export function DialogHost() {
  const dialog = useUIStore((s) => s.dialog);
  const close = useUIStore((s) => s.closeDialog);
  const lists = useSheriffStore((s) => s.lists);
  const tasks = useSheriffStore((s) => s.tasks);

  if (!dialog) return null;

  switch (dialog.kind) {
    case 'list-form': {
      const list = dialog.listId ? lists.find((l) => l.id === dialog.listId) : undefined;
      return <ListFormDialog key={dialog.listId ?? 'new'} list={list} onClose={close} />;
    }

    case 'task-form': {
      const task = dialog.taskId ? tasks[dialog.taskId] : undefined;
      return (
        <TaskFormDialog
          key={dialog.taskId ?? 'new'}
          listId={dialog.listId}
          task={task}
          onClose={close}
        />
      );
    }

    case 'confirm-delete-list': {
      const list = lists.find((l) => l.id === dialog.listId);
      if (!list) return null;
      const count = list.taskIds.length;
      return (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && close()}
          title="Remove list"
          confirmLabel="Remove list"
          onConfirm={() => {
            const focus = useFocusStore.getState();
            if (focus.taskId && list.taskIds.includes(focus.taskId)) focus.stop();
            useSheriffStore.getState().deleteList(list.id);
            const ui = useUIStore.getState();
            if (ui.activeListId === list.id) ui.openList(null);
            ui.toast('warn', `LIST REMOVED // ${list.name}`);
            play('delete');
          }}
        >
          <p>
            You are about to remove <strong>{list.name}</strong>.
          </p>
          <p className="warn-text">
            [WARN] Removing a list removes every task added to it
            {count > 0 ? ` (${count} task${count === 1 ? '' : 's'})` : ''}. This cannot be undone.
          </p>
        </ConfirmDialog>
      );
    }

    case 'confirm-delete-task': {
      const task = tasks[dialog.taskId];
      if (!task) return null;
      return (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && close()}
          title="Remove task"
          confirmLabel="Remove task"
          onConfirm={() => {
            const focus = useFocusStore.getState();
            if (focus.taskId === task.id) focus.stop();
            useSheriffStore.getState().deleteTask(task.id);
            useUIStore.getState().toast('warn', `TASK REMOVED // ${task.title}`);
            play('delete');
          }}
        >
          <p>
            Remove <strong>{task.title}</strong> from this list? Logged focus time goes with it.
          </p>
        </ConfirmDialog>
      );
    }

    case 'shortcuts':
      return (
        <Modal
          open
          onOpenChange={(open) => !open && close()}
          title="> KEYBOARD"
          description="shortcuts are ignored while typing"
        >
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Keys</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUTS.map(([keys, action]) => (
                <tr key={keys}>
                  <td>
                    <kbd className="kbd">{keys}</kbd>
                  </td>
                  <td>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      );
  }
}
