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
    clip: {
      duration: 8,
      ios: { start: 12.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.79 } },
      android: { start: 14.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.85 } },
    },
  },
  {
    key: 'datepicker',
    name: 'DatePicker',
    test: 'Date Picker',
    native: { ios: 'UIDatePicker', android: 'MaterialDatePicker' },
    still: {
      ios: { time: 14.5, crop: { x: 0.03, y: 0.565, w: 0.94, h: 0.36 } },
      // The Material dialog, inset past its rounded corners so no scrim shows
      android: { time: 8.5, crop: { x: 0.075, y: 0.222, w: 0.85, h: 0.588 }, bg: '#ebe6ee' },
    },
    clip: {
      ios: { start: 7.6, crop: { x: 0.03, y: 0.36, w: 0.94, h: 0.54 } },
      android: { start: 6.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.78 } },
    },
  },
  {
    key: 'textfield',
    name: 'TextField',
    test: 'Text Field',
    native: { ios: 'UITextField', android: 'TextInputLayout' },
    still: {
      ios: { time: 26.5, crop: { x: 0.03, y: 0.06, w: 0.94, h: 0.72 } },
      android: { time: 25.0, crop: { x: 0.03, y: 0.23, w: 0.94, h: 0.6 } },
    },
    clip: {
      ios: { start: 15.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.82 } },
      android: { start: 12.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.62 } },
    },
  },
  {
    key: 'segmentedcontrol',
    name: 'SegmentedControl',
    test: 'Segmented Control',
    native: { ios: 'UISegmentedControl', android: 'MaterialButtonToggleGroup' },
    still: {
      ios: { time: 10.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.52 } },
      android: { time: 14.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.58 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
      android: { start: 8.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.43 } },
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
      ios: { time: 8.0, crop: { x: 0.03, y: 0.12, w: 0.94, h: 0.2 } },
      android: { time: 12.5, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.19 } },
    },
    clip: {
      ios: { start: 5.0, crop: { x: 0.03, y: 0.13, w: 0.94, h: 0.36 } },
      android: { start: 10.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
    },
  },
  {
    key: 'button',
    name: 'Button',
    test: 'Button',
    native: { ios: 'UIButton', android: 'MaterialButton' },
    still: {
      ios: { time: 12.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.58 } },
      android: { time: 10.5, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.76 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.4 } },
      android: { start: 10.0, crop: { x: 0.03, y: 0.14, w: 0.94, h: 0.46 } },
    },
  },
  {
    key: 'contextmenu',
    name: 'ContextMenu',
    test: 'Context Menu',
    native: { ios: 'UIContextMenuInteraction', android: 'PopupMenu' },
    still: {
      ios: { time: 34.5, crop: { x: 0.3, y: 0.3, w: 0.7, h: 0.34 } },
      android: { time: 8.5, crop: { x: 0.3, y: 0.3, w: 0.67, h: 0.34 } },
    },
    clip: {
      ios: { start: 4.5, crop: { x: 0.03, y: 0.25, w: 0.94, h: 0.43 } },
      android: { start: 6.0, crop: { x: 0.03, y: 0.28, w: 0.94, h: 0.34 } },
    },
  },
  {
    key: 'selectionmenu',
    name: 'SelectionMenu',
    test: 'Selection Menu',
    native: { ios: 'UIMenu', android: 'Material exposed dropdown' },
    still: {
      ios: { time: 6.5, crop: { x: 0.2, y: 0.26, w: 0.72, h: 0.46 } },
      android: { time: 14.9, crop: { x: 0.25, y: 0.33, w: 0.72, h: 0.64 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.24, w: 0.94, h: 0.48 } },
      android: { start: 11.0, crop: { x: 0.03, y: 0.24, w: 0.94, h: 0.68 } },
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
      android: { time: 11.5, crop: { x: 0.1, y: 0.46, w: 0.8, h: 0.096 } },
    },
    clip: {
      ios: { start: 4.0, crop: { x: 0.03, y: 0.42, w: 0.94, h: 0.55 } },
      android: { start: 9.5, crop: { x: 0.03, y: 0.42, w: 0.94, h: 0.55 } },
    },
  },
  {
    key: 'liquidglass',
    name: 'LiquidGlass',
    test: 'Liquid Glass',
    iosOnly: true,
    native: { ios: 'UIGlassEffect, iOS 26', android: 'fallback View' },
    still: {
      ios: { time: 19.0, crop: { x: 0.03, y: 0.155, w: 0.94, h: 0.22 } },
    },
    clip: {
      ios: { start: 8.5, crop: { x: 0.03, y: 0.155, w: 0.94, h: 0.22 } },
    },
  },
];

/** The Theme demo in dark appearance, for the hero's dark-mode tiles. */
export const THEME_DARK = {
  ios: { time: 20.5, crop: { x: 0.03, y: 0.41, w: 0.94, h: 0.52 } },
  android: { time: 22.5, crop: { x: 0.03, y: 0.43, w: 0.94, h: 0.56 } },
};

/** The Theme demo in light appearance with the same brand color (Teal). */
export const THEME_LIGHT = {
  ios: { time: 6.5, crop: { x: 0.03, y: 0.41, w: 0.94, h: 0.52 } },
  android: { time: 12.5, crop: { x: 0.03, y: 0.43, w: 0.94, h: 0.56 } },
};

export const byKey = Object.fromEntries(COMPONENTS.map((c) => [c.key, c]));
