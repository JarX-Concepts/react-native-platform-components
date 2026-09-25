---
title: "TextField"
description: "Native text field for React Native: Material 3 TextInputLayout on Android (floating label, outlined or filled box, supporting text, error state, icons, counter), UITextField on iOS with the iOS 17 and 18 text traits."
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-textfield.gif" height="480" alt="TextField on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-textfield.gif" height="480" alt="TextField on Android" /></td>
  </tr>
</table>

Native text field using **TextInputLayout** with the Material 3 styles on Android and **UITextField** (a growing `UITextView` for multi-line text) on iOS. The whole field is the platform widget, not a `TextInput` dressed up in JavaScript: Android gets the floating label, the outlined or filled box, supporting text, the error state, start and end icons, prefix and suffix text and the character counter; iOS gets the text traits React Native's `TextInput` doesn't expose, Writing Tools, inline predictions and smart punctuation among them.

```tsx
import { TextField } from 'react-native-platform-components';

const [email, setEmail] = useState('');

<TextField
  label="Email"
  placeholder="you@example.com"
  supportingText="We never share it"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoComplete="email"
  autoCapitalize="none"
/>;
```

The props that exist on React Native's `TextInput` keep their names and meaning (`value`, `onChangeText`, `placeholder`, `secureTextEntry`, `keyboardType`, `maxLength`, `editable`, `focus()` and `blur()` on the ref), so a field is a change of import. Form libraries that drive `value` and `onChangeText` work unchanged.

### Props

