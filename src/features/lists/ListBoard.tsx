import { Plus } from 'lucide-react';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import { ListCard } from './ListCard';

export function ListBoard() {
  const lists = useSheriffStore((s) => s.lists);
  const openDialog = useUIStore((s) => s.openDialog);
  const newList = () => openDialog({ kind: 'list-form' });

  return (
    <div className="view">
      <header className="view__header">
        <div>
          <p className="eyebrow">SHERIFF::BOARD</p>
          <h1 className="h1">
            <span aria-hidden="true">&gt; </span>Your lists
          </h1>
        </div>
        <button type="button" className="btn btn--solid" onClick={newList}>
          <Plus aria-hidden="true" className="icon" /> New list <kbd className="kbd">N</kbd>
        </button>
      </header>

      {lists.length === 0 ? (
        <div className="empty" data-testid="board-empty">
          <img src="/mr-sheriff-mark.svg" alt="" className="empty__mark" width={96} height={96} />
          <p className="empty__title">// NO LISTS ON THE BOOKS</p>
          <p className="empty__body">
            Every job starts with a list. Set its dates and a task limit, and the sheriff keeps you
            honest.
          </p>
          <button type="button" className="btn" onClick={newList}>
            Create first list
          </button>
        </div>
      ) : (
        <div className="grid" data-testid="list-grid">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
