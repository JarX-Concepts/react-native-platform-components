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
| `Button`                           | A `Pressable` with the `button` role, `testID`, `disabled` and the label as `Text`. While `loading` it can't be pressed and `accessibilityState.busy` is `true`. With `selected` it has the `togglebutton` role and `accessibilityState.checked`, and a press calls `onSelectedChange(!selected)`. A button with a `menu` doesn't call `onPress`; its menu callbacks are reached with `fireEvent` (see [Menu and picker events](#menu-and-picker-events)) |
| `SegmentedControl`                 | A `tablist` view carrying `testID`, with a `Pressable` tab per segment: the label as `Text`, the segment's `testID` (else `${testID}-${value}`), and `accessibilityState.selected`. Pressing a segment calls `onSelect(value, index)`; pressing the selected one does nothing, or calls `onDeselect` when `android.selectionRequired` is `false`. Disabled segments and a disabled control can't be pressed                                                                                                                                                                                                                  |
| `TabBar`                           | A `tablist` view carrying `testID`, with a `Pressable` tab per item: the label as `Text`, the item's `testID` (else `${testID}-${value}`), and `accessibilityState.selected`. Pressing a tab calls `onSelect(value, index)`, or `onReselect` for the selected one                                                                                                                                                                                                                                                                                                                                                            |
| `NavigationRail`                   | A view carrying `testID` with the `header`, then a `tablist` view with a `Pressable` per destination: the label (and badge) as `Text`, the item's `testID` (else `${testID}-${value}`), and `accessibilityState.selected`. Pressing a destination calls `onSelect(value, index)`, or `onReselect` for the selected one |
| `FloatingActionButton`             | A `Pressable` with the `button` role, `testID` and `disabled`, labeled by `accessibilityLabel` or `label`; the label shows as `Text` while extended |
| `ButtonGroup`                      | A view carrying `testID`, with a `Pressable` per button (the button's `testID`, else `${testID}-${value}`). Presses call `onPress(value, index)` and, with `selection`, `onSelectionChange` with the next selection, following the native rules                                                                                                                                                                                                                                                                                                                                                                                                  |
| `SplitButton`                      | A `Pressable` with the `button` role, `testID` and the label as `Text`, for the main button. Pressing it calls `onPress`; the menu isn't rendered (see [Menu and picker events](#menu-and-picker-events))                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `Chip`                             | A `Pressable` with `testID` and the label as `Text` (a `togglebutton` with `accessibilityState.checked` when `selected` is set) that calls `onPress`; it doesn't change `selected`. With a close icon, a separate `Pressable` with `closeTestID` (else `${testID}-close`), labeled "Remove {label}", calls `onClose` |
| `Switch`                           | A `Pressable` with the `switch` role, `testID`, `accessibilityState.checked` and the label as `Text`, labeled by `accessibilityLabel` or `label`. Pressing it calls `onValueChange(!value)`, and `fireEvent(element, 'valueChange', true)` works as with React Native's `Switch`; it shows `value` only |
| `ChipGroup`                        | A view carrying `testID`, with a chip per item as in `Chip` (test IDs `${testID}-${value}` and `${testID}-${value}-close` unless the item sets its own). Presses call `onPress(value, index)` and, with `selection`, `onSelectionChange` with the next selection, following the native rules; close presses call `onClose(value, index)` |
| `Checkbox`                         | A `Pressable` with the checkbox role, `testID`, the label (and the error message) as `Text`, and `accessibilityState.checked` (`'mixed'` when indeterminate). Pressing it calls `onCheckedChange` with the state asked for; it doesn't change `checked` |
| `RadioGroup`                       | A view with the radiogroup role and `testID`, and a `Pressable` per option with the radio role, its `testID` (else `${testID}-${value}`), the label and description as `Text` and `accessibilityState.checked`. Pressing another enabled option calls `onValueChange(value, index)`; the validation message is `Text` |
| `SelectionMenu`                    | A view carrying `testID` that shows the selected option's label or the placeholder. While open (`embedded`, or `modal` with `visible`), each option is a `Pressable` with the test ID `${testID}-${data}` that calls `onSelect(data, label, index)`                                                                                                                                                                                                                                                                                                                                                                          |
| `ActionSheet`                      | Its children in a view carrying `testID`. While `visible`, the title and message as `Text`, then each shown action as a `Pressable` with its `testID` (else `${testID}-${id}`) that calls `onSelect(id)` (disabled actions can't be pressed), and a cancel `Pressable` with `cancelTestID` (else `${testID}-cancel`) that calls `onCancel` |
| `Dialog`                           | A view carrying `testID`. While `visible`, the title and message as `Text`, then each shown action as a `Pressable` with its `testID` (else `${testID}-${id}`): the cancel action calls `onCancel`, the others `onSelect(id)` (disabled actions can't be pressed). `onShow` is called when `visible` turns `true` and `onDismiss` when it turns `false`; `onPresentFailed` is never called |
| `ProgressIndicator`                | A view with the `progressbar` role carrying `testID` and `accessibilityLabel`, with the progress as `accessibilityValue` (`{ min: 0, max: 100, now }`), or `accessibilityState.busy` while indeterminate |
| `DatePicker`                       | An empty view carrying `testID` and `style`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ContextMenu`                      | Its children in a view carrying `testID`. While `visible` is `true`, each action follows them as a `Pressable` with the `menuitem` role and the action's `testID` (else `${testID}-${id}`), which calls `onPressAction(id, title)`; submenus and sections list their actions. Otherwise the menu isn't rendered |
| `FloatingToolbar`, `LiquidGlass`   | A view with the `style`, `testID` and children. `LiquidGlass` with `onPress` is a `Pressable` that calls it with `{ x, y }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isLiquidGlassSupported`           | `false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `GlassDisclosure`                  | The pill: a `Pressable` (`<testID>-pill`) with the title and subtitle. While `expanded`, the panel (`<testID>-panel`) instead: a close `Pressable` (`<testID>-close`), the title, subtitle, `headerRight` and children. No animation or backdrop                                                                                                                                                                                                                                                                                                                                                                             |
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

fireEvent(screen.getByTestId('file-source'), 'select', 'camera');
fireEvent(screen.getByTestId('file-source'), 'cancel');

fireEvent(screen.getByTestId('delete-dialog'), 'select', 'delete');
fireEvent(screen.getByTestId('delete-dialog'), 'presentFailed', 'busy');

fireEvent(screen.getByTestId('sort'), 'menuSelect', 'date', 'Date');

fireEvent(screen.getByTestId('reply'), 'menuSelect', 'forward', 'Forward');
```

## Menu actions in end-to-end tests

Under Jest a menu renders only while a `ContextMenu` has `visible` set, but in an end-to-end test it opens for real. Give the actions of a `ContextMenu`, a `Button` menu or a `SplitButton` menu a `testID` and the test can tap them by ID once the menu is open, whatever language the titles are in:

```tsx
<Button
  testID="sort"
  label={t('sort')}
  menu={[
    { id: 'date', title: t('date'), testID: 'sort-date' },
    { id: 'name', title: t('name'), testID: 'sort-name' },
  ]}
  onMenuSelect={setSortBy}
/>
```

```ts
// Detox
await element(by.id('sort')).tap();
await waitFor(element(by.id('sort-date'))).toBeVisible().withTimeout(6000);
await element(by.id('sort-date')).tap();
```

On iOS the ID is the menu row's accessibility identifier; on Android 10+ it is the view tag of the popup row's title, which Detox and Espresso match. See [Testing menu actions](/components/contextmenu#testing-menu-actions).

## Test IDs in end-to-end tests

On a device every component follows one rule: **the native view that carries a `testID` also carries the accessibility label and takes the touches.** Finding an element by ID, reading its label, checking that it is visible and tapping it all reach the same view, so a test can wait for a label that changes:

```tsx
<Button
  testID="statement-submit"
  label={file ? 'Parse Statement' : 'Upload'}
  onPress={file ? parse : pickFile}
/>
```

```ts
// Detox
await element(by.id('statement-submit')).tap();
await waitFor(element(by.id('statement-submit')))
  .toHaveLabel('Parse Statement')
  .withTimeout(10000);
```

The label is the `accessibilityLabel` when there is one, else the visible title. The host view React Native creates for the component carries neither the ID nor the label, so a screen reader still announces the control once.

| Component | Where the `testID` goes |
| --- | --- |
| `Button`, `FloatingActionButton`, `Chip` | The native button (`UIButton`, `MaterialButton`, the Material FAB or `Chip`) |
| `SplitButton` | The main button; the menu button gets `${testID}-menu` |
| `ButtonGroup`, `ChipGroup`, `SegmentedControl`, `TabBar`, `NavigationRail` | The group itself; each button, chip, segment, tab or destination has its own `testID` (by default `${testID}-${value}` for `ButtonGroup` and `ChipGroup`). A `ButtonGroup` button folded into the overflow menu is found by its label |
| `Chip` / `ChipGroup` close icons | `closeTestID` (default `${testID}-close`, `${testID}-${value}-close`), labeled `closeAccessibilityLabel` or "Remove {label}" |
| `TextField` | The text input, where the test types |
| Menu actions (`ContextMenu`, `Button` and `SplitButton` menus), `ActionSheet` and `Dialog` actions | The action's row or button |
| `GlassDisclosure` | The parts: `-pill`, `-panel`, `-close`, `-backdrop` |
| `DatePicker`, `SelectionMenu`, `ContextMenu`, `FloatingToolbar`, `LiquidGlass`, `ActionSheet`, `Dialog` | The component's own view. Give it an `accessibilityLabel` to read one there |

A few platform details:

- **iOS alerts.** `UIAlertController` puts an action's identifier on more than one of its views; match the first with `element(by.id(id)).atIndex(0)`.
- **Android text fields.** For an `EditText` without an `accessibilityLabel`, Detox reads the text in the field as its label. Check a value with `toHaveText`.
- **Badges.** On iOS a tab's or destination's label includes its badge (`"Inbox, 3"`); on Android the badge isn't part of the label.
- **Android before 10.** Menu rows aren't tagged (see above); find them by text.

## Overriding an export

Spread the mock and replace what a test needs:

```js
jest.mock('react-native-platform-components', () => ({
  ...require('react-native-platform-components/jest'),
  isLiquidGlassSupported: true,
}));
```
