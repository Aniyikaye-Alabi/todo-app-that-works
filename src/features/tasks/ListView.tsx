import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDate } from '@/lib/date';
import { hexTag } from '@/lib/id';
import { formatMinutes } from '@/lib/time';
import { listStats, useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import type { Task, TaskList } from '@/types';
import { deadlineLabel, getListStatus, STATUS_TAG } from '../lists/listStatus';
import { TaskRow } from './TaskRow';

export function ListView({ list }: { list: TaskList }) {
  const tasksById = useSheriffStore((s) => s.tasks);
  const reorderTasks = useSheriffStore((s) => s.reorderTasks);
  const { openList, openDialog } = useUIStore.getState();

  const tasks = list.taskIds.map((id) => tasksById[id]).filter((t): t is Task => Boolean(t));
  const stats = listStats(list, tasksById);
  const status = getListStatus(list, stats);
  const capacityPct = (stats.total / list.taskLimit) * 100;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    reorderTasks(
      list.id,
      list.taskIds.indexOf(String(active.id)),
      list.taskIds.indexOf(String(over.id)),
    );
  };

  const addTask = () => openDialog({ kind: 'task-form', listId: list.id });

  return (
    <div className="view">
      <header className="view__header">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => openList(null)}>
            <ArrowLeft aria-hidden="true" className="icon" /> Board
          </button>
          <p className="eyebrow">
            LIST::{hexTag(list.id)}{' '}
            <span className={`tag tag--${status}`}>{STATUS_TAG[status]}</span>
          </p>
          <h1 className="h1" data-testid="list-title">
            <span aria-hidden="true">&gt; </span>
            {list.name}
          </h1>
          {list.description && <p className="lede">{list.description}</p>}
        </div>
        <div className="view__header-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Edit list"
            onClick={() => openDialog({ kind: 'list-form', listId: list.id })}
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            aria-label="Delete list"
            onClick={() => openDialog({ kind: 'confirm-delete-list', listId: list.id })}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="list-layout">
        <Panel
          title="Tasks"
          meta={`${stats.total}/${list.taskLimit}`}
          className="list-layout__tasks"
        >
          <div className="toolbar">
            <button
              type="button"
              className="btn btn--solid"
              onClick={addTask}
              disabled={stats.full}
              data-testid="add-task"
            >
              <Plus aria-hidden="true" className="icon" /> Add task <kbd className="kbd">N</kbd>
            </button>
            {stats.full && (
              <p className="hint hint--warn" role="status">
                [WARN] TASK LIMIT REACHED // raise the limit or clear a task
              </p>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="empty empty--inline">
              <p className="empty__title">// NO TASKS FILED</p>
              <p className="empty__body">Add a task and give it a duration to plan focus rounds.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={list.taskIds} strategy={verticalListSortingStrategy}>
                <ol className="task-list" aria-label="Tasks" data-testid="task-list">
                  {tasks.map((task, i) => (
                    <TaskRow key={task.id} task={task} index={i} />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
        </Panel>

        <aside className="list-layout__side">
          <Panel title="Orders">
            <p className="list-card__dates">
              <CalendarRange aria-hidden="true" className="icon" />
              {formatDate(list.startDate)} → {formatDate(list.endDate)}
            </p>
            <p className="hint">{`// ${deadlineLabel(list)}`}</p>
            <dl className="stats stats--stack">
              <div>
                <dt>Capacity</dt>
                <dd>
                  <ProgressBar value={capacityPct} label="Task capacity used" cells={12} />
                </dd>
              </div>
              <div>
                <dt>Completion</dt>
                <dd>
                  <ProgressBar value={stats.percent} label="Tasks completed" cells={12} />
                </dd>
              </div>
              <div>
                <dt>Focus served</dt>
                <dd>
                  {formatMinutes(stats.focusedMinutes)} / {formatMinutes(stats.plannedMinutes)}
                </dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
