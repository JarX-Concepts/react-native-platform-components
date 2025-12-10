import React, { useMemo } from 'react';
import type {
  DateChangeEvent,
  IOSProps,
  NativeProps,
} from './DatePickerNativeComponent';
import { StyleSheet, type NativeSyntheticEvent } from 'react-native';
import { default as NativeDatePicker } from './DatePickerNativeComponent';

export type IOSDatePickerMode =
  | 'date'
  | 'time'
  | 'dateAndTime'
  | 'countDownTimer';

export type IOSDatePickerStyle = 'calendar' | 'wheels';

export type DatePickerProps = Omit<
  NativeProps,
  | 'onConfirm'
  | 'onCancel'
  | 'dateMs'
  | 'minDateMs'
  | 'maxDateMs'
  | 'ios'
  | 'visible'
  | 'modal'
> & {
  date?: Date;
  minDate?: Date;
  maxDate?: Date;
  visible?: boolean;
  modal?: boolean;

  /** Fired when the user selects a date/time. */
  onConfirm?: (dateTime: Date) => void;

  /** Fired when the user cancels the date picker. */
  onCancel?: () => void;

  ios?: Omit<IOSProps, 'mode' | 'preferredStyle'> & {
    mode?: IOSDatePickerMode;
    preferredStyle?: IOSDatePickerStyle;
  };
};

const IOS_INLINE_HEIGHTS: Record<IOSDatePickerStyle, number> = {
  calendar: 320,
  wheels: 216,
};

export function DatePicker(props: DatePickerProps) {
  const {
    onConfirm,
    onCancel,
    date,
    minDate,
    maxDate,
    style,
    visible,
    modal,
    ...rest
  } = props;

  const handleConfirm = React.useCallback(
    (e: NativeSyntheticEvent<DateChangeEvent>) => {
      onConfirm?.(new Date(e.nativeEvent.timestampMs));
    },
    [onConfirm]
  );

  const handleCancel = React.useCallback(() => onCancel?.(), [onCancel]);

  const height = useMemo(() => {
    if (modal === false) {
      return rest.ios?.preferredStyle === 'wheels'
        ? IOS_INLINE_HEIGHTS.wheels
        : IOS_INLINE_HEIGHTS.calendar;
    }
    return undefined;
  }, [modal, rest.ios?.preferredStyle]);

  const styles = useMemo(() => createStyles(height), [height]);

  return (
    <NativeDatePicker
      {...rest}
      presentation={modal ? 'modal' : 'inline'}
      visible={visible ? 'open' : 'close'}
      style={[styles.picker, style]}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      dateMs={date?.getTime()}
      minDateMs={minDate?.getTime()}
      maxDateMs={maxDate?.getTime()}
    />
  );
}

function createStyles(_height?: number) {
  const styles = StyleSheet.create({
    picker: {},
  });
  return styles;
}
