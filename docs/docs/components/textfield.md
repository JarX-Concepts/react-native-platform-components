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
| `onSubmitEditing`     | `(event) => void`                                        | The return key was pressed (single-line fields). The field blurs                                |
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
| `multiline`           | `boolean`                                                | A field that grows with its text. Return inserts a newline                                      |
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

### Android Props (`android`)

| Prop       | Type                       | Description                                                             |
| ---------- | -------------------------- | ----------------------------------------------------------------------- |
| `material` | `'m3' \| 'system'`         | The Material 3 text field (default) or the platform `EditText`. See [Material style](#material-style) |
| `variant`  | `'outlined' \| 'filled' \| 'plain'` | Material 3 text field style. Default: `'outlined'`. See [Variants](#variants) |
| `dense`    | `boolean`                  | The dense variant, a shorter field                                      |

### Controlled text

`value` and `onChangeText` work like the core `TextInput`, including under fast typing. Native keeps a counter of user edits and sends it with every `onChangeText`; a `value` pushed from JS carries the last counter JS has seen, and native drops it when the user has typed since, so a slow render never erases keystrokes. The edit that follows reconciles the two sides. Formatting as you type (`onChangeText={(t) => setValue(t.toUpperCase())}`) works, and a field whose owner ignores an edit is reverted to `value`, as `TextInput` does.

The field registers with React Native's focus tracking, so `Keyboard.dismiss()`, a `ScrollView`'s `keyboardShouldPersistTaps` and `KeyboardAvoidingView` treat it like a `TextInput`.

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

### Autofill

`autoComplete` takes the React Native `TextInput` values, which include the HTML autocomplete names (`email`, `new-password`, `one-time-code`, `sms-otp`, `address-line1`, `postal-address-locality`, `birthdate-day`, `cc-exp-month`, `organization`, ...). Android maps them to autofill hints, as the core `TextInput` does; iOS maps them to `textContentType` (the credit card and birth date types need iOS 17). A value a platform has no equivalent for, such as `gift-card-pin` on iOS or `nickname` on Android, is ignored there, so a form schema's hints can be passed straight through.

### Multi-line text

```tsx
<TextField label="Notes" multiline maxLength={200} showCharacterCount />
```

A multi-line field grows with its text. `minLines` sets the height it starts at (a feedback box), and `maxLines` the height it stops growing at and scrolls its text instead (a chat composer). The field reports its height through `onLayout` as it grows. The return key inserts a newline, so `onSubmitEditing` is not called.

```tsx
<TextField placeholder="Message" multiline minLines={1} maxLines={5} />
```

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

`testID` is set on the inner text input, the `UITextField` / `UITextView` on iOS and the `EditText` on Android, not on the host view. E2E drivers can then type into and clear the field by id (Detox `typeText`, `replaceText`, `clearText`). `leadingIconTestID` and `trailingIconTestID` identify the icons, so a test can tap a trailing icon that opens a picker. On Android they apply to the Material field; the `material: 'system'` field draws its icons as compound drawables, which have no view to carry an id.

```ts
await element(by.id('email')).typeText('ada@example.com');
await element(by.id('dob-picker')).tap(); // trailingIconTestID="dob-picker"
```

### Android theme

The field is a Material 3 widget, so it works with a `Theme.Material3` app theme and with the library's Material 3 fallback; see [Android Theme Configuration](/guides/android-theme).
