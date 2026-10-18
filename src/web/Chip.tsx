// web/Chip.tsx
import React from 'react';
import { View } from 'react-native';

import type { ChipProps } from '../Chip';
import type { ChipGroupProps } from '../ChipGroup';
import { nextSelection } from './ButtonGroup';
import { Icon } from './Icon';
import { BUTTON_BASE, usePrimaryColor, type CSSStyle } from './shared';

const CHIP_HEIGHT = 32;

/** The pill around a chip's buttons, after the Material 3 chip tokens. */
function chipStyle(
  primary: string,
  selected: boolean,
  disabled: boolean
): CSSStyle {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    height: CHIP_HEIGHT,
    borderRadius: 8,
    border: selected
      ? `1px solid color-mix(in srgb, ${primary} 18%, Canvas)`
      : '1px solid color-mix(in srgb, CanvasText 30%, transparent)',
    backgroundColor: selected
      ? `color-mix(in srgb, ${primary} 18%, Canvas)`
      : 'transparent',
    color: 'CanvasText',
    opacity: disabled ? 0.38 : 1,
    overflow: 'hidden',
  };
}

const PLAIN_BUTTON: CSSStyle = {
  ...BUTTON_BASE,
  height: '100%',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'inherit',
  fontSize: 14,
  padding: 0,
};

interface WebChipProps {
  label: string;
  icon?: ChipProps['icon'];
  selected?: boolean;
  closeIcon: boolean;
  disabled: boolean;
  accessibilityLabel?: string;
  closeAccessibilityLabel?: string;
  testID?: string;
  closeTestID?: string;
  onPress: () => void;
  onClose: () => void;
}

/**
 * One chip: a toggle `<button>` (`aria-pressed` when selectable) and, beside
 * it in the same pill, a close `<button>`. Buttons can't nest, so the pill is
 * a wrapper around both.
 */
function WebChip(props: WebChipProps): React.ReactElement {
  const primary = usePrimaryColor();
  const {
    label,
    icon,
    selected,
    closeIcon,
    disabled,
    accessibilityLabel,
    closeAccessibilityLabel,
    testID,
    closeTestID,
    onPress,
    onClose,
  } = props;
  return (
    <span style={chipStyle(primary, !!selected, disabled)}>
      <button
        type="button"
        data-testid={testID}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={accessibilityLabel ?? label}
        onClick={onPress}
        style={{
          ...PLAIN_BUTTON,
          paddingLeft: icon ? 8 : 16,
          paddingRight: closeIcon ? 8 : 16,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <Icon icon={icon} color={primary} size={18} />
        {label}
      </button>
      {closeIcon ? (
        <button
          type="button"
          data-testid={closeTestID}
          disabled={disabled}
          aria-label={closeAccessibilityLabel ?? `Remove ${label}`}
          onClick={onClose}
          style={{
            ...PLAIN_BUTTON,
            width: 28,
            paddingRight: 4,
            cursor: disabled ? 'default' : 'pointer',
          }}
        >
          ✕
        </button>
      ) : null}
    </span>
  );
}

/** A chip after the Material 3 chip, with a close button beside it. */
export function Chip(props: ChipProps): React.ReactElement {
  const {
    label,
    icon,
    variant: _variant,
    selected,
    onPress,
    closeIcon,
    onClose,
    closeAccessibilityLabel,
    disabled,
    haptics: _haptics,
    // Browsers scale text with page zoom, which has no cap
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    closeTestID,
    style,
    ...viewProps
  } = props;

  return (
    <View {...viewProps} style={[{ alignSelf: 'flex-start' }, style]}>
      <WebChip
        label={label}
        icon={icon}
        selected={selected}
        closeIcon={closeIcon ?? onClose !== undefined}
        disabled={!!disabled}
        accessibilityLabel={accessibilityLabel}
        closeAccessibilityLabel={closeAccessibilityLabel}
        testID={testID}
        closeTestID={closeTestID ?? (testID ? `${testID}-close` : undefined)}
        onPress={() => onPress?.()}
        onClose={() => onClose?.()}
      />
    </View>
  );
}

/**
 * A row of chips that wraps (or scrolls horizontally with `wrap={false}`),
 * with toggle semantics when `selection` is set.
 */
export function ChipGroup(props: ChipGroupProps): React.ReactElement {
  const {
    chips,
    variant: _variant,
    selection = 'none',
    selectedValues = [],
    selectionRequired,
    wrap = true,
    spacing = 8,
    disabled,
    haptics: _haptics,
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    onPress,
    onSelectionChange,
    onClose,
    testID,
    style,
    ...viewProps
  } = props;

  const required = selectionRequired ?? selection === 'single';
  const selected =
    selection === 'single' ? selectedValues.slice(0, 1) : selectedValues;

  const handlePress = (value: string, index: number) => {
    onPress?.(value, index);
    if (selection === 'none') return;
    const next = nextSelection(
      chips.map((c) => c.value),
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
      testID={testID}
      role="group"
      style={[
        {
          flexDirection: 'row',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          overflow: wrap ? 'visible' : 'scroll',
          gap: spacing,
        },
        style,
      ]}
    >
      {chips.map((chip, index) => (
        <WebChip
          key={chip.value}
          label={chip.label}
          icon={chip.icon}
          selected={
            selection === 'none' ? undefined : selected.includes(chip.value)
          }
          closeIcon={chip.closeIcon ?? onClose !== undefined}
          disabled={!!(disabled || chip.disabled)}
          accessibilityLabel={chip.accessibilityLabel}
          closeAccessibilityLabel={chip.closeAccessibilityLabel}
          testID={
            chip.testID ?? (testID ? `${testID}-${chip.value}` : undefined)
          }
          closeTestID={
            chip.closeTestID ??
            (testID ? `${testID}-${chip.value}-close` : undefined)
          }
          onPress={() => handlePress(chip.value, index)}
          onClose={() => onClose?.(chip.value, index)}
        />
      ))}
    </View>
  );
}
