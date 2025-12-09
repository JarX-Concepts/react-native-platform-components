// DatePickerNativeComponent.ts
import type { CodegenTypes, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * Timestamp in **milliseconds since Unix epoch** (JS Date.getTime()).
 */
export type TimestampMs = CodegenTypes.Double;

/**
 * Event emitted when the date changes.
 */
export type DateChangeEvent = {
  /** Selected date/time in ms since Unix epoch. */
  timestampMs: CodegenTypes.Double;
};

export type IOSProps = {
  /** UIDatePicker.mode */
  mode?: string; //IOSDatePickerMode;

  /** UIDatePicker.preferredDatePickerStyle */
  preferredStyle?: string; //IOSDatePickerStyle;

  /**
   * For `countDownTimer` mode.
   * Duration in seconds.
   */
  countDownDurationSeconds?: CodegenTypes.Double;

  /** UIDatePicker.minuteInterval */
  minuteInterval?: CodegenTypes.Int32;

  /** UIDatePicker.roundsToMinuteInterval (iOS 14+) */
  roundsToMinuteInterval?: boolean;
};

/**
 * Android-specific configuration.
 */
export type AndroidProps = {
  /**
   * First day of week in ISO-8601 (1 = Monday ... 7 = Sunday).
   * If not set, use system default.
   */
  firstDayOfWeek?: CodegenTypes.Int32;
};

export type WebProps = {
  // Future: web-specific options (inputMode, etc.).
};

export type WindowsProps = {};
export type MacOSProps = {};

/**
 * Common cross-platform props.
 *
 * NOTE on "optional" numeric props:
 * ---------------------------------
 * Codegen numeric types (`Double`, `Int32`, etc.) always get a native default
 * value. To represent "not provided" / "no value", we use a sentinel.
 *
 * Sentinel convention in this component:
 *   - `-1` for TimestampMs means "no date / unbounded".
 */
export type CommonProps = {
  /**
   * Controlled value.
   *
   * - `dateMs` is the **only source of truth** for the selected date.
   * - `-1` means "no date selected" (empty value).
   *
   * Even though it's technically optional here, JS code should treat this as a
   * controlled prop: always pass a value (`-1` or a real timestamp).
   */
  dateMs?: CodegenTypes.WithDefault<TimestampMs, -1>;

  /**
   * Minimum selectable date. `-1` → no minimum bound.
   */
  minDateMs?: CodegenTypes.WithDefault<TimestampMs, -1>;

  /**
   * Maximum selectable date. `-1` → no maximum bound.
   */
  maxDateMs?: CodegenTypes.WithDefault<TimestampMs, -1>;

  /**
   * Locale identifier, e.g. "en-US", "fr-FR".
   * Let the platform handle invalid / unsupported values.
   */
  locale?: string;

  /**
   * IANA time zone name, e.g. "America/Los_Angeles".
   * If omitted, use system default.
   */
  timeZoneName?: string;

  /** Visibility / "open" or "close" state. (only used in modal mode) */
  visible?: CodegenTypes.WithDefault<string, 'close'>;

  /** Presentation: "modal" vs "inline". */
  presentation?: CodegenTypes.WithDefault<string, 'modal'>;
};

export interface NativeProps extends ViewProps, CommonProps {
  ios?: IOSProps;
  android?: AndroidProps;
  web?: WebProps;
  windows?: WindowsProps;
  macos?: MacOSProps;

  /** Fired when the user selects a date/time. */
  onConfirm?: CodegenTypes.BubblingEventHandler<DateChangeEvent> | null;

  /** Fired when the user cancels the date picker. */
  onCancel?: CodegenTypes.BubblingEventHandler<Readonly<{}>> | null;
}

export default codegenNativeComponent<NativeProps>('DatePicker');
