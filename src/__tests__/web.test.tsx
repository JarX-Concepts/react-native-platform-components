import { createRef } from 'react';
import { Image, StyleSheet, TextInput } from 'react-native';
import renderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import * as Native from '../index';
import * as Web from '../index.web';
import {
  ActionSheet,
  Button,
  ButtonGroup,
  Chip,
  ChipGroup,
  ContextMenu,
  DatePicker,
  DateRangePicker,
  Dialog,
  FloatingActionButton,
  GlassDisclosure,
  LiquidGlass,
  LiquidGlassContainer,
  NavigationRail,
  SegmentedControl,
  SelectionMenu,
  TabBar,
  TextField,
  setNativeTheme,
  useNativeTheme,
  type TextFieldRef,
} from '../index.web';
import { nextSelection } from '../web/ButtonGroup';
import {
  formatInputValue,
  inputTypeForMode,
  parseInputValue,
} from '../web/dateInput';
import { resetWarnings, webIcon } from '../web/shared';

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

const click = (node: ReactTestInstance) => act(() => node.props.onClick());

describe('web entry point', () => {
  it('exports the same runtime API as the native entry point', () => {
    // Icon helpers that flatten icons for the native specs have no use on web.
    const nativeOnly = ['NO_ICON', 'resolveIcon', 'resolveSegmentIcon'];
    const nativeKeys = Object.keys(Native)
      .filter((key) => !nativeOnly.includes(key))
      .sort();
    expect(Object.keys(Web).sort()).toEqual(nativeKeys);
  });
});

