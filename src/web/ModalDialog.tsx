// web/ModalDialog.tsx
import React, { useLayoutEffect, useRef } from 'react';

type DialogElement = {
  open: boolean;
  showModal?: () => void;
};

/**
 * A modal `<dialog>`, open while mounted: the shared surface of the web
 * pickers, menus and sheets (not the public `Dialog` component, which uses
 * it too). Escape and a click on the backdrop call `onDismiss`, unless
 * `dismissable` is `false`; like the native modals, the caller closes it by
 * flipping its `visible` prop, which unmounts it.
 */
export function ModalDialog({
  label,
  role,
  describedBy,
  dismissable = true,
  onDismiss,
  onOpen,
  children,
}: {
  label?: string;
  /** ARIA role of the `<dialog>`, e.g. `'alertdialog'`; default its own */
  role?: string;
  /** Id of the element that describes the dialog (`aria-describedby`) */
  describedBy?: string;
  /** `false`: Escape and a backdrop click do nothing */
  dismissable?: boolean;
  onDismiss: () => void;
  /** Called once the dialog is open, with whether `showModal` worked */
  onOpen?: (opened: boolean) => void;
  children: React.ReactNode;
}): React.ReactElement {
  const ref = useRef<DialogElement | null>(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useLayoutEffect(() => {
    const dialog = ref.current;
    let opened = true;
    if (dialog && !dialog.open) {
      try {
        dialog.showModal?.();
      } catch {
        opened = false;
      }
    }
    onOpenRef.current?.(opened);
  }, []);

  return (
    <dialog
      ref={(element) => {
        ref.current = element as unknown as DialogElement | null;
      }}
      role={role}
      aria-label={label}
      aria-describedby={describedBy}
      aria-modal={role === 'alertdialog' ? true : undefined}
      onCancel={(event) => {
        // Escape: a dialog that can't be dismissed stays open.
        if (!dismissable) event.preventDefault();
      }}
      onClose={onDismiss}
      onClick={(event) => {
        // The dialog has no padding, so a click on the element itself is a
        // click on the backdrop.
        if (dismissable && event.target === event.currentTarget) onDismiss();
      }}
      style={{
        padding: 0,
        border: 'none',
        borderRadius: 16,
        backgroundColor: 'Canvas',
        color: 'CanvasText',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ padding: 16 }}>{children}</div>
    </dialog>
  );
}
