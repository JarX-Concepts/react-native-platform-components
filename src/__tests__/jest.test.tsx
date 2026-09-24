import { createRef } from 'react';
import { Text, TextInput } from 'react-native';
import renderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import * as Native from '../index';
import * as Mock from '../jest';
import {
  Button,
  ButtonGroup,
  ContextMenu,
  DatePicker,
  LiquidGlass,
  LiquidGlassContainer,
  SegmentedControl,
  SelectionMenu,
  TabBar,
  TextField,
  isLiquidGlassSupported,
  normalizeLabelStyle,
  type TextFieldRef,
} from '../jest';

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

// Like @testing-library/react-native: getByTestId returns the host element,
// and fireEvent walks up from it to the nearest handler.
const byTestID = (tree: ReactTestRenderer, testID: string) =>
  tree.root.find(
    (node) => typeof node.type === 'string' && node.props.testID === testID
  );

function fire(node: ReactTestInstance, event: string, ...args: unknown[]) {
  const name = `on${event[0]!.toUpperCase()}${event.slice(1)}`;
  let current: ReactTestInstance | null = node;
  while (current && typeof current.props[name] !== 'function') {
    current = current.parent;
  }
  if (!current) throw new Error(`No ${name} handler`);
  act(() => current!.props[name](...args));
}

const press = (node: ReactTestInstance) => fire(node, 'press');

const texts = (tree: ReactTestRenderer) =>
  tree.root.findAllByType(Text).map((t) => t.props.children);

describe('jest mock', () => {
  it('exports the same runtime API as the native entry point', () => {
    expect(Object.keys(Mock).sort()).toEqual(Object.keys(Native).sort());
  });

  it('re-exports the real helpers', () => {
    expect(normalizeLabelStyle).toBe(Native.normalizeLabelStyle);
    expect(Mock.resolveIcon).toBe(Native.resolveIcon);
    expect(isLiquidGlassSupported).toBe(false);
    expect(() => Mock.setNativeTheme(null)).not.toThrow();
  });
});

