// Button.tsx
import React, { useCallback, useMemo, useState } from 'react';
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import NativeButton, {
  type ButtonMenuSelectEvent,
  type ButtonSelectedChangeEvent,
} from './ButtonNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import { flattenMenuActions, type ContextMenuAction } from './menuItems';
import type { AndroidMaterialStyle } from './sharedTypes';

/**
 * Emphasis of the button, from highest to lowest.
 *
 * | Variant    | Android (Material 3 Expressive) | iOS (`UIButton.Configuration`) |
 * | ---------- | ------------------------------- | ------------------------------ |
 * | `filled`   | Filled button                   | `.filled()`                    |
 * | `tonal`    | Filled tonal button             | `.tinted()`                    |
 * | `outlined` | Outlined button                 | `.bordered()`                  |
 * | `text`     | Text button                     | `.plain()`                     |
 * | `elevated` | Elevated button                 | `.gray()`                      |
 * | `glass`    | Filled tonal button             | `.glass()` (iOS 26+), else `.gray()` |
 * | `prominentGlass` | Filled button             | `.prominentGlass()` (iOS 26+), else `.filled()` |
 * | `clearGlass` | Filled tonal button           | `.clearGlass()` (iOS 26+), else `.gray()` |
 * | `prominentClearGlass` | Filled button        | `.prominentClearGlass()` (iOS 26+), else `.filled()` |
 *
 * The glass variants are the iOS 26 Liquid Glass buttons; `color` tints
 * the prominent glass and `tintColor` colors the label and icon. Clear glass
 * is more transparent, for buttons over photos and other rich content.
 */
export type ButtonVariant =
  | 'filled'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'elevated'
  | 'glass'
  | 'prominentGlass'
  | 'clearGlass'
  | 'prominentClearGlass';

/**
 * Button size. Material 3 Expressive defines five sizes; iOS maps them onto
 * `UIButton.Configuration.Size` (`xsmall` → mini, `xlarge` → large).
 */
export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Corner shape. `round` is a pill; `square` keeps rounded corners. Unset
 * means the platform default (round on Android, dynamic on iOS).
 */
export type ButtonShape = 'round' | 'square';

/** Where the icon sits relative to the label. */
export type ButtonIconPosition = 'leading' | 'trailing' | 'top' | 'bottom';

/**
 * An animated SF Symbol effect (iOS 17+). `wiggle`, `rotate` and `breathe`
 * need iOS 18; on earlier versions they do nothing.
 */
export type ButtonSymbolEffect =
  'bounce' | 'pulse' | 'variableColor' | 'wiggle' | 'rotate' | 'breathe';

export interface ButtonProps extends ViewProps {
  /** Button text. Omit for an icon-only button. */
  label?: string;

  /** Icon shown next to the label, or alone when there is no label. */
  icon?: PlatformIcon;

  /**
   * Where the icon sits relative to the label. Default: `'leading'`.
   * iOS: `imagePlacement`. Android: `iconGravity` (`textEnd` for trailing,
   * `textTop` for top). Material has no bottom gravity, so `'bottom'` puts the
   * icon on top on Android.
   */
  iconPosition?: ButtonIconPosition;

  /** Emphasis. Default: `'filled'`. See {@link ButtonVariant}. */
  variant?: ButtonVariant;

  /** Size. Default: `'small'`, the Material 3 default. */
  size?: ButtonSize;

  /** Corner shape. Default: platform default. */
  shape?: ButtonShape;

  /**
   * Corner radius in points (dp). Overrides `shape` when set.
   * iOS: `background.cornerRadius` with the fixed corner style. Android: the
   * `shapeAppearanceModel` corner size (the press morph is turned off).
   */
  cornerRadius?: number;

  /** Whether the button is disabled. */
  disabled?: boolean;

  /**
   * Shows a native spinner in place of the label and icon, keeping the
   * button's size, and ignores presses. Sets `accessibilityState.busy`.
   * iOS: `UIButton.Configuration.showsActivityIndicator`. Android: a Material
   * circular progress indicator drawn as the button icon.
   */
  loading?: boolean;

  /**
   * Container (background) color.
   * Android: `backgroundTint`. iOS: `baseBackgroundColor`.
   */
  color?: ColorValue;

  /**
   * Label and icon color.
   * Android: text color and `iconTint`. iOS: `baseForegroundColor`.
   */
  tintColor?: ColorValue;

  /**
   * Container color while disabled. Unset keeps the platform's disabled look.
   * iOS: a `configurationUpdateHandler` on `isEnabled`. Android: the disabled
   * state of the `backgroundTint` color state list.
   */
  disabledColor?: ColorValue;

  /**
   * Label and icon color while disabled. Unset keeps the platform's disabled
   * look. iOS: a `configurationUpdateHandler` on `isEnabled`. Android: the
   * disabled state of the text color and `iconTint` color state lists.
   */
  disabledTintColor?: ColorValue;

  /** Label font. */
  labelStyle?: LabelStyle;

  /**
   * Largest scale the label's font can reach with the system text size
   * (Dynamic Type / font scale), as on `Text`: `undefined` or `0` means no
   * cap; values of 1 or more cap it.
   */
  maxFontSizeMultiplier?: number;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /**
   * Called when the button is pressed. A button with a `menu` opens the menu
   * instead.
   */
  onPress?: () => void;

  /**
   * Makes the button a toggle, with this as its controlled state. A press
   * calls `onSelectedChange` with the opposite value; the button shows the
   * new state once `selected` changes, and goes back if it doesn't.
   *
   * iOS: `changesSelectionAsPrimaryAction` and `isSelected`, with the
   * configuration's selected look. Android: a checkable `MaterialButton`
   * (`isChecked`), with the Material toggle button colors and shape.
   */
  selected?: boolean;

