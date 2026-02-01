// index.web.tsx
// Web stubs for react-native-platform-components
// These components are native-only and render nothing/children on web.
// This file is fully standalone to avoid importing native component specs.

import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

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

export interface SegmentedControlSegmentProps {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: string;
}

export interface SegmentedControlProps extends ViewProps {
  segments: readonly SegmentedControlSegmentProps[];
  selectedValue: string | null;
  disabled?: boolean;
  onSelect?: (value: string, index: number) => void;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
}

export const SegmentedControl = (
  _props: SegmentedControlProps
): React.ReactElement | null => null;

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
