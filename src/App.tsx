import { useCallback, useEffect } from 'react';
import { BootSequence } from '@/components/BootSequence';
import { DialogHost } from '@/components/DialogHost';
import { StatusBar } from '@/components/StatusBar';
import { Toaster } from '@/components/Toaster';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { CommandPalette } from '@/features/command/CommandPalette';
import { FocusController } from '@/features/focus/FocusSession';
import { ListBoard } from '@/features/lists/ListBoard';
import { ListView } from '@/features/tasks/ListView';
import { useHotkeys } from '@/hooks/useHotkeys';
import { setSoundEnabled } from '@/lib/sound';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';

export default function App() {
  const settings = useSheriffStore((s) => s.settings);
  const markBootSeen = useSheriffStore((s) => s.markBootSeen);
  const activeListId = useUIStore((s) => s.activeListId);
  const activeList = useSheriffStore((s) => s.lists.find((l) => l.id === activeListId));
  const blocked = useUIStore((s) => s.dialog !== null || s.paletteOpen);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    setSoundEnabled(settings.soundOn);
  }, [settings.soundOn]);

  // A list deleted elsewhere (e.g. via the palette) drops you back on the board.
  useEffect(() => {
    if (activeListId && !activeList) useUIStore.getState().openList(null);
  }, [activeListId, activeList]);

  const ui = useUIStore.getState;
  useHotkeys({
    '$mod+k': (e) => {
      e.preventDefault();
      ui().setPaletteOpen(!ui().paletteOpen);
    },
  });
  useHotkeys(
    {
      n: (e) => {
        e.preventDefault();
        if (activeList) {
          if (activeList.taskIds.length < activeList.taskLimit) {
            ui().openDialog({ kind: 'task-form', listId: activeList.id });
          } else {
            ui().toast('warn', 'TASK LIMIT REACHED');
          }
        } else {
          ui().openDialog({ kind: 'list-form' });
        }
      },
      'g h': () => ui().openList(null),
      m: () => {
        const on = !useSheriffStore.getState().settings.soundOn;
        useSheriffStore.getState().setSoundOn(on);
      },
      'Shift+?': () => ui().openDialog({ kind: 'shortcuts' }),
    },
    !blocked,
  );

  const finishBoot = useCallback(() => markBootSeen(), [markBootSeen]);
  if (!settings.bootSeen) return <BootSequence onDone={finishBoot} />;

  return (
    <TooltipProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <StatusBar />
      <main id="main" className="main">
        {activeList ? <ListView list={activeList} /> : <ListBoard />}
      </main>
      <footer className="footer">
        <span aria-hidden="true">//</span> press <kbd className="kbd">?</kbd> for shortcuts ·{' '}
        <kbd className="kbd">Ctrl K</kbd> for commands
      </footer>
      <DialogHost />
      <CommandPalette />
      <FocusController />
      <Toaster />
    </TooltipProvider>
  );
}
