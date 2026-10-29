// Chip.tsx
import React, { useCallback, useMemo, useState } from 'react';
import type { ViewProps } from 'react-native';

import NativeChip from './ChipNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import type { Haptics } from './haptics';

/**
 * The Material 3 chip types. They set the chip's style on Android; iOS has
 * no system chip, and every variant is the same capsule button there.
 *
 * | Variant      | Use                                      | Android style                     |
 * | ------------ | ---------------------------------------- | --------------------------------- |
 * | `assist`     | A smart or automated action              | `Widget.Material3.Chip.Assist`     |
 * | `filter`     | An option that filters content (toggles) | `Widget.Material3.Chip.Filter`     |
 * | `input`      | A piece of user input, often removable   | `Widget.Material3.Chip.Input`      |
 * | `suggestion` | A dynamically generated suggestion       | `Widget.Material3.Chip.Suggestion` |
 */
export type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

export interface ChipProps extends ViewProps {
  /** Chip text. */
  label: string;

  /**
   * Leading icon. See {@link PlatformIcon}. On Android a selected filter
   * chip shows its checkmark in the icon's place.
   */
  icon?: PlatformIcon;

  /**
   * Material 3 chip type. Default: `'filter'` when `selected` is set,
   * `'assist'` otherwise. See {@link ChipVariant}.
   */
  variant?: ChipVariant;

  /**
   * Makes the chip selectable, with this as its controlled state. The chip
   * shows what the prop says: a press calls `onPress`, and the chip changes
   * once `selected` does (and goes back if it doesn't).
   *
   * iOS: the button's selected state (`isSelected`, announced by VoiceOver)
   * with a filled capsule. Android: a checkable `Chip` (`isChecked`).
   */
  selected?: boolean;

  /** Called when the chip is pressed. */
  onPress?: () => void;

  /**
   * Shows the trailing close (remove) icon. Default: `true` when `onClose`
   * is set.
   */
  closeIcon?: boolean;

  /** Called when the close icon is pressed. */
  onClose?: () => void;

  /**
   * Screen-reader label of the close icon. Default: Material's localized
   * "Remove {label}" on Android, "Remove {label}" on iOS.
   */
  closeAccessibilityLabel?: string;

  /** Whether the chip is disabled. */
  disabled?: boolean;

  /**
   * Haptic played when the chip or its close icon is pressed. Default:
   * none, like the native chips. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Largest scale the label's font can reach with the system text size
   * (Dynamic Type / font scale), as on `Text`: `undefined` or `0` means no
   * cap; values of 1 or more cap it.
   */
  maxFontSizeMultiplier?: number;

  /**
   * Smallest height of the chip in points (dp). Default: the platform's
   * (30 on iOS, 32 on Android). The label stays centered and the font
   * keeps its size; see "Sizing" in the Chip docs.
   *
   * iOS: a minimum height for the capsule button. Android: `chipMinHeight`.
   */
  minHeight?: number;

  /**
   * Space in points (dp) between the chip's edges and its content (the
   * icon or label at the start, the label or close icon at the end).
   * Default: the platform's (12 on iOS; 4 to 16 on Android, by variant and
   * icon).
   *
   * iOS: the button configuration's leading and trailing `contentInsets`.
   * Android: `chipStartPadding` and `chipEndPadding`, less the text and icon
   * paddings Material already puts at the edges.
   */
  paddingHorizontal?: number;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /** Test identifier of the chip. */
  testID?: string;

  /**
   * Test identifier of the close icon. Default: `${testID}-close` when
   * `testID` is set. iOS: the close button's `accessibilityIdentifier`.
   * Android: the view tag of a view laid over the close icon, which
   * forwards its touches to the chip.
   */
  closeTestID?: string;
}

export function Chip(props: ChipProps): React.ReactElement {
  const {
    label,
    icon,
    variant,
    selected,
    onPress,
    closeIcon,
    onClose,
    closeAccessibilityLabel,
    disabled,
    haptics,
    maxFontSizeMultiplier,
    minHeight,
    paddingHorizontal,
    accessibilityLabel,
    testID,
    closeTestID,
    ...viewProps
  } = props;

  const nativeIcon = useMemo(() => resolveIcon(icon), [icon]);
  const isSelectable = selected !== undefined;

  // Controlled selection, like React Native's Switch: every press of a
  // selectable chip re-renders with a new event count, so native applies
  // `selected` again and a toggle the parent didn't take goes back.
  const [pressEventCount, setPressEventCount] = useState(0);
  const handlePress = useCallback(() => {
    if (isSelectable) setPressEventCount((count) => count + 1);
    onPress?.();
  }, [isSelectable, onPress]);

  const handleClose = useCallback(() => onClose?.(), [onClose]);

  return (
    <NativeChip
      label={label}
      icon={nativeIcon}
      variant={variant ?? (isSelectable ? 'filter' : 'assist')}
      selected={isSelectable ? (selected ? 'true' : 'false') : ''}
      pressEventCount={pressEventCount}
      closeIcon={(closeIcon ?? onClose !== undefined) ? 'true' : 'false'}
      closeAccessibilityLabel={closeAccessibilityLabel ?? ''}
      closeTestID={closeTestID ?? (testID ? `${testID}-close` : '')}
      interactivity={disabled ? 'disabled' : 'enabled'}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      chipMinHeight={minHeight ?? -1}
      chipPaddingHorizontal={paddingHorizontal ?? -1}
      spokenLabel={accessibilityLabel ?? ''}
      haptics={haptics ?? ''}
      onChipPress={onPress || isSelectable ? handlePress : undefined}
      onChipClose={onClose ? handleClose : undefined}
      testID={testID}
      {...viewProps}
    />
  );
}
