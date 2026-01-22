// SelectionMenuNativeComponent.ts
import type { CodegenTypes, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * A single option in the menu.
 */
export type SelectionMenuOption = Readonly<{
  label: string;
  data: string;
}>;

/**
 * Event emitted when the user selects an option.
 */
export type SelectionMenuSelectEvent = Readonly<{
  /** Selected option index (implementation detail; stable for this render) */
  index: CodegenTypes.Int32;

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
}>;

export interface SelectionMenuProps extends ViewProps {
  /**
   * Menu options.
   */
  options: ReadonlyArray<SelectionMenuOption>;

  /**
   * Controlled selection by `data`.
   *
   * - Empty string means "no selection".
   * - Native should treat this as the single source of truth.
   */
  selectedData?: CodegenTypes.WithDefault<string, ''>;

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
   * Fired when the user selects an option.
   */
  onSelect?: CodegenTypes.BubblingEventHandler<SelectionMenuSelectEvent>;

  /**
   * Fired when dismissed without selection.
   */
  onRequestClose?: CodegenTypes.BubblingEventHandler<Readonly<{}>>;

  ios?: IOSProps;
  android?: AndroidProps;
}

export default codegenNativeComponent<SelectionMenuProps>('PCSelectionMenu');
