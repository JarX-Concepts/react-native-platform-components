// web/Checkbox.tsx
import React, { useEffect, useId, useRef } from 'react';
import { View } from 'react-native';

import type { CheckboxProps } from '../Checkbox';
import type { RadioGroupProps } from '../RadioGroup';
import { usePrimaryColor, type CSSStyle } from './shared';

/** The Material 3 baseline error color. */
const ERROR_COLOR = '#B3261E';
const MUTED_COLOR = 'color-mix(in srgb, CanvasText 64%, transparent)';

/** The part of the DOM input this adapter sets (the library has no DOM lib types). */
type CheckboxElement = { indeterminate: boolean };

const ROW: CSSStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '8px 0',
  fontSize: 16,
  lineHeight: '24px',
  color: 'CanvasText',
};

const INPUT: CSSStyle = {
  width: 18,
  height: 18,
  margin: '3px 0 0',
  flexShrink: 0,
};

function errorStyle(): CSSStyle {
  return { fontSize: 12, lineHeight: '16px', color: ERROR_COLOR };
}

/**
 * A native `<input type="checkbox">` inside its `<label>`, so the box and
 * the text are one target. `indeterminate` is the input's DOM property
 * (there is no attribute for it). The message of `error` is the input's
 * description (`aria-describedby`), and `aria-invalid` marks the error.
 */
export function Checkbox(props: CheckboxProps): React.ReactElement {
  const primary = usePrimaryColor();
  const {
    checked,
    onCheckedChange,
    label,
    disabled,
    error,
    haptics: _haptics,
    // Browsers scale text with page zoom, which has no cap
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    ...viewProps
  } = props;

  const inputRef = useRef<CheckboxElement | null>(null);
  const errorId = useId();
  const indeterminate = checked === 'indeterminate';
  const errorText = typeof error === 'string' && error ? error : undefined;

  // After every render: a click clears the DOM's indeterminate flag, and a
  // parent that keeps 'indeterminate' re-renders without changing it
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  });

  return (
    <View {...viewProps}>
      <label
        style={{
          ...ROW,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.38 : 1,
        }}
      >
        <input
          ref={(element) => {
            inputRef.current = element as unknown as CheckboxElement | null;
          }}
          type="checkbox"
          data-testid={testID}
          // Controlled: React puts the box back if the parent doesn't update
          checked={checked === true}
          disabled={disabled}
          aria-label={accessibilityLabel}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorText ? errorId : undefined}
          onChange={() => {
            onCheckedChange?.(checked !== true);
            // Back to the prop's look until the parent re-renders (an
            // ignored toggle doesn't)
            if (inputRef.current)
              inputRef.current.indeterminate = indeterminate;
          }}
          style={{
            ...INPUT,
            accentColor: error ? ERROR_COLOR : primary,
            cursor: 'inherit',
          }}
        />
        <span>
          {label}
          {errorText ? (
            <span id={errorId} style={{ ...errorStyle(), display: 'block' }}>
              {errorText}
            </span>
          ) : null}
        </span>
      </label>
    </View>
  );
}

/**
 * Native `<input type="radio">`s sharing one name, in a `radiogroup`; each
 * option's input sits inside its `<label>` with the description. The
 * validation message under the group is the group's description and a
 * polite live region.
 */
export function RadioGroup(props: RadioGroupProps): React.ReactElement {
  const primary = usePrimaryColor();
  const {
    options,
    value,
    onValueChange,
    error,
    disabled,
    haptics: _haptics,
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    ...viewProps
  } = props;

  const name = useId();
  const errorId = useId();
  const errorText = typeof error === 'string' && error ? error : undefined;

  return (
    <View {...viewProps} testID={testID}>
      <div
        role="radiogroup"
        aria-label={accessibilityLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorText ? errorId : undefined}
        aria-disabled={disabled || undefined}
      >
        {options.map((option, index) => {
          const optionDisabled = !!(disabled || option.disabled);
          return (
            <label
              key={option.value}
              style={{
                ...ROW,
                cursor: optionDisabled ? 'default' : 'pointer',
                opacity: optionDisabled ? 0.38 : 1,
              }}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                data-testid={
                  option.testID ??
                  (testID ? `${testID}-${option.value}` : undefined)
                }
                // Controlled: React puts the choice back if the parent doesn't update
                checked={value === option.value}
                disabled={optionDisabled}
                aria-label={option.accessibilityLabel}
                onChange={() => onValueChange?.(option.value, index)}
                style={{
                  ...INPUT,
                  accentColor: error ? ERROR_COLOR : primary,
                  cursor: 'inherit',
                }}
              />
              <span>
                {option.label}
                {option.description ? (
                  <span
                    style={{
                      display: 'block',
                      fontSize: 14,
                      lineHeight: '20px',
                      color: MUTED_COLOR,
                    }}
                  >
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      <div id={errorId} aria-live="polite" style={errorStyle()}>
        {errorText ?? ''}
      </div>
    </View>
  );
}
