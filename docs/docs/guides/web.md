---
title: 'Web'
description: 'Connect your web design system through typed component adapters while keeping the same shared screens, props and callbacks.'
---

The package focuses on native iOS and Android widgets. On web you can connect
your application's own controls with `PlatformComponentsProvider`, using the
same imports and public props throughout shared screens. You can register one
component or a complete set. Components without a registration retain the
existing fallbacks described below.

The web build must resolve this package's `browser` entry and alias
`react-native` to [react-native-web](https://necolas.github.io/react-native-web/).
Expo web handles this setup. For a custom bundler, follow
[React Native Web's setup instructions](https://necolas.github.io/react-native-web/docs/setup/)
and enable the `browser` export condition. Do not import the package's native
source files or generated native components directly in a browser bundle.

Jump to [connect your web components](#connect-your-web-components) for the setup.

## Built-in fallbacks

The web entry point takes the same props as iOS and Android and uses the same types, so shared screens need no `Platform.OS` checks. Where the browser has a control of its own, the component renders that control, which is the web's own platform widget:

| Component              | Web rendering                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextField`            | react-native-web's `TextInput` (an `<input>` or `<textarea>`), with the label, prefix, suffix, clear button, password toggle, supporting and error text, and counter around it     |
| `DatePicker`           | `<input type="date">`, `"time"`, `"datetime-local"` or `"month"`. `embedded` renders it in place; `modal` opens it in a `<dialog>` with Cancel and Done                            |
| `DateRangePicker`      | A `<dialog>` with start and end date inputs; Done confirms a complete range within the configured bounds                                                                           |
| `SelectionMenu`        | `embedded` renders a `<select>`; `modal` opens the options in a `<dialog>`                                                                                                         |
| `Button`               | A `<button>` in the Material 3 variants and sizes. A toggle (`selected`) sets `aria-pressed`. There is no web menu: a button with a `menu` calls `onPress` and logs a warning once |
| `FloatingActionButton` | A `<button>` styled after the Material 3 FAB, with the label while extended. `scrollViewNativeID` is ignored                                                                       |
| `ButtonGroup`          | A row of `<button>`s, with toggle semantics (`aria-pressed`, or radios for single selection) when `selection` is set                                                               |
| `SplitButton`          | The main button alone: there is no web menu (a warning is logged once)                                                                                                             |
| `SegmentedControl`     | A radio group of `<button>`s in a track, like the iOS control                                                                                                                      |
| `TabBar`               | A `tablist` of `<button>` tabs, icon over label, the selected icon in a pill                                                                                                       |
| `NavigationRail`       | A vertical `tablist` of `<button>` destinations, icon over label (beside it when expanded), with the header above                                                                  |
| `FloatingToolbar`      | A pill-shaped surface that lays out its children                                                                                                                                   |
| `LiquidGlass`          | A plain view. `isLiquidGlassSupported` is `false`, as on Android                                                                                                                   |
| `ContextMenu`          | Its children, without a menu (see below)                                                                                                                                           |

## Behavior

Events and controlled props work the way they do on native:

- **`DatePicker`**: `embedded` reports every change with `confirmed: true`. `modal` works like the iOS popover: changes report `confirmed: false`, **Done** reports `confirmed: true`, and **Cancel**, Escape or a click outside the dialog call `onClosed`. Close the dialog by setting `visible` to `false`. Changing `date` also updates an already open dialog; recreating the same date value preserves the user's pending edits. `minDate` and `maxDate` constrain both typed dates and confirmed selections. Bounds compare the fields shown by the input: days for date inputs, months for month inputs, and times of day for time inputs. `ios.minuteInterval` sets the step for time and date-time inputs only. Dates are in the browser's local time zone; `timeZoneName` is ignored.
- **`DateRangePicker`**: Done stays disabled until both dates are set, ordered, and within `minDate` / `maxDate`. Confirmation reports the start of each day in the browser’s local time zone, then calls `onClosed`. `timeZoneName` and Android dialog options are ignored.
- **`SelectionMenu`**: `modal` stays headless. While `visible`, picking an option calls `onSelect`, and Escape or a click outside calls `onRequestClose`. `accessibilityLabel` names the actual select or dialog; it defaults to the placeholder, or “Select an option”.
- **`SegmentedControl`**: as on iOS, clicking the selected segment keeps it selected. `labelVisibility: 'auto'` shows both the icon and the label.
- **`TabBar`**: clicking the selected tab calls `onReselect`. `labelVisibility: 'auto'` labels every tab.

## Keyboard support

The browser handles keyboard input for embedded date fields and selection menus. Custom button controls support Tab to focus and Enter or Space to activate. `TabBar`, `NavigationRail`, `SegmentedControl`, single-selection `ButtonGroup`, and modal `SelectionMenu` currently do not implement arrow-key navigation within their groups. The modal selection menu also lacks type-ahead search. Use your own web component when your application requires those keyboard interactions.

## Theme and icons

`useNativeTheme` and `setNativeTheme` set the brand color the web components use for filled buttons, focus and selection, and the browser's own controls through `accent-color`. Without a theme they use the Material 3 baseline purple. `PlatformColor` and `DynamicColorIOS` values don't exist on the web and fall back to the defaults.

Only image icons (`{ type: 'image', source }`) render on the web. SF Symbols and Android drawables have no web equivalent and are left out, so pass an image in a per-platform pair when a control needs an icon on every platform. See [Icons](/guides/icons).

## ContextMenu

Browsers have no native menu to attach to a view, so on the web `ContextMenu` renders its children without a menu and logs a warning once in development.

## Connect your web components

### 1. Write a typed adapter

An adapter is a React component accepting the corresponding package props.
Translate those props into your web library's API, or use native HTML controls.
This small example implements labeled buttons, disabled state and controlled
toggles with the browser's own button:

```tsx
// AppWebButton.web.tsx
import { View } from 'react-native';
import type { ButtonProps } from 'react-native-platform-components';

export function AppWebButton({
  label,
  disabled,
  selected,
  onSelectedChange,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps) {
  return (
    <View style={style}>
      <button
        type="button"
        data-testid={testID}
        aria-label={accessibilityLabel ?? label}
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => {
          if (selected !== undefined) onSelectedChange?.(!selected);
          onPress?.();
        }}
      >
        {label}
      </button>
    </View>
  );
}
```

This example deliberately has a small support surface: it does not implement
icons, menus, haptics or visual variant props. Extend the mapping for the features
your screens use and document any unsupported props. The provider routes props;
it does not implement missing behavior inside a supplied component. React Native
styles belong on a `View` or need translation to CSS, rather than being spread
directly onto a DOM element.

### 2. Register once at the web root

Keep the registry and component definitions outside render functions so controls
retain their state and focus across parent renders:

```tsx
// PlatformComponentsRoot.web.tsx
import type { ReactNode } from 'react';
import {
  PlatformComponentsProvider,
  type WebComponents,
} from 'react-native-platform-components';
import { AppWebButton } from './AppWebButton.web';

const webComponents = {
  Button: AppWebButton,
  // TextField: AppWebTextField,
  // SelectionMenu: AppWebSelect,
  // ContextMenu: AppWebContextMenu,
} satisfies Partial<WebComponents>;

export function PlatformComponentsRoot({ children }: { children: ReactNode }) {
  return (
    <PlatformComponentsProvider web={webComponents}>
      {children}
    </PlatformComponentsProvider>
  );
}
```

For a shared Expo/Metro app, add the native counterpart:

```tsx
// PlatformComponentsRoot.tsx
export { PlatformComponentsProvider as PlatformComponentsRoot } from 'react-native-platform-components';
```

Metro's platform resolution chooses `.web.tsx` for web and the plain file for
native. A custom bundler must configure the equivalent resolution, or mount the
provider directly in its separate web entry point. Keep imports of your web-only
design system in that web module so they never enter native bundles. The native
provider simply renders its children and ignores web registrations.

### 3. Keep shared screens unchanged

Wrap the shared application once:

```tsx
import { PlatformComponentsRoot } from './PlatformComponentsRoot';
import { SharedScreens } from './SharedScreens';

export default function App() {
  return (
    <PlatformComponentsRoot>
      <SharedScreens />
    </PlatformComponentsRoot>
  );
}
```

Screens continue importing from this package:

```tsx
import { Button } from 'react-native-platform-components';

export function SaveAction({ save }: { save: () => void }) {
  return <Button label="Save" onPress={save} />;
}
```

That `Button` uses `AppWebButton` inside the web provider, and the native widget
on iOS and Android. There is no per-screen platform branch or custom import.

## Adapter contract

`WebComponents` accepts these keys: `Button`, `ButtonGroup`, `SplitButton`,
`ContextMenu`, `DatePicker`, `DateRangePicker`, `FloatingActionButton`,
`FloatingToolbar`, `LiquidGlass`, `LiquidGlassContainer`, `NavigationRail`,
`SegmentedControl`, `SelectionMenu`, `TabBar` and `TextField`.

Each entry is checked against that component's public props. `WebComponentProps`
also exposes the mapping, for example `WebComponentProps['TextField']`. Import
these as types so they add no native runtime imports to web bundles.

- **Controlled state:** render from the supplied value. Report a proposed change
  through the existing callback; do not permanently change the selection when
  the parent leaves its prop unchanged.
- **Callbacks:** translate your web library's events into the documented package
  arguments. For example, `SelectionMenu.onSelect` receives `(data, label, index)`,
  where `index` refers to the original options array, including disabled entries.
  Date picker confirmation and dismissal remain separate events.
- **Disabled choices and accessibility:** preserve disabled state, accessible
  names, keyboard operation and focus behavior in your adapter. Translate test
  identifiers to `data-testid` if your browser tests use them.
- **Platform props:** document how unsupported `ios` / `android` options, icons,
  styles and native effects map or are ignored. Do not spread these onto DOM nodes.
- **Composition:** register `SplitButton` to supply its complete web menu. Its
  built-in main-button-only fallback also respects a registered `Button`.
  Other compound controls are replaced as a whole, not by automatically
  replacing every HTML button inside them.
- **Avoid recursion:** an adapter must render your web implementation, not the
  same package component it replaces. Rendering the package's `Button` from its
  own registered `Button` adapter would recursively invoke the adapter.

### TextField refs

A `TextField` adapter must forward the public `TextFieldRef`, not a raw DOM node.
Use React's `forwardRef<TextFieldRef, TextFieldProps>` and `useImperativeHandle`
(or React 19's ref prop) to expose:

| Method                      | Required behavior                                                             |
| --------------------------- | ----------------------------------------------------------------------------- |
| `focus()`                   | Focus the underlying input.                                                   |
| `blur()`                    | Blur it.                                                                      |
| `clear()`                   | Clear it and call `onChangeText('')`, maintaining controlled-value semantics. |
| `isFocused()`               | Report whether the underlying input currently has focus.                      |
| `setSelection(start, end?)` | Set a clamped UTF-16 selection range; default `end` to `start`.               |

Read DOM state inside methods or effects, not at module initialization or during
server rendering. See the [TextField API](/components/textfield) for event and
selection details. The provider forwards the ref through the exported component.

## Scope, fallbacks and server rendering

Registrations belong to a React subtree. Nested providers replace the entries
they supply and inherit omitted or `undefined` entries. Separate application
roots and separate server render requests do not share a mutable registry.
Removing a registration restores the nearest inherited component or the built-in
fallback. Changing the implementation component itself remounts that control.

No registration is required to use the existing fallbacks. Their limitations in
the table above still apply wherever you do not provide a replacement. Capability
constants such as `isLiquidGlassSupported` describe the built-in platform support;
they are not changed by registrations.

For server-rendered web apps, render the same registry and initial props on the
server and client. In Next.js App Router, put the provider and its registry inside
a client component (`'use client'` at the top of your web root module); do not pass
component functions from a Server Component across that boundary. The adapter
must itself support server rendering and hydration. There is no process-global
`register()` call.
