// index.web.tsx
// Web stubs for react-native-platform-components
// These components are native-only and render nothing/children on web.
// This file is fully standalone to avoid importing native component specs.

import React from 'react';
import type { ReactNode } from 'react';
import type { ColorValue, StyleProp, ViewStyle, ViewProps } from 'react-native';
import type { PlatformIcon } from './icons';
import type { LabelStyle } from './labelStyle';

// ============================================================================
// Shared Types (duplicated to avoid importing from files with native deps)
// ============================================================================

export type Visible = 'open' | 'closed';
export type Presentation = 'modal' | 'embedded';
export type AndroidMaterialMode = 'system' | 'm3';

// ============================================================================
// DatePicker
// ============================================================================

export type DatePickerProps = {
  style?: StyleProp<ViewStyle>;
  date: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  locale?: string;

  timeZoneName?: string;
  mode?: 'date' | 'time' | 'dateAndTime' | 'countDownTimer';
  presentation?: 'modal' | 'embedded';
  visible?: boolean;
  onConfirm?: (dateTime: Date) => void;
  onClosed?: () => void;
  testID?: string;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
};

export const DatePicker = (
  _props: DatePickerProps
): React.ReactElement | null => null;

// ============================================================================
// SelectionMenu
// ============================================================================

export type SelectionMenuOption = {
  label: string;
  data: string;
};

export interface SelectionMenuProps extends ViewProps {
  options: readonly SelectionMenuOption[];
  selected: string | null;
  disabled?: boolean;
  placeholder?: string;
  presentation?: Presentation;
  visible?: boolean;
  onSelect?: (data: string, label: string, index: number) => void;
  onRequestClose?: () => void;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
}

export const SelectionMenu = (
  _props: SelectionMenuProps
): React.ReactElement | null => null;

// ============================================================================
// ContextMenu
// ============================================================================

export interface ContextMenuActionAttributes {
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

export interface ContextMenuAction {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageColor?: string;
  attributes?: ContextMenuActionAttributes;
  state?: 'off' | 'on' | 'mixed';
  subactions?: ContextMenuAction[];
}

export interface ContextMenuProps extends ViewProps {
  title?: string;
  actions: readonly ContextMenuAction[];
  disabled?: boolean;
  trigger?: 'longPress' | 'tap';
  onPressAction?: (actionId: string, actionTitle: string) => void;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
  children?: ReactNode;
}

export const ContextMenu = ({
  children,
}: ContextMenuProps): React.ReactElement | null => {
  return <>{children}</>;
};

// ============================================================================
// SegmentedControl
// ============================================================================

export type SegmentedControlIconSource =
  | string
  | { type: 'sfSymbol'; name: string }
  | { type: 'drawable'; name: string }
  | { type: 'image'; source: unknown; tinted?: boolean };

export type SegmentedControlIcon =
  | SegmentedControlIconSource
  | { ios?: SegmentedControlIconSource; android?: SegmentedControlIconSource };

export type SegmentedControlLabelVisibility = 'auto' | 'labeled' | 'unlabeled';

export interface SegmentedControlSegmentProps {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: SegmentedControlIcon;
  badge?: string | number;
  accessibilityLabel?: string;
}

export interface SegmentedControlBadgeStyle {
  backgroundColor?: string;
  color?: string;
}

export interface SegmentedControlLabelStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
}

export interface SegmentedControlProps extends ViewProps {
  segments: readonly SegmentedControlSegmentProps[];
  selectedValue: string | null;
  disabled?: boolean;
  labelVisibility?: SegmentedControlLabelVisibility;
  selectedSegmentColor?: string;
  activeTintColor?: string;
  inactiveTintColor?: string;
  labelStyle?: SegmentedControlLabelStyle;
  badgeStyle?: SegmentedControlBadgeStyle;
  onSelect?: (value: string, index: number) => void;
  onDeselect?: () => void;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
}

export const SegmentedControl = (
  _props: SegmentedControlProps
): React.ReactElement | null => null;

// ============================================================================
// Button, ButtonGroup, FloatingToolbar
// ============================================================================

export type {
  PlatformIcon,
  PlatformIconSource,
  NativeIconFields,
} from './icons';
export type { LabelStyle, NativeLabelStyle } from './labelStyle';

export type ButtonVariant =
  'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
export type ButtonShape = 'round' | 'square';

export interface ButtonProps extends ViewProps {
  label?: string;
  icon?: PlatformIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  disabled?: boolean;
  color?: ColorValue;
  tintColor?: ColorValue;
  labelStyle?: LabelStyle;
  accessibilityLabel?: string;
  onPress?: () => void;
  android?: Record<string, unknown>;
}

export const Button = (_props: ButtonProps): React.ReactElement | null => null;

export type ButtonGroupSelection = 'none' | 'single' | 'multiple';
export type ButtonGroupOverflow = 'none' | 'menu' | 'wrap';

