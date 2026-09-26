import type { ComponentType, ReactNode, RefAttributes } from 'react';
import type { ButtonProps } from './Button';
import type { ButtonGroupProps } from './ButtonGroup';
import type { SplitButtonProps } from './SplitButton';
import type { ContextMenuProps } from './ContextMenu';
import type { DatePickerProps, DateRangePickerProps } from './DatePicker';
import type { FloatingActionButtonProps } from './FloatingActionButton';
import type { FloatingToolbarProps } from './FloatingToolbar';
import type { LiquidGlassProps } from './LiquidGlass';
import type { LiquidGlassContainerProps } from './LiquidGlassContainer';
import type { NavigationRailProps } from './NavigationRail';
import type { SegmentedControlProps } from './SegmentedControl';
import type { SelectionMenuProps } from './SelectionMenu';
import type { TabBarProps } from './TabBar';
import type { TextFieldProps, TextFieldRef } from './TextField';

/** Public contracts accepted by consumer-supplied web components. */
export interface WebComponentProps {
  Button: ButtonProps;
  ButtonGroup: ButtonGroupProps;
  SplitButton: SplitButtonProps;
  ContextMenu: ContextMenuProps;
  DatePicker: DatePickerProps;
  DateRangePicker: DateRangePickerProps;
  FloatingActionButton: FloatingActionButtonProps;
  FloatingToolbar: FloatingToolbarProps;
  LiquidGlass: LiquidGlassProps;
  LiquidGlassContainer: LiquidGlassContainerProps;
  NavigationRail: NavigationRailProps;
  SegmentedControl: SegmentedControlProps;
  SelectionMenu: SelectionMenuProps;
  TabBar: TabBarProps;
  TextField: TextFieldProps & RefAttributes<TextFieldRef>;
}

/** Implement one or more entries with the same props, callbacks and ref contract. */
export type WebComponents = {
  [Name in keyof WebComponentProps]: ComponentType<WebComponentProps[Name]>;
};

export interface PlatformComponentsProviderProps {
  /** Web overrides for this subtree; ignored on iOS and Android. */
  web?: Partial<WebComponents>;
  children?: ReactNode;
}
