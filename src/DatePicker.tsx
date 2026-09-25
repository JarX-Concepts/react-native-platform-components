// DatePicker.tsx
import React, { useCallback, useEffect } from 'react';
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';

import NativeDatePicker, {
  type DateChangeEvent,
  type NativeProps as NativeDatePickerProps,
  type IOSProps as NativeIOSProps,
  type AndroidProps as NativeAndroidProps,
  type DatePickerPresentation,
  type DatePickerMode,
  type IOSRoundsToMinuteInterval,
  type IOSDatePickerStyle,
} from './DatePickerNativeComponent';

import type { AndroidMaterialMode, Visible } from './sharedTypes';

/**
 * Android: how the Material pickers take input. `'text'` opens the date
 * picker on its text field and the time picker on its keyboard entry;
 * `'calendar'` on the calendar and the clock dial. Default: `'calendar'`.
 */
export type AndroidDatePickerInputMode = 'calendar' | 'text';

export type DatePickerProps = {
  style?: StyleProp<ViewStyle>;

  /** Controlled value. Use `null` for "no date selected". */
  date: Date | null;

  /** Optional bounds. Use `null` for "unbounded". */
  minDate?: Date | null;
  maxDate?: Date | null;

  locale?: string;
  timeZoneName?: string;

  /**
   * What to pick. `'yearAndMonth'` is `UIDatePicker`'s month and year wheels
   * (iOS 17.4+; the date wheels before); Android shows the date picker.
   * `'countDownTimer'` is iOS only (Android shows a date picker).
   */
  mode?: DatePickerMode;
  presentation?: DatePickerPresentation;

  /**
   * Forces the 24-hour (`true`) or 12-hour (`false`) clock in the time
   * modes. Default: the device setting. iOS: the picker's locale with that
   * hour cycle. Android: the time picker's clock format.
   */
  is24Hour?: boolean;

  /**
   * Modal only. If presentation !== "modal", ignored.
   * Wrapper ergonomics: boolean.
   */
  visible?: boolean;

  /**
   * Called when the selection changes. `confirmed` is true for deliberate
   * selections (see docs). `durationSeconds` is the selected duration in
   * `countDownTimer` mode (iOS, and web's time input); 0 in other modes.
   */
  onConfirm?: (
    dateTime: Date,
    confirmed: boolean,
    durationSeconds: number
  ) => void;
  onClosed?: () => void;

  /** Test identifier */
  testID?: string;

  ios?: {
    preferredStyle?: IOSDatePickerStyle;
    countDownDurationSeconds?: NativeIOSProps['countDownDurationSeconds'];
    minuteInterval?: NativeIOSProps['minuteInterval'];
    roundsToMinuteInterval?: IOSRoundsToMinuteInterval;
    /**
     * Modal only. Show a Cancel/Done toolbar below the picker. Defaults to
     * true. When false, `onConfirm` never fires with `confirmed: true` —
     * the caller is expected to drive dismissal themselves by flipping
     * `visible` off (and can read the current date from the stream of
     * `confirmed: false` events).
     */
    showConfirmToolbar?: boolean;
  };

  android?: {
    firstDayOfWeek?: NativeAndroidProps['firstDayOfWeek'];
    material?: AndroidMaterialMode;
    dialogTitle?: NativeAndroidProps['dialogTitle'];
    positiveButtonTitle?: NativeAndroidProps['positiveButtonTitle'];
    negativeButtonTitle?: NativeAndroidProps['negativeButtonTitle'];
    /** Material pickers only (`material: 'm3'`). */
    inputMode?: AndroidDatePickerInputMode;
  };
};

// Sentinel value for "no date". Using MIN_SAFE_INTEGER ensures we don't
// conflict with valid negative timestamps (dates before 1970).
const NO_DATE_SENTINEL = Number.MIN_SAFE_INTEGER;

function dateToMsOrSentinel(d: Date | null | undefined): number {
  if (!d) return NO_DATE_SENTINEL;
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : NO_DATE_SENTINEL;
}

function normalizeVisible(
  presentation: NativeDatePickerProps['presentation'] | undefined,
  visible: boolean | undefined
): Visible | undefined {
  // Only meaningful in modal presentation. Keep undefined for inline to avoid noise.
  if (presentation !== 'modal') return undefined;
  return visible ? 'open' : 'closed';
}

