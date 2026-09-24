---
title: 'DatePicker'
description: 'Native date and time picker for React Native: UIDatePicker on iOS, MaterialDatePicker and MaterialTimePicker on Android, and a Material date range picker.'
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-datepicker.gif" height="480" alt="DatePicker on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-datepicker.gif" height="480" alt="DatePicker on Android" /></td>
  </tr>
</table>

Native date & time picker using **platform system pickers**. [`DateRangePicker`](#date-range-daterangepicker) picks a range of days with Material's range picker on Android.

### Props

| Prop           | Type                                                                | Description                                                                                                                     |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `date`         | `Date \| null`                                                      | Controlled date value                                                                                                           |
| `minDate`      | `Date \| null`                                                      | Minimum selectable date (days before it are disabled)                                                                           |
| `maxDate`      | `Date \| null`                                                      | Maximum selectable date (days after it are disabled)                                                                            |
| `locale`       | `string`                                                            | Locale identifier (e.g., `'en-US'`). See [Android caveats](#android-caveats)                                                    |
| `timeZoneName` | `string`                                                            | Time zone identifier                                                                                                            |
| `mode`         | `'date' \| 'time' \| 'dateAndTime' \| 'countDownTimer' \| 'yearAndMonth'` | Picker mode. `countDownTimer` and `yearAndMonth` are iOS only (Android shows a date picker). See [Year and month](#year-and-month-ios) |
| `is24Hour`     | `boolean`                                                           | Forces the 24-hour (`true`) or 12-hour (`false`) clock. Default: the device setting. See [24-hour clock](#24-hour-clock)          |
| `presentation` | `'modal' \| 'embedded'`                                             | Presentation style                                                                                                              |
| `visible`      | `boolean`                                                           | Controls modal visibility (modal mode only)                                                                                     |
| `onConfirm`    | `(date: Date, confirmed: boolean, durationSeconds: number) => void` | Called on date change; `confirmed` is `true` for deliberate selections, `durationSeconds` is the countdown duration (see below) |
| `onClosed`     | `() => void`                                                        | Called when modal is dismissed                                                                                                  |

### iOS Props (`ios`)

| Prop                       | Type                                               | Description                                                                           |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `preferredStyle`           | `'automatic' \| 'compact' \| 'inline' \| 'wheels'` | iOS date picker style. `countDownTimer` and `yearAndMonth` always show as wheels, the only style they have |
| `countDownDurationSeconds` | `number`                                           | Duration for countdown timer mode                                                     |
| `minuteInterval`           | `number`                                           | Minute interval (1-30)                                                                |
| `roundsToMinuteInterval`   | `'inherit' \| 'round' \| 'noRound'`                | Rounding behavior                                                                     |
| `showConfirmToolbar`       | `boolean`                                          | Modal only. Show Cancel/Done toolbar below the picker. Defaults to `true`. See below. |

### Android Props (`android`)

| Prop                  | Type               | Description                                                            |
| --------------------- | ------------------ | ---------------------------------------------------------------------- |
| `firstDayOfWeek`      | `number`           | First day of week in the calendar (1-7, Sunday=1), system and M3       |
| `material`            | `'system' \| 'm3'` | Material Design style (modal only; embedded always uses system picker) |
| `dialogTitle`         | `string`           | Custom dialog title                                                    |
| `positiveButtonTitle` | `string`           | Custom confirm button text                                             |
| `negativeButtonTitle` | `string`           | Custom cancel button text                                              |
| `inputMode`           | `'calendar' \| 'text'` | Material pickers: open on the calendar and clock dial (default) or on text entry. See [Text input](#text-input-android) |

### The `confirmed` Flag

`onConfirm` fires on every date/time change, but the second argument (`confirmed`) lets you distinguish between browsing and deliberate selections:

| Platform / Mode      | Every change                              | Deliberate selection                 |
| -------------------- | ----------------------------------------- | ------------------------------------ |
| **iOS modal**        | `confirmed: false` (user still adjusting) | `confirmed: true` (tapping **Done**) |
| **iOS embedded**     | `confirmed: true`                         | —                                    |
| **Android modal**    | —                                         | `confirmed: true` (pressing OK)      |
| **Android embedded** | `confirmed: true`                         | —                                    |

On iOS in modal presentation, the picker is shown in a popover with a Cancel/Done toolbar below it. Tapping **Done** emits `confirmed: true`; tapping **Cancel** or outside the popover calls `onClosed`. Set `ios.showConfirmToolbar: false` to hide the toolbar — in that mode `confirmed: true` never fires, and your app is expected to drive dismissal by flipping `visible` off (reading the current date from the stream of `confirmed: false` events). This only makes UX sense paired with `ios.preferredStyle: 'inline'`.

### Countdown Timer (`durationSeconds`)

In `countDownTimer` mode the selection is a duration, not a date. `onConfirm` reports it as the third argument, `durationSeconds` (for example 5400 for 1 h 30 min); the `date` argument has no meaning in this mode. In every other mode `durationSeconds` is `0`. Set the initial duration with `ios.countDownDurationSeconds`.

```tsx
<DatePicker
  date={null}
  mode="countDownTimer"
  presentation="embedded"
  ios={{ countDownDurationSeconds: duration }}
  onConfirm={(_date, _confirmed, durationSeconds) =>
    setDuration(durationSeconds)
  }
/>
```

`countDownTimer` is a `UIDatePicker` mode. Android has no countdown picker: it treats the mode as `date` and always reports `durationSeconds: 0`. On web it is a time input, and `durationSeconds` is its hours and minutes.

### 24-hour clock

`is24Hour` overrides the device's 12/24-hour setting in the time modes. `false` forces the 12-hour clock with AM/PM.

- **iOS:** `UIDatePicker` draws its clock in its locale's hour cycle, so the picker gets its locale (`locale`, or the device's) with the hour cycle set (`Locale.Components.hourCycle`; the ICU `@hours=` keyword before iOS 16). The language and the date format stay the same. This applies to the wheels, compact and inline styles.
- **Android:** `MaterialTimePicker`'s `TimeFormat.CLOCK_24H` / `CLOCK_12H`, and `setIs24HourView` on the system and embedded `TimePicker`.

| iOS 26 | Android |
| --- | --- |
| ![24-hour time wheels on iOS 26](/img/components/datepicker/24-hour-ios.webp) | ![MaterialTimePicker with a 24-hour clock dial on Android](/img/components/datepicker/24-hour-android.webp) |

```tsx
<DatePicker date={time} mode="time" is24Hour onConfirm={(d) => setTime(d)} />
```

### Year and month (iOS)

`mode="yearAndMonth"` is `UIDatePicker`'s month and year wheels (iOS 17.4+), for a card expiry or a monthly report. Like the countdown timer, it only exists as wheels, so `ios.preferredStyle` is ignored. `onConfirm` reports a date in the picked month; read its year and month. The day and time are kept from the previous date. Before iOS 17.4 the mode shows the date wheels. Android has no month picker and shows the date picker.

![Month and year wheels on iOS 26](/img/components/datepicker/year-and-month-ios.webp)

### Text input (Android)

`android.inputMode: 'text'` opens the Material pickers on their keyboard entry: `MaterialDatePicker`'s date field (`INPUT_MODE_TEXT`), the start and end fields of the range picker, and `MaterialTimePicker`'s hour and minute fields (`INPUT_MODE_KEYBOARD`). `'calendar'` opens them on the calendar and the clock dial, the default. People can switch in the dialog either way. The system dialogs have no text mode, so this applies with `material: 'm3'` and to `DateRangePicker`.

![The Material range picker opened on its start and end date fields](/img/components/datepicker/text-input-android.webp)

### Date range (`DateRangePicker`)

`DateRangePicker` shows `MaterialDatePicker.Builder.dateRangePicker()` on Android, the full-screen Material range picker. It is a modal: `visible` shows it, `onConfirm` receives `{ startDate, endDate }` when the user saves, and `onClosed` is called when it closes, saved or not. Both dates are the start (midnight) of their day in `timeZoneName` or the device time zone, and `endDate` is the last day of the range, inclusive. `startDate` and `endDate` set the range it opens on.

```tsx
import { DateRangePicker, isDateRangePickerSupported } from 'react-native-platform-components';

<DateRangePicker
  visible={open}
  startDate={range?.startDate ?? null}
  endDate={range?.endDate ?? null}
  minDate={today}
  onConfirm={setRange}
  onClosed={() => setOpen(false)}
  android={{ dialogTitle: 'Trip dates' }}
/>;
```

![The Material date range picker on Android, with Sep 24 to Sep 28 selected](/img/components/datepicker/date-range-android.webp)

| Prop           | Type                                      | Description                                                                |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `visible`      | `boolean`                                 | Shows the dialog                                                           |
| `startDate`, `endDate` | `Date \| null`                   | The range the dialog opens on                                              |
| `minDate`, `maxDate` | `Date \| null`                     | Days outside are disabled                                                  |
| `onConfirm`    | `(range: { startDate: Date; endDate: Date }) => void` | The user saved a range                                     |
| `onClosed`     | `() => void`                              | The dialog closed                                                          |
| `locale`, `timeZoneName` | `string`                        | As on `DatePicker`                                                         |
| `android`      | `{ firstDayOfWeek?, inputMode?, dialogTitle?, positiveButtonTitle?, negativeButtonTitle? }` | As on `DatePicker` (the range picker is always Material) |

**iOS has no native range picker**, and this library doesn't draw one. On iOS `DateRangePicker` renders nothing and warns in development when it is shown. Check `isDateRangePickerSupported` and offer two `DatePicker`s (a start and an end) there. On web it is a dialog with start and end date inputs.

### Android Caveats

- **`minDate` / `maxDate`**: both pickers disable the days outside the range, including the days before `minDate` in its month and after `maxDate` in its month. The bounds are whole days in `timeZoneName` (or the device time zone). If you pick the `minDate` day with a time of day earlier than `minDate`, the result is clamped to `minDate` (the same goes for `maxDate`).
- **`locale`**, `material: 'system'` (and embedded): the calendar's month name and weekday initials use `locale`. The header (for example "Thu, Sep 24") and the time picker's 12/24-hour format follow the device settings.
- **`locale`**, `material: 'm3'`: `MaterialDatePicker` and `MaterialTimePicker` format with the device locale, and a library can't change that for one dialog. `locale` only sets the date format of the M3 date picker's text-input mode. For localized titles and buttons, pass `dialogTitle`, `positiveButtonTitle` and `negativeButtonTitle`.
- **Text input and your theme**: `MaterialDatePicker`'s text fields are `TextInputLayout`s styled by your theme's `textInputStyle`. A theme that sets `textInputStyle` to an exposed dropdown menu style (`Widget.Material3.TextInputLayout.OutlinedBox.ExposedDropdownMenu`) makes the picker throw when it shows them ("EditText needs to be an AutoCompleteTextView"), in text mode or when the user taps its edit icon. Keep `textInputStyle` a text field style; `SelectionMenu` sets up its own dropdown.

A common pattern is to close the modal only on a confirmed selection:

```tsx
<DatePicker
  date={date}
  visible={visible}
  presentation="modal"
  mode="time"
  onConfirm={(d, confirmed) => {
    setDate(d);
    if (confirmed) setVisible(false);
  }}
  onClosed={() => setVisible(false)}
/>
```
