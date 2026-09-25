// web/ButtonGroup.tsx
import React from 'react';
import { View } from 'react-native';

import type { ButtonGroupProps } from '../ButtonGroup';
import { Icon } from './Icon';
import {
  BUTTON_BASE,
  BUTTON_SIZES,
  buttonColors,
  cssColor,
  cssFont,
  usePrimaryColor,
} from './shared';

/**
 * The selection after pressing `value`, in button order. Mirrors the native
 * rules: `single` swaps the selection, `multiple` toggles, and a required
 * selection never becomes empty.
 */
export function nextSelection(
  values: readonly string[],
  selected: readonly string[],
  value: string,
  selection: 'single' | 'multiple',
  required: boolean
): string[] {
  const isSelected = selected.includes(value);
  let next: string[];
  if (selection === 'single') {
    next = isSelected ? [] : [value];
  } else {
    next = isSelected
      ? selected.filter((v) => v !== value)
      : [...selected, value];
  }
  if (required && next.length === 0) return [...selected];
  return values.filter((v) => next.includes(v));
}

/** A row of `<button>`s, with toggle semantics when `selection` is set. */
export function ButtonGroup(props: ButtonGroupProps): React.ReactElement {
  const {
    buttons,
    variant = 'outlined',
    size = 'small',
    shape = 'round',
    connected: connectedProp,
    spacing,
    selection = 'none',
    selectedValues = [],
    selectionRequired,
    disabled,
    color,
    tintColor,
    labelStyle,
    overflow,
    onPress,
    onSelectionChange,
    android,
    style,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();
  const metrics = BUTTON_SIZES[size] ?? BUTTON_SIZES.small!;
  const selectable = selection !== 'none';
  const connected = connectedProp ?? selectable;
  const required = selectionRequired ?? selection === 'single';
  const selected =
    selection === 'single' ? selectedValues.slice(0, 1) : selectedValues;
  const radius = shape === 'square' ? 12 : metrics.height / 2;
  const innerRadius = 8;
  const gap = spacing ?? (connected ? 2 : 8);
  // Browsers have no overflow menu; 'wrap' wraps the row
  const wrap = (overflow ?? android?.overflow) === 'wrap';

  const handlePress = (value: string, index: number) => {
    onPress?.(value, index);
    if (selection === 'none') return;
    const next = nextSelection(
      buttons.map((b) => b.value),
      selected,
      value,
      selection,
      required
    );
    const changed =
      next.length !== selected.length ||
      next.some((v) => !selected.includes(v));
    if (changed) onSelectionChange?.(next);
  };

  return (
    <View
      {...viewProps}
      role={selection === 'single' ? 'radiogroup' : 'group'}
      style={[
        {
          flexDirection: 'row',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          gap,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {buttons.map((button, index) => {
        const isSelected = selectable && selected.includes(button.value);
        const isDisabled = disabled || button.disabled;
        const colors = buttonColors(
          isSelected ? 'filled' : variant,
          primary,
          isSelected ? undefined : cssColor(color),
          isSelected ? undefined : cssColor(tintColor)
        );
        const first = index === 0;
        const last = index === buttons.length - 1;
        const start = !connected || first ? radius : innerRadius;
        const end = !connected || last ? radius : innerRadius;
        return (
          <button
            key={button.value}
            type="button"
            disabled={isDisabled}
            role={selection === 'single' ? 'radio' : undefined}
            aria-checked={selection === 'single' ? isSelected : undefined}
            aria-pressed={selection === 'multiple' ? isSelected : undefined}
            aria-label={button.accessibilityLabel ?? button.label}
            onClick={() => handlePress(button.value, index)}
            style={{
              ...BUTTON_BASE,
              ...colors,
              height: metrics.height,
              minWidth: metrics.height,
              padding: button.label ? `0 ${metrics.padding}px` : 0,
              borderRadius: `${start}px ${end}px ${end}px ${start}px`,
              fontSize: metrics.fontSize,
              opacity: isDisabled ? 0.38 : 1,
              cursor: isDisabled ? 'default' : 'pointer',
              ...cssFont(labelStyle),
            }}
          >
            <Icon
              icon={button.icon}
              color={colors.color as string | undefined}
            />
            {button.label}
          </button>
        );
      })}
    </View>
  );
}
