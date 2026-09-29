import { create } from 'zustand';

/** Ephemeral UI state — never persisted. */

export type Dialog =
  | { kind: 'list-form'; listId?: string }
  | { kind: 'task-form'; listId: string; taskId?: string }
  | { kind: 'confirm-delete-list'; listId: string }
  | { kind: 'confirm-delete-task'; taskId: string }
  | { kind: 'shortcuts' };

export type ToastTone = 'ok' | 'warn' | 'err' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface UIState {
  /** `null` = the board of all lists. */
  activeListId: string | null;
  dialog: Dialog | null;
  paletteOpen: boolean;
  /** Focus session keeps running while its overlay is hidden. */
  focusMinimized: boolean;
  toasts: Toast[];

  openList: (id: string | null) => void;
  openDialog: (dialog: Dialog) => void;
  closeDialog: () => void;
  setPaletteOpen: (open: boolean) => void;
  setFocusMinimized: (minimized: boolean) => void;
  toast: (tone: ToastTone, message: string) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;
const toastTimers = new Map<number, ReturnType<typeof setTimeout>>();
const TOAST_MS = 4000;

export const useUIStore = create<UIState>()((set, get) => ({
  activeListId: null,
  dialog: null,
  paletteOpen: false,
  focusMinimized: false,
  toasts: [],

  openList: (activeListId) => set({ activeListId }),
  openDialog: (dialog) => set({ dialog, paletteOpen: false }),
  closeDialog: () => set({ dialog: null }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setFocusMinimized: (focusMinimized) => set({ focusMinimized }),
  toast: (tone, message) => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, tone, message }] }));
    // Errors stay until dismissed (style guide §5.11).
    if (tone !== 'err')
      toastTimers.set(
        id,
        setTimeout(() => get().dismissToast(id), TOAST_MS),
      );
  },
  dismissToast: (id) => {
    clearTimeout(toastTimers.get(id));
    toastTimers.delete(id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
