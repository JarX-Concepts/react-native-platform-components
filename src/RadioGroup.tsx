// RadioGroup.tsx
import React, { useCallback, useMemo, useState } from 'react';
import type { ViewProps } from 'react-native';

import NativeRadioGroup, {
  type RadioGroupChangeEvent,
  type RadioGroupNativeOption,
} from './RadioGroupNativeComponent';
import type { Haptics } from './haptics';
import { warnSelectionIdentifiers } from './selectionIdentifiers';

export interface RadioGroupOption {
  /** Unique value identifier for the option */
  value: string;

  /** Option text. It wraps. */
  label: string;

  /** Secondary text under the label, such as "3–5 business days". */
  description?: string;

  /** Whether this specific option is disabled */
  disabled?: boolean;

  /** Test identifier of the option's row. Default: `${testID}-${value}`. */
  testID?: string;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;
}

export interface RadioGroupProps extends ViewProps {
  /** Options to display, top to bottom */
  options: readonly RadioGroupOption[];

  /**
   * Value of the chosen option (controlled). `undefined` / `null`: none
   * chosen yet. The group shows what the prop says: a tap calls
   * `onValueChange`, and the choice moves once `value` does (and goes back
   * if it doesn't).
   */
  value?: string | null;

  /**
   * Called when the user picks an option.
   * @param value - The option's value
   * @param index - The option's index
   */
  onValueChange?: (value: string, index: number) => void;

  /**
   * Error state. A string is the validation message shown under the group
   * (such as "Choose a delivery method"); `true` shows the error look
   * without a message.
   */
  error?: boolean | string;

  /** Whether the entire group is disabled */
  disabled?: boolean;

  /**
   * Haptic played when the user picks an option. Default: none, like the
   * native controls. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Largest scale the labels' font can reach with the system text size
   * (Dynamic Type / font scale), as on `Text`: `undefined` or `0` means no
   * cap; values of 1 or more cap it.
   */
  maxFontSizeMultiplier?: number;

  /**
   * Screen-reader name of the group, such as "Delivery method". TalkBack
   * announces it on the radio group; VoiceOver on entering the group.
   */
  accessibilityLabel?: string;

  /** Test identifier of the group; also the prefix of the options' defaults. */
  testID?: string;
}

export function RadioGroup(props: RadioGroupProps): React.ReactElement {
  const {
    options,
    value,
    onValueChange,
    error,
    disabled,
    haptics,
    maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    ...viewProps
  } = props;

  const nativeOptions = useMemo((): RadioGroupNativeOption[] => {
    warnSelectionIdentifiers(
      'RadioGroup',
      options.map((option) => option.value)
    );
    return options.map((option) => ({
      value: option.value,
      label: option.label,
      description: option.description ?? '',
      disabled: option.disabled ? 'disabled' : 'enabled',
      testID: option.testID ?? (testID ? `${testID}-${option.value}` : ''),
      accessibilityLabel: option.accessibilityLabel ?? '',
    }));
  }, [options, testID]);

  // Controlled: every pick re-renders with a new event count, so native
  // applies `value` again and a pick the parent didn't take goes back.
  const [valueEventCount, setValueEventCount] = useState(0);
  const handleChange = useCallback(
    (e: { nativeEvent: RadioGroupChangeEvent }) => {
      setValueEventCount((count) => count + 1);
      onValueChange?.(e.nativeEvent.value, e.nativeEvent.index);
    },
    [onValueChange]
  );

  return (
    <NativeRadioGroup
      options={nativeOptions}
      value={value ?? ''}
      valueEventCount={valueEventCount}
      errorState={error ? 'error' : 'none'}
      errorText={typeof error === 'string' ? error : ''}
      interactivity={disabled ? 'disabled' : 'enabled'}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      groupLabel={accessibilityLabel ?? ''}
      haptics={haptics ?? ''}
      onRadioGroupChange={handleChange}
      testID={testID}
      {...viewProps}
    />
  );
}
