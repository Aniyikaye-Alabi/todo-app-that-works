import { Command as CommandIcon, Volume2, VolumeX } from 'lucide-react';
import { useNow } from '@/hooks/useNow';
import { currentPhase, remainingMs } from '@/lib/focus';
import { play, setSoundEnabled } from '@/lib/sound';
import { formatClock } from '@/lib/time';
import { useFocusStore } from '@/store/focusStore';
import { useSheriffStore } from '@/store/sheriffStore';
import { useUIStore } from '@/store/uiStore';

export function StatusBar() {
  const now = useNow(1000);
  const listCount = useSheriffStore((s) => s.lists.length);
  const soundOn = useSheriffStore((s) => s.settings.soundOn);
  const setSoundOn = useSheriffStore((s) => s.setSoundOn);
  const focus = useFocusStore();
  const minimized = useUIStore((s) => s.focusMinimized);
  const { setFocusMinimized, setPaletteOpen } = useUIStore.getState();

  const live = focus.status === 'running' || focus.status === 'paused';
  const showChip = (live || focus.status === 'finished') && minimized;
  const phase = currentPhase(focus);
  const clock = new Date(now).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) play('confirm');
  };

  return (
    <header className="statusbar" role="banner">
      <div className="statusbar__brand">
        <img src="/mr-sheriff-mark.svg" alt="" width={20} height={20} />
        <span className="statusbar__name">SHERIFF</span>
        <span className="statusbar__sys">
          <span aria-hidden="true">◆ </span>SYS::ONLINE
        </span>
      </div>

      <div className="statusbar__items">
        <span className="statusbar__item statusbar__item--hide-sm">LISTS {listCount}</span>
        {showChip && (
          <button
            type="button"
            className={`focus-chip${phase?.kind === 'break' ? ' focus-chip--break' : ''}`}
            onClick={() => setFocusMinimized(false)}
            data-testid="focus-chip"
          >
            {focus.status === 'finished'
              ? 'SESSION DONE'
              : `${focus.status === 'paused' ? 'PAUSED' : phase?.kind === 'break' ? 'BREAK' : 'FOCUS'} ${formatClock(
                  remainingMs(focus, now),
                )}`}
          </button>
        )}
        <span className="statusbar__item statusbar__clock">{clock}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
        >
          {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="btn btn--sm btn--ghost statusbar__cmd"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <CommandIcon aria-hidden="true" className="icon" />
          <kbd className="kbd">Ctrl K</kbd>
        </button>
      </div>
    </header>
  );
}
