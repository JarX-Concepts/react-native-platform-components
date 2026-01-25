// DatePickerNativeComponent.ts
import type { CodegenTypes, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export type TimestampMs = CodegenTypes.Double;

export type DateChangeEvent = {
  timestampMs: CodegenTypes.Double;
};

export type DatePickerMode = 'date' | 'time' | 'dateAndTime' | 'countDownTimer';
export type DatePickerPresentation = 'modal' | 'embedded';

export type IOSDatePickerStyle = 'automatic' | 'compact' | 'inline' | 'wheels';
export type IOSRoundsToMinuteInterval = 'inherit' | 'round' | 'noRound';

export type IOSProps = {
  preferredStyle?: string; // IOSDatePickerStyle
  countDownDurationSeconds?: CodegenTypes.Double;
  minuteInterval?: CodegenTypes.Int32;
  roundsToMinuteInterval?: string; // IOSRoundsToMinuteInterval
};

export type AndroidProps = {
  firstDayOfWeek?: CodegenTypes.Int32;
  material?: string; // AndroidMaterialMode
  dialogTitle?: string;
  positiveButtonTitle?: string;
  negativeButtonTitle?: string;
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
  mode?: string; // DatePickerMode

  dateMs?: CodegenTypes.WithDefault<TimestampMs, -9007199254740991>;
  minDateMs?: CodegenTypes.WithDefault<TimestampMs, -9007199254740991>;
  maxDateMs?: CodegenTypes.WithDefault<TimestampMs, -9007199254740991>;

  locale?: string;
  timeZoneName?: string;

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

  onConfirm?: CodegenTypes.BubblingEventHandler<DateChangeEvent>;
  onClosed?: CodegenTypes.BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>('PCDatePicker');
