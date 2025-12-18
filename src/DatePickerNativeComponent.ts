// DatePickerNativeComponent.ts
import type { CodegenTypes, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export type TimestampMs = CodegenTypes.Double;

export type DateChangeEvent = {
  timestampMs: CodegenTypes.Double;
};

export type DatePickerMode = 'date' | 'time' | 'dateAndTime' | 'countDownTimer';
export type DatePickerPresentation = 'modal' | 'inline';

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
 * - `-1` means "no value / unbounded / unset".
 */
export type CommonProps = {
  mode?: string; // DatePickerMode

  dateMs?: CodegenTypes.WithDefault<TimestampMs, -1>;
  minDateMs?: CodegenTypes.WithDefault<TimestampMs, -1>;
  maxDateMs?: CodegenTypes.WithDefault<TimestampMs, -1>;

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
  onCancel?: CodegenTypes.BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>('PCDatePicker');
