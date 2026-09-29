import { CalendarRange, Pencil, Trash2 } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatDate } from '@/lib/date';
import { hexTag } from '@/lib/id';
import { formatMinutes } from '@/lib/time';
import { listStats, useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import type { TaskList } from '@/types';
import { deadlineLabel, getListStatus, STATUS_TAG } from './listStatus';

export function ListCard({ list }: { list: TaskList }) {
  const tasks = useSheriffStore((s) => s.tasks);
  const { openList, openDialog } = useUIStore.getState();
  const stats = listStats(list, tasks);
  const status = getListStatus(list, stats);

  return (
    <Panel
      as="article"
      title={list.name}
      meta={hexTag(list.id)}
      className="list-card"
      data-testid="list-card"
    >
      <div className="list-card__head">
        <span className={`tag tag--${status}`}>{STATUS_TAG[status]}</span>
        <span className="list-card__deadline">{deadlineLabel(list)}</span>
      </div>

      {list.description && <p className="list-card__desc">{list.description}</p>}

      <p className="list-card__dates">
        <CalendarRange aria-hidden="true" className="icon" />
        <span>
          {formatDate(list.startDate)} <span aria-hidden="true">→</span>
          <span className="sr-only">to</span> {formatDate(list.endDate)}
        </span>
      </p>

      <dl className="stats">
        <div>
          <dt>Tasks</dt>
          <dd data-testid="list-capacity">
            {stats.total}/{list.taskLimit}
          </dd>
        </div>
        <div>
          <dt>Done</dt>
          <dd>{stats.done}</dd>
        </div>
        <div>
          <dt>Planned</dt>
          <dd>{formatMinutes(stats.plannedMinutes)}</dd>
        </div>
      </dl>

      <ProgressBar value={stats.percent} label={`${list.name} completion`} cells={16} />

      <div className="list-card__actions">
        <button type="button" className="btn btn--solid" onClick={() => openList(list.id)}>
          Enter
        </button>
        <Tooltip content="edit list">
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit list ${list.name}`}
            onClick={() => openDialog({ kind: 'list-form', listId: list.id })}
          >
            <Pencil aria-hidden="true" />
          </button>
        </Tooltip>
        <Tooltip content="remove list and all its tasks">
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            aria-label={`Delete list ${list.name}`}
            onClick={() => openDialog({ kind: 'confirm-delete-list', listId: list.id })}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </Panel>
  );
}
