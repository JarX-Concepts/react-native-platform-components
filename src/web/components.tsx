import { withWebComponent } from './PlatformComponentsProvider';
import type { WebComponents } from '../webComponents';
import { Button as DefaultButton } from './Button';
import { ButtonGroup as DefaultButtonGroup } from './ButtonGroup';
import { SplitButton as DefaultSplitButton } from './SplitButton';
import { DatePicker as DefaultDatePicker } from './DatePicker';
import { DateRangePicker as DefaultDateRangePicker } from './DateRangePicker';
import { FloatingActionButton as DefaultFloatingActionButton } from './FloatingActionButton';
import { NavigationRail as DefaultNavigationRail } from './NavigationRail';
import { SegmentedControl as DefaultSegmentedControl } from './SegmentedControl';
import { SelectionMenu as DefaultSelectionMenu } from './SelectionMenu';
import { TabBar as DefaultTabBar } from './TabBar';
import { TextField as DefaultTextField } from './TextField';
import {
  ContextMenu as DefaultContextMenu,
  FloatingToolbar as DefaultFloatingToolbar,
  LiquidGlass as DefaultLiquidGlass,
  LiquidGlassContainer as DefaultLiquidGlassContainer,
} from './containers';

// Explicit types keep published declarations tied to a resolvable type import.
export const Button: WebComponents['Button'] = withWebComponent(
  'Button',
  DefaultButton
);
export const ButtonGroup: WebComponents['ButtonGroup'] = withWebComponent(
  'ButtonGroup',
  DefaultButtonGroup
);
export const SplitButton: WebComponents['SplitButton'] = withWebComponent(
  'SplitButton',
  DefaultSplitButton
);
export const DatePicker: WebComponents['DatePicker'] = withWebComponent(
  'DatePicker',
  DefaultDatePicker
);
export const DateRangePicker: WebComponents['DateRangePicker'] =
  withWebComponent('DateRangePicker', DefaultDateRangePicker);
export const FloatingActionButton: WebComponents['FloatingActionButton'] =
  withWebComponent('FloatingActionButton', DefaultFloatingActionButton);
export const NavigationRail: WebComponents['NavigationRail'] = withWebComponent(
  'NavigationRail',
  DefaultNavigationRail
);
export const SegmentedControl: WebComponents['SegmentedControl'] =
  withWebComponent('SegmentedControl', DefaultSegmentedControl);
export const SelectionMenu: WebComponents['SelectionMenu'] = withWebComponent(
  'SelectionMenu',
  DefaultSelectionMenu
);
export const TabBar: WebComponents['TabBar'] = withWebComponent(
  'TabBar',
  DefaultTabBar
);
export const TextField: WebComponents['TextField'] = withWebComponent(
  'TextField',
  DefaultTextField
);
export const ContextMenu: WebComponents['ContextMenu'] = withWebComponent(
  'ContextMenu',
  DefaultContextMenu
);
export const FloatingToolbar: WebComponents['FloatingToolbar'] =
  withWebComponent('FloatingToolbar', DefaultFloatingToolbar);
export const LiquidGlass: WebComponents['LiquidGlass'] = withWebComponent(
  'LiquidGlass',
  DefaultLiquidGlass
);
export const LiquidGlassContainer: WebComponents['LiquidGlassContainer'] =
  withWebComponent('LiquidGlassContainer', DefaultLiquidGlassContainer);
