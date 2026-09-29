import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}

/** Destructive-action confirmation. Focus lands on CANCEL, never on the destructive button. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="modal__backdrop" />
        <AlertDialog.Content className="modal modal--alert" data-testid="confirm-dialog">
          <AlertDialog.Title className="modal__title modal__title--danger">
            <span aria-hidden="true">!! </span>
            {title}
            <span aria-hidden="true"> !!</span>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="modal__body">{children}</div>
          </AlertDialog.Description>
          <div className="modal__actions">
            <AlertDialog.Cancel className="btn btn--ghost">Cancel</AlertDialog.Cancel>
            <AlertDialog.Action className="btn btn--danger" onClick={onConfirm}>
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