  /** Called when a toggle button is pressed, with the state it asks for. */
  onSelectedChange?: (selected: boolean) => void;

  /**
   * A menu the button opens when pressed, in place of `onPress`. Same items
   * as ContextMenu: submenus, sections, icons, states and attributes.
   *
   * iOS: `UIButton.menu` with `showsMenuAsPrimaryAction`. Android: a
   * `PopupMenu` anchored to the button.
   */
  menu?: readonly ContextMenuAction[];

  /** Called when a menu item is picked, with its id and title. */
  onMenuSelect?: (id: string, title: string) => void;

  /** Called when the menu opens. */
  onMenuOpen?: () => void;

  /** Called when the menu closes. */
  onMenuClose?: () => void;

  /**
   * iOS-specific configuration
   */
  ios?: {
    /**
     * Animates the SF Symbol icon (`UIImageView.addSymbolEffect`, iOS 17+;
     * `wiggle`, `rotate` and `breathe` need iOS 18). Without
     * `symbolEffectTrigger` the effect repeats until it is unset. Ignored
     * for image icons and on Android.
     */
    symbolEffect?: ButtonSymbolEffect;

    /**
     * Plays `symbolEffect` once each time this value changes, instead of
     * repeating it. The first value doesn't play.
     */
    symbolEffectTrigger?: number | string;
  };

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
     * Material 3 button, which has one size and shape (`size` and `shape`
     * are ignored).
     */
    material?: AndroidMaterialStyle;
  };

  /** Test identifier */
  testID?: string;
}

export function Button(props: ButtonProps): React.ReactElement {
  const {
    label,
    icon,
    iconPosition,
    variant,
    size,
    shape,
    cornerRadius,
    disabled,
    loading,
    color,
    tintColor,
    disabledColor,
    disabledTintColor,
    labelStyle,
    maxFontSizeMultiplier,
    accessibilityLabel,
    onPress,
    selected,
    onSelectedChange,
    menu,
    onMenuSelect,
    onMenuOpen,
    onMenuClose,
    ios,
    android,
    accessibilityState,
    ...viewProps
  } = props;

  const nativeIcon = useMemo(() => resolveIcon(icon), [icon]);
  const nativeLabelStyle = useMemo(
    () => normalizeLabelStyle(labelStyle),
    [labelStyle]
  );

  const nativeMenu = useMemo(
    () => (menu ? flattenMenuActions(menu) : []),
    [menu]
  );

  const handlePress = useCallback(() => {
    if (loading) return;
    onPress?.();
  }, [onPress, loading]);

  // Controlled toggle, like React Native's Switch: every press re-renders
  // with a new event count, so native applies `selected` again and a state
  // the parent didn't take goes back.
  const [selectedEventCount, setSelectedEventCount] = useState(0);
  const handleSelectedChange = useCallback(
    (e: NativeSyntheticEvent<ButtonSelectedChangeEvent>) => {
      setSelectedEventCount((count) => count + 1);
      onSelectedChange?.(e.nativeEvent.selected);
    },
    [onSelectedChange]
  );

  const handleMenuSelect = useCallback(
    (e: NativeSyntheticEvent<ButtonMenuSelectEvent>) => {
      onMenuSelect?.(e.nativeEvent.id, e.nativeEvent.title);
    },
    [onMenuSelect]
  );

  const handleMenuOpen = useCallback(() => onMenuOpen?.(), [onMenuOpen]);
  const handleMenuClose = useCallback(() => onMenuClose?.(), [onMenuClose]);

  const nativeIOS = useMemo(
    () => ({
      symbolEffect: ios?.symbolEffect ?? '',
      symbolEffectTrigger:
        ios?.symbolEffectTrigger === undefined
          ? ''
          : String(ios.symbolEffectTrigger),
    }),
    [ios?.symbolEffect, ios?.symbolEffectTrigger]
  );

  const isToggle = selected !== undefined;

  const mergedAccessibilityState = useMemo(
    () =>
      loading ? { ...accessibilityState, busy: true } : accessibilityState,
    [loading, accessibilityState]
  );

  return (
    <NativeButton
      label={label ?? ''}
      icon={nativeIcon}
      iconPosition={iconPosition ?? 'leading'}
      variant={variant ?? 'filled'}
      size={size ?? 'small'}
      shape={shape ?? ''}
      cornerRadius={cornerRadius ?? -1}
      interactivity={disabled ? 'disabled' : 'enabled'}
      loading={loading ? 'true' : 'false'}
      color={color}
      foregroundColor={tintColor}
      disabledColor={disabledColor}
      disabledForegroundColor={disabledTintColor}
      androidRippleColor={android?.rippleColor}
      androidStrokeColor={android?.strokeColor}
      androidMaterial={android?.material ?? 'expressive'}
      labelStyle={nativeLabelStyle}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      spokenLabel={accessibilityLabel ?? ''}
      selected={isToggle ? (selected ? 'true' : 'false') : ''}
      selectedEventCount={selectedEventCount}
      menu={nativeMenu}
      ios={nativeIOS}
      onButtonPress={onPress ? handlePress : undefined}
      onSelectedChange={isToggle ? handleSelectedChange : undefined}
      onMenuSelect={onMenuSelect ? handleMenuSelect : undefined}
      onMenuOpen={onMenuOpen ? handleMenuOpen : undefined}
      onMenuClose={onMenuClose ? handleMenuClose : undefined}
      accessibilityState={mergedAccessibilityState}
      {...viewProps}
    />
  );
}
