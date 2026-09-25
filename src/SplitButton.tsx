// SplitButton.tsx
import React, { useCallback, useMemo } from 'react';
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import type { ButtonSize, ButtonVariant } from './Button';
import NativeButtonGroup, {
  type ButtonGroupMenuSelectEvent,
} from './ButtonGroupNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import { flattenMenuActions, type ContextMenuAction } from './menuItems';
import type { Haptics } from './haptics';
import type { AndroidMaterialStyle } from './sharedTypes';

/**
 * Emphasis of a split button: the Button variants without `text`, which has
 * no container to split.
 */
export type SplitButtonVariant = Exclude<ButtonVariant, 'text'>;

export interface SplitButtonProps extends ViewProps {
  /** Text of the main button. Omit for an icon-only main button. */
  label?: string;

  /** Icon of the main button. See {@link PlatformIcon}. */
  icon?: PlatformIcon;

  /** Screen-reader label of the main button. Defaults to `label`. */
  accessibilityLabel?: string;

  /**
   * The menu the trailing button opens. Same items as ContextMenu:
   * submenus, sections, icons, states and attributes.
   */
  menu: readonly ContextMenuAction[];

  /**
   * Screen-reader label of the trailing menu button. Default:
   * `'More options'`.
   */
  menuAccessibilityLabel?: string;

  /** Emphasis. Default: `'filled'`. See {@link SplitButtonVariant}. */
  variant?: SplitButtonVariant;

  /** Size. Default: `'small'`. */
  size?: ButtonSize;

  /** Whether both buttons are disabled. */
  disabled?: boolean;

  /** Container (background) color. */
  color?: ColorValue;

  /** Label and icon color. */
  tintColor?: ColorValue;

  /** Label font. */
  labelStyle?: LabelStyle;

  /**
   * Haptic played when the main button is pressed or a menu item is picked
   * (not when the menu opens); a menu item's own `haptics` wins. Default:
   * none, like the native buttons. See {@link Haptics}.
   */
  haptics?: Haptics;

  /** Called when the main button is pressed. */
  onPress?: () => void;

  /** Called when a menu item is picked, with its id and title. */
  onMenuSelect?: (id: string, title: string) => void;

  /** Called when the menu opens. */
  onMenuOpen?: () => void;

  /** Called when the menu closes. */
  onMenuClose?: () => void;

  /**
   * Android-specific configuration
   */
  android?: {
    /** Ripple color shown while pressing. */
    rippleColor?: ColorValue;

    /** Outline color (outlined variant). */
    strokeColor?: ColorValue;

    /**
     * Material style: Material 3 Expressive (default), or the classic
     * Material 3 buttons, which have one size (`size` is ignored).
     */
    material?: AndroidMaterialStyle;
  };

  /** Test identifier */
  testID?: string;
}

/**
 * A main action with an attached menu, like "Send ▾".
 *
 * - Android: Material 3 `MaterialSplitButton`, a leading button and a
 *   trailing icon button whose chevron turns while the `PopupMenu` is open.
 * - iOS: a button joined to a chevron button that opens a `UIMenu`
 *   (`showsMenuAsPrimaryAction`).
 */
export function SplitButton(props: SplitButtonProps): React.ReactElement {
  const {
    label,
    icon,
    accessibilityLabel,
    menu,
    menuAccessibilityLabel,
    variant,
    size,
    disabled,
    color,
    tintColor,
    labelStyle,
    haptics,
    onPress,
    onMenuSelect,
    onMenuOpen,
    onMenuClose,
    android,
    ...viewProps
  } = props;

  const nativeButtons = useMemo(
    () => [
      {
        label: label ?? '',
        value: 'primary',
        disabled: 'enabled',
        accessibilityLabel: accessibilityLabel ?? '',
        ...resolveIcon(icon),
      },
    ],
    [label, icon, accessibilityLabel]
  );

  const nativeMenu = useMemo(() => flattenMenuActions(menu), [menu]);

  const nativeLabelStyle = useMemo(
    () => normalizeLabelStyle(labelStyle),
    [labelStyle]
  );

  const nativeAndroid = useMemo(
    () => ({ material: android?.material ?? 'expressive' }),
    [android?.material]
  );

  const handlePress = useCallback(() => onPress?.(), [onPress]);

  const handleMenuSelect = useCallback(
    (e: NativeSyntheticEvent<ButtonGroupMenuSelectEvent>) => {
      onMenuSelect?.(e.nativeEvent.id, e.nativeEvent.title);
    },
    [onMenuSelect]
  );

  const handleMenuOpen = useCallback(() => onMenuOpen?.(), [onMenuOpen]);
  const handleMenuClose = useCallback(() => onMenuClose?.(), [onMenuClose]);

  return (
    <NativeButtonGroup
      buttons={nativeButtons}
      split="true"
      menu={nativeMenu}
      menuAccessibilityLabel={menuAccessibilityLabel ?? 'More options'}
      variant={variant ?? 'filled'}
      size={size ?? 'small'}
      shape=""
      connected="true"
      spacing={-1}
      selection="none"
      selectedValues={[]}
      selectionRequired="false"
      interactivity={disabled ? 'disabled' : 'enabled'}
      color={color}
      foregroundColor={tintColor}
      androidRippleColor={android?.rippleColor}
      androidStrokeColor={android?.strokeColor}
      labelStyle={nativeLabelStyle}
      overflow="none"
      haptics={haptics ?? ''}
      onButtonPress={onPress ? handlePress : undefined}
      onMenuSelect={onMenuSelect ? handleMenuSelect : undefined}
      onMenuOpen={onMenuOpen ? handleMenuOpen : undefined}
      onMenuClose={onMenuClose ? handleMenuClose : undefined}
      android={nativeAndroid}
      {...viewProps}
    />
  );
}
