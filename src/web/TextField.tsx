// web/TextField.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type {
  TextFieldChangeEvent,
  TextFieldEvent,
  TextFieldProps,
  TextFieldRef,
} from '../TextField';
import { Icon } from './Icon';
import { usePrimaryColor } from './shared';

const ERROR_COLOR = '#B3261E';
const MUTED_COLOR = 'rgba(128, 128, 128, 1)';
const OUTLINE_COLOR = 'rgba(128, 128, 128, 0.5)';

function textEvent(text: string): TextFieldEvent {
  return { nativeEvent: { text } } as TextFieldEvent;
}

/**
 * A text input with the TextField extras around it: a label above, prefix and
 * suffix, icons, a clear button, a password toggle, and supporting, error and
 * counter text below.
 */
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
      clearButtonMode = 'never',
      passwordToggle,
      showCharacterCount,
      maxLength,
      keyboardType,
      returnKeyType,
      autoCapitalize,
      autoCorrect,
      secureTextEntry,
      multiline,
      editable = true,
      autoFocus,
      selectTextOnFocus,
      autoComplete,
      keyboardAppearance,
      textStyle,
      accessibilityLabel,
      ios,
      android,
      style,
      ...viewProps
    } = props;

    const primary = usePrimaryColor();
    const inputRef = useRef<React.ComponentRef<typeof TextInput> | null>(null);
    const eventCount = useRef(0);
    const [uncontrolledText, setUncontrolledText] = useState(
      defaultValue ?? ''
    );
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const text = value ?? uncontrolledText;
    const errorText = typeof error === 'string' ? error : undefined;
    const invalid = error !== undefined && error !== false && error !== '';

    const changeText = (next: string) => {
      setUncontrolledText(next);
      eventCount.current += 1;
      onChangeText?.(next);
      onChange?.({
        nativeEvent: { text: next, eventCount: eventCount.current },
      } as TextFieldChangeEvent);
    };

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => changeText(''),
      isFocused: () => inputRef.current?.isFocused() ?? false,
    }));

    const showClear =
      editable &&
      text.length > 0 &&
      (clearButtonMode === 'always' ||
        (clearButtonMode === 'while-editing' && focused) ||
        (clearButtonMode === 'unless-editing' && !focused));

    const accent = invalid ? ERROR_COLOR : focused ? primary : undefined;
    const bottomText = errorText ?? supportingText;
    const counter = showCharacterCount
      ? maxLength !== undefined
        ? `${text.length} / ${maxLength}`
        : `${text.length}`
      : undefined;

    return (
      <View {...viewProps} style={[{ gap: 4 }, style]}>
        {label ? (
          <Text style={{ fontSize: 13, color: accent ?? MUTED_COLOR }}>
            {label}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            gap: 8,
            minHeight: 40,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: accent ?? OUTLINE_COLOR,
            opacity: editable ? 1 : 0.6,
          }}
        >
          <Icon icon={leadingIcon} color={MUTED_COLOR} />
          {prefix ? <Text style={{ color: MUTED_COLOR }}>{prefix}</Text> : null}
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={changeText}
            onFocus={() => {
              setFocused(true);
              onFocus?.(textEvent(text));
            }}
            onBlur={() => {
              setFocused(false);
              onBlur?.(textEvent(text));
            }}
            onSubmitEditing={
              multiline ? undefined : () => onSubmitEditing?.(textEvent(text))
            }
            placeholder={placeholder}
            maxLength={maxLength}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType === 'none' ? undefined : returnKeyType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            secureTextEntry={secureTextEntry && !revealed}
            multiline={multiline}
            editable={editable}
            autoFocus={autoFocus}
            selectTextOnFocus={selectTextOnFocus}
            autoComplete={autoComplete}
            accessibilityLabel={accessibilityLabel ?? label}
            aria-invalid={invalid}
            style={{
              flex: 1,
              minWidth: 0,
              paddingVertical: 8,
              fontSize: textStyle?.fontSize ?? 16,
              fontFamily: textStyle?.fontFamily,
              fontWeight: textStyle?.fontWeight,
              fontStyle: textStyle?.fontStyle,
              outlineWidth: 0,
            }}
          />
          {suffix ? <Text style={{ color: MUTED_COLOR }}>{suffix}</Text> : null}
          {showClear ? (
            <FieldButton label="Clear text" onPress={() => changeText('')}>
              ✕
            </FieldButton>
          ) : null}
          {passwordToggle ? (
            <FieldButton
              label={revealed ? 'Hide password' : 'Show password'}
              onPress={() => setRevealed((r) => !r)}
            >
              {revealed ? 'Hide' : 'Show'}
            </FieldButton>
          ) : null}
          {trailingIcon ? (
            onTrailingIconPress ? (
              <Pressable
                role="button"
                onPress={onTrailingIconPress}
                style={{ padding: 4 }}
              >
                <Icon icon={trailingIcon} color={MUTED_COLOR} />
              </Pressable>
            ) : (
              <Icon icon={trailingIcon} color={MUTED_COLOR} />
            )
          ) : null}
        </View>
        {bottomText || counter ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: errorText ? ERROR_COLOR : MUTED_COLOR,
              }}
            >
              {bottomText ?? ''}
            </Text>
            {counter ? (
              <Text style={{ fontSize: 12, color: MUTED_COLOR }}>
                {counter}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }
);

function FieldButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      // Keep focus in the input, so a clear button shown only while editing
      // is still there when the click lands.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
      style={{
        padding: '4px 6px',
        border: 'none',
        borderRadius: 4,
        fontFamily: 'inherit',
        fontSize: 13,
        color: MUTED_COLOR,
        backgroundColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
