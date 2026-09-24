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
    // Wait for dropdown to fully appear
    await new Promise((r) => setTimeout(r, 300));
    // Android dropdown covers the tabs, so always use index 0
    await element(by.text(optionLabel)).atIndex(0).tap();
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

export const ensureModalMode = async (enabled: boolean) => {
  const toggle = element(by.id('modal-switch'));
  const button = element(by.id('picker-toggle-button'));

  // The switch mounts (or unmounts) the picker's Open/Close button, so that
  // button's presence is what says which mode the demo is in
  const inModalMode = async () => {
    try {
      await expect(button).toBeVisible();
      return true;
    } catch {
      return false;
    }
  };

  if ((await inModalMode()) === enabled) return;
  await toggle.tap();
  // React re-renders before the button appears or goes, so poll for it rather
  // than asserting straight after the tap
  if (enabled) {
    await waitFor(button).toBeVisible().withTimeout(10000);
  } else {
    await waitFor(button).not.toBeVisible().withTimeout(10000);
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
  beforeAll(async () => {
    if (isAndroid()) {
      // Text is entered with replaceText (see typeInto), so the soft keyboard
      // has no part in the flows; keep it down so it never covers the demo's
      // buttons below a focused field, as it does on the CI emulator
      execSync(
        `"${adbPath()}" -s ${device.id} shell settings put secure show_ime_with_hard_keyboard 0`
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

  it('should test Date Picker functionality', async () => {
    const dismissModal = async () => {
      if (isAndroid()) {
        // The demo titles the dialog's negative button
        await element(by.text('Custom Cancel')).atIndex(0).tap();
      } else {
        // The picker presents in a popover, and the Cancel item of its own
        // confirm toolbar is the only control above the overlay. A tap aimed
        // at the demo behind it never lands: the app stops answering Detox,
        // which waits on that one tap until the test times out.
        await element(by.label('Cancel')).atIndex(0).tap();
      }
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
    } else {
      await selectMenuOption('ios-style-menu', 'Inline');
    }

    // Open the modal (then pause)
    await element(by.id('picker-toggle-button')).tap();
    await pause(1000);

    // Dismiss it
    await dismissModal();

    // Disable the modal mode
    await ensureModalMode(false);

    if (!isAndroid()) {
      await selectMenuOption('ios-style-menu', 'Wheels');
    }

    // Set mode to "Time" (then pause)
    await selectMenuOption('mode-menu', 'Time');
    await pause(1000);

    // Enable the modal mode
    await ensureModalMode(true);

    // Open the modal (then pause)
    await element(by.id('picker-toggle-button')).tap();
    await pause(1000);

    // Dismiss it
    await dismissModal();
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
      .withTimeout(2000);
    await element(by.text('California')).atIndex(0).tap();

    // Verify selection was made (field should show "California")
    await expect(element(by.text('California'))).toBeVisible();

    // Test clearing the selection
    await element(by.id('clear-state-button')).tap();

    // Verify selection was cleared
    await expect(element(by.text('None'))).toBeVisible();

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
      .withTimeout(2000);

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
      .withTimeout(2000);
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
      .withTimeout(2000);
    await element(by.text('Arkansas')).atIndex(0).tap();

    // Verify the selection
    await expect(element(by.text('Arkansas'))).toBeVisible();

    // Set Android material to "M3" (Android only)
    try {
      await selectMenuOption('android-material-menu', 'M3');

      await element(by.id('embedded-switch')).tap();

      await element(by.id('state-menu-embedded')).tap();
    } catch {
      // Not on Android.
    }
  });

  it('should test Context Menu functionality', async () => {
    // Navigate to ContextMenu tab
    await selectDemo('Context Menu');

    // Verify we're on the ContextMenu screen
    await expect(element(by.text('Long-press me'))).toBeVisible();

    // Test basic context menu with long-press
    await element(by.id('context-menu-basic')).longPress();

    // Wait for menu to appear and verify actions are visible
    await waitFor(element(by.text('Copy')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.text('Paste'))).toBeVisible();
    await expect(element(by.text('Share'))).toBeVisible();

    // Select an action
    await element(by.text('Copy')).atIndex(0).tap();

    // Verify the action was recorded
    await waitFor(element(by.text('Copy (copy)')))
      .toBeVisible()
      .withTimeout(2000);

    // Test context menu with submenu
    await element(by.id('context-menu-submenu')).longPress();

    // Wait for menu to appear
    await waitFor(element(by.text('Edit')))
      .toBeVisible()
      .withTimeout(2000);

    // On iOS, tap Edit to see submenu; on Android submenus work differently
    if (!isAndroid()) {
      await element(by.text('Edit')).tap();
      await waitFor(element(by.text('Cut')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.text('Cut')).tap();
    } else {
      // On Android, just select the Share action instead
      await element(by.text('Share')).atIndex(0).tap();
    }
    await pause(500);

    // Test destructive actions
    await element(by.id('context-menu-destructive')).longPress();

    await waitFor(element(by.text('Delete Forever')))
      .toBeVisible()
      .withTimeout(2000);

    // Dismiss the menu by tapping outside or selecting an action
    await element(by.text('Archive')).atIndex(0).tap();

    // Verify the action was recorded
    await waitFor(element(by.text('Archive (archive)')))
      .toBeVisible()
      .withTimeout(2000);

    // Test tap mode
    await element(by.id('context-menu-tap')).tap();

    // Wait for menu to appear
    await waitFor(element(by.text('Copy')))
      .toBeVisible()
      .withTimeout(2000);

    // Select an action
    await element(by.text('Paste')).atIndex(0).tap();

    // Verify the action was recorded
    await waitFor(element(by.text('Paste (paste)')))
      .toBeVisible()
      .withTimeout(2000);

    // Test Android-only programmatic mode
    if (isAndroid()) {
      await element(by.id('programmatic-toggle-button')).tap();

      // Wait for menu to appear
      await waitFor(element(by.text('Copy')))
        .toBeVisible()
        .withTimeout(2000);

      // Select an action
      await element(by.text('Share')).atIndex(0).tap();

      // Verify the action was recorded
      await waitFor(element(by.text('Share (share)')))
        .toBeVisible()
        .withTimeout(2000);
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
      await element(by.id('context-menu-basic')).longPress();

      await waitFor(element(by.text('Copy')))
        .toBeVisible()
        .withTimeout(2000);

      // Dismiss
      await element(by.text('Share')).atIndex(0).tap();
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

    // The multi-select group sits below the fold on a phone
    await scrollToId('button-group-multiple');
    await element(by.text('Italic')).atIndex(0).tap();
    await pause(500);
    await expect(element(by.id('button-group-value'))).toHaveText(
      'month · bold, italic'
    );

    await element(by.text('Bold')).atIndex(0).tap();
    await pause(500);
    await expect(element(by.id('button-group-value'))).toHaveText(
      'month · italic'
    );

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
    await expect(element(by.id('button-last-pressed'))).toHaveText('copy');
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
  });

  it('should test Liquid Glass functionality', async () => {
    // LiquidGlass is iOS 26+ only - skip on Android
    if (isAndroid()) {
      return;
    }

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
