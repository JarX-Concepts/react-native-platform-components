// DatePicker.tsx
import React, { useCallback } from 'react';
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

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

export type DatePickerProps = {
  style?: StyleProp<ViewStyle>;

  /** Controlled value. Use `null` for "no date selected". */
  date: Date | null;

  /** Optional bounds. Use `null` for "unbounded". */
  minDate?: Date | null;
  maxDate?: Date | null;

  locale?: string;
  timeZoneName?: string;
  mode?: DatePickerMode;
  presentation?: DatePickerPresentation;

  /**
   * Modal only. If presentation !== "modal", ignored.
   * Wrapper ergonomics: boolean.
   */
  visible?: boolean;

  onConfirm?: (dateTime: Date) => void;
  onClosed?: () => void;

  /** Test identifier */
  testID?: string;

  ios?: {
    preferredStyle?: IOSDatePickerStyle;
    countDownDurationSeconds?: NativeIOSProps['countDownDurationSeconds'];
    minuteInterval?: NativeIOSProps['minuteInterval'];
    roundsToMinuteInterval?: IOSRoundsToMinuteInterval;
  };

  android?: {
    firstDayOfWeek?: NativeAndroidProps['firstDayOfWeek'];
    material?: AndroidMaterialMode;
    dialogTitle?: NativeAndroidProps['dialogTitle'];
    positiveButtonTitle?: NativeAndroidProps['positiveButtonTitle'];
    negativeButtonTitle?: NativeAndroidProps['negativeButtonTitle'];
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
    onConfirm,
    onClosed,
    ios,
    android,
    testID,
  } = props;

  const isModal = presentation === 'modal';

  const handleConfirm = useCallback(
    (e: NativeSyntheticEvent<DateChangeEvent>) => {
      onConfirm?.(new Date(e.nativeEvent.timestampMs));
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
        }
      : undefined,

    android: android
      ? {
          firstDayOfWeek: android.firstDayOfWeek,
          material: android.material,
          dialogTitle: android.dialogTitle,
          positiveButtonTitle: android.positiveButtonTitle,
          negativeButtonTitle: android.negativeButtonTitle,
        }
      : undefined,
  };

  return <NativeDatePicker testID={testID} {...nativeProps} />;
}

const styles = StyleSheet.create({
  picker: {},
});
