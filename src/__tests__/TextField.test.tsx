import { createRef } from 'react';
import renderer, { act } from 'react-test-renderer';

import { TextField, type TextFieldRef } from '../index';

jest.mock('../TextFieldNativeComponent', () => {
  const React = require('react');
  // A forwardRef host stand-in; renderSpy records the props of every render
  const renderSpy = jest.fn();
  const Native = React.forwardRef((props: object, ref: unknown) => {
    renderSpy(props);
    return React.createElement('PCTextField', { ...props, ref });
  });
  return {
    __esModule: true,
    default: Native,
    renderSpy,
    Commands: {
      focus: jest.fn(),
      blur: jest.fn(),
      clear: jest.fn(),
      setText: jest.fn(),
    },
  };
});

jest.mock('react-native/Libraries/Components/TextInput/TextInputState', () => {
  let focused: object | null = null;
  const inputs = new Set<object>();
  return {
    __esModule: true,
    default: {
      currentlyFocusedInput: () => focused,
      focusInput: (input: object | null) => {
        focused = input;
      },
      blurInput: (input: object | null) => {
        if (focused === input) focused = null;
      },
      registerInput: (input: object) => inputs.add(input),
      unregisterInput: (input: object) => inputs.delete(input),
      isTextInput: (input: object) => inputs.has(input),
      // Test helper: the most recently registered host node
      __lastRegistered: () => Array.from(inputs).pop() ?? null,
    },
  };
});

const renderSpy = jest.requireMock('../TextFieldNativeComponent')
  .renderSpy as jest.Mock;
const Commands = jest.requireMock('../TextFieldNativeComponent').Commands as {
  focus: jest.Mock;
  blur: jest.Mock;
  clear: jest.Mock;
  setText: jest.Mock;
};
const TextInputState = jest.requireMock(
  'react-native/Libraries/Components/TextInput/TextInputState'
).default as {
  currentlyFocusedInput: () => object | null;
  isTextInput: (input: object) => boolean;
  __lastRegistered: () => object | null;
};

function lastNativeProps() {
  const calls = renderSpy.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    // Host refs are null in the test renderer unless a node mock is supplied
    tree = renderer.create(element, {
      createNodeMock: (el) => ({ type: el.type }),
    });
  });
  return tree!;
}

/** The host node the field registered, which is also its ref target. */
function nativeNode() {
  const node = TextInputState.__lastRegistered();
  expect(node).not.toBeNull();
  return node as object;
}

