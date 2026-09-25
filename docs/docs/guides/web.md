---
title: "Web"
description: "How the components render on the web with react-native-web: the browser's own controls, the same props, and how to swap in your own web components."
---

On the web the package resolves to a separate entry point for [react-native-web](https://necolas.github.io/react-native-web/). Expo web and any bundler that aliases `react-native` to `react-native-web` pick it up automatically through the package's `browser` export condition. There is nothing to configure.

The web entry point takes the same props as iOS and Android and uses the same types, so shared screens need no `Platform.OS` checks. Where the browser has a control of its own, the component renders that control, which is the web's own platform widget:

| Component          | Web rendering                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TextField`        | react-native-web's `TextInput` (an `<input>` or `<textarea>`), with the label, prefix, suffix, clear button, password toggle, supporting and error text, and counter around it |
| `DatePicker`       | `<input type="date">`, `"time"` or `"datetime-local"`. `embedded` renders it in place; `modal` opens it in a `<dialog>` with Cancel and Done                                   |
| `SelectionMenu`    | `embedded` renders a `<select>`; `modal` opens the options in a `<dialog>`                                                                                                     |
| `Button`           | A `<button>` in the Material 3 variants and sizes. A toggle (`selected`) sets `aria-pressed`. There is no web menu: a button with a `menu` calls `onPress` and logs a warning once |
| `ButtonGroup`      | A row of `<button>`s, with toggle semantics (`aria-pressed`, or radios for single selection) when `selection` is set                                                           |
| `SplitButton`      | The main button alone: there is no web menu (a warning is logged once)                                                                                                         |
| `SegmentedControl` | A radio group of `<button>`s in a track, like the iOS control                                                                                                                  |
| `TabBar`           | A `tablist` of `<button>` tabs, icon over label, the selected icon in a pill                                                                                                   |
| `NavigationRail`   | A vertical `tablist` of `<button>` destinations, icon over label (beside it when expanded), with the header above |
| `FloatingToolbar`  | A pill-shaped surface that lays out its children                                                                                                                               |
| `LiquidGlass`      | A plain view. `isLiquidGlassSupported` is `false`, as on Android                                                                                                               |
| `ContextMenu`      | Its children, without a menu (see below)                                                                                                                                       |

## Behavior

Events and controlled props work the way they do on native:

- **`DatePicker`**: `embedded` reports every change with `confirmed: true`. `modal` works like the iOS popover: changes report `confirmed: false`, **Done** reports `confirmed: true`, and **Cancel**, Escape or a click outside the dialog call `onClosed`. Close the dialog by setting `visible` to `false`. `minDate`, `maxDate` and `ios.minuteInterval` apply to the input. Dates are in the browser's local time zone; `timeZoneName` is ignored.
- **`SelectionMenu`**: `modal` stays headless. While `visible`, picking an option calls `onSelect`, and Escape or a click outside calls `onRequestClose`.
- **`SegmentedControl`**: as on iOS, clicking the selected segment keeps it selected. `labelVisibility: 'auto'` shows both the icon and the label.
- **`TabBar`**: clicking the selected tab calls `onReselect`. `labelVisibility: 'auto'` labels every tab.

## Theme and icons

`useNativeTheme` and `setNativeTheme` set the brand color the web components use for filled buttons, focus and selection, and the browser's own controls through `accent-color`. Without a theme they use the Material 3 baseline purple. `PlatformColor` and `DynamicColorIOS` values don't exist on the web and fall back to the defaults.

Only image icons (`{ type: 'image', source }`) render on the web. SF Symbols and Android drawables have no web equivalent and are left out, so pass an image in a per-platform pair when a control needs an icon on every platform. See [Icons](/guides/icons).

## ContextMenu

Browsers have no native menu to attach to a view, so on the web `ContextMenu` renders its children without a menu and logs a warning once in development.

## Using your own web components

To use a different component on the web, such as your design system's menu or date picker, add a `.web.tsx` file next to a wrapper in your app. Metro, Expo and webpack all resolve it before the plain file:

```tsx
// AppContextMenu.tsx: iOS and Android
export { ContextMenu as AppContextMenu } from 'react-native-platform-components';
```

```tsx
// AppContextMenu.web.tsx: web
import type { ContextMenuProps } from 'react-native-platform-components';
import { DropdownMenu } from './design-system';

export function AppContextMenu({
  actions,
  onPressAction,
  children,
}: ContextMenuProps) {
  return (
    <DropdownMenu
      items={actions.map((a) => ({ id: a.id, label: a.title }))}
      onSelect={(id, label) => onPressAction?.(id, label)}
    >
      {children}
    </DropdownMenu>
  );
}
```

The props types are exported from the web entry point too, so the web version can accept exactly the same props.