describe('Button (web)', () => {
  it('renders a <button> that calls onPress', () => {
    const onPress = jest.fn();
    const tree = render(<Button label="Save" onPress={onPress} testID="b" />);
    const button = tree.root.findByType('button');

    expect(button.props.type).toBe('button');
    expect(button.props['aria-label']).toBe('Save');
    expect(button.props.children).toContain('Save');

    click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled with the disabled prop', () => {
    const tree = render(<Button label="Save" disabled />);
    expect(tree.root.findByType('button').props.disabled).toBe(true);
  });

  it('shows a spinner while loading and ignores clicks', () => {
    const onPress = jest.fn();
    const tree = render(<Button label="Save" loading onPress={onPress} />);
    const button = tree.root.findByType('button');

    expect(button.props['aria-busy']).toBe(true);
    expect(button.props.disabled).toBeFalsy();
    expect(button.props.onClick).toBeUndefined();
    // The label stays in the layout, hidden, so the width doesn't change
    const hidden = tree.root.findAll(
      (node) =>
        node.type === 'span' && node.props.style?.visibility === 'hidden'
    );
    expect(hidden).toHaveLength(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses custom disabled colors instead of fading', () => {
    const tree = render(
      <Button
        label="Save"
        disabled
        disabledColor="#cccccc"
        disabledTintColor="#333333"
      />
    );
    const style = tree.root.findByType('button').props.style;
    expect(style.backgroundColor).toBe('#cccccc');
    expect(style.color).toBe('#333333');
    expect(style.opacity).toBe(1);
  });

  it('places a trailing icon and applies a numeric corner radius', () => {
    const tree = render(
      <Button label="Next" iconPosition="trailing" cornerRadius={6} />
    );
    const style = tree.root.findByType('button').props.style;
    expect(style.flexDirection).toBe('row-reverse');
    expect(style.borderRadius).toBe(6);
  });

  it('stacks the icon for top and bottom placement', () => {
    const tree = render(<Button label="Share" iconPosition="top" />);
    let style = tree.root.findByType('button').props.style;
    expect(style.flexDirection).toBe('column');
    expect(style.height).toBeUndefined();
    act(() => tree.update(<Button label="Share" iconPosition="bottom" />));
    style = tree.root.findByType('button').props.style;
    expect(style.flexDirection).toBe('column-reverse');
  });

  it('is a toggle with aria-pressed', () => {
    const onSelectedChange = jest.fn();
    const tree = render(
      <Button
        label="Bold"
        selected={false}
        onSelectedChange={onSelectedChange}
      />
    );
    const button = tree.root.findByType('button');
    expect(button.props['aria-pressed']).toBe(false);
    click(button);
    expect(onSelectedChange).toHaveBeenCalledWith(true);

    act(() => tree.update(<Button label="Bold" selected />));
    expect(tree.root.findByType('button').props['aria-pressed']).toBe(true);
  });

  it('warns once about a menu and calls onPress', () => {
    resetWarnings();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onPress = jest.fn();
    const tree = render(
      <Button
        label="Sort"
        menu={[{ id: 'name', title: 'Name' }]}
        onPress={onPress}
      />
    );
    click(tree.root.findByType('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('uses the theme color for filled buttons', () => {
    function App() {
      useNativeTheme({ colors: { primary: '#123456' } });
      return <Button label="Save" />;
    }
    const tree = render(<App />);
    expect(tree.root.findByType('button').props.style.backgroundColor).toBe(
      '#123456'
    );
    act(() => setNativeTheme(null));
    expect(tree.root.findByType('button').props.style.backgroundColor).toBe(
      '#6750A4'
    );
  });
});

describe('ButtonGroup (web)', () => {
  const values = ['a', 'b', 'c'];

  it('computes the next selection like native', () => {
    expect(nextSelection(values, ['a'], 'b', 'single', true)).toEqual(['b']);
    expect(nextSelection(values, ['a'], 'a', 'single', true)).toEqual(['a']);
    expect(nextSelection(values, ['a'], 'a', 'single', false)).toEqual([]);
    expect(nextSelection(values, ['c'], 'a', 'multiple', false)).toEqual([
      'a',
      'c',
    ]);
    expect(nextSelection(values, ['a'], 'a', 'multiple', true)).toEqual(['a']);
  });

  it('reports presses and selection changes', () => {
    const onPress = jest.fn();
    const onSelectionChange = jest.fn();
    const tree = render(
      <ButtonGroup
        buttons={values.map((value) => ({ value, label: value }))}
        selection="multiple"
        selectedValues={['c']}
        onPress={onPress}
        onSelectionChange={onSelectionChange}
      />
    );
    const buttons = tree.root.findAllByType('button');
    expect(buttons.map((b) => b.props['aria-pressed'])).toEqual([
      false,
      false,
      true,
    ]);

    click(buttons[0]!);
    expect(onPress).toHaveBeenCalledWith('a', 0);
    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'c']);
  });
});

describe('Chip and ChipGroup (web)', () => {
  it('Chip is a toggle <button> with a close <button> beside it', () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    const tree = render(
      <Chip
        testID="ada"
        label="Ada"
        selected
        onPress={onPress}
        onClose={onClose}
      />
    );
    const [chip, close] = tree.root.findAllByType('button');
    expect(chip!.props['data-testid']).toBe('ada');
    expect(chip!.props['aria-pressed']).toBe(true);
    expect(close!.props['data-testid']).toBe('ada-close');
    expect(close!.props['aria-label']).toBe('Remove Ada');

    click(chip!);
    click(close!);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a plain chip has no pressed state and no close button', () => {
    const tree = render(<Chip label="Share" />);
    const buttons = tree.root.findAllByType('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.props['aria-pressed']).toBeUndefined();
  });

  it('ChipGroup reports presses, selection changes and closes', () => {
    const onPress = jest.fn();
    const onSelectionChange = jest.fn();
    const onClose = jest.fn();
    const tree = render(
      <ChipGroup
        testID="diet"
        chips={['a', 'b', 'c'].map((value) => ({ value, label: value }))}
        selection="multiple"
        selectedValues={['c']}
        onPress={onPress}
        onSelectionChange={onSelectionChange}
        onClose={onClose}
      />
    );
    const chips = tree.root
      .findAllByType('button')
      .filter((b) => !String(b.props['data-testid']).endsWith('-close'));
    expect(chips.map((b) => b.props['aria-pressed'])).toEqual([
      false,
      false,
      true,
    ]);
    expect(chips.map((b) => b.props['data-testid'])).toEqual([
      'diet-a',
      'diet-b',
      'diet-c',
    ]);

    click(chips[0]!);
    expect(onPress).toHaveBeenCalledWith('a', 0);
    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'c']);

    const close = tree.root
      .findAllByType('button')
      .find((b) => b.props['data-testid'] === 'diet-b-close');
    click(close!);
    expect(onClose).toHaveBeenCalledWith('b', 1);
  });
});