| Prop                  | Type                                                     | Description                                                                                     |
| --------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `value`               | `string`                                                 | Controlled text. See [Controlled text](#controlled-text)                                        |
| `defaultValue`        | `string`                                                 | Initial text of an uncontrolled field                                                           |
| `onChangeText`        | `(text: string) => void`                                 | Called with the new text on every edit                                                          |
| `onChange`            | `(event) => void`                                        | Called on every edit with `nativeEvent.text` and `nativeEvent.eventCount`                       |
| `onFocus`, `onBlur`   | `(event) => void`                                        | Focus changes, with `nativeEvent.text`                                                          |
| `onSubmitEditing`     | `(event) => void`                                        | The return key was pressed, unless it inserts a newline. See [Return key](#return-key)          |
| `submitBehavior`      | `'submit' \| 'blurAndSubmit' \| 'newline'`               | What the return key does. Default: `'blurAndSubmit'`, `'newline'` for multi-line fields         |
| `onSelectionChange`   | `(event) => void`                                        | The cursor moved or the selection changed, with `nativeEvent.selection`. See [Selection](#selection) |
| `selection`           | `{ start: number; end?: number }`                        | Controlled cursor position or selection                                                        |
| `label`               | `string`                                                 | Field label. See [Label, placeholder and supporting text](#label-placeholder-and-supporting-text) |
| `placeholder`         | `string`                                                 | Shown while the field is empty                                                                  |
| `supportingText`      | `string`                                                 | Helper text below the field                                                                     |
| `error`               | `boolean \| string`                                      | Error state; a string is the message. See [Validation](#validation)                              |
| `prefix`, `suffix`    | `string`                                                 | Text inside the field before and after the input (`$`, `kg`)                                    |
| `leadingIcon`         | `PlatformIcon`                                           | Icon at the start of the field. See [Icons](#icons)                                             |
| `trailingIcon`        | `PlatformIcon`                                           | Icon at the end of the field; pressing it calls `onTrailingIconPress`                           |
| `onTrailingIconPress` | `() => void`                                             | The trailing icon was pressed                                                                   |
| `leadingIconTestID`, `trailingIconTestID` | `string`                             | Test identifiers of the icons. See [Testing](#testing)                                          |
| `leadingIconAccessibilityLabel`, `trailingIconAccessibilityLabel` | `string`     | Screen-reader labels of the icons                                                               |
| `onPress`             | `() => void`                                             | Called when a non-editable field is pressed. See [Read-only fields that open something](#read-only-fields-that-open-something) |
| `clearButtonMode`     | `'never' \| 'while-editing' \| 'unless-editing' \| 'always'` | A clear button inside the field. Default: `'never'`                                          |
| `passwordToggle`      | `boolean`                                                | A button that shows and hides the text of a `secureTextEntry` field                             |
| `showCharacterCount`  | `boolean`                                                | Character count below the field, `12 / 100` with `maxLength`                                    |
| `maxLength`           | `number`                                                 | Maximum number of characters                                                                    |
| `keyboardType`        | `TextInput` values                                       | Keyboard to show. Default: `'default'`                                                          |
| `returnKeyType`       | `TextInput` values                                       | Return key label. Default: `'default'`                                                          |
| `autoCapitalize`      | `'none' \| 'sentences' \| 'words' \| 'characters'`       | Default: `'sentences'`                                                                          |
| `autoCorrect`         | `boolean`                                                | Auto-correction and suggestions. Default: `true`                                                |
| `secureTextEntry`     | `boolean`                                                | Obscures the text                                                                               |
| `multiline`           | `boolean`                                                | A field that grows with its text. Return inserts a newline, unless `submitBehavior` says otherwise |
| `minLines`, `maxLines` | `number`                                                | Multi-line height bounds, in lines. See [Multi-line text](#multi-line-text)                    |
| `editable`            | `boolean`                                                | Default: `true`. A non-editable field is drawn disabled, unless it has `onPress`                |
| `autoFocus`           | `boolean`                                                | Focuses the field when it mounts                                                                |
| `selectTextOnFocus`   | `boolean`                                                | Selects all text on focus                                                                       |
| `autoComplete`        | `TextInput` values                                       | Autofill hint. See [Autofill](#autofill)                                                        |
| `keyboardAppearance`  | `'default' \| 'light' \| 'dark'`                         | iOS keyboard appearance                                                                         |
| `textStyle`           | `{ fontFamily?, fontSize?, fontWeight?, fontStyle? }`    | Font of the input text                                                                          |
| `textAlign`           | `'left' \| 'center' \| 'right'`                           | Text alignment. Default: natural (leading)                                                      |
| `maxFontSizeMultiplier` | `number`                                               | Cap on the system text size scale, as on `Text`. See [Styling](#styling)                        |
| `activeColor`, `outlineColor`, `errorColor`, `containerColor`, `textColor`, `placeholderTextColor` | `ColorValue` | Field colors. See [Colors](#colors) |
| `accessibilityLabel`  | `string`                                                 | Screen-reader label. Defaults to `label`                                                        |
| `testID`              | `string`                                                 | Set on the inner text input. See [Testing](#testing)                                            |

### Ref

| Method        | Description                                          |
| ------------- | ---------------------------------------------------- |
| `focus()`     | Focuses the field and shows the keyboard             |
| `blur()`      | Removes focus and hides the keyboard                 |
| `clear()`     | Clears the text; `onChangeText` is called with `''`  |
| `isFocused()` | Whether the field has focus                          |
| `setSelection(start, end?)` | Moves the cursor to `start`, or selects `start`..`end` |

```tsx
const field = useRef<TextFieldRef>(null);
<TextField ref={field} label="Name" />
<Button label="Edit" onPress={() => field.current?.focus()} />
```

### iOS Props (`ios`)

The text traits, each `'default'` unless set. They apply on the iOS version that introduced them and are ignored before it.

| Prop                       | Type                                            | Description                                                                                  |
| -------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `writingTools`             | `'default' \| 'complete' \| 'limited' \| 'none'` | Writing Tools (iOS 18): rewrites in place, only the panel, or off                            |
| `inlinePrediction`         | `'default' \| 'yes' \| 'no'`                    | Inline predictive text (iOS 17)                                                              |
| `smartQuotes`              | `'default' \| 'yes' \| 'no'`                    | Smart quotes                                                                                 |
| `smartDashes`              | `'default' \| 'yes' \| 'no'`                    | Smart dashes                                                                                 |
| `smartInsertDelete`        | `'default' \| 'yes' \| 'no'`                    | Spaces around pasted and deleted words                                                       |
| `mathExpressionCompletion` | `'default' \| 'yes' \| 'no'`                    | Math expression completion, `1+1=` (iOS 18)                                                  |
| `borderStyle`              | `'roundedRect' \| 'none' \| 'line' \| 'bezel'`  | `UITextField.borderStyle`. Default: `'roundedRect'`                                          |
| `labelPlacement`           | `'above' \| 'leading'`                          | The label above the field (default) or in a leading column. See [Grouped forms on iOS](#grouped-forms-on-ios) |
| `labelWidth`               | `number`                                        | Width of the leading label column, in points. Default: `100`                                  |
| `keyboardToolbar`          | `{ done?, items?, onItemPress?, doneTestID? }`  | A `UIToolbar` above the keyboard. See [Keyboard toolbar (iOS)](#keyboard-toolbar-ios)          |
| `passwordRules`            | `string`                                        | Rules for suggested strong passwords. See [Password rules (iOS)](#password-rules-ios)         |

### Android Props (`android`)

| Prop       | Type                       | Description                                                             |
| ---------- | -------------------------- | ----------------------------------------------------------------------- |
| `material` | `'m3' \| 'system'`         | The Material 3 text field (default) or the platform `EditText`. See [Material style](#material-style) |
| `variant`  | `'outlined' \| 'filled' \| 'plain'` | Material 3 text field style. Default: `'outlined'`. See [Variants](#variants) |
| `dense`    | `boolean`                  | The dense variant, a shorter field                                      |

### Controlled text

`value` and `onChangeText` work like the core `TextInput`, including under fast typing. Native keeps a counter of user edits and sends it with every `onChangeText`; a `value` pushed from JS carries the last counter JS has seen, and native drops it when the user has typed since, so a slow render never erases keystrokes. The edit that follows reconciles the two sides. Formatting as you type (`onChangeText={(t) => setValue(t.toUpperCase())}`) works, and a field whose owner ignores an edit is reverted to `value`, as `TextInput` does.

The field registers with React Native's focus tracking, so `Keyboard.dismiss()`, a `ScrollView`'s `keyboardShouldPersistTaps` and `KeyboardAvoidingView` treat it like a `TextInput`.

### Return key

`submitBehavior` is the `TextInput` prop of the same name and meaning:

| Value | Return key |
| --- | --- |
| `'blurAndSubmit'` | Calls `onSubmitEditing` and dismisses the keyboard. The default for single-line fields |
| `'submit'` | Calls `onSubmitEditing` and keeps the field focused and the keyboard up |
| `'newline'` | Inserts a newline. The default for multi-line fields; a single-line field treats it as `'blurAndSubmit'` |

A chat composer grows with its text and sends on return without dropping the keyboard:

```tsx
<TextField
  placeholder="Message"
  value={message}
  onChangeText={setMessage}
  multiline
  maxLines={4}
  submitBehavior="submit"
  returnKeyType="send"
  onSubmitEditing={() => {
    send(message);
    setMessage('');
  }}
/>
```

| iOS 26 | Android |
| --- | --- |
| ![A chat composer that sent a message and keeps the keyboard up on iOS 26](/img/components/textfield/chat-submit-ios.webp) | ![A focused multi-line field whose keyboard offers Send instead of Enter on Android (Gboard's compact bar, with a hardware keyboard attached)](/img/components/textfield/chat-submit-android.webp) |

On iOS, return in a multi-line field submits instead of inserting a newline. On Android, a multi-line field that submits asks the keyboard for its action key (the `returnKeyType` icon, Send above) in place of Enter, as the core `TextInput` does.

### Selection

`onSelectionChange` reports the cursor and the selection in UTF-16 offsets, the unit JavaScript strings count in, with the `TextInput` event shape (`nativeEvent.selection.start` and `.end`). `selection` controls it: like `value`, the field returns to it when the user moves the cursor, so pair it with `onSelectionChange`. A change made from JS, text or selection, doesn't come back as an event, and a selection sent while the user is typing is dropped the same way a stale `value` is. For a one-off move, the ref's `setSelection(start, end?)` needs no state.

```tsx
const [selection, setSelection] = useState({ start: 0, end: 0 });

<TextField
  value={text}
  onChangeText={setText}
  selection={selection}
  onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
/>
<Button label="Select all" onPress={() => setSelection({ start: 0, end: text.length })} />
```

Setting the selection doesn't focus the field, and a tap that focuses it puts the cursor where the tap lands, as on any text field.

### Label, placeholder and supporting text

`label` is the field's name. On Android it is the Material floating label: inside the box while empty, above the text once focused or filled. On iOS it is a caption above the field that takes the tint color while focused. `placeholder` is shown inside the empty field (on Android only while focused when there is a label, so the two don't overlap). `supportingText` sits below the field on both platforms.

```tsx
<TextField label="Username" placeholder="At least 3 characters" supportingText="Public" />
```

A field without a `label` has the placeholder as its only hint and, on Android, the shorter box of a plain field.

### Validation

`error` puts the field in the error state: red outline, label and supporting text on Android, red caption and message on iOS. A string replaces the supporting text with the message; `true` keeps the supporting text and only changes the colors. On Android the Material error icon takes the end of the field while the error shows, unless the field has a `passwordToggle` or a `trailingIcon`, which stay in place.

```tsx
<TextField
  label="Email"
  value={email}
  onChangeText={setEmail}
  onBlur={() => setTouched(true)}
  error={touched && !isValid(email) ? 'Enter a valid email address' : undefined}
  supportingText="Work address"
/>
```

### Icons

`leadingIcon` and `trailingIcon` accept the same shapes as [Button](/components/button#icons): an SF Symbol or drawable name, an image asset, or an `{ ios, android }` pair. The trailing icon is a button; `onTrailingIconPress` is called when it is pressed.

```tsx
<TextField
  placeholder="Search"
  leadingIcon={{
    ios: { type: 'sfSymbol', name: 'magnifyingglass' },
    android: { type: 'drawable', name: 'search' },
  }}
  trailingIcon={{
    ios: { type: 'sfSymbol', name: 'paperplane' },
    android: { type: 'drawable', name: 'send' },
  }}
  onTrailingIconPress={search}
  returnKeyType="search"
  onSubmitEditing={search}
/>
```

The end of the field holds one thing: a `trailingIcon`, else the `passwordToggle`, else the clear button. On Android the clear button is the Material clear icon, shown while the focused field has text, whatever `clearButtonMode` says beyond `'never'`. Clearing calls `onChange` and `onChangeText('')` on both platforms, so a search filter resets with it. Multi-line fields have no icons, prefix or suffix on iOS, where a `UITextView` has no accessory slots.

### Passwords

```tsx
<TextField
  label="Password"
  secureTextEntry
  passwordToggle
  autoComplete="new-password"
  value={password}
  onChangeText={setPassword}
/>
```

`passwordToggle` adds the Material password toggle on Android and an eye button on iOS. `autoComplete="password"` and `"new-password"` enable the platform password managers; `"one-time-code"` offers codes from incoming messages.

### Password rules (iOS)

`ios.passwordRules` tells iOS what a new password must contain, so the strong password it suggests (with `autoComplete="new-password"`) is one your backend accepts. It takes the [password rules descriptor](https://developer.apple.com/password-rules/) that Safari and `UITextInputPasswordRules` use:

```tsx
<TextField
  label="New password"
  secureTextEntry
  autoComplete="new-password"
  ios={{
    passwordRules:
      'minlength: 20; required: lower; required: upper; required: digit; required: [#$%&!];',
  }}
/>
```

![A suggested strong password that follows the rules, with $ in place of the default hyphens, on iOS 26](/img/components/textfield/password-rules-ios.webp)

Without rules, iOS suggests its default `xxxxxx-xxxxxx-xxxxxx` form; with the rules above it uses the listed symbols. iOS offers the suggestion while AutoFill Passwords is on. Android has no equivalent: the Autofill service generates passwords by its own rules.

### Autofill

`autoComplete` takes the React Native `TextInput` values, which include the HTML autocomplete names (`email`, `new-password`, `one-time-code`, `sms-otp`, `address-line1`, `postal-address-locality`, `birthdate-day`, `cc-exp-month`, `organization`, ...). Android maps them to autofill hints, as the core `TextInput` does; iOS maps them to `textContentType` (the credit card and birth date types need iOS 17). A value a platform has no equivalent for, such as `gift-card-pin` on iOS or `nickname` on Android, is ignored there, so a form schema's hints can be passed straight through.

### Multi-line text

```tsx
<TextField label="Notes" multiline maxLength={200} showCharacterCount />
```

A multi-line field grows with its text. `minLines` sets the height it starts at (a feedback box), and `maxLines` the height it stops growing at and scrolls its text instead (a chat composer). The field reports its height through `onLayout` as it grows. The return key inserts a newline, so `onSubmitEditing` is not called, unless `submitBehavior` is `'submit'` or `'blurAndSubmit'` (see [Return key](#return-key)).

```tsx
<TextField placeholder="Message" multiline minLines={1} maxLines={5} />
```

### Keyboard toolbar (iOS)

`ios.keyboardToolbar` puts a `UIToolbar` above the keyboard, the field's `inputAccessoryView`. Number and phone pads have no return key, so a Done button there is how people put them away. `done: true` is the system Done button (a checkmark on iOS 26); a string is a prominent button with that title. Done dismisses the keyboard: `onBlur` is called, `onSubmitEditing` is not.

`items` are `UIBarButtonItem`s at the start of the toolbar: a `title`, an `icon` (an SF Symbol name or an image, as for [Button](/components/button#icons)), or a `systemItem` such as `'cancel'`, `'save'` or `'add'`, which brings its own localized title or symbol. `prominent` gives an item the prominent style. `'flexibleSpace'` between items spreads them out; Done always sits at the end. `onItemPress` receives the pressed item's `id`.

```tsx
<TextField
  label="Quantity"
  value={quantity}
  onChangeText={setQuantity}
  keyboardType="number-pad"
  ios={{
    keyboardToolbar: {
      items: [
        { id: 'minus', icon: 'minus', accessibilityLabel: 'Decrease' },
        { id: 'plus', icon: 'plus', accessibilityLabel: 'Increase' },
      ],
      done: true,
      onItemPress: (id) => step(id === 'plus' ? 1 : -1),
    },
  }}
/>
```

| iOS 26 | iOS 18 |
| --- | --- |
| ![A number pad with a keyboard toolbar: minus and plus buttons and a checkmark Done button on iOS 26](/img/components/textfield/keyboard-toolbar-ios.webp) | ![The same toolbar on iOS 18, with a bold Done button](/img/components/textfield/keyboard-toolbar-ios18.webp) |

iOS 26 draws the toolbar's buttons as Liquid Glass capsules over the keyboard; earlier versions draw a bar with plain buttons and a bold Done. Items take `testID`s, and `doneTestID` identifies Done, so an E2E test can tap them.

Android keyboards have no toolbar. Their action key is already there on number pads (✓ by default, or the `returnKeyType` icon), and pressing it calls `onSubmitEditing` and dismisses the keyboard, or keeps it up with `submitBehavior="submit"`. Buttons like the ones above belong in your own layout on Android; the `keyboardToolbar` prop is ignored there.

### Grouped forms on iOS

Apple's own forms (Contacts, Settings) put the label in a column at the left and a borderless field beside it, one row per field inside a rounded group. That is the same `UITextField` in a list cell layout; `ios.labelPlacement: 'leading'` with `ios.borderStyle: 'none'` gives the row, and your own grouped container with hairline separators gives the card. Rows in one group share a `labelWidth` so the fields line up. Android keeps its Material fields, so the same code is a stack of outlined fields there.

```tsx
const row = { ios: { labelPlacement: 'leading', borderStyle: 'none' } } as const;

<View style={styles.group}>
  <TextField label="First" value={first} onChangeText={setFirst} {...row} />
  <Divider />
  <TextField label="Middle" placeholder="optional" value={middle} onChangeText={setMiddle} {...row} />
  <Divider />
  <TextField label="Last" value={last} onChangeText={setLast} {...row} />
</View>
```

### Variants

Material 3 has two text field styles, both on `android.variant`: `'outlined'` (the default) draws a stroke around the box, `'filled'` a tinted container with a bottom line. `'plain'` drops the box and the line, for a large standalone input such as an amount; the label still floats. `android.dense` picks the shorter, dense version of any of them. iOS has one field; `ios.borderStyle` chooses between the rounded rectangle and the other `UITextField` borders, and `'none'` is the borderless field.

```tsx
<TextField label="Filled" android={{ variant: 'filled' }} />
<TextField label="Dense" android={{ dense: true }} />
<TextField
  value={amount}
  onChangeText={setAmount}
  keyboardType="decimal-pad"
  textAlign="center"
  textStyle={{ fontSize: 40, fontWeight: '600' }}
  android={{ variant: 'plain' }}
  ios={{ borderStyle: 'none' }}
/>
```

### Material style

`android.material` is the same preference as on [DatePicker](/components/datepicker) and [SelectionMenu](/components/selectionmenu): `'m3'` (the default here) is the Material 3 `TextInputLayout`; `'system'` is the platform `EditText`, the AppCompat widget with the underline, for screens that keep the system look. The system field shows one hint (the placeholder, else the label), the supporting or error text on a line below and the icons as compound drawables; it has no floating label, box, clear button, password toggle, counter, prefix or suffix. `variant` and `dense` only apply to the Material field.

```tsx
<TextField label="Email" supportingText="Work address" android={{ material: 'system' }} />
```

### Read-only fields that open something

A field that opens a menu, a date picker or a search screen is a non-editable field with `onPress`. It keeps its enabled look, never focuses or shows the keyboard, and is announced as a button. Without `onPress`, `editable={false}` draws the field disabled.

```tsx
<TextField
  label="Date of birth"
  value={formatted}
  editable={false}
  onPress={() => setPickerVisible(true)}
  trailingIcon={{ ios: 'calendar', android: 'ic_calendar' }}
  onTrailingIconPress={() => setPickerVisible(true)}
/>
```

### Styling

`textStyle` sets the input font with the `Text` style conventions; the label, supporting text and counter keep the platform's typography. Every text follows the system text size (Dynamic Type on iOS, the font scale on Android), the `textStyle` font included. `maxFontSizeMultiplier` caps that scale as it does on `Text`: with `1.5`, a 17pt input stops at 25.5pt however large the system setting.

`textAlign` aligns the typed text and the placeholder; the natural alignment (leading) is the default.

### Colors

By default the colors come from the theme: the app's Material 3 theme or the brand color set with [`useNativeTheme`](/guides/theming) on Android, the tint color on iOS. The color props override it for one field:

| Prop | Android (`TextInputLayout`) | iOS |
| --- | --- | --- |
| `activeColor` | Focused stroke or underline, floating label, cursor | Focused border, focused label, cursor |
| `outlineColor` | Unfocused stroke or underline | Unfocused border |
| `errorColor` | Error stroke, label, message and icon | Error label and message, error border |
| `containerColor` | Box background | Field background |
| `textColor` | Input text | Input text |
| `placeholderTextColor` | Placeholder | Placeholder |

`UITextField`'s rounded rectangle can't be recolored, so on iOS the field draws the same rounded rectangle itself when `activeColor`, `outlineColor` or `containerColor` is set. The host view's `style.backgroundColor` paints the whole component, label and supporting text included; `containerColor` is only the box.

### Testing

`testID` is set on the inner text input, the `UITextField` / `UITextView` on iOS and the `EditText` on Android, not on the host view. E2E drivers can then type into and clear the field by id (Detox `typeText`, `replaceText`, `clearText`). `leadingIconTestID` and `trailingIconTestID` identify the icons, so a test can tap a trailing icon that opens a picker. On iOS, the keyboard toolbar's items carry their own `testID`, and `ios.keyboardToolbar.doneTestID` identifies Done. On Android they apply to the Material field; the `material: 'system'` field draws its icons as compound drawables, which have no view to carry an id.

```ts
await element(by.id('email')).typeText('ada@example.com');
await element(by.id('dob-picker')).tap(); // trailingIconTestID="dob-picker"
```

For Jest, see [Testing](/guides/testing).

### Android theme

The field is a Material 3 widget, so it works with a `Theme.Material3` app theme and with the library's Material 3 fallback; see [Android Theme Configuration](/guides/android-theme).
