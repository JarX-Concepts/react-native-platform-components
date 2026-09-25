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
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import NativeTextField, {
  Commands,
  type TextFieldChangeEvent as NativeChangeEvent,
  type TextFieldSelectionEvent as NativeSelectionEvent,
  type TextFieldTextEvent as NativeTextEvent,
  type TextFieldToolbarItem as NativeToolbarItem,
  type TextFieldToolbarPressEvent as NativeToolbarPressEvent,
} from './TextFieldNativeComponent';
import { NO_ICON, resolveIcon, type PlatformIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import { focusRegistry } from './focusRegistry';
import { resolveSubmitBehavior } from './submitBehavior';
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

/**
 * Autofill hint: the React Native `TextInput` `autoComplete` values, which
 * include the HTML autocomplete names. iOS maps them to `textContentType`,
 * Android to autofill hints. A value one platform has no equivalent for is
 * ignored there.
 */
export type TextFieldAutoComplete =
  | 'off'
  | 'username'
  | 'username-new'
  | 'password'
  | 'current-password'
  | 'new-password'
  | 'password-new'
  | 'one-time-code'
  | 'sms-otp'
  | 'email-otp'
  | '2fa-app-otp'
  | 'email'
  | 'name'
  | 'given-name'
  | 'family-name'
  | 'additional-name'
  | 'name-given'
  | 'name-family'
  | 'name-middle'
  | 'name-middle-initial'
  | 'name-prefix'
  | 'name-suffix'
  | 'honorific-prefix'
  | 'honorific-suffix'
  | 'nickname'
  | 'organization'
  | 'organization-title'
  | 'tel'
  | 'tel-country-code'
  | 'tel-national'
  | 'tel-device'
  | 'street-address'
  | 'address-line1'
  | 'address-line2'
  | 'postal-address'
  | 'postal-address-country'
  | 'postal-address-extended'
  | 'postal-address-extended-postal-code'
  | 'postal-address-locality'
  | 'postal-address-region'
  | 'postal-address-dependent-locality'
  | 'postal-address-unit'
  | 'postal-code'
  | 'country'
  | 'birthdate-full'
  | 'birthdate-day'
  | 'birthdate-month'
  | 'birthdate-year'
  | 'gender'
  | 'cc-number'
  | 'cc-exp'
  | 'cc-exp-day'
  | 'cc-exp-month'
  | 'cc-exp-year'
  | 'cc-csc'
  | 'cc-name'
  | 'cc-given-name'
  | 'cc-middle-name'
  | 'cc-family-name'
  | 'cc-type'
  | 'url'
  | 'flight-number'
  | 'flight-confirmation-code'
  | 'gift-card-number'
  | 'gift-card-pin'
  | 'loyalty-account-number'
  | 'promo-code'
  | 'upi-vpa'
  | 'wifi-password';

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

/** A cursor position or selected range, as UTF-16 offsets into the text. */
export type TextFieldSelection = { start: number; end: number };

/** Selection events carry the new selection, as on `TextInput`. */
export type TextFieldSelectionChangeEvent = NativeSyntheticEvent<{
  selection: TextFieldSelection;
}>;

/**
 * What the return key does, as on `TextInput`: `'blurAndSubmit'` calls
 * `onSubmitEditing` and dismisses the keyboard, `'submit'` calls it and keeps
 * the keyboard up, `'newline'` inserts a newline (multi-line fields).
 */
export type TextFieldSubmitBehavior = 'submit' | 'blurAndSubmit' | 'newline';

/** A system button of the iOS keyboard toolbar (`UIBarButtonItem.SystemItem`). */
export type TextFieldToolbarSystemItem =
  | 'done'
  | 'cancel'
  | 'save'
  | 'add'
  | 'edit'
  | 'close'
  | 'search'
  | 'compose'
  | 'reply'
  | 'action'
  | 'camera'
  | 'trash'
  | 'undo'
  | 'redo';

/**
 * An item of the iOS keyboard toolbar: a button, or `'flexibleSpace'` to push
 * the next items to the end.
 */
export type TextFieldToolbarItem =
  | 'flexibleSpace'
  | {
      /** Passed to `onItemPress`. */
      id: string;
      /** Button title. */
      title?: string;
      /** An icon instead of the title: an SF Symbol name or an image. */
      icon?: PlatformIcon;
      /** A system button, with its own localized title or symbol. */
      systemItem?: TextFieldToolbarSystemItem;
      /** The prominent style: bold, or tinted glass on iOS 26. */
      prominent?: boolean;
      /** Screen-reader label; defaults to the title. */
      accessibilityLabel?: string;
      /** Test identifier of the button. */
      testID?: string;
    };

/** The iOS keyboard toolbar, a `UIToolbar` shown above the keyboard. */
export interface TextFieldKeyboardToolbar {
  /**
   * A Done button at the end of the toolbar that dismisses the keyboard
   * (`onBlur` is called; `onSubmitEditing` is not). `true` is the system
   * Done button; a string is a prominent button with that title.
   */
  done?: boolean | string;
  /** Buttons at the start of the toolbar, before Done. */
  items?: TextFieldToolbarItem[];
  /** Called with the `id` of a pressed item. */
  onItemPress?: (id: string) => void;
  /** Test identifier of the Done button. */
  doneTestID?: string;
}

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
  /**
   * Moves the cursor to `start`, or selects `start`..`end`, in UTF-16
   * offsets clamped to the text.
   */
  setSelection(start: number, end?: number): void;
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

  /**
   * Called when the return key is pressed, unless it inserts a newline (see
   * `submitBehavior`).
   */
  onSubmitEditing?: (event: TextFieldEvent) => void;

  /**
   * What the return key does. Default: `'blurAndSubmit'` for single-line
   * fields, `'newline'` for multi-line fields. `'submit'` keeps the keyboard
   * up, for a chat composer that sends on return.
   */
  submitBehavior?: TextFieldSubmitBehavior;

  /**
   * Called when the cursor moves or the selection changes, with
   * `nativeEvent.selection` in UTF-16 offsets.
   */
  onSelectionChange?: (event: TextFieldSelectionChangeEvent) => void;

  /**
   * Controlled cursor position or selection, in UTF-16 offsets; `end`
   * defaults to `start`, a cursor. Like `value`, the field returns to it
   * when the user moves the cursor, so update it from `onSelectionChange`.
   * For a one-off move, use the ref's `setSelection` instead.
   */
  selection?: { start: number; end?: number };

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

  /** Test identifier of the leading icon (Android: Material fields only). */
  leadingIconTestID?: string;

  /** Screen-reader label of the leading icon, which is decorative without one. */
  leadingIconAccessibilityLabel?: string;

  /** Test identifier of the trailing icon (Android: Material fields only). */
  trailingIconTestID?: string;

  /** Screen-reader label of the trailing icon. */
  trailingIconAccessibilityLabel?: string;

  /**
   * Called when a field with `editable={false}` is pressed, for a field that
   * opens a menu, a date picker or another screen. The field doesn't focus
   * or show the keyboard, keeps its enabled look, and is announced as a
   * button. Ignored while the field is editable.
   */
  onPress?: () => void;

  /**
   * Color of the focused outline (underline for filled fields), the focused
   * label and the cursor. Default: the tint / Material primary color.
   */
  activeColor?: ColorValue;

  /**
   * Color of the unfocused outline (underline for filled fields). iOS draws
   * the rounded-rect border itself when this, `activeColor` or
   * `containerColor` is set.
   */
  outlineColor?: ColorValue;

  /** Color of the outline, label and message in the error state. */
  errorColor?: ColorValue;

  /** Background of the field's box. The host `style.backgroundColor` paints the whole view. */
  containerColor?: ColorValue;

  /** Color of the typed text. */
  textColor?: ColorValue;

  /** Color of the placeholder. */
  placeholderTextColor?: ColorValue;

  /**
   * Largest scale the field's text may reach with the system text size
   * (Dynamic Type / font scale), as on React Native `Text`: `2` caps a 17pt
   * font at 34pt. Unset or `0`: no cap. Applies to the input, label,
   * placeholder, prefix, suffix and supporting text.
   */
  maxFontSizeMultiplier?: number;

  /** Horizontal alignment of the text. Default: the natural (leading) alignment. */
  textAlign?: 'left' | 'center' | 'right';

  /** Multi-line fields: the height in lines the field starts at. */
  minLines?: number;

  /** Multi-line fields: the lines the field grows to before it scrolls. */
  maxLines?: number;

  /**
   * When to show a clear button inside the field. Default: `'never'`.
   * Android shows the Material clear icon while the field has text.
   * Clearing fires `onChange` and `onChangeText('')` on both platforms.
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

  /**
   * Multi-line field that grows with its content, between `minLines` and
   * `maxLines`. Return inserts a newline.
   */
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

    /**
     * A toolbar above the keyboard (`inputAccessoryView`) with a Done
     * button and your own buttons. Number and phone pads have no return
     * key, so this is how they are dismissed.
     */
    keyboardToolbar?: TextFieldKeyboardToolbar;

    /**
     * Requirements for the strong passwords iOS suggests, as a
     * `UITextInputPasswordRules` descriptor, e.g.
     * `'minlength: 12; required: lower; required: upper; required: digit;'`.
     * Use with `autoComplete="new-password"`.
     */
    passwordRules?: string;
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

    /**
     * Material 3 text field style. Default: `'outlined'`. `'plain'` has no
     * box or underline (the label still floats), for a large standalone
     * input such as an amount; the iOS equivalent is `ios.borderStyle: 'none'`.
     */
    variant?: 'outlined' | 'filled' | 'plain';

    /** The dense variant, a shorter field. */
    dense?: boolean;
  };

  /**
   * Test identifier. It is set on the inner text input (the `UITextField` /
   * `UITextView` on iOS, the `EditText` on Android) rather than the host
   * view, so E2E drivers such as Detox can type into and clear the field.
   */
  testID?: string;
}

