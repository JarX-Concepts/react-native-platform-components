// web/Dialog.tsx
import React, { useId, useLayoutEffect, useRef, useState } from 'react';

import type { DialogProps } from '../Dialog';
import { ModalDialog } from './ModalDialog';

// Material 3 baseline error color, as on Android
const DESTRUCTIVE_COLOR = '#B3261E';

/** Dialogs open on the page: one never goes over another, as on Android. */
let openDialogs = 0;

/**
 * While `visible`, a modal `<dialog role="alertdialog">` with the title,
 * message and a `<button>` per action (`data-testid` from each action's
 * `testID`). The cancel action, Escape and a click outside call `onCancel`
 * (unless `dismissable` is `false`); the other actions call `onSelect`. A
 * dialog asked for while another one is open reports `onPresentFailed('busy')`.
 */
export function Dialog(props: DialogProps): React.ReactElement | null {
  const { visible, title, message, actions, dismissable = true } = props;

  const [phase, setPhase] = useState<'idle' | 'open' | 'failed'>('idle');
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const callbacks = useRef(props);
  callbacks.current = props;
  const id = useId();

  useLayoutEffect(() => {
    if (!visible) {
      setPhase('idle');
      return;
    }
    if (openDialogs > 0) {
      setPhase('failed');
      callbacks.current.onPresentFailed?.('busy');
      return;
    }
    openDialogs += 1;
    setPhase('open');
    return () => {
      openDialogs -= 1;
      // Closed through `visible` (not unmounted): it has gone.
      if (!visibleRef.current) callbacks.current.onDismiss?.();
    };
  }, [visible]);

  if (!visible || phase !== 'open') return null;

  const shown = actions.filter((action) => !action.hidden);
  const cancelAction = shown.find((action) => action.role === 'cancel');
  const preferred = shown.find(
    (action) => action.preferred && !action.disabled
  );
  const stacked = shown.length > 3;
  const cancel = () => callbacks.current.onCancel?.();

  return (
    <ModalDialog
      label={title ?? message ?? 'Dialog'}
      role="alertdialog"
      describedBy={message ? `${id}-message` : undefined}
      dismissable={dismissable}
      onDismiss={cancel}
      onOpen={(opened) => {
        if (opened) callbacks.current.onShow?.();
        else callbacks.current.onPresentFailed?.('rejected');
      }}
    >
      <div
        data-testid={props.testID}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          minWidth: 280,
          maxWidth: 400,
          padding: 8,
        }}
      >
        {title ? (
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{title}</h2>
        ) : null}
        {message ? (
          <p
            id={`${id}-message`}
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: '20px',
              opacity: 0.8,
            }}
          >
            {message}
          </p>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexDirection: stacked ? 'column' : 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            alignItems: stacked ? 'flex-end' : 'center',
            gap: 8,
          }}
        >
          {shown.map((action) => {
            const destructive = action.role === 'destructive';
            const isCancel = action === cancelAction;
            return (
              <button
                key={action.id}
                type="button"
                data-testid={action.testID}
                disabled={action.disabled}
                autoFocus={action === preferred}
                onClick={() => {
                  if (action.disabled) return;
                  if (isCancel) cancel();
                  else callbacks.current.onSelect?.(action.id);
                }}
                style={{
                  minHeight: 40,
                  padding: '0 12px',
                  border: 'none',
                  borderRadius: 20,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: action === preferred ? 600 : 500,
                  color: destructive ? DESTRUCTIVE_COLOR : 'inherit',
                  opacity: action.disabled ? 0.38 : 1,
                  backgroundColor: 'transparent',
                  cursor: action.disabled ? 'default' : 'pointer',
                  order: stacked && isCancel ? 1 : undefined,
                }}
              >
                {action.title}
              </button>
            );
          })}
        </div>
      </div>
    </ModalDialog>
  );
}
