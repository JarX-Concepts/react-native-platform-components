// TextFieldNativeComponent.ts
import type * as React from 'react';
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeCommands, codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/**
 * Icon fields, pre-resolved on the JS side (see icons.ts).
 */
export type TextFieldIconProps = Readonly<{
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconRequest: string;
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
}>;

/**
 * Text font. Empty strings / 0 mean "platform default".
 */
export type TextFieldTextStyleProps = Readonly<{
  fontFamily?: string;
  fontSize?: Double;
  fontWeight?: string; // 'normal' | 'bold' | '100'..'900'
  fontStyle?: string; // 'normal' | 'italic'
}>;

/**
 * Fired on every edit. `eventCount` is the native edit counter that JS hands
 * back with `setText`, so a stale controlled value can't overwrite what the
 * user typed since.
 */
export type TextFieldChangeEvent = Readonly<{
  text: string;
  eventCount: Int32;
}>;

/** Focus, blur and submit carry the text at that moment. */
export type TextFieldTextEvent = Readonly<{
  text: string;
}>;

/** The cursor or selection, as UTF-16 offsets into the text. */
export type TextFieldSelectionEvent = Readonly<{
  start: Int32;
  end: Int32;
}>;

/** A press on a keyboard toolbar button (iOS). */
export type TextFieldToolbarPressEvent = Readonly<{
  itemId: string;
}>;

/**
 * A keyboard toolbar item (iOS). Icons are pre-resolved on the JS side (see
 * icons.ts); empty strings mean "none".
 */
export type TextFieldToolbarItem = Readonly<{
  kind: string; // 'button' | 'done' | 'flexibleSpace'
  itemId: string;
  title: string;
  systemItem: string; // '' | UIBarButtonItem.SystemItem name
  iconType: string; // '' | 'sfSymbol' | 'image'
  iconName: string;
  iconRequest: string;
  iconUri: string;
  iconScale: Double;
  iconTinted: string; // 'true' | 'false'
  prominent: string; // 'true' | 'false'
  accessibilityLabel: string;
  testID: string;
}>;

/**
 * iOS-specific configuration. Every field is '' for the platform default.
 */
export type TextFieldIOSProps = Readonly<{
  /** 'default' | 'complete' | 'limited' | 'none' (iOS 18) */
  writingTools?: string;
  /** 'default' | 'yes' | 'no' (iOS 17) */
  inlinePrediction?: string;
  /** 'default' | 'yes' | 'no' */
  smartQuotes?: string;
  /** 'default' | 'yes' | 'no' */
  smartDashes?: string;
  /** 'default' | 'yes' | 'no' */
  smartInsertDelete?: string;
  /** 'default' | 'yes' | 'no' (iOS 18) */
  mathExpressionCompletion?: string;
  /** 'roundedRect' | 'none' | 'line' | 'bezel' */
  borderStyle?: string;
  /** 'above' | 'leading': where the label sits */
  labelPlacement?: string;
  /** Width of a leading label column in points; 0 = default */
  labelWidth?: Double;
  /** UITextInputPasswordRules descriptor; '' = none */
  passwordRules?: string;
}>;

/**
 * Android-specific configuration.
 */
export type TextFieldAndroidProps = Readonly<{
  /** 'm3' | 'system' (AndroidMaterialMode) */
  material?: string;
  /** 'outlined' | 'filled' | 'plain' */
  variant?: string;
  /** 'standard' | 'dense' */
  density?: string;
}>;

export interface TextFieldNativeProps extends ViewProps {
  /**
   * Text applied when the native view is created. Later updates go through
   * the `setText` command so they can be checked against `eventCount`.
   */
  initialText?: string;

  /** Floating label (Android) / caption above the field (iOS). */
  label?: string;

  /** Placeholder shown while the field is empty. */
  placeholder?: string;

  /** Helper text below the field. */
  supportingText?: string;

  /** 'none' | 'error' */
  errorState?: string;

  /** Error message shown instead of the supporting text. */
  errorText?: string;

  /** Text shown before the input, inside the field. */
  prefix?: string;

  /** Text shown after the input, inside the field. */
  suffix?: string;

  /** Icon at the start of the field. */
  leadingIcon?: TextFieldIconProps;

  /** Icon at the end of the field; pressing it fires onTrailingIconPress. */
  trailingIcon?: TextFieldIconProps;

  /** 'never' | 'while-editing' | 'unless-editing' | 'always' */
  clearButtonMode?: string;

  /** 'shown' | 'hidden': a button that toggles secure text entry. */
  passwordToggle?: string;

  /** 'shown' | 'hidden': the character counter. */
  characterCount?: string;

  /** Maximum number of UTF-16 characters; 0 = unlimited. */
  maxLength?: Int32;

  /** React Native keyboardType value. */
  keyboardType?: string;

  /** React Native returnKeyType value. */
  returnKeyType?: string;

  /** 'none' | 'sentences' | 'words' | 'characters' */
  autoCapitalize?: string;

  /** 'enabled' | 'disabled' */
  autoCorrect?: string;

