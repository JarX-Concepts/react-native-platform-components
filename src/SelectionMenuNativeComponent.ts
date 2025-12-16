// SelectionMenuNativeComponent.ts
import type { CodegenTypes, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * Event emitted when the user selects an option.
 */
export type SelectionMenuSelectEvent = {
  /** Selected option index (0-based). */
  index: CodegenTypes.Int32;
  /** Selected option label/value (as provided in `options`). */
  value: string;
};

export type SelectionMenuVisible = 'open' | 'closed';

/**
 * Presentation hint for headless mode (inlineMode === false).
 *
 * - "auto": platform default (recommended)
 * - "popover": iOS popover (iPad-style) / Android dialog-like
 * - "sheet": iOS sheet / Android bottom-sheet-like
 *
 * Note: this is a best-effort hint; platforms may adapt.
 */
export type SelectionMenuPresentation = 'auto' | 'popover' | 'sheet';

/**
 * iOS-specific configuration (reserved for future extension).
 */
export type IOSProps = {};

/**
 * Android-specific configuration (reserved for future extension).
 */
export type AndroidProps = {};

export interface SelectionMenuProps extends ViewProps {
  /**
   * The options displayed by the menu.
   */
  options: ReadonlyArray<string>;

  /**
   * Currently selected index (controlled).
   * Use -1 for "no selection".
   */
  selectedIndex: CodegenTypes.Int32;

  /**
   * If true, the control should not open and should not emit selection.
   */
  disabled?: boolean;

  /**
   * Optional placeholder text when selectedIndex === -1.
   */
  placeholder?: string;

  /**
   * If true, native renders its own interactive inline anchor UI and manages
   * opening/closing internally (platform-native).
   *
   * If false (default), the component is "headless" and is controlled by `visible`.
   */
  inlineMode?: boolean;

  /**
   * Controlled presentation for headless mode (inlineMode === false):
   * - "open": show the menu UI (popover/sheet/dialog depending on platform)
   * - "closed": dismiss it
   *
   * Note: when inlineMode === true, implementations should ignore this.
   */
  visible?: string; //SelectionMenuVisible;

  /**
   * Presentation hint for headless mode (inlineMode === false).
   *
   * Note: when inlineMode === true, implementations should ignore this.
   */
  presentation?: string; //SelectionMenuPresentation;

  /**
   * Called when the user selects an option.
   */
  onSelect?: CodegenTypes.BubblingEventHandler<SelectionMenuSelectEvent>;

  /**
   * Called when the user dismisses without selecting (tap outside / back / escape).
   * (Implementations should set `visible` back to "closed" in JS.)
   */
  onRequestClose?: CodegenTypes.BubblingEventHandler<Readonly<{}>>;

  ios?: IOSProps;
  android?: AndroidProps;
}

export default codegenNativeComponent<SelectionMenuProps>('PCSelectionMenu');
