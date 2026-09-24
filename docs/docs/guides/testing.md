---
title: 'Testing with Jest'
description: 'Mock the library in Jest with one line: interactive TextInput, Pressable and View stand-ins that React Native Testing Library can query and drive.'
---

The components are native views, so they can't render under Jest. The package ships a mock at `react-native-platform-components/jest` that rebuilds each component from React Native primitives (`TextInput`, `Pressable`, `Text`, `View`). Your component tests can then find fields by test ID or label, type into them and press buttons with [React Native Testing Library](https://callstack.github.io/react-native-testing-library/).

## Setup

Add one line to a file listed in your Jest `setupFiles` (or `setupFilesAfterEnv`):

```js title="jest.setup.js"
jest.mock('react-native-platform-components', () =>
  require('react-native-platform-components/jest')
);
```

```json title="package.json"
{
  "jest": {
    "setupFiles": ["./jest.setup.js"]
  }
}
```

The mock exports everything the real module does, under the same names and with the same prop types. The label-style and icon helpers are the real ones.

## Example

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

test('saves the form', () => {
  const onSave = jest.fn();
  render(<ProfileForm onSave={onSave} />);

  fireEvent.changeText(screen.getByTestId('name'), 'Ada');
  fireEvent.press(screen.getByText('Pro'));
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));

  expect(onSave).toHaveBeenCalledWith({ name: 'Ada', plan: 'pro' });
});
```

## What each mock renders

| Export                             | Renders                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextField`                        | A `TextInput` carrying `testID`, `value`/`defaultValue`, `placeholder`, `editable`, `multiline`, `secureTextEntry`, `maxLength`, `keyboardType` and `accessibilityLabel` (defaults to `label`). The label, prefix, suffix, supporting or error text and character count are `Text`. Each edit calls `onChange` and `onChangeText`; the ref has `focus`, `blur`, `clear` and `isFocused`. A trailing icon is a button with the test ID `trailingIconTestID` (else `${testID}-trailing-icon`) that calls `onTrailingIconPress`; `leadingIconTestID` renders a view with that ID. Pressing a non-editable field calls `onPress` |
| `Button`                           | A `Pressable` with the `button` role, `testID`, `disabled` and the label as `Text`. While `loading` it can't be pressed and `accessibilityState.busy` is `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `SegmentedControl`                 | A `tablist` view carrying `testID`, with a `Pressable` tab per segment: the label as `Text`, the segment's `testID` (else `${testID}-${value}`), and `accessibilityState.selected`. Pressing a segment calls `onSelect(value, index)`; pressing the selected one does nothing, or calls `onDeselect` when `android.selectionRequired` is `false`. Disabled segments and a disabled control can't be pressed                                                                                                                                                                                                                  |
| `TabBar`                           | A `tablist` view carrying `testID`, with a `Pressable` tab per item: the label as `Text`, the item's `testID` (else `${testID}-${value}`), and `accessibilityState.selected`. Pressing a tab calls `onSelect(value, index)`, or `onReselect` for the selected one                                                                                                                                                                                                                                                                                                                                                            |
| `ButtonGroup`                      | A view carrying `testID`, with a `Pressable` per button (test ID `${testID}-${value}`). Presses call `onPress(value, index)` and, with `selection`, `onSelectionChange` with the next selection, following the native rules                                                                                                                                                                                                                                                                                                                                                                                                  |
| `SelectionMenu`                    | A view carrying `testID` that shows the selected option's label or the placeholder. While open (`embedded`, or `modal` with `visible`), each option is a `Pressable` with the test ID `${testID}-${data}` that calls `onSelect(data, label, index)`                                                                                                                                                                                                                                                                                                                                                                          |
| `DatePicker`                       | An empty view carrying `testID` and `style`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ContextMenu`                      | Its children in a view carrying `testID`. The menu isn't rendered                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `FloatingToolbar`, `LiquidGlass`   | A view with the `style`, `testID` and children. `LiquidGlass` with `onPress` is a `Pressable` that calls it with `{ x, y }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isLiquidGlassSupported`           | `false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `useNativeTheme`, `setNativeTheme` | No-ops                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Menu and picker events

The date picker and the menus have no UI to press under Jest, so their callbacks sit on the view that carries `testID`. `fireEvent` reaches them by event name:

```tsx
fireEvent(
  screen.getByTestId('birthday'),
  'confirm',
  new Date(2000, 0, 1),
  true
);
fireEvent(screen.getByTestId('birthday'), 'closed');

fireEvent(screen.getByTestId('color'), 'select', 'g', 'Green', 1);
fireEvent(screen.getByTestId('color'), 'requestClose');

fireEvent(screen.getByTestId('row-menu'), 'pressAction', 'delete', 'Delete');
fireEvent(screen.getByTestId('row-menu'), 'menuOpen');
```

## Overriding an export

Spread the mock and replace what a test needs:

```js
jest.mock('react-native-platform-components', () => ({
  ...require('react-native-platform-components/jest'),
  isLiquidGlassSupported: true,
}));
```
