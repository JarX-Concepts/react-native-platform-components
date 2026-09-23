// web/Dialog.tsx
import React, { useLayoutEffect, useRef } from 'react';

type DialogElement = {
  open: boolean;
  showModal?: () => void;
};

/**
 * A modal `<dialog>`, open while mounted. Escape and a click on the backdrop
 * call `onDismiss`; like the native modals, the caller closes it by flipping
 * its `visible` prop, which unmounts it.
 */
export function Dialog({
  label,
  onDismiss,
  children,
}: {
  label?: string;
  onDismiss: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  const ref = useRef<DialogElement | null>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal?.();
  }, []);

  return (
    <dialog
      ref={(element) => {
        ref.current = element as unknown as DialogElement | null;
      }}
      aria-label={label}
      onClose={onDismiss}
      onClick={(event) => {
        // The dialog has no padding, so a click on the element itself is a
        // click on the backdrop.
        if (event.target === event.currentTarget) onDismiss();
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
