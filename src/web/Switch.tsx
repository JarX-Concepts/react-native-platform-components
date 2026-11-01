// web/Switch.tsx
import React from 'react';
import { View } from 'react-native';

import type { SwitchProps } from '../Switch';
import { cssColor, usePrimaryColor } from './shared';

// Safari 17.4+ draws `<input type="checkbox" switch>` as a native switch;
// other browsers ignore the attribute and draw a checkbox. React passes an
// unknown attribute through only as a string.
const SWITCH_ATTRIBUTE = { switch: '' } as object;

/**
 * A checkbox with the switch role (`role="switch"`, `aria-checked`), tinted
 * with `color` or the brand color. With a `label`, a `<label>` row with the
 * text at the start and the box at the end, so the whole row toggles it.
 * The input carries the `testID`.
 */
export function Switch(props: SwitchProps): React.ReactElement {
  const primary = usePrimaryColor();
  const {
    value = false,
    onValueChange,
    disabled,
    label,
    color,
    // Browsers don't color a checkbox's track or thumb
    trackColor: _trackColor,
    thumbColor: _thumbColor,
    haptics: _haptics,
    // Browsers scale text with page zoom, which has no cap
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    android: _android,
    ...viewProps
  } = props;

  const input = (
    <input
      type="checkbox"
      role="switch"
      {...SWITCH_ATTRIBUTE}
      data-testid={testID}
      // Controlled: React puts a change the parent didn't take back
      checked={value}
      aria-checked={value}
      aria-label={accessibilityLabel}
      disabled={!!disabled}
      onChange={(event) =>
        onValueChange?.(
          (event.target as unknown as { checked: boolean }).checked
        )
      }
      style={{
        accentColor: cssColor(color) ?? primary,
        width: 20,
        height: 20,
        margin: 0,
        flexShrink: 0,
        cursor: disabled ? 'default' : 'pointer',
      }}
    />
  );

  if (!label) {
    return <View {...viewProps}>{input}</View>;
  }

  return (
    <View {...viewProps}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 48,
          color: 'CanvasText',
          fontSize: 16,
          opacity: disabled ? 0.38 : 1,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <span>{label}</span>
        {input}
      </label>
    </View>
  );
}
