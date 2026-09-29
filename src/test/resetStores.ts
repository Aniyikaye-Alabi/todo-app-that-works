import { idleFocusState } from '@/lib/focus';
import { useFocusStore } from '@/store/focusStore';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';

/** Resets every store to a clean slate. `bootSeen` defaults to true so UI tests skip the boot screen. */
export function resetStores({ bootSeen = true } = {}) {
  useSheriffStore.setState({
    lists: [],
    tasks: {},
    settings: { theme: 'phosphor', soundOn: false, bootSeen },
  });
  useFocusStore.setState(idleFocusState);
  useUIStore.setState({
    activeListId: null,
    dialog: null,
    paletteOpen: false,
    focusMinimized: false,
    toasts: [],
  });
}

export const validList = {
  name: 'Sprint 14',
  description: '',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  taskLimit: 3,
};

export const validTask = {
  title: 'Write tests',
  notes: '',
  priority: 'med' as const,
  durationMinutes: 60,
};