export function DatePicker(props: DatePickerProps): React.ReactElement {
  const {
    style,
    date,
    minDate,
    maxDate,
    locale,
    timeZoneName,
    mode,
    presentation = 'modal',
    visible,
    is24Hour,
    onConfirm,
    onClosed,
    ios,
    android,
    testID,
  } = props;

  const isModal = presentation === 'modal';

  const handleConfirm = useCallback(
    (e: NativeSyntheticEvent<DateChangeEvent>) => {
      const { timestampMs, confirmed, durationSeconds } = e.nativeEvent;
      onConfirm?.(new Date(timestampMs), confirmed, durationSeconds ?? 0);
    },
    [onConfirm]
  );

  const handleClosed = useCallback(() => {
    onClosed?.();
  }, [onClosed]);

  const nativeProps: NativeDatePickerProps = {
    style: [styles.picker, style],

    mode,
    locale,
    timeZoneName,
    hourFormat: hourFormat(is24Hour),

    presentation,
    visible: normalizeVisible(presentation, visible),

    dateMs: dateToMsOrSentinel(date),
    minDateMs: dateToMsOrSentinel(minDate),
    maxDateMs: dateToMsOrSentinel(maxDate),

    onConfirm: onConfirm ? handleConfirm : undefined,
    onClosed: isModal && onClosed ? handleClosed : undefined,

    ios: ios
      ? {
          preferredStyle: ios.preferredStyle,
          countDownDurationSeconds: ios.countDownDurationSeconds,
          minuteInterval: ios.minuteInterval,
          roundsToMinuteInterval: ios.roundsToMinuteInterval,
          confirmToolbar: ios.showConfirmToolbar === false ? 'hide' : 'show',
        }
      : undefined,

    android: android
      ? {
          firstDayOfWeek: android.firstDayOfWeek,
          material: android.material,
          dialogTitle: android.dialogTitle,
          positiveButtonTitle: android.positiveButtonTitle,
          negativeButtonTitle: android.negativeButtonTitle,
          inputMode: android.inputMode,
        }
      : undefined,
  };

  return <NativeDatePicker testID={testID} {...nativeProps} />;
}

function hourFormat(is24Hour: boolean | undefined): string {
  if (is24Hour === undefined) return '';
  return is24Hour ? '24' : '12';
}

/** A range of days, as `DateRangePicker` reports it. */
export type DateRange = { startDate: Date; endDate: Date };

export type DateRangePickerProps = {
  style?: StyleProp<ViewStyle>;

  /** First day of the range the picker opens with; `null` for none. */
  startDate?: Date | null;

  /** Last day of the range the picker opens with; `null` for none. */
  endDate?: Date | null;

  /** Optional bounds. Use `null` for "unbounded". */
  minDate?: Date | null;
  maxDate?: Date | null;

  /** Locale of the text-input date format. */
  locale?: string;
  timeZoneName?: string;

  /** Shows the picker dialog. */
  visible: boolean;

  /**
   * Called with the chosen range when the user confirms it. Both dates are
   * the start (midnight) of their day in `timeZoneName`, or the device time
   * zone; `endDate` is the last day of the range, inclusive.
   */
  onConfirm?: (range: DateRange) => void;

  /** Called when the dialog closes, confirmed or not. */
  onClosed?: () => void;

  /** Test identifier */
  testID?: string;

  android?: {
    firstDayOfWeek?: NativeAndroidProps['firstDayOfWeek'];
    /** `'text'` opens on the start and end date fields. */
    inputMode?: AndroidDatePickerInputMode;
    dialogTitle?: NativeAndroidProps['dialogTitle'];
    positiveButtonTitle?: NativeAndroidProps['positiveButtonTitle'];
    negativeButtonTitle?: NativeAndroidProps['negativeButtonTitle'];
  };
};

/**
 * Whether `DateRangePicker` shows anything on this platform. iOS has no
 * native date range picker; offer two `DatePicker`s there instead.
 */
export const isDateRangePickerSupported: boolean = rangePickerSupported();

function rangePickerSupported(): boolean {
  return Platform.OS !== 'ios';
}

/**
 * A date range picker: Material's `MaterialDatePicker.dateRangePicker()` on
 * Android, a modal dialog. iOS has no native range picker, so it renders
 * nothing there and warns in development (see `isDateRangePickerSupported`).
 */
export function DateRangePicker(
  props: DateRangePickerProps
): React.ReactElement | null {
  const {
    style,
    startDate,
    endDate,
    minDate,
    maxDate,
    locale,
    timeZoneName,
    visible,
    onConfirm,
    onClosed,
    android,
    testID,
  } = props;

  const supported = rangePickerSupported();
  useEffect(() => {
    if (__DEV__ && visible && !supported) {
      console.warn(
        'DateRangePicker: iOS has no native date range picker, so nothing is ' +
          'shown. Check isDateRangePickerSupported and offer two DatePickers ' +
          'on iOS.'
      );
    }
  }, [visible, supported]);

  const handleConfirm = useCallback(
    (e: NativeSyntheticEvent<DateChangeEvent>) => {
      const { timestampMs, endTimestampMs } = e.nativeEvent;
      onConfirm?.({
        startDate: new Date(timestampMs),
        endDate: new Date(endTimestampMs),
      });
    },
    [onConfirm]
  );

  const handleClosed = useCallback(() => {
    onClosed?.();
  }, [onClosed]);

  if (!supported) return null;

  return (
    <NativeDatePicker
      testID={testID}
      style={[styles.picker, style]}
      mode="dateRange"
      presentation="modal"
      visible={visible ? 'open' : 'closed'}
      locale={locale}
      timeZoneName={timeZoneName}
      dateMs={dateToMsOrSentinel(startDate)}
      endDateMs={dateToMsOrSentinel(endDate)}
      minDateMs={dateToMsOrSentinel(minDate)}
      maxDateMs={dateToMsOrSentinel(maxDate)}
      onConfirm={onConfirm ? handleConfirm : undefined}
      onClosed={onClosed ? handleClosed : undefined}
      android={
        android
          ? {
              firstDayOfWeek: android.firstDayOfWeek,
              material: 'm3',
              dialogTitle: android.dialogTitle,
              positiveButtonTitle: android.positiveButtonTitle,
              negativeButtonTitle: android.negativeButtonTitle,
              inputMode: android.inputMode,
            }
          : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  picker: {},
});
