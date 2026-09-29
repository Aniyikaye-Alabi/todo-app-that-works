import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { Keyboard, ListChecks, Palette, Play, Plus, Volume2, VolumeX } from 'lucide-react';
import { play } from '@/lib/sound';
import { useFocusStore } from '@/store/focusStore';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';
import type { ThemeName } from '@/types';

const THEMES: ThemeName[] = ['phosphor', 'amber', 'cyberpunk', 'clean'];

/** `Ctrl/Cmd + K` — jump to lists, start focus, switch theme, toggle sound. */
export function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const setOpen = useUIStore((s) => s.setPaletteOpen);
  const activeListId = useUIStore((s) => s.activeListId);
  const lists = useSheriffStore((s) => s.lists);
  const tasks = useSheriffStore((s) => s.tasks);
  const settings = useSheriffStore((s) => s.settings);

  const activeList = lists.find((l) => l.id === activeListId);
  const openTasks = (activeList?.taskIds ?? [])
    .map((id) => tasks[id])
    .filter((t) => t && !t.completed && t.durationMinutes > t.focusedMinutes);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const ui = useUIStore.getState();
  const { setTheme, setSoundOn } = useSheriffStore.getState();

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="palette"
      overlayClassName="modal__backdrop"
      contentClassName="palette__content"
    >
      <Dialog.Title className="sr-only">Command palette</Dialog.Title>
      <div className="palette__input-wrap">
        <span aria-hidden="true" className="palette__prompt">
          &gt;
        </span>
        <Command.Input className="palette__input" placeholder="// type a command or list name" />
      </div>
      <Command.List className="palette__list">
        <Command.Empty className="palette__empty">// NO MATCHES</Command.Empty>

        <Command.Group heading="Actions">
          <Command.Item onSelect={run(() => ui.openDialog({ kind: 'list-form' }))}>
            <Plus aria-hidden="true" /> New list
          </Command.Item>
          {activeList && (
            <Command.Item
              disabled={activeList.taskIds.length >= activeList.taskLimit}
              onSelect={run(() => ui.openDialog({ kind: 'task-form', listId: activeList.id }))}
            >
              <Plus aria-hidden="true" /> New task in {activeList.name}
            </Command.Item>
          )}
          <Command.Item onSelect={run(() => ui.openList(null))}>
            <ListChecks aria-hidden="true" /> Go to board
          </Command.Item>
          <Command.Item onSelect={run(() => setSoundOn(!settings.soundOn))}>
            {settings.soundOn ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
            {settings.soundOn ? 'Mute sound' : 'Unmute sound'}
          </Command.Item>
          <Command.Item onSelect={run(() => ui.openDialog({ kind: 'shortcuts' }))}>
            <Keyboard aria-hidden="true" /> Keyboard shortcuts
          </Command.Item>
        </Command.Group>

        {openTasks.length > 0 && (
          <Command.Group heading="Start focus">
            {openTasks.map((t) => (
              <Command.Item
                key={t!.id}
                value={`focus ${t!.title} ${t!.id}`}
                onSelect={run(() => {
                  if (useFocusStore.getState().start(t!.id)) ui.setFocusMinimized(false);
                })}
              >
                <Play aria-hidden="true" /> {t!.title}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {lists.length > 0 && (
          <Command.Group heading="Lists">
            {lists.map((l) => (
              <Command.Item
                key={l.id}
                value={`list ${l.name} ${l.id}`}
                onSelect={run(() => ui.openList(l.id))}
              >
                <ListChecks aria-hidden="true" /> {l.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Theme">
          {THEMES.map((t) => (
            <Command.Item
              key={t}
              value={`theme ${t}`}
              onSelect={run(() => {
                setTheme(t);
                play('tick');
              })}
            >
              <Palette aria-hidden="true" /> Theme: {t}
              {settings.theme === t && <span className="palette__current"> [ACTIVE]</span>}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
