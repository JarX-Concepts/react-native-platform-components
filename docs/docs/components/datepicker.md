---
title: 'DatePicker'
description: 'Native date and time picker for React Native: UIDatePicker on iOS, MaterialDatePicker and MaterialTimePicker on Android.'
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

Native date & time picker using **platform system pickers**.

### Props

| Prop           | Type                                                                | Description                                                                                                                     |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `date`         | `Date \| null`                                                      | Controlled date value                                                                                                           |
| `minDate`      | `Date \| null`                                                      | Minimum selectable date (days before it are disabled)                                                                           |
| `maxDate`      | `Date \| null`                                                      | Maximum selectable date (days after it are disabled)                                                                            |
| `locale`       | `string`                                                            | Locale identifier (e.g., `'en-US'`). See [Android caveats](#android-caveats)                                                    |
| `timeZoneName` | `string`                                                            | Time zone identifier                                                                                                            |
| `mode`         | `'date' \| 'time' \| 'dateAndTime' \| 'countDownTimer'`             | Picker mode. `countDownTimer` is iOS only (Android shows a date picker)                                                         |
| `presentation` | `'modal' \| 'embedded'`                                             | Presentation style                                                                                                              |
| `visible`      | `boolean`                                                           | Controls modal visibility (modal mode only)                                                                                     |
| `onConfirm`    | `(date: Date, confirmed: boolean, durationSeconds: number) => void` | Called on date change; `confirmed` is `true` for deliberate selections, `durationSeconds` is the countdown duration (see below) |
| `onClosed`     | `() => void`                                                        | Called when modal is dismissed                                                                                                  |

### iOS Props (`ios`)

| Prop                       | Type                                               | Description                                                                           |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `preferredStyle`           | `'automatic' \| 'compact' \| 'inline' \| 'wheels'` | iOS date picker style. `countDownTimer` always shows as wheels, the only style it has |
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

### Android Caveats

- **`minDate` / `maxDate`**: both pickers disable the days outside the range, including the days before `minDate` in its month and after `maxDate` in its month. The bounds are whole days in `timeZoneName` (or the device time zone). If you pick the `minDate` day with a time of day earlier than `minDate`, the result is clamped to `minDate` (the same goes for `maxDate`).
- **`locale`**, `material: 'system'` (and embedded): the calendar's month name and weekday initials use `locale`. The header (for example "Thu, Sep 24") and the time picker's 12/24-hour format follow the device settings.
- **`locale`**, `material: 'm3'`: `MaterialDatePicker` and `MaterialTimePicker` format with the device locale, and a library can't change that for one dialog. `locale` only sets the date format of the M3 date picker's text-input mode. For localized titles and buttons, pass `dialogTitle`, `positiveButtonTitle` and `negativeButtonTitle`.

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
