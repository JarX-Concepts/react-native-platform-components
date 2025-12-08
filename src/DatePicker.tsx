import React from 'react';
import type {
  DateChangeEvent,
  IOSProps,
  NativeProps,
} from './DatePickerNativeComponent';
import type { NativeSyntheticEvent } from 'react-native';
import { default as NativeDatePicker } from './DatePickerNativeComponent';

export type IOSDatePickerMode =
  | 'date'
  | 'time'
  | 'dateAndTime'
  | 'countDownTimer';

export type IOSDatePickerStyle = 'calendar' | 'wheels';

export type DatePickerProps = Omit<
  NativeProps,
  'onConfirm' | 'onCancel' | 'dateMs' | 'minDateMs' | 'maxDateMs' | 'ios'
> & {
  date?: Date;
  minDate?: Date;
  maxDate?: Date;

  /** Fired when the user selects a date/time. */
  onConfirm?: (dateTime: Date) => void;

  /** Fired when the user cancels the date picker. */
  onCancel?: () => void;

  ios?: Omit<IOSProps, 'mode' | 'preferredStyle'> & {
    mode?: IOSDatePickerMode;
    preferredStyle?: IOSDatePickerStyle;
  };
};

export function DatePicker(props: DatePickerProps) {
  const { onConfirm, onCancel, date, minDate, maxDate, ...rest } = props;

  const handleConfirm = React.useCallback(
    (e: NativeSyntheticEvent<DateChangeEvent>) => {
      onConfirm?.(new Date(e.nativeEvent.timestampMs));
    },
    [onConfirm]
  );

  const handleCancel = React.useCallback(() => onCancel?.(), [onCancel]);

  return (
    <NativeDatePicker
      {...rest}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      dateMs={date?.getTime()}
      minDateMs={minDate?.getTime()}
      maxDateMs={maxDate?.getTime()}
    />
  );
}
