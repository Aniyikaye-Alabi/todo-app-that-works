import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

/** Radix Dialog styled as a terminal window. Traps focus, closes on Esc, restores focus. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal__backdrop" />
        <Dialog.Content className={`modal modal--${size}`}>
          <header className="modal__header">
            <Dialog.Title className="modal__title">{title}</Dialog.Title>
            <Dialog.Close className="icon-btn" aria-label="Close">
              <X aria-hidden="true" />
            </Dialog.Close>
          </header>
          {description ? (
            <Dialog.Description className="hint">{`// ${description}`}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
