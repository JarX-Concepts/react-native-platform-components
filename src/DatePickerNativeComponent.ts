// DatePickerNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
  Double,
  Int32,
  WithDefault,
} from './codegenTypes';

export type TimestampMs = Double;

export type DateChangeEvent = {
  timestampMs: Double;
  confirmed: boolean;
  /**
   * iOS `countDownTimer` mode: the selected duration in seconds. 0 in every
   * other mode and on Android (which has no countdown picker).
   */
  durationSeconds: Double;
  /**
   * `dateRange` mode (Android): the last day of the range, with
   * `timestampMs` the first. 0 in every other mode.
   */
  endTimestampMs: Double;
};

export type DatePickerMode =
  'date' | 'time' | 'dateAndTime' | 'countDownTimer' | 'yearAndMonth';
export type DatePickerPresentation = 'modal' | 'embedded';

export type IOSDatePickerStyle = 'automatic' | 'compact' | 'inline' | 'wheels';
export type IOSRoundsToMinuteInterval = 'inherit' | 'round' | 'noRound';
export type IOSConfirmToolbar = 'show' | 'hide';

export type IOSProps = {
  preferredStyle?: string; // IOSDatePickerStyle
  countDownDurationSeconds?: Double;
  minuteInterval?: Int32;
  roundsToMinuteInterval?: string; // IOSRoundsToMinuteInterval
  confirmToolbar?: string; // IOSConfirmToolbar
};

export type AndroidProps = {
  firstDayOfWeek?: Int32;
  material?: string; // AndroidMaterialMode
  dialogTitle?: string;
  positiveButtonTitle?: string;
  negativeButtonTitle?: string;
  inputMode?: string; // '' | 'calendar' | 'text'
};

export type WebProps = Readonly<{}>;
export type WindowsProps = Readonly<{}>;
export type MacOSProps = Readonly<{}>;

/**
 * Sentinel convention:
 * - `Number.MIN_SAFE_INTEGER` means "no value / unbounded / unset".
 *   (Allows negative timestamps for pre-1970 dates.)
 */
export type CommonProps = {
  mode?: string; // DatePickerMode, or 'dateRange' for DateRangePicker

  dateMs?: WithDefault<TimestampMs, -9007199254740991>;
  /** `dateRange` mode: the last day of the range (`dateMs` is the first). */
  endDateMs?: WithDefault<TimestampMs, -9007199254740991>;
  minDateMs?: WithDefault<TimestampMs, -9007199254740991>;
  maxDateMs?: WithDefault<TimestampMs, -9007199254740991>;

  locale?: string;
  timeZoneName?: string;

  /** '' (device setting) | '12' | '24' */
  hourFormat?: string;

  /**
   * Only used when presentation === "modal".
   * Defaults should be applied in JS wrapper (recommended).
   */
  visible?: string; // Visible

  /** Defaults should be applied in JS wrapper (recommended). */
  presentation?: string; // DatePickerPresentation
};

export interface NativeProps extends ViewProps, CommonProps {
  ios?: IOSProps;
  android?: AndroidProps;

  onConfirm?: BubblingEventHandler<DateChangeEvent>;
  onClosed?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>(
  'PCDatePicker'
) as HostComponent<NativeProps>;
