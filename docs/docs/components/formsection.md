---
title: "FormSection"
description: "The iOS inset grouped card for React Native forms: rows of TextFields, switches and checkboxes on a rounded card with separators, a header and a footer, measured against UIKit and SwiftUI on iOS 26 and iOS 18. Android and web render the children as they are."
---

A group of form rows. On iOS it is the inset grouped card of Settings and Contacts: the rows on a rounded card with separators between them, under a header and over a footer in Apple's style. A [TextField](/components/textfield) in it becomes a list row, its label in a leading column and a borderless field beside it, and the rows of one section share a label column so their fields line up. Android and web have no such card: the children render as they are, with the header and footer as text, so one screen's code works everywhere.

It is a JavaScript component: a `View` with the native controls inside it.

| iOS 26 | iOS 26, dark | iOS 26, the largest text size |
| --- | --- | --- |
| ![A Payee section on iOS 26: a header, a rounded white card with Name and Phone fields beside their labels and two switch rows, separators between the rows, and a footer below the card; then a Delivery confirmation section with a switch, a carrier menu and a checkbox](/img/components/formsection/light-ios.webp) | ![The same sections in dark mode: dark gray cards on black](/img/components/formsection/dark-ios.webp) | ![The same Payee section at the largest accessibility text size: the field labels above their fields with the rows' margins kept, the switch rows taller for their wrapped labels, and the footer wrapping over several lines](/img/components/formsection/ax5-ios.webp) |

```tsx
import {
  FormSection,
  Switch,
  TextField,
} from 'react-native-platform-components';

<FormSection
  header="Payee"
  footer="We'll mail the check to this address."
  labelWidth={90}
>
  <TextField label="Name" placeholder="Required" value={name} onChangeText={setName} />
  <TextField label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
  <Switch label="Overnight mail" value={overnight} onValueChange={setOvernight} />
</FormSection>
```

Put the section on the grouped background, `PlatformColor('systemGroupedBackground')` on iOS, as Settings does. The card is `secondarySystemGroupedBackground`, so both follow light and dark mode.

### Props

| Prop                    | Type        | Description                                                                                                                           |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `header`                | `string`    | Text above the group. iOS: Apple's section header, inset to line up with the rows. Android and web: plain text                        |
| `footer`                | `string`    | Text below the group, such as an explanation of its settings. iOS: footnote in the secondary label color, inset to match            |
| `labelWidth`            | `number`    | iOS: width of the leading label column of the TextField rows, in points, so their fields line up. A field's own `ios.labelWidth` wins. Default: the TextField's, 100 |
| `maxFontSizeMultiplier` | `number`    | Largest scale the header and footer text can reach with the system text size, as on `Text`. Unset or `0`: no cap                      |
| `children`              | `ReactNode` | The rows, one per child. See [Rows](#rows)                                                                                            |
| `style`                 | `ViewStyle` | Style of the section: the header, card and footer together                                                                            |
| `testID`                | `string`    | Test identifier of the section. Parts get suffixes: `-header`, `-footer`, and on iOS `-card`, `-row-<index>` and `-separator-<index>` (the separator under that row) |

`FormSection` also takes the usual view props.

### Rows

On iOS each child is a row of the card, with a separator between it and the next. `null`, `false` and `undefined` children make no row, so a row shown on a condition (`{memo && <TextField ... />}`) brings its separator with it, and a fragment's children are rows of their own.

- **TextField**: a list row. It defaults to `ios.labelPlacement: 'leading'`, `ios.borderStyle: 'none'`, the section's `labelWidth`, and a `minFieldHeight` of the native row height, so the field is the row. Anything the field sets itself wins: `ios={{ labelPlacement: 'above' }}` keeps the label above the field in that row, and `minFieldHeight` a taller row. A TextField inside your own view in the row gets the same defaults.
- **Switch, Checkbox, RadioGroup, SelectionMenu** and any other view: placed in the row with the row's horizontal inset, centered in the native row height, and padded above and below so a row that grows (a wrapping label at a large text size) keeps its margins. A Switch with a `label` is a settings row of its own: the whole row toggles it.

The rows have no press highlight: rows that navigate somewhere are outside this component's scope.

Android and web render the children unchanged, so space them as the platform does there (for example `style={{ gap: 12 }}` on Android, between outlined fields).

### Platform behavior

The iOS values were measured on `UITableView(style: .insetGrouped)` and SwiftUI's `Form` on iPhone simulators (iPhone SE, 16, 17 Pro, Air and 17 Pro Max on iOS 26.5; iPhone SE, 16 and 16 Pro on iOS 18.5).

| | iOS 26 | iOS 15 – 18 | Android, web |
| --- | --- | --- | --- |
| Card | `secondarySystemGroupedBackground`, 26pt continuous corners | The same color, 10pt corners | None |
| Row height | 52pt at the default text size, growing with the content | 44pt | The children's own |
| Row inset | 20pt on the wider phones (420pt and up) and iPad, 16pt on the others | 20pt on phones wider than 375pt, 16pt on those | None |
| Separators | `separator` color, 1pt, inset from both ends by the row inset | Hairline, from the row inset to the trailing edge | None |
| Header | Body size, semibold, sentence case, `secondaryLabel`; 6pt above the card | Footnote, capitals, `secondaryLabel`; 7pt above the card | Android: Material's title small in `colorPrimary`. Web: semibold text |
| Footer | Footnote, `secondaryLabel`; 7pt below the card | The same | Android: Material's body small in `colorOnSurfaceVariant`. Web: small text in `GrayText` |

The header and footer follow Dynamic Type with the text styles Apple's lists use (`headline` or `footnote`), and the gaps around them grow with the text.

The iOS 26 design comes with Liquid Glass: it is used when [`isLiquidGlassSupported`](/components/liquidglass) is `true` (iOS 26 or newer, in a build made with Xcode 26 or newer). An app that keeps the earlier design by setting `UIDesignRequiresCompatibility` to `YES` in its Info.plist gets the iOS 18 section on iOS 26, matching the lists UIKit draws there. Its row inset still follows iOS 26 (16pt on a 402pt phone), as UIKit's does. iOS 27 ignores the key in apps built with Xcode 27 (the iOS 27 SDK) and draws the new design, and so does `FormSection`; built with Xcode 26, the app keeps the earlier design on iOS 27 too.

| iOS 18 |
| --- |
| ![The Payee section on iOS 18: a capitalized footnote header, a card with 10pt corners, 44pt rows and hairline separators that run to the trailing edge](/img/components/formsection/light-ios18.webp) |

The section has no margins of its own: place it with `style` or its parent's padding. Apple's lists put the card 16 or 20 points from the screen's sides (the row inset) and leave about 30 points between one section's card and the next section's header.

### Large text

At the accessibility text sizes the rows grow with their text and the separators stay at the rows' edges. A TextField's leading label moves above its field, and its row keeps its margins above the label and below the field, as in Apple's lists (see [Grouped forms on iOS](/components/textfield#grouped-forms-on-ios)), and the header and footer wrap. `maxFontSizeMultiplier` caps the header and footer; the rows' own components have their own `maxFontSizeMultiplier`.

### Accessibility

The header is a header (`accessibilityRole="header"`, a heading on web), so VoiceOver's rotor and TalkBack's headings navigation reach the section. The rows are the components inside them, each with its own label and role; the card and separators are not accessibility elements.

### Testing

The [Jest mock](/guides/testing) renders a view with the header (a `header`-role `Text`, `<testID>-header`), the children and the footer (`<testID>-footer`), without the card or separators. In Detox on iOS, the rows (`<testID>-row-<index>`) and separators (`<testID>-separator-<index>`) have frames you can assert.
