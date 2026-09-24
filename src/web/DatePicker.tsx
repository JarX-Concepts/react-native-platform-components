// web/DatePicker.tsx
import React, { useState } from 'react';
import { View } from 'react-native';

import type { DatePickerProps } from '../DatePicker';
import { Dialog } from './Dialog';
import {
  formatInputValue,
  inputTypeForMode,
  parseInputValue,
} from './dateInput';
import { BUTTON_BASE, eventValue, usePrimaryColor } from './shared';

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

/**
 * The browser's date and time inputs. `embedded` renders the input in place
 * and reports every change with `confirmed: true`. `modal` opens it in a
 * `<dialog>` with Cancel/Done buttons, like the iOS popover: changes report
 * `confirmed: false`, Done reports `confirmed: true`, and Cancel, Escape or a
 * click outside call `onClosed`. In `countDownTimer` mode the input is a time
 * input and `onConfirm`'s `durationSeconds` is its hours and minutes.
 */
export function DatePicker(props: DatePickerProps): React.ReactElement {
  const {
    style,
    date,
    minDate,
    maxDate,
    locale,
    mode,
    presentation = 'modal',
    visible,
    onConfirm,
    onClosed,
    ios,
    testID,
  } = props;

  const primary = usePrimaryColor();
  const type = inputTypeForMode(mode);
  const step = ios?.minuteInterval ? ios.minuteInterval * 60 : undefined;
  const confirm = (next: Date, confirmed: boolean) =>
    onConfirm?.(
      next,
      confirmed,
      mode === 'countDownTimer'
        ? next.getHours() * 3600 + next.getMinutes() * 60
        : 0
    );

  const renderInput = (
    value: Date | null,
    onValue: (next: Date) => void,
    autoFocus: boolean
  ) => (
    <input
      type={type}
      lang={locale}
      value={formatInputValue(value, type)}
      min={formatInputValue(minDate, type) || undefined}
      max={formatInputValue(maxDate, type) || undefined}
      step={step}
      autoFocus={autoFocus}
      onChange={(event) => {
        const next = parseInputValue(eventValue(event), type, value);
        if (next) onValue(next);
      }}
      style={{ ...INPUT_STYLE, accentColor: primary }}
    />
  );

  if (presentation === 'embedded') {
    return (
      <View testID={testID} style={style}>
        {renderInput(date, (next) => confirm(next, true), false)}
      </View>
    );
  }

  return (
    <View testID={testID} style={style}>
      {visible ? (
        <ModalPicker
          date={date}
          primary={primary}
          renderInput={renderInput}
          onConfirm={confirm}
          onClosed={onClosed}
        />
      ) : null}
    </View>
  );
}

function ModalPicker({
  date,
  primary,
  renderInput,
  onConfirm,
  onClosed,
}: {
  date: Date | null;
  primary: string;
  renderInput: (
    value: Date | null,
    onValue: (next: Date) => void,
    autoFocus: boolean
  ) => React.ReactElement;
  onConfirm: (next: Date, confirmed: boolean) => void;
  onClosed: DatePickerProps['onClosed'];
}): React.ReactElement {
  const [draft, setDraft] = useState(date);
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

  return (
    <Dialog onDismiss={dismiss}>
      {renderInput(
        draft,
        (next) => {
          setDraft(next);
          onConfirm(next, false);
        },
        true
      )}
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
          disabled={!draft}
          onClick={() => draft && onConfirm(draft, true)}
          style={{ ...textButton, opacity: draft ? 1 : 0.38 }}
        >
          Done
        </button>
      </div>
    </Dialog>
  );
}