describe('TextField (mock)', () => {
  it('is a TextInput that reports edits', () => {
    const onChangeText = jest.fn();
    const onChange = jest.fn();
    const tree = render(
      <TextField
        testID="name"
        label="Name"
        supportingText="Your full name"
        placeholder="Ada"
        defaultValue="A"
        onChangeText={onChangeText}
        onChange={onChange}
      />
    );
    const input = tree.root.findByType(TextInput);
    expect(input.props.testID).toBe('name');
    expect(input.props.value).toBe('A');
    expect(input.props.placeholder).toBe('Ada');
    expect(input.props.accessibilityLabel).toBe('Name');
    expect(texts(tree)).toEqual(['Name', 'Your full name']);

    fire(input, 'changeText', 'Ada');
    expect(onChangeText).toHaveBeenCalledWith('Ada');
    expect(onChange.mock.calls[0][0].nativeEvent).toEqual({
      text: 'Ada',
      eventCount: 1,
    });
    expect(tree.root.findByType(TextInput).props.value).toBe('Ada');
  });

  it('shows the error, submits with the text and clears through the ref', () => {
    const onSubmitEditing = jest.fn();
    const onChangeText = jest.fn();
    const ref = createRef<TextFieldRef>();
    const tree = render(
      <TextField
        ref={ref}
        value="abc"
        supportingText="Help"
        error="Required"
        onSubmitEditing={onSubmitEditing}
        onChangeText={onChangeText}
      />
    );
    expect(texts(tree)).toEqual(['Required']);

    act(() => tree.root.findByType(TextInput).props.onSubmitEditing());
    expect(onSubmitEditing.mock.calls[0][0].nativeEvent.text).toBe('abc');

    act(() => ref.current!.focus());
    expect(ref.current!.isFocused()).toBe(true);
    act(() => ref.current!.clear());
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('makes the trailing icon pressable', () => {
    const onTrailingIconPress = jest.fn();
    const tree = render(
      <TextField
        testID="search"
        trailingIcon="xmark"
        onTrailingIconPress={onTrailingIconPress}
      />
    );
    press(byTestID(tree, 'search-trailing-icon'));
    expect(onTrailingIconPress).toHaveBeenCalledTimes(1);
  });

  it('uses the icon test IDs and presses a read-only field', () => {
    const onPress = jest.fn();
    const onTrailingIconPress = jest.fn();
    const tree = render(
      <TextField
        testID="due"
        editable={false}
        onPress={onPress}
        leadingIconTestID="due-leading"
        trailingIcon="calendar"
        trailingIconTestID="due-picker"
        onTrailingIconPress={onTrailingIconPress}
      />
    );
    expect(byTestID(tree, 'due-leading')).toBeTruthy();
    press(byTestID(tree, 'due-picker'));
    expect(onTrailingIconPress).toHaveBeenCalledTimes(1);
    press(byTestID(tree, 'due'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Button (mock)', () => {
  it('is a pressable with its label', () => {
    const onPress = jest.fn();
    const tree = render(
      <Button testID="save" label="Save" onPress={onPress} />
    );
    const button = byTestID(tree, 'save');
    expect(button.props.accessibilityRole).toBe('button');
    expect(texts(tree)).toEqual(['Save']);

    press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('respects disabled', () => {
    const tree = render(<Button testID="save" label="Save" disabled />);
    const button = byTestID(tree, 'save');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('reports busy while loading', () => {
    const tree = render(<Button testID="save" label="Save" loading />);
    const button = byTestID(tree, 'save');
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
  });
});

describe('TabBar (mock)', () => {
  it('selects and reselects tabs', () => {
    const onSelect = jest.fn();
    const onReselect = jest.fn();
    const tree = render(
      <TabBar
        testID="tabs"
        items={[
          { label: 'Home', value: 'home', testID: 'tab-home' },
          { label: 'Inbox', value: 'inbox', badge: 2 },
        ]}
        selectedValue="home"
        onSelect={onSelect}
        onReselect={onReselect}
      />
    );
    press(byTestID(tree, 'tabs-inbox'));
    expect(onSelect).toHaveBeenCalledWith('inbox', 1);
    press(byTestID(tree, 'tab-home'));
    expect(onReselect).toHaveBeenCalledWith('home', 0);
    expect(texts(tree)).toContain('2');
  });
});

describe('SegmentedControl (mock)', () => {
  it('uses a segment testID when given', () => {
    const onSelect = jest.fn();
    const tree = render(
      <SegmentedControl
        testID="tabs"
        segments={[
          { label: 'Home', value: 'home', testID: 'tab-home' },
          { label: 'Invest', value: 'invest' },
        ]}
        selectedValue="invest"
        onSelect={onSelect}
      />
    );
    press(byTestID(tree, 'tab-home'));
    expect(onSelect).toHaveBeenCalledWith('home', 0);
    expect(byTestID(tree, 'tabs-invest')).toBeTruthy();
  });

  const segments = [
    { label: 'One', value: '1' },
    { label: 'Two', value: '2' },
    { label: 'Three', value: '3', disabled: true },
  ];

  it('selects a segment', () => {
    const onSelect = jest.fn();
    const tree = render(
      <SegmentedControl
        testID="seg"
        segments={segments}
        selectedValue="1"
        onSelect={onSelect}
      />
    );
    expect(texts(tree)).toEqual(['One', 'Two', 'Three']);
    expect(byTestID(tree, 'seg-1').props.accessibilityState.selected).toBe(
      true
    );
    expect(byTestID(tree, 'seg-3').props.accessibilityState.disabled).toBe(
      true
    );

    press(byTestID(tree, 'seg-1'));
    expect(onSelect).not.toHaveBeenCalled();
    press(byTestID(tree, 'seg-2'));
    expect(onSelect).toHaveBeenCalledWith('2', 1);
  });

  it('deselects when the selection is optional', () => {
    const onDeselect = jest.fn();
    const tree = render(
      <SegmentedControl
        testID="seg"
        segments={segments}
        selectedValue="1"
        onDeselect={onDeselect}
        android={{ selectionRequired: false }}
      />
    );
    press(byTestID(tree, 'seg-1'));
    expect(onDeselect).toHaveBeenCalledTimes(1);
  });
});

describe('ButtonGroup (mock)', () => {
  it('reports presses and selection changes', () => {
    const onPress = jest.fn();
    const onSelectionChange = jest.fn();
    const tree = render(
      <ButtonGroup
        testID="group"
        buttons={['a', 'b', 'c'].map((value) => ({ value, label: value }))}
        selection="multiple"
        selectedValues={['c']}
        onPress={onPress}
        onSelectionChange={onSelectionChange}
      />
    );
    press(byTestID(tree, 'group-a'));
    expect(onPress).toHaveBeenCalledWith('a', 0);
    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'c']);
  });
});

describe('menus, pickers and containers (mock)', () => {
  it('SelectionMenu lists options while open', () => {
    const onSelect = jest.fn();
    const tree = render(
      <SelectionMenu
        testID="color"
        presentation="embedded"
        options={[
          { label: 'Red', data: 'r' },
          { label: 'Green', data: 'g' },
        ]}
        selected="r"
        onSelect={onSelect}
      />
    );
    press(byTestID(tree, 'color-g'));
    expect(onSelect).toHaveBeenCalledWith('g', 'Green', 1);
  });

  it('ContextMenu renders its children and exposes its callbacks', () => {
    const onPressAction = jest.fn();
    const tree = render(
      <ContextMenu
        testID="menu"
        actions={[{ id: 'delete', title: 'Delete' }]}
        onPressAction={onPressAction}
      >
        <Button label="Inside" />
      </ContextMenu>
    );
    expect(texts(tree)).toEqual(['Inside']);
    const menu = byTestID(tree, 'menu');
    fire(menu, 'pressAction', 'delete', 'Delete');
    expect(onPressAction).toHaveBeenCalledWith('delete', 'Delete');
  });

  it('DatePicker and LiquidGlass render views', () => {
    const onConfirm = jest.fn();
    const onPress = jest.fn();
    const tree = render(
      <LiquidGlassContainer testID="group" spacing={20}>
        <LiquidGlass testID="glass" cornerStyle="capsule" onPress={onPress}>
          <DatePicker testID="date" date={null} onConfirm={onConfirm} />
        </LiquidGlass>
      </LiquidGlassContainer>
    );
    expect(byTestID(tree, 'group').props.spacing).toBeUndefined();
    press(byTestID(tree, 'glass'));
    expect(onPress).toHaveBeenCalledWith({ x: 0, y: 0 });
    const date = new Date(2026, 8, 23);
    fire(byTestID(tree, 'date'), 'confirm', date, true);
    expect(onConfirm).toHaveBeenCalledWith(date, true);
  });
});