  /** 'secure' | 'plain' */
  secureTextEntry?: string;

  /** 'single' | 'multiline' */
  lines?: string;

  /**
   * What the return key does: 'submit' | 'blurAndSubmit' | 'newline',
   * resolved on the JS side ('newline' only for multi-line fields).
   */
  submitBehavior?: string;

  /** iOS: the keyboard toolbar (inputAccessoryView); empty = none. */
  keyboardToolbarItems?: ReadonlyArray<TextFieldToolbarItem>;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** 'focus' | 'none': focus the field when it mounts. */
  autoFocus?: string;

  /** 'select' | 'keep': select all text on focus. */
  selectTextOnFocus?: string;

  /** React Native autoComplete value; '' = platform default. */
  autoComplete?: string;

  /** 'default' | 'light' | 'dark' (iOS keyboard appearance) */
  keyboardAppearance?: string;

  /** Font of the input text. */
  textStyle?: TextFieldTextStyleProps;

  /**
   * Screen-reader label, applied to the native field rather than the host
   * view. Empty means "use the label".
   */
  spokenLabel?: string;

  /** E2E identifier of the leading icon. */
  leadingIconTestID?: string;

  /** Screen-reader label of the leading icon. */
  leadingIconSpokenLabel?: string;

  /** E2E identifier of the trailing icon. */
  trailingIconTestID?: string;

  /** Screen-reader label of the trailing icon. */
  trailingIconSpokenLabel?: string;

  /** Focused outline, focused label and cursor color. */
  activeColor?: ColorValue;

  /** Unfocused outline (underline for the filled variant) color. */
  outlineColor?: ColorValue;

  /** Error outline, label and message color. */
  errorColor?: ColorValue;

  /** Background of the field's box. */
  containerColor?: ColorValue;

  /** Input text color. */
  textColor?: ColorValue;

  /** Placeholder color. */
  placeholderTextColor?: ColorValue;

  /** Largest font scale the text may reach; 0 = no cap. */
  maxFontSizeMultiplier?: Double;

  /** '' (natural) | 'left' | 'center' | 'right' */
  textAlign?: string;

  /** Multi-line: minimum and maximum visible lines; 0 = unset. */
  minLines?: Int32;
  maxLines?: Int32;

  /** 'none' | 'button': a non-editable field that fires onFieldPress. */
  pressMode?: string;

  ios?: TextFieldIOSProps;
  android?: TextFieldAndroidProps;

  /** Fired on every user edit. */
  onFieldChange?: BubblingEventHandler<TextFieldChangeEvent>;

  /** Fired when the field gains focus. */
  onFieldFocus?: BubblingEventHandler<TextFieldTextEvent>;

  /** Fired when the field loses focus. */
  onFieldBlur?: BubblingEventHandler<TextFieldTextEvent>;

  /** Fired when the return key submits (see submitBehavior). */
  onFieldSubmit?: BubblingEventHandler<TextFieldTextEvent>;

  /** Fired when the cursor moves or the selection changes. */
  onFieldSelectionChange?: BubblingEventHandler<TextFieldSelectionEvent>;

  /** iOS: fired when a keyboard toolbar button (other than Done) is pressed. */
  onKeyboardToolbarPress?: BubblingEventHandler<TextFieldToolbarPressEvent>;

  /** Fired when the trailing icon is pressed. */
  onTrailingIconPress?: BubblingEventHandler<Readonly<{}>>;

  /** Fired when a field with pressMode 'button' is pressed. */
  onFieldPress?: BubblingEventHandler<Readonly<{}>>;
}

type NativeTextFieldComponent = HostComponent<TextFieldNativeProps>;

// `React.ElementRef` rather than `React.ComponentRef`: the codegen shipped with
// React Native 0.81 (and the 0.76 Android floor) only accepts the former.
interface NativeCommands {
  /** Focuses the field and shows the keyboard. */
  focus: (viewRef: React.ElementRef<NativeTextFieldComponent>) => void;

  /** Removes focus and hides the keyboard. */
  blur: (viewRef: React.ElementRef<NativeTextFieldComponent>) => void;

  /** Clears the text; fires onFieldChange like a user edit. */
  clear: (viewRef: React.ElementRef<NativeTextFieldComponent>) => void;

  /**
   * Replaces the text, unless the user has edited since `eventCount` was
   * reported, in which case the update is dropped and the next edit event
   * brings JS back in sync.
   */
  setText: (
    viewRef: React.ElementRef<NativeTextFieldComponent>,
    eventCount: Int32,
    text: string
  ) => void;

  /**
   * Selects `start`..`end` (UTF-16 offsets, clamped to the text), unless the
   * user has edited since `eventCount` was reported, as for `setText`.
   */
  setSelection: (
    viewRef: React.ElementRef<NativeTextFieldComponent>,
    eventCount: Int32,
    start: Int32,
    end: Int32
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['focus', 'blur', 'clear', 'setText', 'setSelection'],
});

export default codegenNativeComponent<TextFieldNativeProps>(
  'PCTextField'
) as NativeTextFieldComponent;
