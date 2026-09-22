// TextField.tsx
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

import NativeTextField, {
  Commands,
  type TextFieldChangeEvent as NativeChangeEvent,
  type TextFieldTextEvent as NativeTextEvent,
} from './TextFieldNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import { focusRegistry } from './focusRegistry';
import type { AndroidMaterialMode } from './sharedTypes';

/** Keyboard to show; the React Native `TextInput` values. */
export type TextFieldKeyboardType =
  | 'default'
  | 'number-pad'
  | 'decimal-pad'
  | 'numeric'
  | 'email-address'
  | 'phone-pad'
  | 'url'
  | 'ascii-capable'
  | 'numbers-and-punctuation'
  | 'name-phone-pad'
  | 'twitter'
  | 'web-search'
  | 'visible-password';

/** Return key label; the React Native `TextInput` values. */
export type TextFieldReturnKeyType =
  'default' | 'done' | 'go' | 'next' | 'search' | 'send' | 'none' | 'previous';

/** Autofill hint; a cross-platform subset of the React Native `TextInput` values. */
export type TextFieldAutoComplete =
  | 'off'
  | 'username'
  | 'password'
  | 'new-password'
  | 'one-time-code'
  | 'email'
  | 'name'
  | 'given-name'
  | 'family-name'
  | 'tel'
  | 'street-address'
  | 'postal-code'
  | 'country'
  | 'cc-number'
  | 'cc-exp'
  | 'cc-csc'
  | 'url';

export type TextFieldAutoCapitalize =
  'none' | 'sentences' | 'words' | 'characters';

export type TextFieldClearButtonMode =
  'never' | 'while-editing' | 'unless-editing' | 'always';

/** An iOS text trait: the system default, on, or off. */
export type TextFieldIOSChoice = 'default' | 'yes' | 'no';

/** Focus, blur and submit events carry the text at that moment. */
export type TextFieldEvent = NativeSyntheticEvent<{ text: string }>;

/** Change events carry the text and the native edit counter. */
export type TextFieldChangeEvent = NativeSyntheticEvent<{
  text: string;
  eventCount: number;
}>;

/** Methods available through the `ref`. */
export interface TextFieldRef {
  /** Focuses the field and shows the keyboard. */
  focus(): void;
  /** Removes focus and hides the keyboard. */
  blur(): void;
  /** Clears the text. Fires `onChangeText('')`. */
  clear(): void;
  /** Whether the field currently has focus. */
  isFocused(): boolean;
}

export interface TextFieldProps extends Omit<
  ViewProps,
  'onFocus' | 'onBlur' | 'children'