describe('FloatingActionButton (web)', () => {
  it('renders a <button> with the label while extended', () => {
    const onPress = jest.fn();
    const tree = render(
      <FloatingActionButton icon="pencil" label="Compose" onPress={onPress} />
    );
    const button = tree.root.findByType('button');
    expect(button.props['aria-label']).toBe('Compose');
    expect(button.props.children).toContain('Compose');
    click(button);
    expect(onPress).toHaveBeenCalledTimes(1);

    act(() =>
      tree.update(
        <FloatingActionButton icon="pencil" label="Compose" extended={false} />
      )
    );
    expect(tree.root.findByType('button').props.children).not.toContain(
      'Compose'
    );
  });
});

describe('NavigationRail (web)', () => {
  it('selects and reselects destinations, with the header above', () => {
    const onSelect = jest.fn();
    const onReselect = jest.fn();
    const tree = render(
      <NavigationRail
        header={<button type="button">Compose</button>}
        items={[
          { label: 'Home', value: 'home', testID: 'rail-home' },
          { label: 'Inbox', value: 'inbox', badge: 2 },
        ]}
        selectedValue="home"
        onSelect={onSelect}
        onReselect={onReselect}
        labelVisibility="selected"
      />
    );
    const [compose, home, inbox] = tree.root.findAllByType('button');
    expect(compose!.props.children).toBe('Compose');
    expect(home!.props.role).toBe('tab');
    expect(home!.props['aria-selected']).toBe(true);
    expect(home!.props['data-testid']).toBe('rail-home');
    // Only the selected destination is labeled
    expect(inbox!.props.children).toContain(null);

    click(inbox!);
    expect(onSelect).toHaveBeenCalledWith('inbox', 1);
    click(home!);
    expect(onReselect).toHaveBeenCalledWith('home', 0);
  });
});

describe('TabBar (web)', () => {
  it('selects and reselects tabs on click', () => {
    const onSelect = jest.fn();
    const onReselect = jest.fn();
    const tree = render(
      <TabBar
        items={[
          { label: 'Home', value: 'home', testID: 'tab-home' },
          { label: 'Inbox', value: 'inbox', badge: 2 },
        ]}
        selectedValue="home"
        onSelect={onSelect}
        onReselect={onReselect}
      />
    );
    const [home, inbox] = tree.root.findAllByType('button');
    expect(home!.props.role).toBe('tab');
    expect(home!.props['aria-selected']).toBe(true);
    expect(home!.props['data-testid']).toBe('tab-home');
    expect(inbox!.props['aria-selected']).toBe(false);

    click(inbox!);
    expect(onSelect).toHaveBeenCalledWith('inbox', 1);
    click(home!);
    expect(onReselect).toHaveBeenCalledWith('home', 0);
  });
});

describe('SegmentedControl (web)', () => {
  it('selects a segment on click', () => {
    const onSelect = jest.fn();
    const tree = render(
      <SegmentedControl
        segments={[
          { label: 'One', value: '1' },
          { label: 'Two', value: '2', badge: 3 },
        ]}
        selectedValue="1"
        onSelect={onSelect}
      />
    );
    const [one, two] = tree.root.findAllByType('button');
    expect(one!.props['aria-checked']).toBe(true);
    expect(two!.props['aria-checked']).toBe(false);
    expect(tree.root.findByType('span').props.children).toBe(3);

    click(one!);
    expect(onSelect).not.toHaveBeenCalled();
    click(two!);
    expect(onSelect).toHaveBeenCalledWith('2', 1);
  });
});