export interface ButtonGroupButtonProps {
  label?: string;
  value: string;
  disabled?: boolean;
  icon?: PlatformIcon;
  accessibilityLabel?: string;
}

export interface ButtonGroupProps extends ViewProps {
  buttons: readonly ButtonGroupButtonProps[];
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  connected?: boolean;
  spacing?: number;
  selection?: ButtonGroupSelection;
  selectedValues?: readonly string[];
  selectionRequired?: boolean;
  disabled?: boolean;
  color?: ColorValue;
  tintColor?: ColorValue;
  labelStyle?: LabelStyle;
  onPress?: (value: string, index: number) => void;
  onSelectionChange?: (values: string[]) => void;
  android?: Record<string, unknown>;
}

export const ButtonGroup = (
  _props: ButtonGroupProps
): React.ReactElement | null => null;

export type FloatingToolbarIOSEffect = 'regular' | 'clear';
export type FloatingToolbarAndroidVariant = 'standard' | 'vibrant';

export interface FloatingToolbarProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  color?: ColorValue;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
  children?: ReactNode;
}

export const FloatingToolbar = ({
  children,
}: FloatingToolbarProps): React.ReactElement | null => {
  return <>{children}</>;
};

// ============================================================================
// LiquidGlass
// ============================================================================

export interface LiquidGlassProps extends ViewProps {
  cornerRadius?: number;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
  children?: ReactNode;
}

export const LiquidGlass = ({
  children,
}: LiquidGlassProps): React.ReactElement | null => {
  return <>{children}</>;
};

export const isLiquidGlassSupported = false;

// ============================================================================
// TextField
// ============================================================================

export type TextFieldKeyboardType =
  | 'default'
  | 'number-pad'
  | 'decimal-pad'
  | 'numeric'
  | 'email-address'
  | 'phone-pad'
  | 'url'
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search'
  | 'visible-password';
export type TextFieldReturnKeyType =
  'default' | 'done' | 'go' | 'next' | 'search' | 'send' | 'none' | 'previous';
export type TextFieldAutoComplete =
  | 'off'
  | 'username'
  | 'password'
  | 'new-password'
  | 'one-time-code'
  | 'email'
  | 'name'
  | 'given-name'
  | 'family-name'
  | 'tel'
  | 'street-address'
  | 'postal-code'
  | 'country'
  | 'cc-number'
  | 'cc-exp'
  | 'cc-csc'
  | 'url';
export type TextFieldAutoCapitalize =
  'none' | 'sentences' | 'words' | 'characters';
export type TextFieldClearButtonMode =
  'never' | 'while-editing' | 'unless-editing' | 'always';
export type TextFieldIOSChoice = 'default' | 'yes' | 'no';
export type TextFieldEvent = { nativeEvent: { text: string } };
export type TextFieldChangeEvent = {
  nativeEvent: { text: string; eventCount: number };
};

export interface TextFieldRef {
  focus(): void;
  blur(): void;
  clear(): void;
  isFocused(): boolean;
}

export interface TextFieldProps extends Omit<
  ViewProps,
  'onFocus' | 'onBlur' | 'children'
> {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  onChange?: (event: TextFieldChangeEvent) => void;
  onFocus?: (event: TextFieldEvent) => void;
  onBlur?: (event: TextFieldEvent) => void;
  onSubmitEditing?: (event: TextFieldEvent) => void;
  label?: string;
  placeholder?: string;
  supportingText?: string;
  error?: boolean | string;
  prefix?: string;
  suffix?: string;
  leadingIcon?: PlatformIcon;
  trailingIcon?: PlatformIcon;
  onTrailingIconPress?: () => void;
  clearButtonMode?: TextFieldClearButtonMode;
  passwordToggle?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  keyboardType?: TextFieldKeyboardType;
  returnKeyType?: TextFieldReturnKeyType;
  autoCapitalize?: TextFieldAutoCapitalize;
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  selectTextOnFocus?: boolean;
  autoComplete?: TextFieldAutoComplete;
  keyboardAppearance?: 'default' | 'light' | 'dark';
  textStyle?: LabelStyle;
  accessibilityLabel?: string;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
}

export const TextField = React.forwardRef<TextFieldRef, TextFieldProps>(
  function TextFieldComponent(_props, ref): React.ReactElement | null {
    React.useImperativeHandle(ref, () => ({
      focus: () => {},
      blur: () => {},
      clear: () => {},
      isFocused: () => false,
    }));
    return null;
  }
);

// ============================================================================
// Native theme
// ============================================================================

export type NativeTheme = {
  colors: {
    primary: ColorValue;
  };
};

export const setNativeTheme = (_theme: NativeTheme | null): void => {};

export const useNativeTheme = (
  _theme: NativeTheme | null | undefined
): void => {};
