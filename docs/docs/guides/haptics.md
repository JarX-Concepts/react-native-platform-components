---
title: "Haptics"
description: "The shared haptics prop: UIKit feedback generators on iOS and View.performHapticFeedback on Android for Button, ButtonGroup, SplitButton, FloatingActionButton, SegmentedControl, TabBar, NavigationRail, SelectionMenu and ContextMenu."
---

The interactive components take a `haptics` prop that plays the platform's own haptic feedback when the user acts on the control: a press, a selection change or a menu pick. There is no separate haptics library to wire up per control, and the haptic plays in native code at the moment the control reports the action, before the event reaches JavaScript.

```tsx
<SegmentedControl haptics="selection" segments={segments} selectedValue={view} onSelect={setView} />
<TabBar haptics="selection" items={tabs} selectedValue={tab} onSelect={setTab} />
<Button label="Pay" haptics="success" onPress={pay} />
```

It is on Button, ButtonGroup, SplitButton, FloatingActionButton, SegmentedControl, TabBar, NavigationRail, SelectionMenu and ContextMenu, and on each menu action (see [Menu items](#menu-items)). Unset, a component plays nothing beyond what the native control does on its own (see [Defaults](#defaults)). Both platforms follow the system setting: with system haptics (iOS) or touch feedback (Android) turned off, nothing plays.

## Values

| Value       | Use for                                           | iOS                                                  | Android (`HapticFeedbackConstants`)          |
| ----------- | ------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `selection` | A selection change: a segment, a tab, a menu pick | `UISelectionFeedbackGenerator.selectionChanged()`    | `SEGMENT_TICK` (API 34+), `CLOCK_TICK` before |
| `light`     | A light tap                                       | `UIImpactFeedbackGenerator(style: .light)`           | `CONTEXT_CLICK`                              |
| `medium`    | A regular press                                   | `UIImpactFeedbackGenerator(style: .medium)`          | `VIRTUAL_KEY`                                |
| `heavy`     | A weighty action                                  | `UIImpactFeedbackGenerator(style: .heavy)`           | `LONG_PRESS`                                 |
| `success`   | An action that completed                          | `UINotificationFeedbackGenerator`, `.success`        | `CONFIRM` (API 30+), `VIRTUAL_KEY` before    |
| `warning`   | An action that needs attention                    | `UINotificationFeedbackGenerator`, `.warning`        | `REJECT` (API 30+), `LONG_PRESS` before      |
| `error`     | An action that failed                             | `UINotificationFeedbackGenerator`, `.error`          | `REJECT` (API 30+), `LONG_PRESS` before      |
| `none`      | No haptic at all                                  | Nothing                                              | Nothing, and turns off the view's own haptic |

Android has fewer distinct effects than iOS. With Android 15's default haptic configuration the constants play these effects:

| Effect                     | Values                          |
| -------------------------- | ------------------------------- |
| Tick                       | `selection`, `light`            |
| Click                      | `medium`, `success`             |
| Heavy click                | `heavy`                         |
| Double click               | `warning`, `error`              |

Devices can tune each constant, so the same value can feel different from one phone to the next. Android has no warning constant; `warning` and `error` both play `REJECT`.

On iOS each component creates its generator on first use, attached to the view (`init(view:)` on iOS 17.5+, the plain initializers before), and prepares it when an action is likely: on touch down for Button, ButtonGroup, SplitButton, FloatingActionButton and NavigationRail, when the menu appears for ContextMenu and the modal SelectionMenu. On Android the haptic is `View.performHapticFeedback` on the component's view, without flags, so the system's touch-feedback setting applies.

On the web the prop is accepted and ignored.

## When each component plays it

| Component                                              | Plays when                                                                              | Doesn't play                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Button](/components/button)                           | The button is pressed, a toggle included (once per press, whatever `onSelectedChange` decides); a `menu` item is picked | When a menu button opens its menu; while `loading` or disabled      |
| [ButtonGroup](/components/buttongroup)                 | A button is pressed, in every selection mode, once per press; a pick from the overflow menu counts as a press | For disabled buttons                                                |
| [SplitButton](/components/buttongroup#splitbutton)     | The main button is pressed; a menu item is picked                                       | When the trailing button opens the menu                             |
| [FloatingActionButton](/components/floatingactionbutton) | The button is pressed                                                                 | While disabled                                                      |
| [SegmentedControl](/components/segmentedcontrol)       | The user's tap changes the selection: selects a segment, or clears it on Android with `selectionRequired: false`. In iOS momentary mode, every tap | When `selectedValue` changes from JavaScript; tapping the selected segment |
| [TabBar](/components/tabbar)                           | The user presses a tab, the search tab and the selected one (a reselect) included      | When `selectedValue` changes from JavaScript; for disabled tabs     |
| [NavigationRail](/components/navigationrail)           | The user presses a destination, including the selected one (a reselect)                | When `selectedValue` changes from JavaScript; for disabled destinations |
| [SelectionMenu](/components/selectionmenu)             | The user picks an option (whenever `onSelect` is called)                                | On open, or when the menu is dismissed without a pick               |
| [ContextMenu](/components/contextmenu)                 | The user presses an action                                                              | On a row that opens a submenu                                       |

A **reselect** plays the haptic too, on TabBar and NavigationRail: pressing the selected tab is a deliberate action (the conventional "scroll to top" or "back to root"), and the press gets the same acknowledgement as any other. The haptic doesn't wait for your `onSelect` handler, so it plays even when your code keeps the selection where it was.

## Menu items

A menu action can carry its own `haptics`, which plays in place of the component's when that action is picked; `'none'` silences one action. It works everywhere the menu items go: ContextMenu actions, Button `menu` and SplitButton `menu`.

```tsx
<ContextMenu
  haptics="selection"
  actions={[
    { id: 'copy', title: 'Copy' },
    { id: 'delete', title: 'Delete', attributes: { destructive: true }, haptics: 'warning' },
  ]}
  onPressAction={handle}
>
  {row}
</ContextMenu>
```

## Defaults

Unset `haptics` adds nothing, so each component keeps the behavior of the native control it wraps:

| Component        | iOS                                                                                           | Android                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Button           | `UIButton`, a toggle or a menu button included: no haptic for the press or the pick            | `MaterialButton`, checkable or not, and its `PopupMenu`: no haptic                                |
| ButtonGroup      | `UIButton`s: no haptic                                                                         | `MaterialButtonGroup` / `MaterialButtonToggleGroup`, and the overflow menu: no haptic            |
| SplitButton      | `UIButton`s and their `UIMenu`: no haptic for the press or the pick                            | `MaterialSplitButton` and its `PopupMenu`: no haptic                                              |
| FloatingActionButton | `UIButton`: no haptic                                                                      | `FloatingActionButton` / `ExtendedFloatingActionButton`: no haptic                               |
| SegmentedControl | `UISegmentedControl`: no haptic on iPhone                                                      | `MaterialButtonToggleGroup`: no haptic                                                            |
| TabBar           | `UITabBar`: no haptic                                                                          | `BottomNavigationView`: no haptic                                                                 |
| NavigationRail   | `UIButton`s: no haptic                                                                         | `NavigationRailView`: no haptic                                                                   |
| SelectionMenu    | The system menu (embedded) or the popover list (modal): no haptic for the pick                 | `Spinner`, the exposed dropdown or `PopupMenu`: no haptic                                        |
| ContextMenu      | `UIContextMenuInteraction` plays its own haptic when the menu opens from a long press         | The long-press haptic (`LONG_PRESS`) when the menu opens from a long press, as any Android long press plays |

So the haptic you choose doesn't double up with one the control already plays: the controls above play none for the action the prop covers. The context menus' open haptic belongs to the long press, not the action, and stays when `haptics` is set.

## Turning haptics off

`'none'` plays nothing, and on Android it also sets `isHapticFeedbackEnabled = false` on the component's view, which turns off the haptics the view plays itself. For ContextMenu that is the long-press haptic when the menu opens. iOS has no switch for the haptics UIKit's own controls play, so on iOS `'none'` behaves like unset: the context menu's open haptic stays.

```tsx
<ContextMenu actions={actions} haptics="none" onPressAction={handle}>
  {row}
</ContextMenu>
```

To turn haptics off everywhere, users switch off system haptics (iOS: Settings › Sounds & Haptics) or touch feedback (Android: Settings › Sound & vibration › Vibration & haptics); both platforms apply the setting to these haptics.
