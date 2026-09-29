import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Play, Trash2 } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tooltip } from '@/components/ui/Tooltip';
import { play } from '@/lib/sound';
import { formatMinutes } from '@/lib/time';
import { useFocusStore } from '@/store/focusStore';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import type { Task } from '@/types';

const PRIORITY_TAG = { low: 'LOW', med: 'MED', high: 'HIGH' } as const;

export function TaskRow({ task, index }: { task: Task; index: number }) {
  const toggleTask = useSheriffStore((s) => s.toggleTask);
  const focusTaskId = useFocusStore((s) => (s.status === 'idle' ? null : s.taskId));
  const { openDialog, setFocusMinimized } = useUIStore.getState();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const remaining = task.durationMinutes - task.focusedMinutes;
  const focusPct = task.durationMinutes ? (task.focusedMinutes / task.durationMinutes) * 100 : 0;
  const isFocusing = focusTaskId === task.id;

  const startFocus = () => {
    if (isFocusing) {
      setFocusMinimized(false);
      return;
    }
    if (useFocusStore.getState().start(task.id)) setFocusMinimized(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`task${task.completed ? ' is-done' : ''}${isDragging ? ' is-dragging' : ''}${
        isFocusing ? ' is-focusing' : ''
      }`}
      data-testid="task-row"
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="task__handle icon-btn"
        aria-label={`Reorder ${task.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </button>

      <label className="checkbox task__check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => {
            toggleTask(task.id);
            play(task.completed ? 'tick' : 'confirm');
          }}
          aria-label={`Mark ${task.title} as ${task.completed ? 'not done' : 'done'}`}
        />
        <span className="checkbox__box" aria-hidden="true" />
      </label>

      <div className="task__body">
        <p className="task__title">
          <span className="task__index" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          {task.title}
        </p>
        {task.notes && <p className="task__notes">{task.notes}</p>}
        <div className="task__meta">
          <span className={`tag tag--prio-${task.priority}`}>
            <span className="sr-only">Priority </span>
            {PRIORITY_TAG[task.priority]}
          </span>
          <span className="task__duration">
            {formatMinutes(task.focusedMinutes)} / {formatMinutes(task.durationMinutes)}
          </span>
          <ProgressBar value={focusPct} label={`${task.title} focus progress`} cells={10} />
        </div>
      </div>

      <div className="task__actions">
        <Tooltip content={remaining > 0 ? 'start focus session' : 'duration fully served'}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={startFocus}
            disabled={(remaining <= 0 || task.completed) && !isFocusing}
            aria-label={`${isFocusing ? 'Resume' : 'Start'} focus on ${task.title}`}
          >
            <Play aria-hidden="true" className="icon" /> {isFocusing ? 'Live' : 'Focus'}
          </button>
        </Tooltip>
        <Tooltip content="edit task">
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit ${task.title}`}
            onClick={() => openDialog({ kind: 'task-form', listId: task.listId, taskId: task.id })}
          >
            <Pencil aria-hidden="true" />
          </button>
        </Tooltip>
        <Tooltip content="remove task">
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            aria-label={`Delete ${task.title}`}
            onClick={() => openDialog({ kind: 'confirm-delete-task', taskId: task.id })}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </li>
  );
}