> {
  /**
   * Controlled text. Native keeps what the user typed until the next
   * `onChangeText` round-trip, so updating state from `onChangeText` never
   * drops characters.
   */
  value?: string;

  /** Initial text of an uncontrolled field. */
  defaultValue?: string;

  /** Called with the new text on every edit. */
  onChangeText?: (text: string) => void;

  /** Called on every edit with the native event. */
  onChange?: (event: TextFieldChangeEvent) => void;

  /** Called when the field gains focus. */
  onFocus?: (event: TextFieldEvent) => void;

  /** Called when the field loses focus. */
  onBlur?: (event: TextFieldEvent) => void;

  /** Called when the return key is pressed. Single-line fields only. */
  onSubmitEditing?: (event: TextFieldEvent) => void;

  /**
   * Field label. Android: the Material floating label. iOS: a caption above
   * the field, which takes the tint color while focused.
   */
  label?: string;

  /** Placeholder shown while the field is empty. */
  placeholder?: string;

  /** Helper text below the field. */
  supportingText?: string;

  /**
   * Error state. A string is shown below the field in place of the
   * supporting text; `true` marks the field as invalid and keeps the
   * supporting text.
   */
  error?: boolean | string;

  /** Text shown before the input, inside the field (a currency sign). */
  prefix?: string;

  /** Text shown after the input, inside the field (a unit). */
  suffix?: string;

  /** Icon at the start of the field. */
  leadingIcon?: PlatformIcon;

  /** Icon at the end of the field. Pressing it calls `onTrailingIconPress`. */
  trailingIcon?: PlatformIcon;

  /** Called when the trailing icon is pressed. */
  onTrailingIconPress?: () => void;

  /**
   * When to show a clear button inside the field. Default: `'never'`.
   * Android shows the Material clear icon while the field has text.
   */
  clearButtonMode?: TextFieldClearButtonMode;

  /**
   * Shows a button that toggles `secureTextEntry`, for password fields.
   * Android: the Material password toggle. iOS: an eye button.
   */
  passwordToggle?: boolean;

  /** Shows the character count below the field (`12 / 100` with `maxLength`). */
  showCharacterCount?: boolean;

  /** Maximum number of characters. */
  maxLength?: number;

  /** Keyboard to show. Default: `'default'`. */
  keyboardType?: TextFieldKeyboardType;

  /** Return key label. Default: `'default'`. */
  returnKeyType?: TextFieldReturnKeyType;

  /** Automatic capitalization. Default: `'sentences'`. */
  autoCapitalize?: TextFieldAutoCapitalize;

  /** Auto-correction and suggestions. Default: `true`. */
  autoCorrect?: boolean;

  /** Obscures the text, for passwords. */
  secureTextEntry?: boolean;

  /** Multi-line field that grows with its content. Return inserts a newline. */
  multiline?: boolean;

  /** Whether the text can be edited. Default: `true`. */
  editable?: boolean;

  /** Focuses the field when it mounts. */
  autoFocus?: boolean;

  /** Selects all text when the field gains focus. */
  selectTextOnFocus?: boolean;

  /**
   * Autofill hint. Android: autofill hints. iOS: `textContentType`, which
   * also enables the password and one-time-code suggestions.
   */
  autoComplete?: TextFieldAutoComplete;

  /** iOS: keyboard appearance. Default: `'default'`. */
  keyboardAppearance?: 'default' | 'light' | 'dark';

  /** Font of the input text. */
  textStyle?: LabelStyle;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /**
   * iOS-specific configuration. Each trait defaults to the system default.
   */
  ios?: {
    /**
     * Writing Tools (iOS 18): `'complete'` allows rewrites in place,
     * `'limited'` only the overlay panel, `'none'` disables them.
     */
    writingTools?: 'default' | 'complete' | 'limited' | 'none';

    /** Inline predictive text (iOS 17). */
    inlinePrediction?: TextFieldIOSChoice;

    /** Smart quotes. */
    smartQuotes?: TextFieldIOSChoice;

    /** Smart dashes. */
    smartDashes?: TextFieldIOSChoice;

    /** Smart insert and delete (spaces around pasted words). */
    smartInsertDelete?: TextFieldIOSChoice;

    /** Math expression completion, `1+1=` (iOS 18). */
    mathExpressionCompletion?: TextFieldIOSChoice;

    /** `UITextField.borderStyle`. Default: `'roundedRect'`. */
    borderStyle?: 'roundedRect' | 'none' | 'line' | 'bezel';

    /**
     * Where the label sits: above the field (default), or in a leading
     * column with the field beside it, the layout of the grouped forms in
     * Contacts and Settings. Pair `'leading'` with `borderStyle: 'none'`
     * inside your own grouped row.
     */
    labelPlacement?: 'above' | 'leading';

    /** Width of the leading label column, in points. Default: 100. */
    labelWidth?: number;
  };

  /**
   * Android-specific configuration
   */
  android?: {
    /**
     * Material preference: the Material 3 text field (default), or
     * `'system'` for the platform `EditText` (the hint as placeholder,
     * supporting text below, icons as compound drawables; no box, floating
     * label, clear button, password toggle, counter, prefix or suffix).
     */
    material?: AndroidMaterialMode;

    /** Material 3 text field style. Default: `'outlined'`. */
    variant?: 'outlined' | 'filled';

    /** The dense variant, a shorter field. */
    dense?: boolean;
  };

  /** Test identifier */
  testID?: string;
}

type NativeTextFieldInstance = React.ComponentRef<typeof NativeTextField>;

