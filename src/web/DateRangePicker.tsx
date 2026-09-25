// web/DateRangePicker.tsx
import React, { useState } from 'react';
import { View } from 'react-native';

import type { DateRangePickerProps } from '../DatePicker';
import { Dialog } from './Dialog';
import { formatInputValue, parseInputValue } from './dateInput';
import { BUTTON_BASE, eventValue, usePrimaryColor } from './shared';

/** The browser has start and end date inputs, so the range picker works on web. */
export const isDateRangePickerSupported: boolean = true;

const INPUT_STYLE = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 40,
  padding: '0 12px',
  border: '1px solid color-mix(in srgb, CanvasText 30%, transparent)',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: 16,
  color: 'inherit',
  backgroundColor: 'transparent',
} as const;

const startOfDay = (date: Date | null | undefined): Date | null => {
  if (!date || !Number.isFinite(date.getTime())) return null;
  const day = new Date(date.getTime());
  day.setHours(0, 0, 0, 0);
  return day;
};

/**
 * A `<dialog>` with start and end date inputs and Cancel/Done buttons. Done
 * reports the range (the start of each day) once both are set and in order,
 * then calls `onClosed`, as the Android dialog does.
 */
export function DateRangePicker(
  props: DateRangePickerProps
): React.ReactElement {
  const { style, testID, visible } = props;
  return (
    <View testID={testID} style={style}>
      {visible ? <RangeDialog {...props} /> : null}
    </View>
  );
}

function RangeDialog({
  startDate,
  endDate,
  minDate,
  maxDate,
  locale,
  onConfirm,
  onClosed,
}: DateRangePickerProps): React.ReactElement {
  const primary = usePrimaryColor();
  const [start, setStart] = useState(startOfDay(startDate));
  const [end, setEnd] = useState(startOfDay(endDate));
  const valid = start != null && end != null && end >= start;
  const dismiss = () => onClosed?.();
  const textButton = {
    ...BUTTON_BASE,
    height: 40,
    padding: '0 12px',
    border: 'none',
    borderRadius: 20,
    fontSize: 14,
    color: primary,
    backgroundColor: 'transparent',
  };

  const renderInput = (
    label: string,
    value: Date | null,
    onValue: (next: Date | null) => void,
    min: Date | null | undefined
  ) => (
    <input
      type="date"
      lang={locale}
      aria-label={label}
      value={formatInputValue(value, 'date')}
      min={formatInputValue(min, 'date') || undefined}
      max={formatInputValue(maxDate, 'date') || undefined}
      onChange={(event) =>
        onValue(parseInputValue(eventValue(event), 'date', null))
      }
      style={{ ...INPUT_STYLE, accentColor: primary }}
    />
  );

  return (
    <Dialog onDismiss={dismiss}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {renderInput('Start date', start, setStart, minDate)}
        {renderInput('End date', end, setEnd, start ?? minDate)}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 12,
        }}
      >
        <button type="button" onClick={dismiss} style={textButton}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            if (!valid) return;
            onConfirm?.({ startDate: start, endDate: end });
            onClosed?.();
          }}
          style={{ ...textButton, opacity: valid ? 1 : 0.38 }}
        >
          Done
        </button>
      </div>
    </Dialog>
  );
}
