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
};

export type DatePickerMode = 'date' | 'time' | 'dateAndTime' | 'countDownTimer';
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

  dateMs?: WithDefault<TimestampMs, -9007199254740991>;
  minDateMs?: WithDefault<TimestampMs, -9007199254740991>;
  maxDateMs?: WithDefault<TimestampMs, -9007199254740991>;

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

  onConfirm?: BubblingEventHandler<DateChangeEvent>;
  onClosed?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<NativeProps>(
  'PCDatePicker'
) as HostComponent<NativeProps>;
