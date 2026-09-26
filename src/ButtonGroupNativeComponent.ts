// ButtonGroupNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/**
 * A single button in the group. Icons are pre-resolved on the JS side (see
 * icons.ts) so native only deals with flat strings.
 */
export type ButtonGroupButton = Readonly<{
  label: string; // Empty for an icon-only button
  value: string;
  disabled: string; // 'enabled' | 'disabled'
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconRequest: string;
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
  accessibilityLabel: string; // Screen-reader label, empty = use label
}>;

/**
 * Event emitted when a button is pressed.
 */
export type ButtonGroupPressEvent = Readonly<{
  index: Int32;
  value: string;
}>;

/**
 * Event emitted when the selection changes (single / multiple selection).
 */
export type ButtonGroupSelectionEvent = Readonly<{
  /** Values of the selected buttons, in button order. */
  // Codegen only understands the `T[]` array form in event payloads.
  values: string[];
}>;

/**
 * Label font. Empty strings / 0 mean "platform default".
 */
export type ButtonGroupLabelStyleProps = Readonly<{
  fontFamily?: string;
  fontSize?: Double;
  fontWeight?: string; // 'normal' | 'bold' | '100'..'900'
  fontStyle?: string; // 'normal' | 'italic'
}>;

/**
 * One item of the split button's menu, the shape of `ContextMenuItem` (see
 * menuItems.ts). Every field is set; empty strings mean "none" and flags are
 * 'true' | 'false'.
 */
export type ButtonGroupMenuItem = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  /** Index of the parent submenu or section; -1 at the top level */
  parent: Int32;
  /** 'action' | 'menu' | 'section' */
  kind: string;
  /** '' | 'sfSymbol' | 'drawable' | 'image' */
  iconType: string;
  iconName: string;
  iconRequest: string;
  iconUri: string;
  iconScale: Double;
  iconTinted: string;
  imageColor: string;
  destructive: string;
  disabled: string;
  keepsMenuPresented: string;
  /** '' | 'off' | 'on' | 'mixed' */
  state: string;
  /** The action's own haptics; '' = the component's */
  haptics: string;
}>;

/** Event emitted when a split button menu item is picked. */
export type ButtonGroupMenuSelectEvent = Readonly<{
  id: string;
  title: string;
}>;

/**
 * Android-specific configuration.
 */
export type ButtonGroupAndroidProps = Readonly<{
  /** Material style: 'm3' | 'expressive' */
  material?: string;
}>;

export interface ButtonGroupNativeProps extends ViewProps {
  /** Buttons to display. */
  buttons: ReadonlyArray<ButtonGroupButton>;

  /**
   * 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'glass' |
   * 'prominentGlass' | 'clearGlass' | 'prominentClearGlass'
   */
  variant?: string;

  /** 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' */
  size?: string;

  /** '' (platform default) | 'round' | 'square' */
  shape?: string;

  /** 'true' | 'false': connected group (shared outline, small inner corners) */
  connected?: string;

  /** Gap between buttons in points; negative means the platform default. */
  spacing?: Double;

  /** 'none' | 'single' | 'multiple' */
  selection?: string;

  /** Values of the selected buttons (single / multiple selection). */
  selectedValues?: ReadonlyArray<string>;

  /** 'true' | 'false': whether at least one button must stay selected */
  selectionRequired?: string;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Container (background) color of the buttons. */
  color?: ColorValue;

  /** Label and icon color of the buttons. */
  foregroundColor?: ColorValue;

  /** Android: ripple color shown while pressing a button. */
  androidRippleColor?: ColorValue;

  /** Android: outline color (outlined variant). */
  androidStrokeColor?: ColorValue;

  /** Label font. */
  labelStyle?: ButtonGroupLabelStyleProps;

  /**
   * What happens to buttons that don't fit: 'none' | 'menu' | 'wrap'
   * ('wrap' is Android only)
   */
  overflow?: string;

  /**
   * 'true' | 'false': a split button, the first button joined to a trailing
   * button that opens `menu` (SplitButton).
   */
  split?: string;

  /** The split button's menu, flattened (see ButtonGroupMenuItem). */
  menu?: ReadonlyArray<ButtonGroupMenuItem>;

  /** Screen-reader label of the split button's menu button. */
  menuAccessibilityLabel?: string;

  /**
   * Haptic played when a button is pressed: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when a button is pressed. */
  onButtonPress?: BubblingEventHandler<ButtonGroupPressEvent>;

  /**
   * Fired when the selection changes. Not `onSelectionChange`: React Native's
   * TextInput registers `topSelectionChange` as a direct event, and an event
   * name can't be both direct and bubbling.
   */
  onGroupSelectionChange?: BubblingEventHandler<ButtonGroupSelectionEvent>;

  /** Fired when a split button menu item is picked. */
  onMenuSelect?: BubblingEventHandler<ButtonGroupMenuSelectEvent>;

  /** Fired when the split button's menu opens. */
  onMenuOpen?: BubblingEventHandler<Readonly<{}>>;

  /** Fired when the split button's menu closes. */
  onMenuClose?: BubblingEventHandler<Readonly<{}>>;

  android?: ButtonGroupAndroidProps;
}

export default codegenNativeComponent<ButtonGroupNativeProps>(
  'PCButtonGroup'
) as HostComponent<ButtonGroupNativeProps>;
