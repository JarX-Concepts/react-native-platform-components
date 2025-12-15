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

/**
 * iOS-specific configuration.
 * (Keep this extensible; we can add popover arrow directions, search, etc.)
 */
export type IOSProps = {
  /**
   * Presentation hint for iOS.
   * - "auto" (default): iPad popover, iPhone sheet
   * - "popover"
   * - "sheet"
   */
  presentation?: string;

  inlineMode?: boolean; // ✅ when true, iOS renders its own anchor UI
};

/**
 * Android-specific configuration.
 * (Placeholder for future Material3 behavior: exposed dropdown menu vs dialog, etc.)
 */
export type AndroidProps = {
  /**
   * Presentation hint for Android.
   * - "auto" (default)
   * - "dropdown"
   * - "dialog"
   */
  presentation?: string;
};

export interface SelectionMenuProps extends ViewProps {
  /**
   * The options displayed by the menu.
   * For a US state selector, pass the 50 state names.
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
   * Controlled presentation:
   * - "open": show the menu UI (popover/sheet/dropdown depending on platform)
   * - "closed": dismiss it
   */
  visible?: string;

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

export default codegenNativeComponent<SelectionMenuProps>('SelectionMenu');
