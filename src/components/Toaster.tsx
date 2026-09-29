import { X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const TAG = { ok: '[OK]', warn: '[WARN]', err: '[ERR]', info: '[INFO]' } as const;

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);
  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.tone}`}
          role={t.tone === 'err' ? 'alert' : 'status'}
        >
          <span className="toast__tag">{TAG[t.tone]}</span>
          <span className="toast__msg">{t.message}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
