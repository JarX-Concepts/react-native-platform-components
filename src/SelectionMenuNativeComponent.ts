// SelectionMenuNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
  Double,
  Int32,
  WithDefault,
} from './codegenTypes';

/**
 * A single option in the menu. Icons are pre-resolved on the JS side (see
 * icons.ts); empty strings mean "none".
 */
export type SelectionMenuNativeOption = Readonly<{
  label: string;
  data: string;
  disabled: string; // 'true' | 'false'
  subtitle: string;
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string;
  iconRequest: string;
  iconUri: string;
  iconScale: Double;
  iconTinted: string; // 'true' | 'false'
}>;

/**
 * Event emitted when the user selects an option.
 */
export type SelectionMenuSelectEvent = Readonly<{
  /** Selected option index (implementation detail; stable for this render) */
  index: Int32;

  /** Selected option label */
  label: string;

  /** Selected option data payload (source of truth) */
  data: string;
}>;

/** Visibility state (headless mode only). */
export type SelectionMenuVisible = 'open' | 'closed';

/** Interactivity state (no booleans). */
export type SelectionMenuInteractivity = 'enabled' | 'disabled';

/** Anchor behavior (no booleans). */
export type SelectionMenuAnchorMode = 'inline' | 'headless';

/**
 * iOS-specific configuration (reserved).
 */
export type IOSProps = Readonly<{}>;

/**
 * Android-specific configuration.
 */
export type AndroidProps = Readonly<{
  material?: string; // AndroidMaterialMode
  /** Embedded M3 dropdown: accept typing to filter the options */
  searchable?: string; // 'true' | 'false'
}>;

export interface SelectionMenuProps extends ViewProps {
  /**
   * Menu options.
   */
  options: ReadonlyArray<SelectionMenuNativeOption>;

  /**
   * Controlled selection by `data`.
   *
   * - Empty string means "no selection".
   * - Native should treat this as the single source of truth.
   */
  selectedData?: WithDefault<string, ''>;

  /**
   * Enabled / disabled state.
   */
  interactivity?: string; // SelectionMenuInteractivity

  /**
   * Placeholder text shown when selectedData === "".
   */
  placeholder?: string;

  /**
   * Inline vs headless behavior.
   */
  anchorMode?: string; // SelectionMenuAnchorMode

  /**
   * Headless mode only:
   * controls visibility.
   */
  visible?: string; // SelectionMenuVisible

  /**
   * Haptic played when the user picks an option: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /**
   * Fired when the user selects an option.
   */
  onSelect?: BubblingEventHandler<SelectionMenuSelectEvent>;

  /**
   * Fired when dismissed without selection.
   */
  onRequestClose?: BubblingEventHandler<Readonly<{}>>;

  ios?: IOSProps;
  android?: AndroidProps;
}

export default codegenNativeComponent<SelectionMenuProps>(
  'PCSelectionMenu'
) as HostComponent<SelectionMenuProps>;