describe('TextField', () => {
  beforeEach(() => {
    renderSpy.mockClear();
    Commands.focus.mockClear();
    Commands.blur.mockClear();
    Commands.clear.mockClear();
    Commands.setText.mockClear();
  });

  it('applies the defaults', () => {
    const tree = render(<TextField />);

    const props = lastNativeProps();
    expect(props.initialText).toBe('');
    expect(props.label).toBe('');
    expect(props.placeholder).toBe('');
    expect(props.errorState).toBe('none');
    expect(props.errorText).toBe('');
    expect(props.clearButtonMode).toBe('never');
    expect(props.passwordToggle).toBe('hidden');
    expect(props.characterCount).toBe('hidden');
    expect(props.maxLength).toBe(0);
    expect(props.keyboardType).toBe('default');
    expect(props.returnKeyType).toBe('default');
    expect(props.autoCapitalize).toBe('sentences');
    expect(props.autoCorrect).toBe('enabled');
    expect(props.secureTextEntry).toBe('plain');
    expect(props.lines).toBe('single');
    expect(props.interactivity).toBe('enabled');
    expect(props.autoFocus).toBe('none');
    expect(props.selectTextOnFocus).toBe('keep');
    expect(props.autoComplete).toBe('');
    expect(props.keyboardAppearance).toBe('default');
    expect(props.spokenLabel).toBe('');
    expect(props.android).toEqual({
      material: 'm3',
      variant: 'outlined',
      density: 'standard',
    });
    expect(props.ios).toEqual({
      writingTools: '',
      inlinePrediction: '',
      smartQuotes: '',
      smartDashes: '',
      smartInsertDelete: '',
      mathExpressionCompletion: '',
      borderStyle: '',
      labelPlacement: '',
      labelWidth: 0,
    });
    expect(props.onFieldSubmit).toBeUndefined();
    expect(props.onTrailingIconPress).toBeUndefined();
    expect(props.leadingIconTestID).toBe('');
    expect(props.trailingIconTestID).toBe('');
    expect(props.leadingIconSpokenLabel).toBe('');
    expect(props.trailingIconSpokenLabel).toBe('');
    expect(props.maxFontSizeMultiplier).toBe(0);
    expect(props.textAlign).toBe('');
    expect(props.minLines).toBe(0);
    expect(props.maxLines).toBe(0);
    expect(props.pressMode).toBe('none');
    expect(props.onFieldPress).toBeUndefined();
    expect(props.activeColor).toBeUndefined();
    expect(Commands.setText).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('normalizes the text, decoration and keyboard props', () => {
    const tree = render(
      <TextField
        value="hello"
        label="Email"
        placeholder="you@example.com"
        supportingText="Work address"
        error="Required"
        prefix="$"
        suffix="kg"
        leadingIcon="envelope"
        clearButtonMode="while-editing"
        passwordToggle
        showCharacterCount
        maxLength={20}
        keyboardType="email-address"
        returnKeyType="next"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        multiline
        editable={false}
        autoFocus
        selectTextOnFocus
        autoComplete="email"
        keyboardAppearance="dark"
        textStyle={{ fontWeight: '600', fontSize: 15 }}
        accessibilityLabel="Email address"
        ios={{ writingTools: 'none', smartQuotes: 'no', borderStyle: 'line' }}
        android={{ variant: 'filled', dense: true }}
      />
    );

    const props = lastNativeProps();
    expect(props.initialText).toBe('hello');
    expect(props.label).toBe('Email');
    expect(props.placeholder).toBe('you@example.com');
    expect(props.supportingText).toBe('Work address');
    expect(props.errorState).toBe('error');
    expect(props.errorText).toBe('Required');
    expect(props.prefix).toBe('$');
    expect(props.suffix).toBe('kg');
    // The Jest preset runs as iOS
    expect(props.leadingIcon).toMatchObject({
      iconType: 'sfSymbol',
      iconName: 'envelope',
    });
    expect(props.trailingIcon).toMatchObject({ iconType: '' });
    expect(props.clearButtonMode).toBe('while-editing');
    expect(props.passwordToggle).toBe('shown');
    expect(props.characterCount).toBe('shown');
    expect(props.maxLength).toBe(20);
    expect(props.keyboardType).toBe('email-address');
    expect(props.returnKeyType).toBe('next');
    expect(props.autoCapitalize).toBe('none');
    expect(props.autoCorrect).toBe('disabled');
    expect(props.secureTextEntry).toBe('secure');
    expect(props.lines).toBe('multiline');
    expect(props.interactivity).toBe('disabled');
    expect(props.autoFocus).toBe('focus');
    expect(props.selectTextOnFocus).toBe('select');
    expect(props.autoComplete).toBe('email');
    expect(props.keyboardAppearance).toBe('dark');
    expect(props.textStyle).toEqual({
      fontFamily: '',
      fontSize: 15,
      fontWeight: '600',
      fontStyle: '',
    });
    expect(props.spokenLabel).toBe('Email address');
    expect(props.ios).toMatchObject({
      writingTools: 'none',
      smartQuotes: 'no',
      smartDashes: '',
      borderStyle: 'line',
    });
    expect(props.android).toEqual({
      material: 'm3',
      variant: 'filled',
      density: 'dense',
    });
    act(() => tree.unmount());
  });

  it('passes the system material mode through', () => {
    const tree = render(<TextField android={{ material: 'system' }} />);
    expect(lastNativeProps().android.material).toBe('system');
    act(() => tree.unmount());
  });

  it('marks a boolean error without a message', () => {
    const tree = render(<TextField error supportingText="Keep me" />);
    expect(lastNativeProps().errorState).toBe('error');
    expect(lastNativeProps().errorText).toBe('');
    expect(lastNativeProps().supportingText).toBe('Keep me');
    act(() => tree.unmount());
  });

  it('uses defaultValue as the initial text of an uncontrolled field', () => {
    const tree = render(<TextField defaultValue="draft" />);
    expect(lastNativeProps().initialText).toBe('draft');
    expect(Commands.setText).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('reports edits and does not echo the same value back to native', () => {
    const onChangeText = jest.fn();
    const onChange = jest.fn();
    function Controlled() {
      const [text, setText] = require('react').useState('a');
      return (
        <TextField
          value={text}
          onChangeText={(next: string) => {
            onChangeText(next);
            setText(next);
          }}
          onChange={onChange}
        />
      );
    }
    const tree = render(<Controlled />);

    act(() => {
      lastNativeProps().onFieldChange({
        nativeEvent: { text: 'ab', eventCount: 1 },
      });
    });

    expect(onChangeText).toHaveBeenCalledWith('ab');
    expect(onChange).toHaveBeenCalledTimes(1);
    // The value now matches what native has, so nothing is pushed back
    expect(Commands.setText).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('pushes the controlled value with the latest event count', () => {
    const tree = render(<TextField value="a" />);
    const node = nativeNode();

    // A controlled field whose owner keeps the old value is reverted, as
    // React Native's TextInput does; the count native reported goes along
    act(() => {
      lastNativeProps().onFieldChange({
        nativeEvent: { text: 'ab', eventCount: 3 },
      });
    });
    expect(Commands.setText).toHaveBeenCalledTimes(1);
    expect(Commands.setText).toHaveBeenCalledWith(node, 3, 'a');

    // The owner formats the text instead: pushed with the same count
    act(() => {
      tree.update(<TextField value="AB" />);
    });
    expect(Commands.setText).toHaveBeenCalledTimes(2);
    expect(Commands.setText).toHaveBeenLastCalledWith(node, 3, 'AB');

    // Re-rendering with the same value doesn't push again
    act(() => {
      tree.update(<TextField value="AB" />);
    });
    expect(Commands.setText).toHaveBeenCalledTimes(2);
    act(() => tree.unmount());
  });

  it('routes focus, blur and submit, and tracks focus in the registry', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const onSubmitEditing = jest.fn();
    const ref = createRef<TextFieldRef>();
    const tree = render(
      <TextField
        ref={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
      />
    );
    const node = nativeNode();

    expect(TextInputState.isTextInput(node)).toBe(true);
    expect(ref.current?.isFocused()).toBe(false);

    act(() => {
      lastNativeProps().onFieldFocus({ nativeEvent: { text: '' } });
    });
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(ref.current?.isFocused()).toBe(true);
    expect(TextInputState.currentlyFocusedInput()).toBe(node);

    act(() => {
      lastNativeProps().onFieldSubmit({ nativeEvent: { text: 'done' } });
    });
    expect(onSubmitEditing).toHaveBeenCalledWith({
      nativeEvent: { text: 'done' },
    });

    act(() => {
      lastNativeProps().onFieldBlur({ nativeEvent: { text: 'done' } });
    });
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(ref.current?.isFocused()).toBe(false);
    expect(TextInputState.currentlyFocusedInput()).toBeNull();

    act(() => tree.unmount());
    expect(TextInputState.isTextInput(node)).toBe(false);
  });

  it('exposes focus, blur and clear through the ref', () => {
    const ref = createRef<TextFieldRef>();
    const tree = render(<TextField ref={ref} />);
    const node = nativeNode();

    act(() => ref.current?.focus());
    expect(Commands.focus).toHaveBeenCalledWith(node);
    act(() => ref.current?.blur());
    expect(Commands.blur).toHaveBeenCalledWith(node);
    act(() => ref.current?.clear());
    expect(Commands.clear).toHaveBeenCalledWith(node);
    act(() => tree.unmount());
  });

  it('routes trailing icon presses', () => {
    const onTrailingIconPress = jest.fn();
    const tree = render(
      <TextField
        trailingIcon="xmark"
        onTrailingIconPress={onTrailingIconPress}
      />
    );
    expect(lastNativeProps().trailingIcon).toMatchObject({
      iconType: 'sfSymbol',
      iconName: 'xmark',
    });
    act(() => {
      lastNativeProps().onTrailingIconPress({ nativeEvent: {} });
    });
    expect(onTrailingIconPress).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('passes the icon ids, colors, alignment, line bounds and font cap', () => {
    const tree = render(
      <TextField
        testID="email"
        leadingIconTestID="email-icon"
        leadingIconAccessibilityLabel="Email"
        trailingIconTestID="email-action"
        trailingIconAccessibilityLabel="Send"
        activeColor="purple"
        outlineColor="gray"
        errorColor="orange"
        containerColor="white"
        textColor="black"
        placeholderTextColor="silver"
        textAlign="center"
        multiline
        minLines={2}
        maxLines={5}
        maxFontSizeMultiplier={1.5}
        autoComplete="address-line1"
        android={{ variant: 'plain' }}
      />
    );
    const props = lastNativeProps();
    expect(props).toMatchObject({
      testID: 'email',
      leadingIconTestID: 'email-icon',
      leadingIconSpokenLabel: 'Email',
      trailingIconTestID: 'email-action',
      trailingIconSpokenLabel: 'Send',
      activeColor: 'purple',
      outlineColor: 'gray',
      errorColor: 'orange',
      containerColor: 'white',
      textColor: 'black',
      placeholderTextColor: 'silver',
      textAlign: 'center',
      lines: 'multiline',
      minLines: 2,
      maxLines: 5,
      maxFontSizeMultiplier: 1.5,
      autoComplete: 'address-line1',
    });
    expect(props.android.variant).toBe('plain');
    act(() => tree.unmount());
  });

  it('turns a read-only field with onPress into a button', () => {
    const onPress = jest.fn();
    const tree = render(<TextField editable={false} onPress={onPress} />);
    expect(lastNativeProps().pressMode).toBe('button');
    expect(lastNativeProps().interactivity).toBe('disabled');
    act(() => {
      lastNativeProps().onFieldPress({ nativeEvent: {} });
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('ignores onPress while the field is editable', () => {
    const tree = render(<TextField onPress={jest.fn()} />);
    expect(lastNativeProps().pressMode).toBe('none');
    expect(lastNativeProps().onFieldPress).toBeUndefined();
    act(() => tree.unmount());
  });
});