export const TextField = forwardRef<TextFieldRef, TextFieldProps>(
  function TextFieldComponent(props, ref): React.ReactElement {
    const {
      value,
      defaultValue,
      onChangeText,
      onChange,
      onFocus,
      onBlur,
      onSubmitEditing,
      label,
      placeholder,
      supportingText,
      error,
      prefix,
      suffix,
      leadingIcon,
      trailingIcon,
      onTrailingIconPress,
      clearButtonMode,
      passwordToggle,
      showCharacterCount,
      maxLength,
      keyboardType,
      returnKeyType,
      autoCapitalize,
      autoCorrect,
      secureTextEntry,
      multiline,
      editable,
      autoFocus,
      selectTextOnFocus,
      autoComplete,
      keyboardAppearance,
      textStyle,
      accessibilityLabel,
      ios,
      android,
      ...viewProps
    } = props;

    const nativeRef = useRef<NativeTextFieldInstance>(null);
    const focused = useRef(false);

    // The same synchronization as React Native's TextInput: every native edit
    // reports an event count, and a controlled value is pushed with the last
    // count JS has seen. Native drops the update when the user has typed
    // since, and the edit that follows brings JS back in line.
    const [mostRecentEventCount, setMostRecentEventCount] = useState(0);
    const [lastNativeText, setLastNativeText] = useState<string | undefined>(
      value ?? defaultValue
    );

    // Registered like a TextInput, so Keyboard.dismiss() and the ScrollView
    // keyboard props treat the field as one (see focusRegistry.ts)
    useLayoutEffect(() => {
      const node = nativeRef.current;
      if (node == null) return undefined;
      focusRegistry.register(node);
      return () => focusRegistry.unregister(node);
    }, []);

    useLayoutEffect(() => {
      if (typeof value !== 'string' || value === lastNativeText) return;
      setLastNativeText(value);
      const node = nativeRef.current;
      if (node != null) {
        Commands.setText(node, mostRecentEventCount, value);
      }
    }, [value, lastNativeText, mostRecentEventCount]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          const node = nativeRef.current;
          if (node != null) Commands.focus(node);
        },
        blur: () => {
          const node = nativeRef.current;
          if (node != null) Commands.blur(node);
        },
        clear: () => {
          const node = nativeRef.current;
          if (node != null) Commands.clear(node);
        },
        isFocused: () => focused.current,
      }),
      []
    );

    const handleChange = useCallback(
      (event: NativeSyntheticEvent<NativeChangeEvent>) => {
        const { text, eventCount } = event.nativeEvent;
        setMostRecentEventCount(eventCount);
        setLastNativeText(text);
        onChange?.(event);
        onChangeText?.(text);
      },
      [onChange, onChangeText]
    );

    const handleFocus = useCallback(
      (event: NativeSyntheticEvent<NativeTextEvent>) => {
        focused.current = true;
        focusRegistry.focused(nativeRef.current);
        onFocus?.(event);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (event: NativeSyntheticEvent<NativeTextEvent>) => {
        focused.current = false;
        focusRegistry.blurred(nativeRef.current);
        onBlur?.(event);
      },
      [onBlur]
    );

    const handleSubmit = useCallback(
      (event: NativeSyntheticEvent<NativeTextEvent>) => {
        onSubmitEditing?.(event);
      },
      [onSubmitEditing]
    );

    const handleTrailingIconPress = useCallback(() => {
      onTrailingIconPress?.();
    }, [onTrailingIconPress]);

    const nativeLeadingIcon = useMemo(
      () => resolveIcon(leadingIcon),
      [leadingIcon]
    );
    const nativeTrailingIcon = useMemo(
      () => resolveIcon(trailingIcon),
      [trailingIcon]
    );
    const nativeTextStyle = useMemo(
      () => normalizeLabelStyle(textStyle),
      [textStyle]
    );

    const nativeIOS = useMemo(
      () => ({
        writingTools: ios?.writingTools ?? '',
        inlinePrediction: ios?.inlinePrediction ?? '',
        smartQuotes: ios?.smartQuotes ?? '',
        smartDashes: ios?.smartDashes ?? '',
        smartInsertDelete: ios?.smartInsertDelete ?? '',
        mathExpressionCompletion: ios?.mathExpressionCompletion ?? '',
        borderStyle: ios?.borderStyle ?? '',
        labelPlacement: ios?.labelPlacement ?? '',
        labelWidth: ios?.labelWidth ?? 0,
      }),
      [ios]
    );

    const nativeAndroid = useMemo(
      () => ({
        material: android?.material ?? 'm3',
        variant: android?.variant ?? 'outlined',
        density: android?.dense ? 'dense' : 'standard',
      }),
      [android]
    );

    return (
      <NativeTextField
        ref={nativeRef}
        initialText={value ?? defaultValue ?? ''}
        label={label ?? ''}
        placeholder={placeholder ?? ''}
        supportingText={supportingText ?? ''}
        errorState={error ? 'error' : 'none'}
        errorText={typeof error === 'string' ? error : ''}
        prefix={prefix ?? ''}
        suffix={suffix ?? ''}
        leadingIcon={nativeLeadingIcon}
        trailingIcon={nativeTrailingIcon}
        clearButtonMode={clearButtonMode ?? 'never'}
        passwordToggle={passwordToggle ? 'shown' : 'hidden'}
        characterCount={showCharacterCount ? 'shown' : 'hidden'}
        maxLength={maxLength ?? 0}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType={returnKeyType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={autoCorrect === false ? 'disabled' : 'enabled'}
        secureTextEntry={secureTextEntry ? 'secure' : 'plain'}
        lines={multiline ? 'multiline' : 'single'}
        interactivity={editable === false ? 'disabled' : 'enabled'}
        autoFocus={autoFocus ? 'focus' : 'none'}
        selectTextOnFocus={selectTextOnFocus ? 'select' : 'keep'}
        autoComplete={autoComplete ?? ''}
        keyboardAppearance={keyboardAppearance ?? 'default'}
        textStyle={nativeTextStyle}
        spokenLabel={accessibilityLabel ?? ''}
        ios={nativeIOS}
        android={nativeAndroid}
        onFieldChange={handleChange}
        onFieldFocus={handleFocus}
        onFieldBlur={handleBlur}
        onFieldSubmit={onSubmitEditing ? handleSubmit : undefined}
        onTrailingIconPress={
          onTrailingIconPress ? handleTrailingIconPress : undefined
        }
        {...viewProps}
      />
    );
  }
);

TextField.displayName = 'TextField';
