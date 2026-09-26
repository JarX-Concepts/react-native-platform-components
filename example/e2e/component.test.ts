import { execSync } from 'child_process';
import { expect } from 'detox';

const isAndroid = () => device.getPlatform() === 'android';

const pause = async (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Scroll the demo screen until an element is visible
const scrollToId = async (
  testID: string,
  direction: 'down' | 'up' = 'down'
) => {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .whileElement(by.id('demo-scroll'))
    .scroll(200, direction);
};

// The Tab Bar demo's section titles, top to bottom. Its feeds are
// ScrollViews of their own and its bars take drags, so a scroll of the page
// that starts on one of those moves that instead: on iOS only the feed, on
// Android the feed first (hiding its bar) and the page with what's left. A
// drag that starts on a title moves only the page.
const TAB_BAR_SECTIONS = [
  'TAB BAR',
  'FLOATING',
  'MINIMIZE ON SCROLL',
  'ACCESSORY',
  'CONTROLS',
];

const isVisible = async (matcher: Detox.NativeMatcher, pct?: number) => {
  try {
    await expect(element(matcher)).toBeVisible(pct);
    return true;
  } catch {
    return false;
  }
};

// iOS: moves the Tab Bar demo by about `amount` of the screen, swiping on a
// section title: the lowest one on screen to go down, the highest to go up.
const swipeTabBarDemo = async (direction: 'down' | 'up', amount = 0.3) => {
  const titles =
    direction === 'down' ? [...TAB_BAR_SECTIONS].reverse() : TAB_BAR_SECTIONS;
  for (const title of titles) {
    if (await isVisible(by.text(title))) {
      await element(by.text(title)).swipe(
        direction === 'down' ? 'up' : 'down',
        'slow',
        amount
      );
      // Let the page come to rest: a tap on a decelerating page only stops it
      await pause(1000);
      return;
    }
  }
  await element(by.id('demo-scroll')).scroll(200, direction);
};

const swipeTabBarDemoTo = async (
  testID: string,
  direction: 'down' | 'up' = 'down'
) => {
  if (isAndroid()) {
    await androidTabBarDemoTo([testID]);
    return;
  }
  for (let step = 0; step < 12; step++) {
    if (await isVisible(by.id(testID))) return;
    await swipeTabBarDemo(direction);
  }
  await expect(element(by.id(testID))).toBeVisible();
};

// Screen frame of an element: in pixels on Android
const frameOf = async (matcher: Detox.NativeMatcher) =>
  ((await element(matcher).getAttributes()) as Detox.AndroidElementAttributes)
    .frame;

// Android: moves the Tab Bar demo until the elements with `ids` lie inside
// the page, clear of its top and bottom tenth (the status bar and the gesture
// area). Where the page drags start decides the state the demo's feeds end up
// in (see TAB_BAR_SECTIONS), so each drag starts on a section title, measured
// afresh, and moves the page by the distance still needed with Detox's
// fling-free scroll. The feeds then only move when the flow scrolls them.
const androidTabBarDemoTo = async (ids: string[]) => {
  const page = await frameOf(by.id('demo-scroll'));
  const top = page.y + page.height * 0.1;
  const bottom = page.y + page.height * 0.9;
  // Detox scrolls by dp; the demo's feeds are 360dp tall
  const density = (await frameOf(by.id('tab-feed'))).height / 360;
  let last: number | undefined;
  for (let step = 0; step < 8; step++) {
    let regionTop = Infinity;
    let regionBottom = -Infinity;
    for (const id of ids) {
      const frame = await frameOf(by.id(id));
      regionTop = Math.min(regionTop, frame.y);
      regionBottom = Math.max(regionBottom, frame.y + frame.height);
    }
    // At the page's end the region stops moving
    if (regionTop === last) break;
    last = regionTop;
    // Up the screen (Detox scrolls 'down') or down it, a little past the
    // margin so rounding doesn't leave it a pixel short
    const needed =
      regionBottom > bottom
        ? regionBottom - bottom + 8 * density
        : regionTop < top
          ? regionTop - top - 8 * density
          : 0;
    if (needed === 0) return;
    const down = needed > 0;
    // The title with the most room for the drag between the margins: the
    // lowest one inside them to move the page up, the highest to move it down
    const titles = down ? [...TAB_BAR_SECTIONS].reverse() : TAB_BAR_SECTIONS;
    let anchor: number | undefined;
    for (const title of titles) {
      const frame = await frameOf(by.text(title));
      const middle = frame.y + frame.height / 2;
      if (middle > top && middle < bottom) {
        anchor = middle;
        break;
      }
    }
    if (anchor === undefined) break;
    const room = down ? anchor - top : bottom - anchor;
    await element(by.id('demo-scroll')).scroll(
      Math.max(1, Math.round(Math.min(Math.abs(needed), room) / density)),
      down ? 'down' : 'up',
      0.5,
      (anchor - page.y) / page.height
    );
    await pause(200);
  }
  for (const id of ids) {
    await expect(element(by.id(id))).toBeVisible();
  }
};

// Android: shows a feed of the Tab Bar demo (with `ids` around it) at its
// first row, where its bar shows. The page moves never touch the feeds, so
// this is a check more than a step. A feed found scrolled goes back up:
// Detox's scroll does nothing once the feed is at its top, and only the scroll
// that reaches the top hands what's left of it on to the page, which then
// moves back into place.
const androidTabBarFeedAtTop = async (
  feedId: string,
  firstRow: string,
  ids: string[]
) => {
  for (let round = 0; round < 6; round++) {
    await androidTabBarDemoTo(ids);
    if (await isVisible(by.text(firstRow), 100)) return;
    for (let step = 0; step < 4; step++) {
      await element(by.id(feedId)).scroll(300, 'up', NaN, 0.5);
    }
  }
  await expect(element(by.text(firstRow))).toBeVisible(100);
};

// Tap a segment by its spoken label, which works for text and icon segments.
const tapSegment = async (label: string) => {
  if (isAndroid()) {
    // MaterialButton content description
    await element(by.label(label)).atIndex(0).tap();
  } else {
    // A UISegment forwards hit-tests to its UISegmentedControl, which Detox
    // rejects as "not hittable"; its inner label / image view passes.
    await element(by.type('UIView').withAncestor(by.label(label)))
      .atIndex(0)
      .tap();
  }
};

// Pick a demo from the header menu (a headless SelectionMenu)
export const selectDemo = async (label: string) => {
  if (isAndroid()) {
    // Scroll to top first so the header is visible (iOS tests start at the top,
    // and scrolling an already-top ScrollView there stalls the app)
    await element(
      by.type('com.facebook.react.views.scroll.ReactScrollView')
    ).scrollTo('top');
    await pause(200);
  }
  await element(by.id('demo-picker')).tap();
  await pause(500);
  // The iOS menu scrolls once it outgrows the screen; bring the item up
  if (!isAndroid()) {
    try {
      await waitFor(element(by.text(label)).atIndex(0))
        .toBeVisible()
        .withTimeout(1000);
    } catch {
      await element(by.text('Tab Bar')).atIndex(0).swipe('up', 'slow', 0.5);
      await pause(500);
    }
  }
  await element(by.text(label)).atIndex(0).tap();
  // Let the demo mount and settle; the README GIFs are trimmed to start here
  await pause(1000);
};

export const selectMenuOption = async (menuId: string, optionLabel: string) => {
  if (isAndroid()) {
    // Android: tap the selected-item TextView inside the Spinner to open the dropdown
    const spinnerText = element(
      by.type('android.widget.TextView').withAncestor(by.id(menuId))
    );
    await spinnerText.tap();
    // The selected label remains in the activity behind the popup. Scope the
    // choice to the dropdown so picking the current option cannot reopen it.
    const option = element(
      by
        .text(optionLabel)
        .withAncestor(by.type('android.widget.DropDownListView'))
    );
    await waitFor(option).toBeVisible().withTimeout(5000);
    await option.tap();
    await waitFor(option).not.toExist().withTimeout(5000);
  } else {
    // iOS: Tap the menu to open it (UIButton pull-down menu)
    await element(by.id(menuId)).tap();
    await pause(500);
    // Menu options are presented inside a system context menu overlay.
    // Scope the search to _UIContextMenuContainerView so we don't accidentally
    // hit the button's own title label or tab labels behind the overlay.
    await element(
      by.text(optionLabel).withAncestor(by.type('_UIContextMenuContainerView'))
    )
      .atIndex(0)
      .tap();
  }
};

// The platform text input inside a TextField host view
// A TextField's testID is on its inner input (UITextField / UITextView,
// EditText), so the id alone finds the view to type into
const inputOf = (fieldId: string) => element(by.id(fieldId));

// Espresso's key injection doesn't reach the Material field on the emulator,
// so Android sets the text directly: still a native edit, reported to JS
// like typing, but without focusing the field or opening the keyboard.
// Focus and blur are exercised through the demo's buttons there.
const typeInto = async (fieldId: string, text: string) => {
  const input = inputOf(fieldId);
  if (isAndroid()) {
    await input.replaceText(text);
  } else {
    await input.tap();
    await pause(300);
    await input.typeText(text);
  }
  await pause(300);
};

// Leaves a field. iOS presses the return key, which submits and blurs a
// single-line field. On Android the keyboard is only up after the demo's
// Focus button, and the Blur button (the ref's blur) closes it; leaving
// another field first moves the focus to the Name field by tapping it.
const pressReturn = async (fieldId: string) => {
  if (isAndroid()) {
    if (fieldId !== 'field-name') {
      await scrollToId('field-name', 'up');
      await inputOf('field-name').tap();
      await pause(800);
    }
    // The keyboard resizes the window and the list scrolls to the focused
    // field; let that finish before the button is located and tapped
    await pause(800);
    await scrollToId('field-blur');
    await pause(400);
    await element(by.id('field-blur')).tap();
    await pause(700);
  } else {
    await inputOf(fieldId).tapReturnKey();
    await pause(700);
  }
};

// Text assertions after an action poll, so a slow CI emulator gets its time
const expectText = async (testID: string, text: string) => {
  await waitFor(element(by.id(testID)))
    .toHaveText(text)
    .withTimeout(8000);
};

// A view's width (points on iOS, pixels on Android)
const widthOf = async (testID: string): Promise<number> => {
  const attributes = (await element(by.id(testID)).getAttributes()) as {
    width?: number;
    frame?: { width: number };
  };
  return attributes.frame?.width ?? attributes.width ?? 0;
};

// Polls a view's width until it passes the check
const waitForWidth = async (
  testID: string,
  check: (width: number) => boolean,
  timeout = 8000
) => {
  const start = Date.now();
  let width = await widthOf(testID);
  while (!check(width)) {
    if (Date.now() - start > timeout) {
      throw new Error(`${testID}: width ${width} never passed the check`);
    }
    await pause(250);
    width = await widthOf(testID);
  }
};

// Dismisses an open iOS menu with a tap away from it, in the page's empty left
// margin. An in-app tap: device.tap() starts an XCUITest runner, which takes
// tens of seconds on CI. iOS 26 passes the dismissing tap on to the view
// underneath (the page's scroll view there); before iOS 26 the menu's
// full-screen container takes it.
const tapOutsideMenu = async () => {
  try {
    await element(by.id('demo-scroll')).tap({ x: 8, y: 600 });
  } catch {
    await element(by.type('_UIContextMenuContainerView'))
      .atIndex(0)
      .tap({ x: 8, y: 600 });
  }
};

// An item of an open menu. On iOS it is looked up inside the menu, clear of
// a (hidden) button with the same title, such as one folded into an overflow
// menu.
const menuItem = (label: string) =>
  isAndroid()
    ? element(by.text(label))
    : element(
        by.text(label).withAncestor(by.type('_UIContextMenuContainerView'))
      );

// Long-presses a context menu target until the menu shows `item`. On a slow
// CI simulator the first long press can land while the page is still
// settling (just after switching demos) and open nothing; one longer press
// is retried before failing.
const openMenuByLongPress = async (targetID: string, item: string) => {
  for (let attempt = 1; ; attempt++) {
    const target = element(by.id(targetID));
    if (attempt === 1) {
      await target.longPress();
    } else {
      await target.longPress(1500);
    }
    try {
      await waitFor(element(by.text(item)))
        .toBeVisible()
        .withTimeout(6000);
      return;
    } catch (error) {
      if (attempt >= 2) throw error;
    }
  }
};

// Swipes the picker wheel at `wheelX` (a fraction of the picker's width)
// until the value it reports changes from `unset`. A
// single short swipe on a slow CI simulator sometimes settles back on the same
// row; three swipes that change nothing still fail.
const swipeWheelUntilSet = async (
  valueID: string,
  wheelX: number,
  unset = '(none)'
) => {
  for (let attempt = 1; ; attempt++) {
    await element(by.id('date-picker')).swipe('up', 'slow', 0.15, wheelX, 0.5);
    try {
      await waitFor(element(by.id(valueID)))
        .not.toHaveText(unset)
        .withTimeout(5000);
      return;
    } catch (error) {
      if (attempt >= 3) throw error;
    }
  }
};

// The demo's ActionField carries its testID on the pressable around the text
const expectFieldText = async (testID: string, text: string) => {
  await waitFor(element(by.text(text).withAncestor(by.id(testID))))
    .toBeVisible()
    .withTimeout(8000);
};

export const ensureModalMode = async (enabled: boolean) => {
  const toggle = element(by.id('modal-switch'));
  const button = element(by.id('picker-toggle-button'));

  // The switch's own value says which mode the demo is in. The Open/Close
  // button it mounts can be there but covered (by a popover or menu that is
  // still going away), which a visibility check reads as "not modal".
  const isOn = async () => {
    try {
      await expect(toggle).toHaveToggleValue(true);
      return true;
    } catch {
      return false;
    }
  };

  if ((await isOn()) === enabled) return;
  await toggle.tap();
  // A tap that lands while the screen is still settling can be dropped;
  // the switch shows it, so tap once more
  if ((await isOn()) !== enabled) {
    await pause(500);
    if ((await isOn()) !== enabled) await toggle.tap();
  }
  // React re-renders before the button appears or goes, so poll for it rather
  // than asserting straight after the tap
  if (enabled) {
    await waitFor(button).toBeVisible().withTimeout(10000);
  } else {
    await waitFor(button).not.toExist().withTimeout(10000);
  }
};

const adbPath = () =>
  process.env.ANDROID_HOME
    ? `${process.env.ANDROID_HOME}/platform-tools/adb`
    : 'adb';

// A fixed clock, full battery and signal, no notification icons: the status
// bars of recordings made for the README (E2E_CLEAN_STATUS_BAR=1, set by
// scripts/generate-readme-gifs.sh) then match across flows and platforms.
const cleanStatusBar = async () => {
  if (isAndroid()) {
    const adb = adbPath();
    for (const command of [
      'settings put global sysui_demo_allowed 1',
      'am broadcast -a com.android.systemui.demo -e command enter',
      'am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941',
      'am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false',
      'am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4',
      'am broadcast -a com.android.systemui.demo -e command network -e mobile show -e datatype none -e level 4',
      'am broadcast -a com.android.systemui.demo -e command notifications -e visible false',
    ]) {
      execSync(`"${adb}" -s ${device.id} shell ${command}`);
    }
  } else {
    await device.setStatusBar({
      time: '9:41',
      dataNetwork: 'wifi',
      wifiMode: 'active',
      wifiBars: '3',
      cellularMode: 'active',
      cellularBars: '4',
      batteryState: 'charged',
      batteryLevel: '100',
    });
  }
};

describe('Platform Components Example', () => {
  const itOnIOS = isAndroid() ? it.skip : it;

  beforeAll(async () => {
    if (isAndroid()) {
      // Text is entered with replaceText (see typeInto), so the soft keyboard
      // has no part in the flows; keep it down so it never covers the demo's
      // buttons below a focused field, as it does on the CI emulator
      execSync(
        `"${adbPath()}" -s ${device.id} shell settings put secure show_ime_with_hard_keyboard 0`
      );
      // The searchable SelectionMenu takes typing; on a fresh emulator the
      // keyboard's first appearance otherwise opens Gboard's "Try out your
      // stylus" sheet over the app
      execSync(
        `"${adbPath()}" -s ${device.id} shell settings put secure stylus_handwriting_enabled 0`
      );
    }
    if (process.env.E2E_CLEAN_STATUS_BAR) {
      await cleanStatusBar();
    }
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Wait for app to fully load - look for a common element
    await waitFor(element(by.text('BASICS')))
      .toBeVisible()
      .withTimeout(5000);
  });

  // The first flow runs on a simulator that is still cold, and CI's iOS
  // runner has taken 96 to 133 s for it, while its steps take about 27 s
  // locally (CI's log shows the app busy with layout and animations), so it
  // gets more than the 120 s default
  it('should test Date Picker functionality', async () => {
    // The demo titles the Android dialogs' negative button. On iOS the
    // picker presents in a popover, and the Cancel item of its own confirm
    // toolbar is the only control above the overlay. A tap aimed at the demo
    // behind it never lands: the app stops answering Detox, which waits on
    // that one tap until the test times out.
    const cancelControl = () =>
      isAndroid()
        ? element(by.text('Custom Cancel')).atIndex(0)
        : element(by.label('Cancel')).atIndex(0);

    // Opens the modal and waits for it, rather than for a fixed time
    const openModal = async () => {
      await element(by.id('picker-toggle-button')).tap();
      await waitFor(cancelControl()).toBeVisible().withTimeout(10000);
    };

    const dismissModal = async () => {
      await cancelControl().tap();
      // The Open/Close button is hittable again only once the picker has gone
      await waitFor(element(by.id('picker-toggle-button')))
        .toBeVisible()
        .withTimeout(10000);
    };

    // The app opens on the Date Picker demo (beforeEach waits for it)

    // Enable DatePicker Tap
    await ensureModalMode(true);
    await expect(element(by.id('picker-toggle-field'))).toBeVisible();

    // Set mode to "Date"
    await selectMenuOption('mode-menu', 'Date');

    // Each platform has its own menu here. Asking for the other one's and
    // catching the failure costs a full matcher timeout on every run.
    if (isAndroid()) {
      await selectMenuOption('android-material-menu', 'M3');
      // The Material pickers open on their text fields
      await selectMenuOption('android-input-mode-menu', 'Text');
    } else {
      await selectMenuOption('ios-style-menu', 'Inline');
    }

    // Open the modal
    await openModal();

    if (isAndroid()) {
      await expect(
        element(
          by.type('com.google.android.material.textfield.TextInputEditText')
        ).atIndex(0)
      ).toBeVisible();
    }

    // Dismiss it
    await dismissModal();

    // Disable the modal mode
    await ensureModalMode(false);

    if (!isAndroid()) {
      await selectMenuOption('ios-style-menu', 'Wheels');
    }

    // Set mode to "Time"
    await selectMenuOption('mode-menu', 'Time');

    // Enable the modal mode
    await ensureModalMode(true);

    if (isAndroid()) {
      // A 24-hour clock: the keyboard entry has no AM/PM toggle
      await selectMenuOption('hour-format-menu', '24-hour');
    }

    // Open the modal
    await openModal();

    if (isAndroid()) {
      await expect(element(by.text('AM'))).not.toBeVisible();
    }

    // Dismiss it
    await dismissModal();

    if (isAndroid()) {
      // The Material range picker opens on its suggested range; saving it
      // reports both days
      await scrollToId('range-open-button');
      await element(by.id('range-open-button')).tap();
      await waitFor(element(by.text('Custom OK')))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.text('Custom OK')).atIndex(0).tap();
      await waitFor(element(by.id('range-value')))
        .not.toHaveText('—')
        .withTimeout(8000);
    }
  }, 180000);

  // UIDatePicker's wheels-only modes (iOS), in a flow of their own to keep
  // the first flow short
  itOnIOS('should test Date Picker wheels', async () => {
    // The app opens on the Date Picker demo, embedded with the inline style
    // (beforeEach waits for it). Countdown from there (UIKit only has
    // countdown wheels), reporting the duration
    await selectMenuOption('mode-menu', 'Countdown');
    await pause(800);
    await scrollToId('date-picker');

    // A swiped wheel can leave a run loop block pending that Detox keeps
    // waiting on after the app has gone idle (the flow then stalled until
    // it timed out), so the wheel steps run unsynchronized and their checks
    // poll
    await device.disableSynchronization();
    try {
      await swipeWheelUntilSet('countdown-duration', 0.7);

      // Month and year wheels (iOS 17.4+), reporting the month picked
      await element(by.id('mode-menu')).tap();
      const yearAndMonth = element(
        by
          .text('Year & Month')
          .withAncestor(by.type('_UIContextMenuContainerView'))
      ).atIndex(0);
      await waitFor(yearAndMonth).toBeVisible().withTimeout(5000);
      await yearAndMonth.tap();
      await waitFor(element(by.id('year-month-value')))
        .toBeVisible()
        .withTimeout(5000);
      await pause(800);
      await swipeWheelUntilSet('year-month-value', 0.3);
      // The pending block belongs to the touch-tracking run loop mode; a
      // drag on the list runs that mode again and lets it go
      await element(by.id('demo-scroll'))
        .scroll(40, 'down', NaN, 0.15)
        .catch(() => element(by.id('demo-scroll')).scroll(40, 'up', NaN, 0.15));
      await pause(500);
    } finally {
      await device.enableSynchronization();
    }
  });

  it('should test Selection Menu functionality', async () => {
    // Navigate to SelectionMenu tab
    await selectDemo('Selection Menu');

    // Verify we're on the SelectionMenu screen
    await expect(element(by.id('state-field-headless'))).toBeVisible();

    // Test opening the headless menu
    await element(by.id('state-field-headless')).tap();

    // Wait for the menu to appear and select California
    await waitFor(element(by.text('California')))
      .toBeVisible()
      .withTimeout(6000);
    await element(by.text('California')).atIndex(0).tap();

    // Verify selection was made (field should show "California"; the menu's
    // own row may still be fading out)
    await expectFieldText('state-field-headless', 'California');

    // Test clearing the selection
    await element(by.id('clear-state-button')).tap();

    // Verify selection was cleared
    await expect(element(by.text('None'))).toBeVisible();

    if (!isAndroid()) {
      // The headless menu is a system menu: a tap outside dismisses it and
      // onRequestClose sets the demo's state back to closed
      await element(by.id('menu-toggle-button')).tap();
      await waitFor(element(by.text('Alabama')))
        .toBeVisible()
        .withTimeout(6000);
      await tapOutsideMenu();
      await expectFieldText('menu-toggle-field', 'closed');
    }

    // Options with icons and subtitles
    await scrollToId('notify-field');
    await element(by.id('notify-field')).tap();
    await waitFor(element(by.text('Email')))
      .toBeVisible()
      .withTimeout(6000);
    await element(by.text('Email')).atIndex(0).tap();
    await expectFieldText('notify-field', 'Email');
    await element(by.id('demo-scroll')).scrollTo('top');

    // Test embedded mode
    await element(by.id('embedded-switch')).tap();

    // In embedded mode, the embedded menu should exist (scroll to top first on Android)
    if (isAndroid()) {
      await element(
        by.type('com.facebook.react.views.scroll.ReactScrollView')
      ).scrollTo('top');
    }
    // iOS doesn't need explicit scroll - the element should be visible
    await waitFor(element(by.id('state-menu-embedded')))
      .toExist()
      .withTimeout(6000);

    // Select a state in embedded mode - tap the menu to open it
    if (isAndroid()) {
      // Android: tap the selected-item TextView inside the menu
      const embeddedMenuText = element(
        by
          .type('android.widget.TextView')
          .withAncestor(by.id('state-menu-embedded'))
      );
      await embeddedMenuText.tap();
    } else {
      // iOS: simple tap on the menu
      await element(by.id('state-menu-embedded')).tap();
    }

    // Wait for the menu to appear and select Arizona (near top of list)
    await waitFor(element(by.text('Arizona')))
      .toBeVisible()
      .withTimeout(6000);
    await element(by.text('Arizona')).atIndex(0).tap();

    // Verify selection (use toExist since the menu might be partially visible)
    await expect(element(by.id('state-menu-embedded'))).toExist();

    // Test disabled state
    await element(by.id('disabled-switch')).tap();

    // The menu should be disabled now
    // (Can't easily verify disabled state in Detox, but we can ensure it doesn't crash)

    // Re-enable
    await element(by.id('disabled-switch')).tap();

    // Toggle back to modal mode
    await element(by.id('embedded-switch')).tap();

    // Test that the headless menu still works
    await expect(element(by.id('state-field-headless'))).toBeVisible();
    await element(by.id('state-field-headless')).tap();

    // Wait for the menu to appear and select a visible state (Arkansas)
    await waitFor(element(by.text('Arkansas')))
      .toBeVisible()
      .withTimeout(6000);
    await element(by.text('Arkansas')).atIndex(0).tap();

    // Verify the selection
    await expectFieldText('state-field-headless', 'Arkansas');

    if (isAndroid()) {
      // The M3 exposed dropdown, searchable: typing filters the options
      await selectMenuOption('android-material-menu', 'M3');
      await element(by.id('embedded-switch')).tap();
      await element(by.id('searchable-switch')).tap();
      const field = element(
        by
          .type('android.widget.EditText')
          .withAncestor(by.id('state-menu-embedded'))
      ).atIndex(0);
      await waitFor(field).toBeVisible().withTimeout(6000);
      await field.tap();
      // The keyboard comes up and the window resizes; let the list settle
      await pause(1000);
      await field.replaceText('new y');
      // The filtered list is re-laid out above the keyboard; Espresso doesn't
      // wait for that window
      await pause(1500);
      // The dropdown is a window without focus, which Espresso can't search,
      // so the one row left ("New York") is tapped through adb: it sits right
      // under the field, about half a field height down.
      const { frame } = (await field.getAttributes()) as {
        frame: { x: number; y: number; width: number; height: number };
      };
      const x = Math.round(frame.x + frame.width / 2);
      const y = Math.round(frame.y + frame.height * 1.55);
      execSync(`"${adbPath()}" -s ${device.id} shell input tap ${x} ${y}`);
      // The pick leaves the field and the keyboard goes down
      await pause(1500);
      await waitFor(field).toHaveText('New York').withTimeout(6000);

      // Text that matches nothing goes back to the selection on leaving
      await field.tap();
      await field.replaceText('zzz');
      await field.tapReturnKey();
      await pause(1500);
      await waitFor(field).toHaveText('New York').withTimeout(6000);
    }
  });

  it('should test Context Menu functionality', async () => {
    // Navigate to ContextMenu tab
    await selectDemo('Context Menu');

    // Verify we're on the ContextMenu screen
    await expect(element(by.text('Long-press me'))).toBeVisible();

    // Long-press the basic menu and check its actions
    await openMenuByLongPress('context-menu-basic', 'Copy');
    await expect(element(by.text('Paste'))).toBeVisible();
    await expect(element(by.text('Share'))).toBeVisible();

    if (isAndroid()) {
      // Select an action
      await element(by.text('Copy')).atIndex(0).tap();

      // Verify the action was recorded
      await waitFor(element(by.text('Copy (copy)')))
        .toBeVisible()
        .withTimeout(6000);
    } else {
      // Tapping the preview (on by default) fires onPreviewPress
      await element(
        by.label('Preview').withAncestor(by.type('_UIContextMenuContainerView'))
      )
        .atIndex(0)
        .tap();
      await expectFieldText('last-action-field', 'Preview pressed');
    }

    // Test context menu with submenu
    await openMenuByLongPress('context-menu-submenu', 'Edit');

    // On iOS, tap Edit to see submenu; on Android submenus work differently
    if (!isAndroid()) {
      await element(by.text('Edit')).tap();
      await waitFor(element(by.text('Cut')))
        .toBeVisible()
        .withTimeout(6000);
      await element(by.text('Cut')).tap();
    } else {
      // On Android, just select the Share action instead
      await element(by.text('Share')).atIndex(0).tap();
    }
    await pause(500);

    // Test destructive actions
    await openMenuByLongPress('context-menu-destructive', 'Delete Forever');

    // Dismiss the menu by tapping outside or selecting an action
    await element(by.text('Archive')).atIndex(0).tap();

    // Verify the action was recorded
    await waitFor(element(by.text('Archive (archive)')))
      .toBeVisible()
      .withTimeout(6000);

    // Test tap mode
    await element(by.id('context-menu-tap')).tap();

    // Wait for menu to appear
    await waitFor(element(by.text('Copy')))
      .toBeVisible()
      .withTimeout(6000);

    // Select an action
    await element(by.text('Paste')).atIndex(0).tap();

    // Verify the action was recorded
    await waitFor(element(by.text('Paste (paste)')))
      .toBeVisible()
      .withTimeout(6000);

    // Test Android-only programmatic mode
    if (isAndroid()) {
      await element(by.id('programmatic-toggle-button')).tap();

      // Wait for menu to appear
      await waitFor(element(by.text('Copy')))
        .toBeVisible()
        .withTimeout(6000);

      // Select an action
      await element(by.text('Share')).atIndex(0).tap();

      // Verify the action was recorded
      await waitFor(element(by.text('Share (share)')))
        .toBeVisible()
        .withTimeout(6000);
    }

    // Test disabled state
    await element(by.id('disabled-switch')).tap();
    await pause(300);

    // Long-press should not open menu when disabled
    // (We can't easily verify the menu doesn't open, but we ensure no crash)
    await element(by.id('context-menu-basic')).longPress();
    await pause(500);

    // Re-enable
    await element(by.id('disabled-switch')).tap();

    // Test iOS preview toggle (iOS only)
    if (!isAndroid()) {
      await element(by.id('preview-switch')).tap();

      // Long-press with preview enabled
      await openMenuByLongPress('context-menu-basic', 'Copy');

      // Dismiss
      await element(by.text('Share')).atIndex(0).tap();
    }

    // Inline sections, an image-asset icon (Remind Me) and a submenu inside a
    // section
    await scrollToId('context-menu-sections');
    await openMenuByLongPress('context-menu-sections', 'Remind Me');
    await element(by.text('Send To')).atIndex(0).tap();
    await waitFor(element(by.text('Mail')))
      .toBeVisible()
      .withTimeout(6000);
    await element(by.text('Mail')).atIndex(0).tap();
    await expectFieldText('last-action-field', 'Mail (send-mail)');

    // A stepper that keeps the menu open on iOS; Android closes it per press
    await scrollToId('context-menu-stepper');
    await element(by.id('context-menu-stepper')).tap();
    await waitFor(element(by.text('Increase')))
      .toBeVisible()
      .withTimeout(6000);
    await element(by.text('Increase')).atIndex(0).tap();
    await expectText('stepper-value', 'Qty 2');
    if (!isAndroid()) {
      // Still open, and the section header shows the new value
      await expect(element(by.text('Quantity: 2'))).toBeVisible();
      await tapOutsideMenu();
      await waitFor(element(by.text('Increase')))
        .not.toBeVisible()
        .withTimeout(6000);
    }
  });

  it('should test Segmented Control functionality', async () => {
    // Navigate to SegmentedControl tab
    await selectDemo('Segmented Control');

    // Verify we're on the SegmentedControl demo
    await expect(element(by.id('segment-basic'))).toBeVisible();

    // Cycle through the basic segments
    // Cycle 1: Day -> Week -> Month -> Year
    await element(by.text('Week')).atIndex(0).tap();
    await pause(350);

    await element(by.text('Month')).atIndex(0).tap();
    await pause(350);

    await element(by.text('Year')).atIndex(0).tap();
    await pause(350);

    // Cycle 2: Year -> Day -> Month -> Week
    await element(by.text('Day')).atIndex(0).tap();
    await pause(350);

    await element(by.text('Month')).atIndex(0).tap();
    await pause(350);

    await element(by.text('Week')).atIndex(0).tap();
    await pause(350);

    // A segment's own testID
    await element(by.id('segment-month')).tap();
    await expectText('segment-basic-value', 'month');
    await element(by.id('segment-week')).tap();
    await expectText('segment-basic-value', 'week');

    // Icons: the same segments render SF Symbols, drawables, and a shared PNG
    await scrollToId('segment-icons');
    await tapSegment('Grid');
    await pause(400);
    await expect(element(by.id('segment-icons-value'))).toHaveText('grid');

    await tapSegment('Alerts');
    await pause(400);
    await expect(element(by.id('segment-icons-value'))).toHaveText('alerts');

    // Label visibility: labels only, icons only, then platform default
    await element(by.text('Labeled')).atIndex(0).tap();
    await pause(600);

    await tapSegment('List');
    await pause(400);
    await expect(element(by.id('segment-icons-value'))).toHaveText('list');

    await element(by.text('Icon only')).atIndex(0).tap();
    await pause(600);

    await tapSegment('Grid');
    await pause(400);
    await expect(element(by.id('segment-icons-value'))).toHaveText('grid');

    await element(by.text('Auto')).atIndex(0).tap();
    await pause(600);

    // Badges: bump the unread count, switch mailboxes, then clear it
    await scrollToId('segment-badges');
    await element(by.id('badge-increment')).tap();
    await pause(400);
    await element(by.id('badge-increment')).tap();
    await pause(400);

    await element(by.text('Sent')).atIndex(0).tap();
    await pause(400);

    await element(by.text('Drafts')).atIndex(0).tap();
    await pause(400);

    await element(by.id('badge-clear')).tap();
    await pause(500);

    await element(by.text('Inbox')).atIndex(0).tap();
    await pause(400);

    // Styling: custom colors and font, then back to the platform defaults
    await scrollToId('segment-styled');
    await element(by.text('High')).atIndex(0).tap();
    await pause(400);

    await element(by.text('Low')).atIndex(0).tap();
    await pause(400);

    await element(by.id('styled-switch')).tap();
    await pause(500);

    await element(by.text('Medium')).atIndex(0).tap();
    await pause(400);

    await element(by.id('styled-switch')).tap();
    await pause(500);

    // Test disabled state - toggle on and off
    await scrollToId('disabled-switch');
    await element(by.id('disabled-switch')).tap();
    await pause(600);

    await element(by.id('disabled-switch')).tap();
    await pause(400);

    if (isAndroid()) {
      // Allow clearing the selection, then tap the selected segment to clear it
      await scrollToId('selection-required-switch');
      await element(by.id('selection-required-switch')).tap();
      await pause(400);

      await scrollToId('segment-basic');
      await element(by.text('Week')).atIndex(0).tap();
      await pause(400);
      await expect(element(by.id('segment-basic-value'))).toHaveText('(none)');

      await element(by.text('Day')).atIndex(0).tap();
      await pause(400);
      await expect(element(by.id('segment-basic-value'))).toHaveText('day');

      // Restore the default (selection required) and confirm a tap no longer clears
      await scrollToId('selection-required-switch');
      await element(by.id('selection-required-switch')).tap();
      await pause(400);

      await scrollToId('segment-basic');
      await element(by.text('Day')).atIndex(0).tap();
      await pause(400);
      await expect(element(by.id('segment-basic-value'))).toHaveText('day');

      // Classic Material 3 segmented buttons, then back to Expressive
      await scrollToId('expressive-switch');
      await element(by.id('expressive-switch')).tap();
      await pause(400);
      await scrollToId('segment-basic', 'up');
      await element(by.text('Month')).atIndex(0).tap();
      await pause(900);
      await scrollToId('expressive-switch');
      await element(by.id('expressive-switch')).tap();
      await pause(400);
      await scrollToId('segment-basic', 'up');
      await element(by.text('Week')).atIndex(0).tap();
      await pause(600);
    } else {
      // Final cycle: Week -> Year -> Day
      await scrollToId('segment-basic');
      await element(by.text('Year')).atIndex(0).tap();
      await pause(300);

      await element(by.text('Day')).atIndex(0).tap();
      await pause(300);
    }
  });

  it('should test Tab Bar functionality', async () => {
    await selectDemo('Tab Bar');
    await expect(element(by.id('tab-bar'))).toBeVisible();
    await pause(600);

    // Tabs by their testID; the Inbox badge clears once it is opened. Search
    // is the search tab (iOS 26: its own circle at the end of the bar)
    await element(by.id('tab-search')).tap();
    await expectText('tab-bar-value', 'search');
    await pause(500);
    await element(by.id('tab-inbox')).tap();
    await expectText('tab-bar-value', 'inbox');
    await pause(500);

    // Pressing the selected tab again is a reselect
    await element(by.id('tab-inbox')).tap();
    await expectText('tab-bar-last-event', 'reselect: inbox');
    await pause(400);
    await element(by.id('tab-profile')).tap();
    await expectText('tab-bar-value', 'profile');
    await pause(500);

    // The floating bar shares the selection
    await element(by.id('tab-home-floating')).tap();
    await expectText('tab-bar-value', 'home');
    await pause(600);

    // Minimize on scroll: scrolling the feed down minimizes the bar over it
    // (iOS 26: the system minimized bar; Android: the bar slides away), and
    // scrolling back up restores it
    if (isAndroid()) {
      // The feed from its top: the scroll down hides the bar, and the scroll
      // back up stops short of the top, so none of it moves the page
      await androidTabBarFeedAtTop('tab-feed', 'Post 1', ['tab-feed']);
      await element(by.id('tab-feed')).scroll(300, 'down', NaN, 0.5);
      // Slid away. (iOS 26 keeps the expanded buttons in its hierarchy while
      // minimized, and iOS before 26 has no minimized bar.)
      await waitFor(element(by.id('tab-search-minimize')))
        .not.toBeVisible()
        .withTimeout(5000);
      await element(by.id('tab-feed')).scroll(150, 'up', NaN, 0.5);
      await waitFor(element(by.id('tab-search-minimize')))
        .toBeVisible()
        .withTimeout(5000);
    } else {
      await scrollToId('tab-feed');
      await swipeTabBarDemo('down', 0.15);
      await pause(400);
      await element(by.id('tab-feed')).scroll(300, 'down', NaN, 0.5);
      await pause(1200);
      await element(by.id('tab-feed')).swipe('down', 'slow', 0.4, 0.5, 0.3);
      await pause(1200);
    }
    await element(by.id('tab-search-minimize')).tap();
    await expectText('tab-bar-value', 'search');
    await pause(600);

    // Accessory: a mini player on a bar with a system item and the search
    // tab. iOS 26 hosts it as the bar's bottom accessory, which moves inline
    // beside the minimized bar; elsewhere it's a row above the bar
    if (isAndroid()) {
      // The whole section, the feed at its top with the bar and player showing
      await androidTabBarFeedAtTop('tab-player-feed', 'Track 1', [
        'tab-player-feed',
        'tab-accessory-env',
      ]);
    } else {
      await swipeTabBarDemoTo('tab-accessory-env');
      // The page may still be springing back from its end, where a tap only
      // stops it
      await pause(1500);
    }
    await waitFor(element(by.id('tab-accessory-play')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('tab-accessory-play')).tap();
    await expectText('tab-accessory-state', 'playing, track 1');
    await pause(400);
    await element(by.id('tab-player-favorites')).tap();
    await expectText('tab-player-value', 'favorites');
    await pause(400);
    await element(by.id('tab-player-search')).tap();
    await expectText('tab-player-value', 'search');
    await pause(400);
    // Hosted (iOS 26), the content sits in the bar's own accessory view
    let hosted = false;
    if (!isAndroid()) {
      try {
        await expect(
          element(by.id('tab-accessory').withAncestor(by.id('tab-bar-player')))
        ).toExist();
        hosted = true;
      } catch {}
    }
    await element(by.id('tab-player-feed')).scroll(300, 'down', NaN, 0.5);
    await pause(1200);
    if (hosted) {
      // Inline beside the minimized bar, and still a player
      await expectText('tab-accessory-env', 'inline');
      await element(by.id('tab-accessory-play')).tap();
      await expectText('tab-accessory-state', 'paused, track 1');
    } else if (isAndroid()) {
      // Slid away with the bar. The feed scrolled from its top, so the
      // scroll down always hides them; the slide takes a moment.
      await waitFor(element(by.id('tab-accessory')))
        .not.toBeVisible()
        .withTimeout(5000);
      await expect(element(by.id('tab-player-listen'))).not.toBeVisible();
    }
    // Back up: expanded, the accessory regular again (short of the feed's
    // top, so Android doesn't hand the rest on to the page)
    if (isAndroid()) {
      await element(by.id('tab-player-feed')).scroll(150, 'up', NaN, 0.5);
    } else {
      await element(by.id('tab-player-feed')).swipe(
        'down',
        'slow',
        0.25,
        0.5,
        0.3
      );
    }
    await pause(1200);
    await expectText('tab-accessory-env', 'regular');
    await waitFor(element(by.id('tab-accessory-next')))
      .toBeVisible()
      .withTimeout(4000);
    await element(by.id('tab-accessory-next')).tap();
    await expectText(
      'tab-accessory-state',
      `${hosted ? 'paused' : 'playing'}, track 2`
    );
    await pause(600);

    // Label visibility, badges and custom colors
    await swipeTabBarDemoTo('tab-labels-labeled');
    await element(by.id('tab-labels-labeled')).tap();
    await pause(700);
    await element(by.id('tab-labels-unlabeled')).tap();
    await pause(700);
    await element(by.id('tab-labels-auto')).tap();
    await pause(500);
    await swipeTabBarDemoTo('tab-unread-switch');
    await element(by.id('tab-unread-switch')).tap();
    await pause(600);
    await swipeTabBarDemoTo('tab-dot-switch');
    await element(by.id('tab-dot-switch')).tap();
    await pause(600);
    await swipeTabBarDemoTo('tab-styled-switch');
    await element(by.id('tab-styled-switch')).tap();
    await pause(900);
    if (isAndroid()) {
      // The Material active indicator: off and on, a circle, and icons
      // beside their labels
      await swipeTabBarDemoTo('tab-indicator-switch');
      await element(by.id('tab-indicator-switch')).tap();
      await pause(600);
      await element(by.id('tab-indicator-switch')).tap();
      await pause(400);
      await swipeTabBarDemoTo('tab-indicator-shape-circle');
      await element(by.id('tab-indicator-shape-circle')).tap();
      await pause(600);
      await swipeTabBarDemoTo('tab-item-layout-horizontal');
      await element(by.id('tab-item-layout-horizontal')).tap();
      await pause(900);
    }
    await swipeTabBarDemoTo('tab-bar', 'up');
    await element(by.id('tab-search')).tap();
    await expectText('tab-bar-value', 'search');
    await pause(900);
    // Five bars, a mini player and the Android controls: a long flow (80 s
    // on CI's Android emulator, 100 s on its iOS simulator)
  }, 180000);

  it('should test Navigation Rail functionality', async () => {
    await selectDemo('Navigation Rail');
    await expect(element(by.id('rail'))).toBeVisible();

    // The rail's width, in points on iOS and pixels on Android
    const railWidth = async () => {
      const attributes = (await element(by.id('rail')).getAttributes()) as {
        width?: number;
        frame?: { width: number };
      };
      return attributes.frame?.width ?? attributes.width ?? 0;
    };
    const tapRailItem = async (testID: string) => {
      await waitFor(element(by.id(testID)))
        .toBeVisible()
        .whileElement(by.id('demo-scroll'))
        .scroll(200, 'up');
      await element(by.id(testID)).tap();
    };

    // Destinations by testID; the selected one again is a reselect, and
    // opening the Inbox clears its badge
    await tapRailItem('rail-search');
    await expectText('rail-value', 'search');
    await element(by.id('rail-search')).tap();
    await expectText('rail-last-event', 'reselect: search');
    await element(by.id('rail-inbox')).tap();
    await expectText('rail-value', 'inbox');
    await pause(500);

    // The header (a Button) sits in the rail and takes its own presses
    await element(by.id('rail-header-button')).tap();
    await expectText('rail-last-event', 'header: compose');

    // Menu gravity moves the destinations; they stay where the taps land
    for (const gravity of ['center', 'bottom', 'top']) {
      await scrollToId(`rail-gravity-${gravity}`);
      await element(by.id(`rail-gravity-${gravity}`)).tap();
      await pause(600);
      await tapRailItem('rail-profile');
      await expectText('rail-value', 'profile');
      await tapRailItem('rail-home');
      await expectText('rail-value', 'home');
    }

    // Expanded: the rail widens, and narrows again collapsed
    const collapsedWidth = await railWidth();
    await scrollToId('rail-expanded-switch');
    await element(by.id('rail-expanded-switch')).tap();
    await pause(1200);
    const expandedWidth = await railWidth();
    if (expandedWidth <= collapsedWidth * 1.5) {
      throw new Error(
        `rail: expanded width ${expandedWidth} vs collapsed ${collapsedWidth}`
      );
    }
    await tapRailItem('rail-photos');
    await expectText('rail-value', 'photos');
    await scrollToId('rail-expanded-switch');
    await element(by.id('rail-expanded-switch')).tap();
    await pause(1200);
    if ((await railWidth()) !== collapsedWidth) {
      throw new Error('rail: the collapsed width did not come back');
    }

    // Label modes, the header off and on, badges and custom colors
    await scrollToId('rail-labels-selected');
    await element(by.id('rail-labels-selected')).tap();
    await pause(600);
    await element(by.id('rail-labels-unlabeled')).tap();
    await pause(600);
    await element(by.id('rail-labels-auto')).tap();
    await pause(400);
    await scrollToId('rail-header-switch');
    await element(by.id('rail-header-switch')).tap();
    await pause(600);
    await element(by.id('rail-header-switch')).tap();
    await pause(600);
    await scrollToId('rail-unread-switch');
    await element(by.id('rail-unread-switch')).tap();
    await pause(500);
    await scrollToId('rail-styled-switch');
    await element(by.id('rail-styled-switch')).tap();
    await pause(900);
    await tapRailItem('rail-search');
    await expectText('rail-value', 'search');
    // tapRailItem scrolls up only until the header counts as visible, which
    // can leave it under the Android status bar, where the tap lands on the
    // system bar instead; scroll the page to the top
    await element(by.id('demo-scroll')).scrollTo('top');
    await element(by.id('rail-header-button')).tap();
    await expectText('rail-last-event', 'header: compose');
  });

  it('should test Button functionality', async () => {
    await selectDemo('Button');
    await expect(element(by.id('button-filled'))).toBeVisible();

    // Every variant is a native button; pressing reports back to JS
    for (const variant of ['filled', 'tonal', 'outlined', 'text', 'elevated']) {
      await element(by.id(`button-${variant}`)).tap();
      await pause(350);
      await expect(element(by.id('button-last-pressed'))).toHaveText(variant);
    }

    // Icon + label, and an icon-only button announced by its label
    await scrollToId('button-icon-label');
    await element(by.id('button-icon-label')).tap();
    await pause(350);
    await expect(element(by.id('button-last-pressed'))).toHaveText('edit');

    await element(by.id('icon-button-tonal')).tap();
    await pause(350);
    await expect(element(by.id('button-last-pressed'))).toHaveText(
      'share (tonal)'
    );

    // Button groups: actions, single selection, multiple selection
    await scrollToId('button-group-actions');
    await element(by.text('Copy')).atIndex(0).tap();
    await pause(350);
    await expect(element(by.id('button-last-pressed'))).toHaveText('copy');

    await element(by.text('Month')).atIndex(0).tap();
    await pause(500);
    await expect(element(by.id('button-group-value'))).toHaveText(
      'month · bold'
    );

    // The multi-select group sits below the fold on a phone. Its labels are
    // looked up inside it: the Toggle section has buttons with the same ones.
    const formatButton = (label: string) =>
      element(by.text(label).withAncestor(by.id('button-group-multiple')));
    await scrollToId('button-group-multiple');
    await formatButton('Italic').tap();
    await pause(500);
    await expect(element(by.id('button-group-value'))).toHaveText(
      'month · bold, italic'
    );

    await formatButton('Bold').tap();
    await pause(500);
    await expect(element(by.id('button-group-value'))).toHaveText(
      'month · italic'
    );

    // Toggle buttons report the state a press asks for; the locked one's
    // parent never takes it, so it stays off
    await scrollToId('button-toggle-value');
    await element(by.id('button-toggle')).tap();
    await expectText('button-toggle-value', 'favorite, bold · locked 0');
    await element(by.id('button-toggle-filled')).tap();
    await expectText('button-toggle-value', 'favorite · locked 0');
    await element(by.id('button-toggle-icon')).tap();
    await expectText('button-toggle-value', 'favorite, alerts · locked 0');
    await element(by.id('button-toggle-locked')).tap();
    await expectText('button-toggle-value', 'favorite, alerts · locked 1');

    // A button with a menu opens it instead of pressing
    await scrollToId('button-menu-value');
    await element(by.id('button-menu')).tap();
    await waitFor(element(by.text('Date')))
      .toBeVisible()
      .withTimeout(6000);
    if (!isAndroid()) {
      // On Android the popup window has the focus, and Espresso can't read
      // the page under it while it is open
      await expectText('button-menu-value', '(none) · open');
    }
    await element(by.text('Date')).atIndex(0).tap();
    await expectText('button-menu-value', 'date · closed');

    // Icons above and below the label, and clear glass
    await scrollToId('button-icon-bottom');
    await element(by.id('button-icon-bottom')).tap();
    await expectText('button-last-pressed', 'edit (bottom)');
    await scrollToId('button-clear-glass');
    await element(by.id('button-clear-glass')).tap();
    await expectText('button-last-pressed', 'clear glass');

    if (!isAndroid()) {
      // A symbol effect with a trigger plays on every press
      await scrollToId('button-bounce-count');
      await element(by.id('button-symbol-bounce')).tap();
      await expectText('button-bounce-count', '1');
    }

    // Split button: the main button presses, the menu button opens its menu
    // On iOS, Detox's default start point can land on the Save menu arrow
    // below the Symbol Effects section. Start in the card's left padding so
    // the page gesture does not compete with a native menu gesture.
    await waitFor(element(by.id('split-value')))
      .toBeVisible()
      .whileElement(by.id('demo-scroll'))
      .scroll(200, 'down', isAndroid() ? NaN : 0.05);
    await element(by.text('Reply')).atIndex(0).tap();
    await expectText('split-value', 'reply');
    await element(by.label('Reply options')).atIndex(0).tap();
    await waitFor(menuItem('Forward')).toBeVisible().withTimeout(6000);
    await menuItem('Forward').tap();
    await expectText('split-value', 'forward');

    // Buttons that don't fit fold into an overflow menu; a pick is a press
    await scrollToId('overflow-value');
    await element(
      by
        .label(isAndroid() ? 'Overflow menu' : 'More')
        .withAncestor(by.id('button-group-overflow'))
    )
      .atIndex(0)
      .tap();
    await waitFor(menuItem('Code')).toBeVisible().withTimeout(6000);
    await menuItem('Code').tap();
    await expectText('overflow-value', 'code');
    await scrollToId('size-picker', 'up');

    // Sizes and shapes: cycle the size picker, then square corners. Larger
    // buttons push the picker down, so bring it back before every tap.
    for (const size of ['M', 'L', 'XL', 'XS', 'S']) {
      await scrollToId('size-picker');
      await element(by.text(size)).atIndex(0).tap();
      await pause(700);
    }
    await scrollToId('square-switch');
    await element(by.id('square-switch')).tap();
    await pause(900);
    await element(by.id('square-switch')).tap();
    await pause(600);

    // Disabled buttons don't report presses
    await scrollToId('disabled-switch');
    await element(by.id('disabled-switch')).tap();
    await pause(600);
    await scrollToId('button-filled', 'up');
    await element(by.id('button-filled')).tap();
    await pause(350);
    await expect(element(by.id('button-last-pressed'))).toHaveText(
      'clear glass'
    );
    // Toggles, menus, split buttons and overflow: about 50-80 s on CI's
    // iOS simulator, over 120 s on a slow runner
  }, 180000);

  it('should test Floating Action Button functionality', async () => {
    await selectDemo('Floating Action Button');
    await expect(element(by.id('fab-regular'))).toBeVisible();

    // Every size is a native button that reports presses
    for (const size of ['small', 'regular', 'medium', 'large']) {
      await element(by.id(`fab-${size}`)).tap();
      await expectText('fab-last-pressed', size);
      await pause(300);
    }

    // The extended button shrinks to its icon and extends again; the view
    // follows the button's width
    await scrollToId('fab-extended-switch');
    const extendedWidth = await widthOf('fab-extended');
    await element(by.id('fab-extended-switch')).tap();
    await waitForWidth('fab-extended', (w) => w < extendedWidth * 0.7);
    await element(by.id('fab-extended')).tap();
    await expectText('fab-last-pressed', 'compose');
    await element(by.id('fab-extended-switch')).tap();
    await waitForWidth('fab-extended', (w) => w >= extendedWidth - 1);

    // Custom colors, then disabled buttons don't report presses
    await element(by.id('fab-styled-switch')).tap();
    await pause(700);
    await element(by.id('fab-regular')).tap();
    await expectText('fab-last-pressed', 'regular');
    await scrollToId('fab-disabled-switch');
    await element(by.id('fab-disabled-switch')).tap();
    await pause(500);
    await element(by.id('fab-extended')).tap();
    await pause(500);
    await expect(element(by.id('fab-last-pressed'))).toHaveText('regular');
    await element(by.id('fab-disabled-switch')).tap();
    await element(by.id('fab-styled-switch')).tap();
    await pause(500);

    // Scrolling the feed down shrinks the linked button (the same Compose
    // button as above), scrolling back up extends it
    if (isAndroid()) {
      await scrollToId('fab-feed');
      await element(by.id('demo-scroll')).scroll(200, 'down');
    } else {
      // Drag the page from the top of the screen: the feed fills the middle
      // and would take the swipe
      await element(by.id('demo-scroll')).scrollTo('bottom', 0.5, 0.15);
    }
    await pause(400);
    await element(by.id('fab-feed')).scroll(300, 'down', NaN, 0.5);
    await waitForWidth('fab-scroll', (w) => w < extendedWidth * 0.7);
    await element(by.id('fab-feed')).swipe('down', 'slow', 0.4, 0.5, 0.3);
    await waitForWidth('fab-scroll', (w) => w >= extendedWidth - 1);
    await element(by.id('fab-scroll')).tap();
    await expectText('fab-last-pressed', 'scroll');
    await pause(600);
  });

  it('should test Floating Toolbar functionality', async () => {
    await selectDemo('Floating Toolbar');
    await expect(element(by.id('toolbar'))).toBeVisible();

    // Toolbar actions are native buttons inside the native container
    await element(by.id('toolbar-share')).tap();
    await pause(400);
    await expect(element(by.id('toolbar-last-action'))).toHaveText('share');

    await element(by.id('toolbar-delete')).tap();
    await pause(400);
    await expect(element(by.id('toolbar-last-action'))).toHaveText('delete');

    await element(by.id('toolbar-send')).tap();
    await pause(400);
    await expect(element(by.id('toolbar-last-action'))).toHaveText('send');

    // Vertical orientation, tint, and (Android) the vibrant variant
    await element(by.id('vertical-switch')).tap();
    await pause(1000);
    await element(by.id('toolbar-edit')).tap();
    await pause(400);
    await expect(element(by.id('toolbar-last-action'))).toHaveText('edit');
    await element(by.id('vertical-switch')).tap();
    await pause(800);

    await element(by.id('tinted-switch')).tap();
    await pause(1000);
    await element(by.id('tinted-switch')).tap();
    await pause(600);

    if (isAndroid()) {
      await element(by.text('Vibrant')).atIndex(0).tap();
      await pause(1000);
      await element(by.text('Standard')).atIndex(0).tap();
      await pause(600);
    }

    // A SegmentedControl inside a toolbar: the view switcher
    await scrollToId('view-toolbar');
    await tapSegment('Months');
    await pause(600);
    await expect(element(by.id('toolbar-last-view'))).toHaveText('months');
    await tapSegment('Years');
    await pause(600);
    await expect(element(by.id('toolbar-last-view'))).toHaveText('years');
    await tapSegment('All');
    await pause(600);

    // A toolbar linked to a ScrollView. Scroll the page from its upper part:
    // a swipe starting on the nested ScrollView would scroll that instead
    await waitFor(
      element(
        by.id(isAndroid() ? 'hide-on-scroll-switch' : 'edge-effect-picker')
      )
    )
      .toBeVisible()
      .whileElement(by.id('demo-scroll'))
      .scroll(200, 'down', 0.5, 0.2);
    if (!isAndroid()) {
      // iOS 26 scroll edge effects under the toolbar, and interactive glass
      for (const effect of ['Soft', 'Hard', 'Hidden', 'Automatic']) {
        await tapSegment(effect);
        await pause(500);
      }
      await element(by.id('interactive-glass-switch')).tap();
      await pause(400);
    }

    // Hide on scroll: away while the content scrolls down, back as it
    // scrolls up, and usable again
    await element(by.id('hide-on-scroll-switch')).tap();
    await pause(400);
    await element(by.id('toolbar-feed')).scroll(250, 'down', 0.5, 0.4);
    await waitFor(element(by.id('feed-toolbar-share')))
      .not.toBeVisible()
      .withTimeout(3000);
    await element(by.id('toolbar-feed')).scroll(100, 'up', 0.5, 0.4);
    await waitFor(element(by.id('feed-toolbar-share')))
      .toBeVisible()
      .withTimeout(3000);
    await element(by.id('feed-toolbar-edit')).tap();
    await expectText('feed-last-action', 'edit');
  });

  itOnIOS('should test Liquid Glass functionality', async () => {
    // Navigate to LiquidGlass tab
    await selectDemo('Liquid Glass');

    // Take initial screenshot of the glass effect
    await device.takeScreenshot('liquid-glass-initial');

    // Verify we're on the LiquidGlass demo
    await expect(element(by.id('liquid-glass-demo'))).toBeVisible();
    await pause(500);

    // Test iOS-only interactions
    if (!isAndroid()) {
      // Long press the main glass card to show interactive effect
      await element(by.id('liquid-glass-demo')).longPress(800);
      await pause(300);

      // Long press the small glass card
      await element(by.id('liquid-glass-demo-2')).longPress(600);
      await pause(300);

      // Long press main glass card again
      await element(by.id('liquid-glass-demo')).longPress(800);
      await pause(300);
      // Change effect to "Clear"
      try {
        await selectMenuOption('effect-menu', 'Clear');
        await pause(500);
        await device.takeScreenshot('liquid-glass-clear-effect');
      } catch {
        // Menu might not be accessible
      }

      // Long press glass cards with clear effect
      await element(by.id('liquid-glass-demo')).longPress(800);
      await pause(300);
      await element(by.id('liquid-glass-demo-2')).longPress(600);
      await pause(300);

      // Change color scheme to "Dark"
      try {
        await selectMenuOption('color-scheme-menu', 'Dark');
        await pause(500);
        await device.takeScreenshot('liquid-glass-dark-mode');
      } catch {
        // Menu might not be accessible
      }

      // Long press glass cards in dark mode
      await element(by.id('liquid-glass-demo')).longPress(800);
      await pause(300);

      // Change tint color to "Blue"
      try {
        await selectMenuOption('tint-color-menu', 'Blue');
        await pause(500);
        await device.takeScreenshot('liquid-glass-blue-tint');
      } catch {
        // Menu might not be accessible
      }

      // Long press glass cards with blue tint
      await element(by.id('liquid-glass-demo')).longPress(800);
      await pause(300);
      await element(by.id('liquid-glass-demo-2')).longPress(600);
      await pause(300);

      // Change effect back to "Regular"
      try {
        await selectMenuOption('effect-menu', 'Regular');
        await pause(500);
      } catch {
        // Menu might not be accessible
      }

      // Final long presses on glass cards
      await element(by.id('liquid-glass-demo')).longPress(800);
      await pause(300);
      await element(by.id('liquid-glass-demo-2')).longPress(600);
      await pause(300);

      // LiquidGlassContainer: a button materializes out of the group, the
      // first one widens, and both morph back
      await scrollToId('glass-expand-switch');
      await element(by.id('glass-extra-switch')).tap();
      await waitFor(element(by.id('glass-extra')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('glass-expand-switch')).tap();
      await waitFor(element(by.text('♥ Favorite')))
        .toBeVisible()
        .withTimeout(3000);
      await pause(600);
      await element(by.id('glass-extra-switch')).tap();
      await waitFor(element(by.id('glass-extra')))
        .not.toExist()
        .withTimeout(3000);
      await element(by.id('glass-expand-switch')).tap();
      await pause(600);

      // The system spacing keeps them apart; then the demo's 24 again
      await selectMenuOption('spacing-menu', 'Default');
      await pause(800);
      await selectMenuOption('spacing-menu', '24');
      await pause(600);

      // Concentric and capsule corners
      await scrollToId('corner-capsule');
      await expect(element(by.id('corner-concentric'))).toBeVisible();
    }

    // Take final screenshot
    await device.takeScreenshot('liquid-glass-final');
  });

  it('should test Text Field functionality', async () => {
    await selectDemo('Text Field');
    await expect(element(by.id('field-name'))).toBeVisible();

    // Typing is a native edit reported through onChangeText. On iOS the
    // keyboard covers the buttons below, so a field is left through its
    // return key, which submits and blurs it.
    await typeInto('field-name', 'Ada');
    await expectText('field-name-value', 'Ada');
    if (!isAndroid()) {
      await expectText('field-last-event', 'focus: name');
      await pressReturn('field-name');
      await expectText('field-last-event', 'blur: name');
    }

    // A controlled value from JS reaches the native field
    await scrollToId('field-set');
    await element(by.id('field-set')).tap();
    await expectText('field-name-value', 'Grace Hopper');
    await expect(inputOf('field-name')).toHaveText('Grace Hopper');

    // Ref methods: focus, blur, then clear
    await scrollToId('field-focus');
    await element(by.id('field-focus')).tap();
    await pause(1200);
    await expectText('field-last-event', 'focus: name');
    await pressReturn('field-name');
    await expectText('field-last-event', 'blur: name');
    await scrollToId('field-clear');
    await element(by.id('field-clear')).tap();
    await expectText('field-name-value', '(empty)');

    // Validation: the error appears once the email field is left
    await scrollToId('field-email', 'up');
    if (isAndroid()) {
      // Focus it so that leaving it is a blur
      await inputOf('field-email').tap();
      await pause(800);
    }
    await typeInto('field-email', 'not-an-email');
    await pressReturn('field-email');
    await waitFor(element(by.text('Enter a valid email address')))
      .toBeVisible()
      .withTimeout(8000);

    // A password with its toggle. On iOS the keyboard's prediction bar would
    // cover the toggle where the field sits; bring the field up first.
    if (!isAndroid()) {
      await element(by.id('demo-scroll')).scroll(250, 'down');
      await pause(400);
    }
    await scrollToId('field-password');
    await typeInto('field-password', 'hunter2');
    await element(by.label('Show password')).atIndex(0).tap();
    await pause(900);
    if (!isAndroid()) {
      await pressReturn('field-password');
    }

    // Affixes, and a multi-line field that grows with its counter
    await scrollToId('field-amount');
    await typeInto('field-amount', '42.50');
    if (!isAndroid()) {
      await pressReturn('field-amount');
    }
    await scrollToId('field-notes');
    await typeInto('field-notes', 'First line\nSecond line');
    await pause(700);

    // Leaving the multi-line field on iOS: a drag on the scroll view, which
    // dismisses the keyboard (and blurs the field) as it does for a
    // TextInput; the swipe starts near the top, above the keyboard.
    if (!isAndroid()) {
      await element(by.id('demo-scroll')).scroll(120, 'down', NaN, 0.15);
      await pause(700);
    }

    await scrollToId('editable-switch');

    if (isAndroid()) {
      // Material variants
      await scrollToId('filled-switch');
      await element(by.id('filled-switch')).tap();
      await pause(900);
      await scrollToId('dense-switch');
      await element(by.id('dense-switch')).tap();
      await pause(900);
      await scrollToId('filled-switch');
      await element(by.id('filled-switch')).tap();
      await pause(600);
      await scrollToId('dense-switch');
      await element(by.id('dense-switch')).tap();
      await pause(600);
      // The platform EditText, then back to Material
      await scrollToId('material-switch');
      await element(by.id('material-switch')).tap();
      await pause(900);
      await element(by.id('material-switch')).tap();
      await pause(600);
    }

    await scrollToId('editable-switch');

    // A read-only field with onPress acts as a button, and its trailing
    // icon has its own testID
    await scrollToId('field-due');
    await element(by.id('field-due')).tap();
    await expectText('field-last-event', 'press: due');
    await expect(element(by.id('field-due'))).toHaveText('Tomorrow');
    await element(by.id('field-due-icon')).tap();
    await expectText('field-last-event', 'icon: due');

    // A non-editable field ignores taps
    await element(by.id('editable-switch')).tap();
    await pause(700);
    await scrollToId('field-name', 'up');
    await inputOf('field-name').tap();
    await pause(500);
    // No focus event: the last one is still the icon press above
    await expectText('field-last-event', 'icon: due');
  });

  // The Keyboard section: its own flow, since the Text Field flow is already
  // long on CI's slower emulator and simulator
  it('should test Text Field keyboard features', async () => {
    await selectDemo('Text Field');
    await expect(element(by.id('field-name'))).toBeVisible();

    // A drag from near the top of the list, which also puts the keyboard
    // away as it does for a TextInput. Near the end of the content there is
    // less to scroll than asked, which is fine here.
    const dragList = async (distance: number) => {
      try {
        await element(by.id('demo-scroll')).scroll(distance, 'down', NaN, 0.15);
      } catch {
        // At the end of the content
      }
    };

    // Scrolls a field into view. On iOS it then goes into the upper part of
    // the screen, clear of the keyboard and its toolbar, in one drag sized
    // from the frame the field reports (the screens differ). Scrolling to
    // an anchor further down first keeps that drag short.
    const liftField = async (fieldId: string, anchorId = fieldId) => {
      await scrollToId(anchorId);
      if (isAndroid()) return;
      const { frame } = (await element(by.id(fieldId)).getAttributes()) as {
        frame: { y: number };
      };
      const distance = Math.round(frame.y - 200);
      if (distance > 40) await dragList(distance);
      await pause(300);
    };

    // iOS: the number pad's toolbar steps the value, and Done dismisses it
    if (!isAndroid()) {
      await liftField('field-quantity', 'field-select-word');
      await inputOf('field-quantity').tap();
      await waitFor(element(by.id('toolbar-plus')))
        .toBeVisible()
        .withTimeout(4000);
      await element(by.id('toolbar-plus')).tap();
      await expect(inputOf('field-quantity')).toHaveText('2');
      await element(by.id('toolbar-done')).tap();
      await expectText('field-last-event', 'blur: quantity');
    }

    // A chat composer (submitBehavior 'submit'): return sends, and on iOS
    // the field keeps focus and the keyboard stays up. Android types the
    // return with a tap that focuses the field, and without a hardware
    // keyboard (CI) the soft keyboard then stays over the list, where the
    // scrolls start, so Android does this last.
    const chatSendsOnReturn = async () => {
      await liftField('field-chat');
      await typeInto('field-chat', 'Hello');
      await inputOf('field-chat').tapReturnKey();
      await expectText('field-chat-sent', 'Hello');
      await expect(inputOf('field-chat')).toHaveText('');
      if (!isAndroid()) {
        await expectText('field-last-event', 'focus: chat');
      }
    };
    if (!isAndroid()) await chatSendsOnReturn();

    // Selection events from native, and a selection set from JS: on iOS by
    // a keyboard toolbar button, on Android by the demo's button. On iOS
    // the chat keyboard is still up; a drag puts it away first.
    if (!isAndroid()) await dragList(40);
    await liftField('field-selection');
    if (isAndroid()) {
      await typeInto('field-selection', 'Hello there');
      await scrollToId('field-select-word');
      await element(by.id('field-select-word')).tap();
      await expectText('field-selection-value', '6–11');
      // New text puts the cursor at the start, which native reports; no
      // tap, so no keyboard
      await typeInto('field-selection', 'Hi there');
      await expectText('field-selection-value', '0–0');
      await chatSendsOnReturn();
    } else {
      await inputOf('field-selection').tap();
      await waitFor(element(by.id('toolbar-select-word')))
        .toBeVisible()
        .withTimeout(4000);
      await element(by.id('toolbar-select-word')).tap();
      await expectText('field-selection-value', '6–11');
      // Detox taps the field before typing, which puts the cursor at the end
      await inputOf('field-selection').typeText('!');
      await expectText('field-selection-value', '12–12');
      await element(by.id('toolbar-selection-done')).tap();
      await pause(500);
    }
  });

  it('should test Theme functionality', async () => {
    await selectDemo('Theme');
    await expect(element(by.id('native-theme-brand-default'))).toBeVisible();
    await pause(800);

    // Brand colors recolor the native components in place
    for (const brand of ['teal', 'indigo', 'orange']) {
      await element(by.id(`native-theme-brand-${brand}`)).tap();
      await pause(1200);
    }

    await tapSegment('Month');
    await pause(800);

    // Dark mode, then a brand color change while dark
    await element(by.id('native-theme-appearance-dark')).tap();
    await pause(1200);
    await element(by.id('native-theme-brand-teal')).tap();
    await pause(1200);

    // Back to the defaults
    await element(by.id('native-theme-appearance-system')).tap();
    await pause(500);
    await element(by.id('native-theme-brand-default')).tap();
    await pause(800);
  });
});
