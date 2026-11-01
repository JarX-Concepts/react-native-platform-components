// What the README visuals show: for every component, the moment of each
// platform's Detox recording to use, and the part of the screen to keep.
//
// Crops are fractions of the frame ({ x, y, w, h } from the top-left), so
// they hold across simulator and emulator resolutions. Times are seconds into
// the recording. The flows navigate from the Date Picker demo first, so most
// times sit after the first few seconds.
//
// Stills feed the hero grid and the social card; clips feed the showreel.

export const COMPONENTS = [
  {
    key: 'theme',
    name: 'Theme',
    test: 'Theme',
    native: { ios: 'useNativeTheme()', android: 'brand color and appearance, app-wide' },
    caption: 'Brand color and dark mode from JavaScript, applied to every component',
    // Teal, then orange, then dark
    clip: {
      duration: 9.5,
      ios: { start: 12.0, crop: { x: 0.03, y: 0.12, w: 0.94, h: 0.84 } },
      android: { start: 12.4, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.82 } },
    },
  },
  {
    key: 'datepicker',
    name: 'DatePicker',
    test: 'Date Picker',
    native: { ios: 'UIDatePicker', android: 'MaterialDatePicker' },
    still: {
      // The embedded pickers, inside their cards: the iOS calendar fitted
      // whole on the card's own color. Android's embedded date picker is the
      // spinner, so its tile shows the embedded time picker's clock instead.
      ios: { time: 10.5, crop: { x: 0.13, y: 0.553, w: 0.74, h: 0.392 }, bg: '#e3e7e9' },
      android: { time: 10.2, crop: { x: 0.04, y: 0.35, w: 0.92, h: 0.32 }, bg: '#9ea3a2' },
    },
    // The social card's tile is wider than tall: the clock fitted whole
    social: {
      android: { time: 10.2, crop: { x: 0.04, y: 0.35, w: 0.92, h: 0.32 }, bg: '#9ea3a2', fit: 'contain' },
    },
    clip: {
      ios: { start: 7.4, crop: { x: 0.03, y: 0.36, w: 0.94, h: 0.57 } },
      android: { start: 8.4, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.78 } },
    },
  },
  {
    key: 'textfield',
    name: 'TextField',
    test: 'Text Field',
    native: { ios: 'UITextField', android: 'TextInputLayout' },
    still: {
      ios: { time: 32.5, crop: { x: 0.03, y: 0.06, w: 0.94, h: 0.585 } },
      // Below the Name section (first, middle and last fields)
      android: { time: 19.0, crop: { x: 0.03, y: 0.445, w: 0.94, h: 0.47 } },
    },
    clip: {
      ios: { start: 24.5, crop: { x: 0.03, y: 0.045, w: 0.94, h: 0.9 } },
      android: { start: 15.5, crop: { x: 0.03, y: 0.43, w: 0.94, h: 0.5 } },
    },
  },
  {
    key: 'segmentedcontrol',
    name: 'SegmentedControl',
    test: 'Segmented Control',
    native: { ios: 'UISegmentedControl', android: 'MaterialButtonToggleGroup' },
    still: {
      ios: { time: 11.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.52 } },
      android: { time: 9.4, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.58 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
      android: { start: 7.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.43 } },
    },
  },
  {
    key: 'tabbar',
    name: 'TabBar',
    test: 'Tab Bar',
    native: { ios: 'UITabBar', android: 'BottomNavigationView' },
    // Stills: the bar and its selection rows, wide like the hero row. Clips
    // also take in the floating bar below: the iOS 26 Liquid Glass capsule,
    // the Material bar in a FloatingToolbar on Android.
    still: {
      ios: { time: 30.5, crop: { x: 0.03, y: 0.485, w: 0.94, h: 0.165 } },
      android: { time: 22.3, crop: { x: 0.03, y: 0.655, w: 0.94, h: 0.175 } },
    },
    // The social card's tile is squarer: the rows around the bar too
    social: {
      ios: { time: 30.5, crop: { x: 0.03, y: 0.41, w: 0.94, h: 0.32 } },
    },
    clip: {
      ios: { start: 5.0, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.36 } },
      android: { start: 8.2, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
    },
  },
  {
    key: 'navigationrail',
    name: 'NavigationRail',
    test: 'Navigation Rail',
    native: { ios: 'tab-style UIButtons', android: 'NavigationRailView' },
    // The rail beside the destination it shows. iOS has no rail: it falls
    // back to a column of tab-style buttons.
    still: {
      ios: { time: 4.2, crop: { x: 0.03, y: 0.165, w: 0.94, h: 0.45 } },
      android: { time: 7.0, crop: { x: 0, y: 0.19, w: 1, h: 0.49 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.15, w: 0.94, h: 0.5 } },
      android: { start: 7.0, crop: { x: 0.02, y: 0.19, w: 0.96, h: 0.51 } },
    },
  },
  {
    key: 'button',
    name: 'Button',
    test: 'Button',
    native: { ios: 'UIButton', android: 'MaterialButton' },
    still: {
      ios: { time: 48.0, crop: { x: 0.03, y: 0.1, w: 0.94, h: 0.6 } },
      android: { time: 36.1, crop: { x: 0.03, y: 0.3, w: 0.94, h: 0.56 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
      android: { start: 8.2, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.46 } },
    },
  },
  {
    key: 'chip',
    name: 'Chip',
    test: 'Chip',
    flow: 'Chip group selection',
    native: { ios: 'capsule UIButtons', android: 'Material Chip / ChipGroup' },
    // The single-select time frame, the scrolling row and the multi-select
    // filters with their input chips. The clip runs longer than the others
    // so it reaches the filters; the Android recording ends a little before
    // it does, and its last frame holds.
    still: {
      ios: { time: 12.3, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.5 } },
      android: { time: 12.5, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.5 } },
    },
    clip: {
      duration: 6.0,
      ios: { start: 5.3, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.5 } },
      android: { start: 7.6, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.5 } },
    },
  },
  {
    key: 'switch',
    name: 'Switch',
    test: 'Switch',
    native: { ios: 'UISwitch', android: 'MaterialSwitch' },
    // The settings rows (one line, wrapping, disabled), the standalone
    // switches and the custom colors. The clip turns Wi-Fi off and on again.
    still: {
      ios: { time: 11.2, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.47 } },
      android: { time: 11.2, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.45 } },
    },
    clip: {
      ios: { start: 4.5, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.3 } },
      android: { start: 7.6, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.3 } },
    },
  },
  {
    key: 'checkbox',
    name: 'Checkbox',
    test: 'Checkbox',
    native: { ios: 'circle SF Symbols in a list row', android: 'MaterialCheckBox' },
    // The agreement in its error state above the indeterminate parent. The
    // clip submits unchecked, checks the agreement, then checks every child
    // from the indeterminate parent.
    still: {
      ios: { time: 9.75, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.47 } },
      android: { time: 8.3, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.45 } },
    },
    clip: {
      duration: 5.0,
      ios: { start: 9.3, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.42 } },
      android: { start: 7.2, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.42 } },
    },
  },
  {
    key: 'radiogroup',
    name: 'RadioGroup',
    test: 'Radio Group',
    flow: 'Radio Group selection',
    native: { ios: 'list rows with a checkmark', android: 'MaterialRadioButton' },
    // The delivery options with Express chosen, fitted whole on the page's
    // color; the flow scrolls the group to the bottom of the screen. The clip
    // shows the validation message, then a choice.
    still: {
      ios: { time: 14.3, crop: { x: 0.03, y: 0.632, w: 0.94, h: 0.358 }, bg: '#ebf0f1' },
      android: { time: 10.8, crop: { x: 0.03, y: 0.645, w: 0.94, h: 0.32 }, bg: '#ebf0ef' },
    },
    clip: {
      ios: { start: 10.6, crop: { x: 0.03, y: 0.6, w: 0.94, h: 0.39 } },
      android: { start: 9.3, crop: { x: 0.03, y: 0.62, w: 0.94, h: 0.36 } },
    },
  },
  {
    key: 'floatingactionbutton',
    name: 'FloatingActionButton',
    test: 'Floating Action Button',
    native: { ios: 'round prominent UIButton', android: 'FloatingActionButton' },
    // The four sizes and the extended button; the clips shrink it to its
    // icon and extend it again
    still: {
      ios: { time: 10.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.455 } },
      android: { time: 10.2, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.455 } },
    },
    clip: {
      ios: { start: 10.9, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.485 } },
      android: { start: 10.2, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.5 } },
    },
  },
  {
    key: 'progressindicator',
    name: 'ProgressIndicator',
    test: 'Progress Indicator',
    native: { ios: 'UIProgressView', android: 'Material 3 progress indicators' },
    // The clips run the demo's simulated upload from 0 to 100%
    still: {
      ios: { time: 19.7, crop: { x: 0.03, y: 0.475, w: 0.94, h: 0.47 } },
      android: { time: 32.9, crop: { x: 0.03, y: 0.47, w: 0.94, h: 0.45 } },
    },
    clip: {
      duration: 4.5,
      ios: { start: 16.8, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.56 } },
      android: { start: 29.6, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.6 } },
    },
  },
  {
    key: 'contextmenu',
    name: 'ContextMenu',
    test: 'Context Menu',
    native: { ios: 'UIContextMenuInteraction', android: 'PopupMenu' },
    still: {
      // The submenu with its destructive row, cut to the hero's three-column
      // tiles, a little taller than wide
      ios: { time: 12.3, crop: { x: 0.28, y: 0.37, w: 0.7, h: 0.4 } },
      android: { time: 10.6, crop: { x: 0.3, y: 0.31, w: 0.66, h: 0.36 } },
    },
    // The social card's tile is wider than tall: the whole row too
    social: {
      ios: { time: 12.3, crop: { x: 0.03, y: 0.4, w: 0.94, h: 0.32 } },
    },
    clip: {
      ios: { start: 6.2, crop: { x: 0.03, y: 0.22, w: 0.97, h: 0.48 } },
      android: { start: 8.6, crop: { x: 0.03, y: 0.3, w: 0.94, h: 0.4 } },
    },
  },
  {
    key: 'actionsheet',
    name: 'ActionSheet',
    test: 'Action Sheet',
    native: { ios: 'UIAlertController', android: 'BottomSheetDialog' },
    // iOS 26 shows the anchored sheet as a popover pointing at its button;
    // Android, the Material modal bottom sheet with icons and the
    // destructive Remove File row. The clips pick a source, then reopen
    // the sheet with the file set and remove it.
    still: {
      ios: { time: 9.5, crop: { x: 0.05, y: 0.075, w: 0.9, h: 0.38 } },
      android: { time: 17.0, crop: { x: 0, y: 0.612, w: 1, h: 0.388 } },
    },
    clip: {
      ios: { start: 5.6, crop: { x: 0.03, y: 0.075, w: 0.94, h: 0.42 } },
      // The file row at the top, the sheet at the bottom
      android: { start: 7.3, crop: { x: 0, y: 0.12, w: 1, h: 0.88 } },
    },
  },
  {
    key: 'dialog',
    name: 'Dialog',
    test: 'Dialog',
    native: { ios: 'UIAlertController', android: 'MaterialAlertDialogBuilder' },
    // The delete confirmation over the dimmed page. The clips delete, and the
    // next dialog opens from onDismiss.
    still: {
      ios: { time: 7.0, crop: { x: 0.05, y: 0.31, w: 0.9, h: 0.42 } },
      android: { time: 8.4, crop: { x: 0.05, y: 0.3, w: 0.9, h: 0.44 } },
    },
    clip: {
      ios: { start: 5.6, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.5 } },
      android: { start: 7.8, crop: { x: 0.03, y: 0.17, w: 0.94, h: 0.5 } },
    },
  },
  {
    key: 'selectionmenu',
    name: 'SelectionMenu',
    test: 'Selection Menu',
    native: { ios: 'UIMenu', android: 'Material exposed dropdown' },
    still: {
      ios: { time: 20.7, crop: { x: 0.22, y: 0.26, w: 0.75, h: 0.36 } },
      android: { time: 10.2, crop: { x: 0.2, y: 0.47, w: 0.75, h: 0.32 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.24, w: 0.94, h: 0.48 } },
      android: { start: 7.2, crop: { x: 0.03, y: 0.3, w: 0.94, h: 0.66 } },
    },
  },
  {
    key: 'floatingtoolbar',
    name: 'FloatingToolbar',
    test: 'Floating Toolbar',
    native: { ios: 'UIGlassEffect capsule', android: 'FloatingToolbarLayout' },
    // iOS shows the view switcher: a segmented control sharing a floating
    // capsule with a button, the arrangement iOS 26 uses for a bottom bar.
    // Android shows the Expressive FloatingToolbarLayout instead, because the
    // segmented control inside the toolbar there renders as plain Material 3.
    // The demo's tint toggle turns the toolbar orange from 19.5s on iOS and
    // between 15-16s on Android, so the clips stay clear of those windows.
    still: {
      // Tight around the bars, fitted whole into the tiles on the screen's
      // own color, so the capsules keep their ends
      ios: { time: 9.0, crop: { x: 0.115, y: 0.8375, w: 0.8, h: 0.099 }, bg: '#f3f3f5' },
      android: { time: 7.5, crop: { x: 0.1, y: 0.468, w: 0.8, h: 0.105 }, bg: '#eff2f2' },
    },
    clip: {
      ios: { start: 9.0, crop: { x: 0.03, y: 0.42, w: 0.94, h: 0.55 } },
      android: { start: 10.3, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.66 } },
    },
  },
  {
    key: 'glassdisclosure',
    name: 'GlassDisclosure',
    test: 'Glass Disclosure',
    native: { ios: 'one morphing UIGlassEffect shape', android: 'Material 3 card' },
    caption: 'A Liquid Glass pill that opens into a panel of React content (a Material card on Android)',
    // The open panel over the dimmed chat. The clips tap the header buttons,
    // then open the pill: one glass shape morphs into the panel on iOS 26.
    still: {
      ios: { time: 21.0, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.5 } },
      android: { time: 10.5, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.45 } },
    },
    clip: {
      duration: 4.0,
      ios: { start: 10.5, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.45 } },
      android: { start: 8.2, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.45 } },
    },
  },
  {
    key: 'liquidglass',
    name: 'LiquidGlass',
    test: 'Liquid Glass',
    iosOnly: true,
    native: { ios: 'UIGlassEffect, iOS 26', android: 'fallback View' },
    // The clip turns the regular glass clear. The still is the glass card
    // alone, for the hero's shallow row.
    still: {
      ios: { time: 19.0, crop: { x: 0.03, y: 0.175, w: 0.94, h: 0.19 } },
    },
    clip: {
      ios: { start: 13.0, crop: { x: 0.03, y: 0.155, w: 0.94, h: 0.22 } },
    },
  },
];

/** The Theme demo in dark appearance, for the hero's dark-mode tiles. */
export const THEME_DARK = {
  ios: { time: 22.5, crop: { x: 0.03, y: 0.41, w: 0.94, h: 0.52 } },
  android: { time: 21.0, crop: { x: 0.03, y: 0.43, w: 0.94, h: 0.53 } },
};

/** The Theme demo in light appearance with the same brand color (Teal). */
export const THEME_LIGHT = {
  ios: { time: 8.5, crop: { x: 0.03, y: 0.41, w: 0.94, h: 0.52 } },
  android: { time: 14.1, crop: { x: 0.03, y: 0.43, w: 0.94, h: 0.53 } },
};

export const byKey = Object.fromEntries(COMPONENTS.map((c) => [c.key, c]));

/**
 * The Detox flow a component's visuals come from, as its title reads after
 * "should test": "<test> functionality" unless the component names another
 * `flow`.
 */
export const flowOf = (c) => c.flow ?? `${c.test} functionality`;
