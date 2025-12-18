// DatePicker.tsx
import React, { useCallback, useMemo } from 'react';
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

function dateToMsOrMinusOne(d: Date | null | undefined): number {
  return d ? d.getTime() : -1;
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
  } = props;

  const handleConfirm = useCallback(
    (e: NativeSyntheticEvent<DateChangeEvent>) => {
      onConfirm?.(new Date(e.nativeEvent.timestampMs));
    },
    [onConfirm]
  );

  const handleClosed = useCallback(() => {
    onClosed?.();
  }, [onClosed]);

  const styles = useMemo(() => createStyles(), []);

  const nativeProps: NativeDatePickerProps = {
    style: [styles.picker, style] as any,

    mode,
    locale,
    timeZoneName,

    presentation,
    visible: normalizeVisible(presentation, visible) as any,

    dateMs: dateToMsOrMinusOne(date) as any,
    minDateMs: dateToMsOrMinusOne(minDate ?? null) as any,
    maxDateMs: dateToMsOrMinusOne(maxDate ?? null) as any,

    onConfirm: onConfirm ? handleConfirm : undefined,
    onClosed: onClosed ? handleClosed : undefined,

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
          material: android.material as any,
          dialogTitle: android.dialogTitle,
          positiveButtonTitle: android.positiveButtonTitle,
          negativeButtonTitle: android.negativeButtonTitle,
        }
      : undefined,
  };

  return <NativeDatePicker {...nativeProps} />;
}

function createStyles() {
  return StyleSheet.create({
    picker: {},
  });
}
