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
    // Orange, then dark: Android takes longer to get there
    clip: {
      duration: 9.5,
      ios: { start: 12.0, crop: { x: 0.03, y: 0.12, w: 0.94, h: 0.84 } },
      android: { start: 26.6, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.82 } },
    },
  },
  {
    key: 'datepicker',
    name: 'DatePicker',
    test: 'Date Picker',
    native: { ios: 'UIDatePicker', android: 'MaterialDatePicker' },
    still: {
      // The embedded pickers, inside their cards: the tiles fit them whole on
      // the cards' own color
      ios: { time: 14.5, crop: { x: 0.05, y: 0.655, w: 0.9, h: 0.33 }, bg: '#fdfdfd' },
      android: { time: 46.5, crop: { x: 0.05, y: 0.585, w: 0.9, h: 0.375 }, bg: '#fdfdfd' },
    },
    clip: {
      ios: { start: 7.4, crop: { x: 0.03, y: 0.36, w: 0.94, h: 0.57 } },
      android: { start: 30.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.78 } },
    },
  },
  {
    key: 'textfield',
    name: 'TextField',
    test: 'Text Field',
    native: { ios: 'UITextField', android: 'TextInputLayout' },
    still: {
      ios: { time: 33.0, crop: { x: 0.03, y: 0.06, w: 0.94, h: 0.585 } },
      android: { time: 36.5, crop: { x: 0.03, y: 0.22, w: 0.94, h: 0.62 } },
    },
    clip: {
      ios: { start: 24.5, crop: { x: 0.03, y: 0.045, w: 0.94, h: 0.9 } },
      android: { start: 28.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.62 } },
    },
  },
  {
    key: 'segmentedcontrol',
    name: 'SegmentedControl',
    test: 'Segmented Control',
    native: { ios: 'UISegmentedControl', android: 'MaterialButtonToggleGroup' },
    still: {
      ios: { time: 10.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.52 } },
      android: { time: 32.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.58 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
      android: { start: 21.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.43 } },
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
      android: { time: 49.0, crop: { x: 0.03, y: 0.645, w: 0.94, h: 0.175 } },
    },
    clip: {
      ios: { start: 5.0, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.36 } },
      android: { start: 15.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
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
      android: { time: 13.5, crop: { x: 0.015, y: 0.25, w: 0.97, h: 0.475 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.15, w: 0.94, h: 0.5 } },
      android: { start: 13.5, crop: { x: 0.02, y: 0.245, w: 0.96, h: 0.5 } },
    },
  },
  {
    key: 'button',
    name: 'Button',
    test: 'Button',
    native: { ios: 'UIButton', android: 'MaterialButton' },
    still: {
      ios: { time: 35.5, crop: { x: 0.03, y: 0.297, w: 0.94, h: 0.6 } },
      android: { time: 240.0, crop: { x: 0.03, y: 0.23, w: 0.94, h: 0.56 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
      android: { start: 29.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.46 } },
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
      android: { time: 18.0, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.455 } },
    },
    clip: {
      ios: { start: 10.9, crop: { x: 0.03, y: 0.135, w: 0.94, h: 0.485 } },
      android: { start: 19.0, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.5 } },
    },
  },
  {
    key: 'contextmenu',
    name: 'ContextMenu',
    test: 'Context Menu',
    native: { ios: 'UIContextMenuInteraction', android: 'PopupMenu' },
    still: {
      ios: { time: 39.2, crop: { x: 0.16, y: 0.29, w: 0.84, h: 0.39 } },
      android: { time: 91.0, crop: { x: 0.27, y: 0.47, w: 0.65, h: 0.32 } },
    },
    clip: {
      ios: { start: 4.5, crop: { x: 0.03, y: 0.25, w: 0.94, h: 0.43 } },
      android: { start: 24.2, crop: { x: 0.03, y: 0.28, w: 0.94, h: 0.34 } },
    },
  },
  {
    key: 'selectionmenu',
    name: 'SelectionMenu',
    test: 'Selection Menu',
    native: { ios: 'UIMenu', android: 'Material exposed dropdown' },
    still: {
      ios: { time: 17.5, crop: { x: 0.25, y: 0.33, w: 0.72, h: 0.34 } },
      android: { time: 27.0, crop: { x: 0.2, y: 0.47, w: 0.75, h: 0.32 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.24, w: 0.94, h: 0.48 } },
      android: { start: 16.5, crop: { x: 0.03, y: 0.3, w: 0.94, h: 0.66 } },
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
    // The demo's tint toggle turns the toolbar orange between 13-15s on iOS
    // and 17-18s on Android, so the clips stay clear of those windows.
    still: {
      // Both crops are cut to the tile's own aspect, so the capsule keeps its
      // ends when the tile fills
      ios: { time: 6.5, crop: { x: 0.115, y: 0.8375, w: 0.8, h: 0.099 } },
      android: { time: 15.5, crop: { x: 0.1, y: 0.465, w: 0.8, h: 0.096 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.42, w: 0.94, h: 0.55 } },
      android: { start: 14.0, crop: { x: 0.03, y: 0.42, w: 0.94, h: 0.53 } },
    },
  },
  {
    key: 'liquidglass',
    name: 'LiquidGlass',
    test: 'Liquid Glass',
    iosOnly: true,
    native: { ios: 'UIGlassEffect, iOS 26', android: 'fallback View' },
    // The clip turns the regular glass clear
    still: {
      ios: { time: 19.0, crop: { x: 0.03, y: 0.155, w: 0.94, h: 0.235 } },
    },
    clip: {
      ios: { start: 13.0, crop: { x: 0.03, y: 0.155, w: 0.94, h: 0.22 } },
    },
  },
];

/** The Theme demo in dark appearance, for the hero's dark-mode tiles. */
export const THEME_DARK = {
  ios: { time: 22.5, crop: { x: 0.03, y: 0.41, w: 0.94, h: 0.52 } },
  android: { time: 39.0, crop: { x: 0.03, y: 0.43, w: 0.94, h: 0.53 } },
};

/** The Theme demo in light appearance with the same brand color (Teal). */
export const THEME_LIGHT = {
  ios: { time: 8.5, crop: { x: 0.03, y: 0.41, w: 0.94, h: 0.52 } },
  android: { time: 21.0, crop: { x: 0.03, y: 0.43, w: 0.94, h: 0.53 } },
};

export const byKey = Object.fromEntries(COMPONENTS.map((c) => [c.key, c]));