type NativeTextFieldInstance = React.ComponentRef<typeof NativeTextField>;

const TOOLBAR_ITEM: NativeToolbarItem = {
  kind: 'button',
  itemId: '',
  title: '',
  systemItem: '',
  ...NO_ICON,
  prominent: 'false',
  accessibilityLabel: '',
  testID: '',
};

/** The keyboard toolbar as flat items: yours, then a Done button at the end. */
function toolbarItems(
  toolbar: TextFieldKeyboardToolbar | undefined
): NativeToolbarItem[] {
  if (toolbar == null) return [];
  const items = (toolbar.items ?? []).map((item): NativeToolbarItem =>
    item === 'flexibleSpace'
      ? { ...TOOLBAR_ITEM, kind: 'flexibleSpace' }
      : {
          ...TOOLBAR_ITEM,
          itemId: item.id,
          title: item.title ?? '',
          systemItem: item.systemItem ?? '',
          ...resolveIcon(item.icon),
          prominent: item.prominent ? 'true' : 'false',
          accessibilityLabel: item.accessibilityLabel ?? '',
          testID: item.testID ?? '',
        }
  );
  if (toolbar.done) {
    if (items[items.length - 1]?.kind !== 'flexibleSpace') {
      items.push({ ...TOOLBAR_ITEM, kind: 'flexibleSpace' });
    }
    items.push({
      ...TOOLBAR_ITEM,
      kind: 'done',
      title: typeof toolbar.done === 'string' ? toolbar.done : '',
      prominent: 'true',
      testID: toolbar.doneTestID ?? '',
    });
  }
  return items;
}

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
      submitBehavior,
      onSelectionChange,
      selection,
      label,
      placeholder,
      supportingText,
      error,
      prefix,
      suffix,
      leadingIcon,
      trailingIcon,
      onTrailingIconPress,
      leadingIconTestID,
      leadingIconAccessibilityLabel,
      trailingIconTestID,
      trailingIconAccessibilityLabel,
      onPress,
      activeColor,
      outlineColor,
      errorColor,
      containerColor,
      textColor,
      placeholderTextColor,
      maxFontSizeMultiplier,
      textAlign,
      minLines,
      maxLines,
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
    const eventCountRef = useRef(0);
    const [lastNativeText, setLastNativeText] = useState<string | undefined>(
      value ?? defaultValue
    );
    // The selection last reported by native or pushed from here; a
    // `selection` prop that differs from it is pushed, the same way
    const [lastNativeSelection, setLastNativeSelection] =
      useState<TextFieldSelection | null>(null);

    // Registered like a TextInput, so Keyboard.dismiss() and the ScrollView
    // keyboard props treat the field as one (see focusRegistry.ts)
    useLayoutEffect(() => {
      const node = nativeRef.current;
      if (node == null) return undefined;
      focusRegistry.register(node);
      return () => focusRegistry.unregister(node);
    }, []);

    // Text first, then the selection, which may point into the new text
    const selectionStart = selection?.start;
    const selectionEnd = selection?.end ?? selectionStart;
    useLayoutEffect(() => {
      const node = nativeRef.current;
      if (typeof value === 'string' && value !== lastNativeText) {
        setLastNativeText(value);
        if (node != null) {
          Commands.setText(node, mostRecentEventCount, value);
        }
      }
      if (
        selectionStart != null &&
        selectionEnd != null &&
        (lastNativeSelection?.start !== selectionStart ||
          lastNativeSelection?.end !== selectionEnd)
      ) {
        setLastNativeSelection({ start: selectionStart, end: selectionEnd });
        if (node != null) {
          Commands.setSelection(
            node,
            mostRecentEventCount,
            selectionStart,
            selectionEnd
          );
        }
      }
    }, [
      value,
      lastNativeText,
      mostRecentEventCount,
      selectionStart,
      selectionEnd,
      lastNativeSelection,
    ]);

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
        setSelection: (start: number, end?: number) => {
          const node = nativeRef.current;
          if (node != null) {
            Commands.setSelection(
              node,
              eventCountRef.current,
              start,
              end ?? start
            );
          }
        },
      }),
      []
    );

    const handleChange = useCallback(
      (event: NativeSyntheticEvent<NativeChangeEvent>) => {
        const { text, eventCount } = event.nativeEvent;
        eventCountRef.current = eventCount;
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

    const handleSelectionChange = useCallback(
      (event: NativeSyntheticEvent<NativeSelectionEvent>) => {
        const { start, end } = event.nativeEvent;
        setLastNativeSelection({ start, end });
        onSelectionChange?.({
          ...event,
          nativeEvent: { selection: { start, end } },
        });
      },
      [onSelectionChange]
    );

    const onToolbarItemPress = ios?.keyboardToolbar?.onItemPress;
    const handleToolbarPress = useCallback(
      (event: NativeSyntheticEvent<NativeToolbarPressEvent>) => {
        onToolbarItemPress?.(event.nativeEvent.itemId);
      },
      [onToolbarItemPress]
    );

    const handleTrailingIconPress = useCallback(() => {
      onTrailingIconPress?.();
    }, [onTrailingIconPress]);

    const handlePress = useCallback(() => {
      onPress?.();
    }, [onPress]);

    // A read-only field with onPress acts as a button
    const pressable = editable === false && onPress != null;

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
        passwordRules: ios?.passwordRules ?? '',
      }),
      [ios]
    );

    const nativeToolbarItems = useMemo(
      () => toolbarItems(ios?.keyboardToolbar),
      [ios?.keyboardToolbar]
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
        submitBehavior={resolveSubmitBehavior(submitBehavior, multiline)}
        keyboardToolbarItems={nativeToolbarItems}
        interactivity={editable === false ? 'disabled' : 'enabled'}
        autoFocus={autoFocus ? 'focus' : 'none'}
        selectTextOnFocus={selectTextOnFocus ? 'select' : 'keep'}
        autoComplete={autoComplete ?? ''}
        keyboardAppearance={keyboardAppearance ?? 'default'}
        textStyle={nativeTextStyle}
        spokenLabel={accessibilityLabel ?? ''}
        leadingIconTestID={leadingIconTestID ?? ''}
        leadingIconSpokenLabel={leadingIconAccessibilityLabel ?? ''}
        trailingIconTestID={trailingIconTestID ?? ''}
        trailingIconSpokenLabel={trailingIconAccessibilityLabel ?? ''}
        activeColor={activeColor}
        outlineColor={outlineColor}
        errorColor={errorColor}
        containerColor={containerColor}
        textColor={textColor}
        placeholderTextColor={placeholderTextColor}
        maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
        textAlign={textAlign ?? ''}
        minLines={minLines ?? 0}
        maxLines={maxLines ?? 0}
        pressMode={pressable ? 'button' : 'none'}
        ios={nativeIOS}
        android={nativeAndroid}
        onFieldChange={handleChange}
        onFieldFocus={handleFocus}
        onFieldBlur={handleBlur}
        onFieldSubmit={onSubmitEditing ? handleSubmit : undefined}
        onFieldSelectionChange={
          onSelectionChange || selection ? handleSelectionChange : undefined
        }
        onKeyboardToolbarPress={
          onToolbarItemPress ? handleToolbarPress : undefined
        }
        onTrailingIconPress={
          onTrailingIconPress ? handleTrailingIconPress : undefined
        }
        onFieldPress={pressable ? handlePress : undefined}
        {...viewProps}
      />
    );
  }
);

TextField.displayName = 'TextField';
