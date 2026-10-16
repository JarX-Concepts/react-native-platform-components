// web/ActionSheet.tsx
import React from 'react';
import { View } from 'react-native';

import type { ActionSheetProps } from '../ActionSheet';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

// Material 3 baseline error color, as on Android
const DESTRUCTIVE_COLOR = '#B3261E';

/**
 * Renders its children; while `visible`, the title, message and actions open
 * in a `<dialog>` with a cancel button below them. Picking an action calls
 * `onSelect`; the cancel button, Escape and a click outside call `onCancel`.
 * Icons draw only for image sources (`{ type: 'image' }`); each button
 * carries its action's `testID` as `data-testid`.
 */
export function ActionSheet(props: ActionSheetProps): React.ReactElement {
  const {
    visible,
    title,
    message,
    actions,
    cancelTitle,
    cancelTestID,
    haptics,
    maxFontSizeMultiplier,
    onSelect,
    onCancel,
    accessibilityLabel,
    children,
    ...viewProps
  } = props;

  const label = accessibilityLabel ?? title ?? 'Actions';
  const shown = actions.filter((action) => !action.attributes?.hidden);
  const cancel = () => onCancel?.();

  return (
    <View {...viewProps}>
      {children}
      {visible ? (
        <Dialog label={label} onDismiss={cancel}>
          <div
            style={{ display: 'flex', flexDirection: 'column', minWidth: 240 }}
          >
            {title || message ? (
              <div style={{ padding: '4px 12px 12px', textAlign: 'center' }}>
                {title ? (
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                ) : null}
                {message ? (
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                    {message}
                  </div>
                ) : null}
              </div>
            ) : null}
            {shown.map((action, index) => {
              const destructive = !!action.attributes?.destructive;
              const color = destructive ? DESTRUCTIVE_COLOR : 'inherit';
              return (
                <button
                  key={action.id}
                  type="button"
                  data-testid={action.testID}
                  disabled={action.attributes?.disabled}
                  autoFocus={
                    index ===
                    shown.findIndex((item) => !item.attributes?.disabled)
                  }
                  onClick={() => {
                    if (!action.attributes?.disabled) onSelect?.(action.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 44,
                    padding: '0 12px',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 16,
                    textAlign: 'start',
                    color,
                    opacity: action.attributes?.disabled ? 0.4 : 1,
                    backgroundColor: 'transparent',
                    cursor: action.attributes?.disabled ? 'default' : 'pointer',
                  }}
                >
                  <Icon
                    icon={action.image}
                    color={
                      action.imageColor ??
                      (destructive ? DESTRUCTIVE_COLOR : 'CanvasText')
                    }
                  />
                  <span>{action.title}</span>
                </button>
              );
            })}
            <button
              type="button"
              data-testid={cancelTestID}
              onClick={cancel}
              style={{
                minHeight: 44,
                marginTop: 8,
                padding: '0 12px',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'inherit',
                fontSize: 16,
                fontWeight: 600,
                color: 'inherit',
                backgroundColor:
                  'color-mix(in srgb, CanvasText 8%, transparent)',
                cursor: 'pointer',
              }}
            >
              {cancelTitle ?? 'Cancel'}
            </button>
          </div>
        </Dialog>
      ) : null}
    </View>
  );
}
