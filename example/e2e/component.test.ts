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

export const ensureModalMode = async (enabled: boolean) => {
  const toggle = element(by.id('modal-switch'));

  if (enabled) {
    try {
      await expect(element(by.id('picker-toggle-button'))).toBeVisible();
      return;
    } catch {
      await toggle.tap();
      await expect(element(by.id('picker-toggle-button'))).toBeVisible();
    }
  } else {
    try {
      await expect(element(by.id('picker-toggle-button'))).toBeVisible();
      await toggle.tap();
    } catch {
      // Already disabled.
    }
  }
};

describe('Platform Components Example', () => {
  beforeAll(async () => {
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
      try {
        await element(by.text('Custom Cancel')).atIndex(0).tap();
        return;
      } catch {
        // Not Android or button not present.
      }

      try {
        // Tap outside the popover to dismiss it
        await element(by.text('BASICS')).tap();
        return;
      } catch {
        // Section title not reachable.
      }
    };

    // The app opens on the Date Picker demo (beforeEach waits for it)

    // Enable DatePicker Tap
    await ensureModalMode(true);
    await expect(element(by.id('picker-toggle-field'))).toBeVisible();

    // Set mode to "Date"
    await selectMenuOption('mode-menu', 'Date');

    // Set iOS style to "Inline" (iOS only)
    try {
      await selectMenuOption('ios-style-menu', 'Inline');
    } catch {
      // Not on iOS.
    }

    // Set Android material to "M3" (Android only)
    try {
      await selectMenuOption('android-material-menu', 'M3');
    } catch {
      // Not on Android.
    }

    // Open the modal (then pause)
    await element(by.id('picker-toggle-button')).tap();
    await pause(1000);

    // Dismiss it
    await dismissModal();

    // Disable the modal mode
    await ensureModalMode(false);

    // Set iOS style to "Wheels" (iOS only)
    try {
      await selectMenuOption('ios-style-menu', 'Wheels');
    } catch {
      // Not on iOS.
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