describe('DatePicker (web)', () => {
  const date = new Date(2026, 8, 23, 14, 30);

  it('maps modes onto input types and values', () => {
    expect(inputTypeForMode(undefined)).toBe('date');
    expect(inputTypeForMode('time')).toBe('time');
    expect(inputTypeForMode('dateAndTime')).toBe('datetime-local');
    expect(formatInputValue(date, 'date')).toBe('2026-09-23');
    expect(formatInputValue(date, 'time')).toBe('14:30');
    expect(formatInputValue(date, 'datetime-local')).toBe('2026-09-23T14:30');
    expect(formatInputValue(null, 'date')).toBe('');
  });

  it('keeps the parts an input does not show', () => {
    expect(parseInputValue('2026-10-01', 'date', date)).toEqual(
      new Date(2026, 9, 1, 14, 30)
    );
    expect(parseInputValue('09:05', 'time', date)).toEqual(
      new Date(2026, 8, 23, 9, 5)
    );
    expect(parseInputValue('2026-10-01T08:00', 'datetime-local', null)).toEqual(
      new Date(2026, 9, 1, 8, 0)
    );
    expect(parseInputValue('', 'date', date)).toBeNull();
  });

  it('embedded: reports changes as confirmed', () => {
    const onConfirm = jest.fn();
    const tree = render(
      <DatePicker
        presentation="embedded"
        date={date}
        minDate={new Date(2026, 0, 1)}
        onConfirm={onConfirm}
      />
    );
    const input = tree.root.findByType('input');
    expect(input.props.type).toBe('date');
    expect(input.props.value).toBe('2026-09-23');
    expect(input.props.min).toBe('2026-01-01');

    act(() => input.props.onChange({ target: { value: '2026-09-24' } }));
    expect(onConfirm).toHaveBeenCalledWith(
      new Date(2026, 8, 24, 14, 30),
      true,
      0
    );
  });

  it('modal: opens a dialog while visible, with Cancel and Done', () => {
    const onConfirm = jest.fn();
    const onClosed = jest.fn();
    const tree = render(
      <DatePicker
        date={date}
        visible={false}
        onConfirm={onConfirm}
        onClosed={onClosed}
      />
    );
    expect(tree.root.findAllByType('dialog')).toHaveLength(0);

    act(() =>
      tree.update(
        <DatePicker
          date={date}
          visible
          onConfirm={onConfirm}
          onClosed={onClosed}
        />
      )
    );
    const input = tree.root.findByType('input');
    act(() => input.props.onChange({ target: { value: '2026-12-25' } }));
    const picked = new Date(2026, 11, 25, 14, 30);
    expect(onConfirm).toHaveBeenLastCalledWith(picked, false, 0);

    const [cancel, done] = tree.root.findAllByType('button');
    click(done!);
    expect(onConfirm).toHaveBeenLastCalledWith(picked, true, 0);

    click(cancel!);
    expect(onClosed).toHaveBeenCalledTimes(1);

    act(() => tree.root.findByType('dialog').props.onClose());
    expect(onClosed).toHaveBeenCalledTimes(2);
  });

  it('yearAndMonth: a month input that gives the first of the month', () => {
    expect(inputTypeForMode('yearAndMonth')).toBe('month');
    expect(formatInputValue(date, 'month')).toBe('2026-09');
    expect(parseInputValue('2027-02', 'month', date)).toEqual(
      new Date(2027, 1, 1, 14, 30)
    );
    expect(parseInputValue('2027-02-01', 'month', date)).toBeNull();
  });

  it('DateRangePicker: start and end inputs, Done reports the range', () => {
    const onConfirm = jest.fn();
    const onClosed = jest.fn();
    const tree = render(
      <DateRangePicker
        visible
        startDate={new Date(2026, 8, 24, 9, 0)}
        endDate={null}
        onConfirm={onConfirm}
        onClosed={onClosed}
      />
    );
    const [startInput, endInput] = tree.root.findAllByType('input');
    expect(startInput!.props.value).toBe('2026-09-24');
    expect(endInput!.props.min).toBe('2026-09-24');
    const done = () => tree.root.findAllByType('button')[1]!;
    // No end yet
    expect(done().props.disabled).toBe(true);

    act(() => endInput!.props.onChange({ target: { value: '2026-09-28' } }));
    click(done());
    expect(onConfirm).toHaveBeenCalledWith({
      startDate: new Date(2026, 8, 24),
      endDate: new Date(2026, 8, 28),
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('countDownTimer: reports the time input as durationSeconds', () => {
    const onConfirm = jest.fn();
    const tree = render(
      <DatePicker
        presentation="embedded"
        mode="countDownTimer"
        date={date}
        onConfirm={onConfirm}
      />
    );
    const input = tree.root.findByType('input');
    expect(input.props.type).toBe('time');
    act(() => input.props.onChange({ target: { value: '01:30' } }));
    expect(onConfirm).toHaveBeenCalledWith(
      new Date(2026, 8, 23, 1, 30),
      true,
      5400
    );
  });
});

describe('SelectionMenu (web)', () => {
  const options = [
    { label: 'Red', data: 'r' },
    { label: 'Green', data: 'g' },
  ];

  it('embedded: renders a <select> with a placeholder', () => {
    const onSelect = jest.fn();
    const tree = render(
      <SelectionMenu
        presentation="embedded"
        options={options}
        selected={null}
        placeholder="Color"
        onSelect={onSelect}
      />
    );
    const select = tree.root.findByType('select');
    expect(select.props.value).toBe('');
    expect(
      tree.root.findAllByType('option').map((o) => o.props.children)
    ).toEqual(['Color', 'Red', 'Green']);

    act(() => select.props.onChange({ target: { value: 'g' } }));
    expect(onSelect).toHaveBeenCalledWith('g', 'Green', 1);
  });

  it('modal: lists the options in a dialog while visible', () => {
    const onSelect = jest.fn();
    const onRequestClose = jest.fn();
    const tree = render(
      <SelectionMenu
        options={options}
        selected="r"
        visible
        onSelect={onSelect}
        onRequestClose={onRequestClose}
      />
    );
    const items = tree.root.findAllByProps({ role: 'option' });
    expect(items.map((i) => i.props['aria-selected'])).toEqual([true, false]);

    click(items[1]!);
    expect(onSelect).toHaveBeenCalledWith('g', 'Green', 1);

    act(() => tree.root.findByType('dialog').props.onClose());
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });
});

describe('TextField (web)', () => {
  it('reports edits, shows supporting text and the counter', () => {
    const onChangeText = jest.fn();
    const tree = render(
      <TextField
        label="Name"
        supportingText="Your full name"
        showCharacterCount
        maxLength={20}
        defaultValue="Ada"
        onChangeText={onChangeText}
      />
    );
    const input = tree.root.findByType(TextInput);
    expect(input.props.value).toBe('Ada');
    expect(input.props.accessibilityLabel).toBe('Name');

    act(() => input.props.onChangeText('Ada L'));
    expect(onChangeText).toHaveBeenCalledWith('Ada L');
    expect(tree.root.findByType(TextInput).props.value).toBe('Ada L');

    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Your full name');
    expect(text).toContain('5 / 20');
  });

  it('shows an error in place of the supporting text', () => {
    const tree = render(
      <TextField supportingText="Help" error="Required" value="" />
    );
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain('Required');
    expect(text).not.toContain('Help');
    expect(tree.root.findByType(TextInput).props['aria-invalid']).toBe(true);
  });

  it('clears through the clear button and the ref', () => {
    const onChangeText = jest.fn();
    const ref = createRef<TextFieldRef>();
    const tree = render(
      <TextField
        ref={ref}
        value="abc"
        clearButtonMode="always"
        onChangeText={onChangeText}
      />
    );
    click(tree.root.findByProps({ 'aria-label': 'Clear text' }));
    expect(onChangeText).toHaveBeenLastCalledWith('');

    onChangeText.mockClear();
    act(() => ref.current!.clear());
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('maps submitBehavior onto the web TextInput', () => {
    const onSubmitEditing = jest.fn();
    let tree = render(<TextField onSubmitEditing={onSubmitEditing} />);
    let input = tree.root.findByType(TextInput);
    expect(input.props.submitBehavior).toBe('blurAndSubmit');
    expect(input.props.blurOnSubmit).toBe(true);

    tree = render(<TextField submitBehavior="submit" />);
    expect(tree.root.findByType(TextInput).props.blurOnSubmit).toBe(false);

    // A multi-line field that submits on Enter keeps Shift+Enter for newlines
    tree = render(
      <TextField
        multiline
        value="hi"
        submitBehavior="submit"
        onSubmitEditing={onSubmitEditing}
      />
    );
    input = tree.root.findByType(TextInput);
    const preventDefault = jest.fn();
    act(() =>
      input.props.onKeyPress({
        nativeEvent: { key: 'Enter', shiftKey: true },
        preventDefault,
      })
    );
    expect(onSubmitEditing).not.toHaveBeenCalled();
    act(() =>
      input.props.onKeyPress({ nativeEvent: { key: 'Enter' }, preventDefault })
    );
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmitEditing.mock.calls[0][0].nativeEvent.text).toBe('hi');
  });

  it('toggles password visibility', () => {
    const tree = render(<TextField secureTextEntry passwordToggle />);
    expect(tree.root.findByType(TextInput).props.secureTextEntry).toBe(true);
    click(tree.root.findByProps({ 'aria-label': 'Show password' }));
    expect(tree.root.findByType(TextInput).props.secureTextEntry).toBe(false);
  });
});

describe('ActionSheet (web)', () => {
  const actions = [
    { id: 'library', title: 'Photo Library', testID: 'source-library' },
    { id: 'camera', title: 'Take Photo', attributes: { disabled: true } },
    { id: 'secret', title: 'Secret', attributes: { hidden: true } },
    { id: 'remove', title: 'Remove', attributes: { destructive: true } },
  ];

  it('renders only its children while hidden', () => {
    const tree = render(
      <ActionSheet visible={false} actions={actions}>
        <Button label="Add" />
      </ActionSheet>
    );
    expect(tree.root.findAllByType('dialog')).toHaveLength(0);
    expect(tree.root.findByType('button').props['aria-label']).toBe('Add');
  });

  it('lists the actions in a dialog and reports picks and cancels', () => {
    const onSelect = jest.fn();
    const onCancel = jest.fn();
    const tree = render(
      <ActionSheet
        visible
        title="Add a file"
        message="Choose a source"
        actions={actions}
        cancelTitle="Not now"
        cancelTestID="source-cancel"
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const dialog = tree.root.findByType('dialog');
    expect(dialog.props['aria-label']).toBe('Add a file');
    const buttons = tree.root.findAllByType('button');
    expect(buttons.map((b) => b.props['data-testid'])).toEqual([
      'source-library',
      undefined,
      undefined,
      'source-cancel',
    ]);
    expect(buttons[1]!.props.disabled).toBe(true);
    expect(buttons[2]!.props.style.color).toBe('#B3261E');
    expect(buttons[3]!.props.children).toBe('Not now');

    click(buttons[0]!);
    click(buttons[1]!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('library');

    click(buttons[3]!);
    act(() => dialog.props.onClose());
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});

describe('Dialog (web)', () => {
  const actions = [
    { id: 'cancel', title: 'Cancel', role: 'cancel' as const, testID: 'c' },
    { id: 'later', title: 'Later', disabled: true },
    { id: 'secret', title: 'Secret', hidden: true },
    {
      id: 'delete',
      title: 'Delete',
      role: 'destructive' as const,
      preferred: true,
      testID: 'd',
    },
  ];

  it('renders nothing while hidden', () => {
    const tree = render(<Dialog visible={false} actions={actions} />);
    expect(tree.toJSON()).toBeNull();
  });

  it('shows an alertdialog and reports picks, cancels, show and dismiss', () => {
    const onSelect = jest.fn();
    const onCancel = jest.fn();
    const onShow = jest.fn();
    const onDismiss = jest.fn();
    const dialog = (visible: boolean) => (
      <Dialog
        visible={visible}
        title="Delete?"
        message="It can't be undone."
        actions={actions}
        onSelect={onSelect}
        onCancel={onCancel}
        onShow={onShow}
        onDismiss={onDismiss}
      />
    );
    const tree = render(dialog(true));
    const element = tree.root.findByType('dialog');
    expect(element.props.role).toBe('alertdialog');
    expect(element.props['aria-label']).toBe('Delete?');
    expect(element.props['aria-describedby']).toBe(
      tree.root.findByType('p').props.id
    );
    expect(onShow).toHaveBeenCalledTimes(1);

    const buttons = tree.root.findAllByType('button');
    expect(buttons.map((b) => b.props['data-testid'])).toEqual([
      'c',
      undefined,
      'd',
    ]);
    expect(buttons[1]!.props.disabled).toBe(true);
    expect(buttons[2]!.props.style.color).toBe('#B3261E');
    expect(buttons[2]!.props.autoFocus).toBe(true);

    click(buttons[2]!);
    click(buttons[1]!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('delete');
    click(buttons[0]!);
    act(() => element.props.onClose());
    expect(onCancel).toHaveBeenCalledTimes(2);

    act(() => tree.update(dialog(false)));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(tree.toJSON()).toBeNull();
  });

  it('keeps a dialog that is not dismissable open on Escape and outside clicks', () => {
    const onCancel = jest.fn();
    const tree = render(
      <Dialog
        visible
        dismissable={false}
        actions={actions}
        onCancel={onCancel}
      />
    );
    const element = tree.root.findByType('dialog');
    const preventDefault = jest.fn();
    act(() => element.props.onCancel({ preventDefault }));
    expect(preventDefault).toHaveBeenCalled();
    act(() =>
      element.props.onClick({ target: element, currentTarget: element })
    );
    expect(onCancel).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('applies every change while open, without a warning', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onShow = jest.fn();
    const tree = render(
      <Dialog visible title="Checking…" actions={actions} onShow={onShow} />
    );
    act(() =>
      tree.update(
        <Dialog
          visible
          title="Checking…"
          message="Ready."
          actions={[{ id: 'install', title: 'Install', testID: 'i' }]}
          onShow={onShow}
        />
      )
    );
    expect(tree.root.findByType('p').props.children).toBe('Ready.');
    expect(
      tree.root.findAllByType('button').map((b) => b.props['data-testid'])
    ).toEqual(['i']);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    act(() => tree.unmount());
    warn.mockRestore();
  });

  it('reports busy for a second dialog while one is open', () => {
    const onPresentFailed = jest.fn();
    const onShow = jest.fn();
    const tree = render(
      <>
        <Dialog visible title="First" actions={actions} />
        <Dialog
          visible
          title="Second"
          actions={actions}
          onShow={onShow}
          onPresentFailed={onPresentFailed}
        />
      </>
    );
    expect(onPresentFailed).toHaveBeenCalledWith('busy');
    expect(onShow).not.toHaveBeenCalled();
    expect(tree.root.findAllByType('dialog')).toHaveLength(1);
    act(() => tree.unmount());

    // Once the first has gone, a dialog shows again
    const again = render(
      <Dialog visible title="Third" actions={actions} onShow={onShow} />
    );
    expect(onShow).toHaveBeenCalledTimes(1);
    act(() => again.unmount());
  });
});

describe('ContextMenu (web)', () => {
  it('renders its children and warns once', () => {
    resetWarnings();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tree = render(
      <ContextMenu actions={[{ id: 'a', title: 'A' }]}>
        <Button label="Inside" />
      </ContextMenu>
    );
    render(
      <ContextMenu actions={[]}>
        <Button label="Second" />
      </ContextMenu>
    );

    expect(tree.root.findByType('button').props['aria-label']).toBe('Inside');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('LiquidGlass (web)', () => {
  const host = (tree: ReactTestRenderer, testID: string) =>
    tree.root.find(
      (node) => typeof node.type === 'string' && node.props.testID === testID
    );
  const radiusOf = (tree: ReactTestRenderer) =>
    StyleSheet.flatten(host(tree, 'glass').props.style)?.borderRadius;

  it('rounds a capsule fully and uses the radius otherwise', () => {
    expect(
      radiusOf(render(<LiquidGlass testID="glass" cornerStyle="capsule" />))
    ).toBe(9999);
    expect(
      radiusOf(
        render(
          <LiquidGlass
            testID="glass"
            cornerStyle="concentric"
            cornerRadius={8}
          />
        )
      )
    ).toBe(8);
    expect(
      radiusOf(render(<LiquidGlass testID="glass" cornerStyle={20} />))
    ).toBe(20);
  });

  it('renders the container as a plain view around its children', () => {
    const tree = render(
      <LiquidGlassContainer spacing={16} testID="group">
        <LiquidGlass testID="glass" />
      </LiquidGlassContainer>
    );
    const group = host(tree, 'group');
    expect(group.props.spacing).toBeUndefined();
    expect(host(tree, 'glass')).toBeDefined();
  });
});

describe('icons (web)', () => {
  const trashSvg = { uri: 'https://example.com/trash.svg' };
  const trashPng = { uri: 'https://example.com/trash.png' };

  it('draws the web image of a per-platform icon', () => {
    const tree = render(
      <Button
        label="Delete"
        icon={{
          ios: 'trash',
          android: { type: 'image', source: trashPng },
          web: { type: 'image', source: trashSvg, tinted: false },
        }}
      />
    );
    const image = tree.root.findByType(Image);
    expect(image.props.source).toBe(trashSvg);
    expect(image.props.style.tintColor).toBeUndefined();
  });

  it('falls back to an iOS or Android image', () => {
    expect(
      webIcon({ ios: 'trash', android: { type: 'image', source: trashPng } })
    ).toEqual({ source: trashPng, tinted: true });
  });

  it('warns once for an icon with nothing to draw', () => {
    resetWarnings();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const icon = {
      ios: { type: 'sfSymbol' as const, name: 'trash' },
      android: 'delete',
    };
    const tree = render(<Button label="Delete" icon={icon} />);
    expect(tree.root.findAllByType(Image)).toHaveLength(0);
    act(() => tree.update(<Button label="Remove" icon={icon} />));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('"trash" / "delete"');

    // No icon, or an image, is nothing to warn about.
    webIcon(undefined);
    webIcon('');
    webIcon({ type: 'image', source: trashPng });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('GlassDisclosure (web)', () => {
  type KeyListener = (event: { key: string }) => void;
  const listeners = new Set<KeyListener>();
  const fakeDocument = {
    addEventListener: (_type: string, listener: KeyListener) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: KeyListener) =>
      listeners.delete(listener),
  };
  const globals = globalThis as { document?: unknown };
  let previous: unknown;

  beforeEach(() => {
    previous = globals.document;
    globals.document = fakeDocument;
  });

  afterEach(() => {
    globals.document = previous;
    listeners.clear();
  });

  it('opens a card from the pill, and Escape asks to close it', async () => {
    const onExpandedChange = jest.fn();
    const element = (expanded: boolean) => (
      <GlassDisclosure
        testID="card"
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        title="concept-plans"
      />
    );
    const tree = render(element(false));
    // The Reduce Motion setting arrives asynchronously
    await act(async () => {});
    const pill = tree.root.find(
      (node) =>
        node.props.testID === 'card-pill' &&
        typeof node.props.onPress === 'function'
    );
    act(() => pill.props.onPress());
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(listeners.size).toBe(0);

    act(() => tree.update(element(true)));
    expect(listeners.size).toBe(1);
    act(() => listeners.forEach((listener) => listener({ key: 'Escape' })));
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);

    act(() => tree.update(element(false)));
    expect(listeners.size).toBe(0);
    act(() => tree.unmount());
  });
});
