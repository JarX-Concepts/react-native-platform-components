// index.web.tsx
//
// Web entry point, for react-native-web. The components render the browser's
// own controls (see src/web). Types come from the native modules as
// type-only exports, which are erased at build time, so the native component
// specs are never imported on web and the two entry points share one API.

export type * from './DatePicker';
export type * from './SelectionMenu';
export type * from './ContextMenu';
export type * from './SegmentedControl';
export type * from './TabBar';
export type * from './FloatingActionButton';
export type * from './NavigationRail';
export type * from './Button';
export type * from './ButtonGroup';
export type * from './SplitButton';
export type * from './FloatingToolbar';
export type * from './LiquidGlass';
export type * from './LiquidGlassContainer';
export type * from './TextField';
export type * from './icons';
export type * from './sharedTypes';
export type * from './haptics';
export type * from './NativeTheme';

export * from './labelStyle';

export type {
  PlatformComponentsProviderProps,
  WebComponents,
  WebComponentProps,
} from './webComponents';
export { PlatformComponentsProvider } from './web/PlatformComponentsProvider';
export {
  Button,
  ButtonGroup,
  SplitButton,
  ContextMenu,
  DatePicker,
  DateRangePicker,
  FloatingActionButton,
  FloatingToolbar,
  LiquidGlass,
  LiquidGlassContainer,
  NavigationRail,
  SegmentedControl,
  SelectionMenu,
  TabBar,
  TextField,
} from './web/components';
export { isDateRangePickerSupported } from './web/DateRangePicker';
export { isLiquidGlassSupported } from './web/containers';
export { setNativeTheme, useNativeTheme } from './web/NativeTheme';
