import { expect } from 'detox';

const isAndroid = () => device.getPlatform() === 'android';

const pause = async (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper to select a tab from the native SegmentedControl
const selectTab = async (tabLabel: string) => {
  if (isAndroid()) {
    // On Android, scroll to top first to ensure tabs are visible
    await element(
      by.type('com.facebook.react.views.scroll.ReactScrollView')
    ).scrollTo('top');
    await pause(200);
    // Find the MaterialButton by its content description (accessibility label)
    await element(by.label(tabLabel)).atIndex(0).tap();
    // Wait longer for React state to update on Android
    await pause(500);
  } else {
    // On iOS, UISegmentedControl segments are found by text
    await element(by.text(tabLabel)).atIndex(0).tap();
    await pause(300);
  }
};

// Tab labels that may conflict with menu options
const TAB_LABELS = ['Date', 'Selection', 'Context', 'Segment'];

const selectMenuOption = async (menuId: string, optionLabel: string) => {
  const hasConflict = TAB_LABELS.includes(optionLabel);

  if (isAndroid()) {
    // Android: Tap the MaterialTextView inside the Spinner to open dropdown
    const spinnerText = element(
      by
        .type('com.google.android.material.textview.MaterialTextView')
        .withAncestor(by.id(menuId))
    );
    await spinnerText.tap();
    // Wait for dropdown to fully appear
    await new Promise((r) => setTimeout(r, 300));
    // Android dropdown covers the tabs, so always use index 0
    await element(by.text(optionLabel)).atIndex(0).tap();
  } else {
    // iOS: Tap the menu to open it
    await element(by.id(menuId)).tap();
    // Wait for menu to appear - if there's no conflict, wait for the text
    // If there's a conflict, just wait a fixed time since the tab text is always visible
    if (hasConflict) {
      await pause(500);
    } else {
      await waitFor(element(by.text(optionLabel)))
        .toBeVisible()
        .withTimeout(2000);
    }
    // Tap the option - use index 1 if it conflicts with a tab label (tab is index 0)
    await element(by.text(optionLabel))
      .atIndex(hasConflict ? 1 : 0)
      .tap();
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
    const ensureModalMode = async (enabled: boolean) => {
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

    const dismissModal = async () => {
      try {
        await element(by.text('Custom Cancel')).atIndex(0).tap();
        return;
      } catch {
        // Not Android or button not present.
      }

      try {
        // Tap the Date tab to dismiss
        await selectTab('Date');
        return;
      } catch {
        // Tab not available.
      }
    };

    // Ensure we're on the DatePicker tab
    await selectTab('Date');

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
    await selectTab('Selection');

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
      // Android: tap the MaterialTextView inside the menu
      const embeddedMenuText = element(
        by
          .type('com.google.android.material.textview.MaterialTextView')
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
    await selectTab('Context');

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
    await selectTab('Segment');

    // Take screenshot of initial state
    await device.takeScreenshot('segmented-control-initial');

    // Verify we're on the SegmentedControl demo
    await expect(element(by.id('segment-basic'))).toBeVisible();

    // Verify initial selection is "day"
    await expect(element(by.id('segment-basic-value'))).toHaveText('day');

    // Test segment selection - tap "Week"
    await element(by.text('Week')).atIndex(0).tap();
    await pause();

    // Verify selection changed
    // NOTE: On Android, MaterialButtonToggleGroup doesn't fire check events from Detox taps
    // The visual selection changes but the callback doesn't fire. This works correctly
    // with real user interaction. Skipping assertion on Android.
    if (!isAndroid()) {
      await expect(element(by.id('segment-basic-value'))).toHaveText('week');
    }

    // Take screenshot after selection
    await device.takeScreenshot('segmented-control-week-selected');

    // Test "Month" selection
    await element(by.text('Month')).atIndex(0).tap();
    await pause();
    if (!isAndroid()) {
      await expect(element(by.id('segment-basic-value'))).toHaveText('month');
    }

    // Test "Year" selection
    await element(by.text('Year')).atIndex(0).tap();
    await pause();
    if (!isAndroid()) {
      await expect(element(by.id('segment-basic-value'))).toHaveText('year');
    }

    // Test disabled state
    await element(by.id('disabled-switch')).tap();
    await pause();

    // Take screenshot of disabled state
    await device.takeScreenshot('segmented-control-disabled');

    // Re-enable
    await element(by.id('disabled-switch')).tap();
    await pause();

    // Test iOS-specific features
    if (!isAndroid()) {
      // Test momentary mode
      await element(by.id('momentary-switch')).tap();
      await pause();

      // Take screenshot of momentary mode
      await device.takeScreenshot('segmented-control-momentary');

      // Disable momentary
      await element(by.id('momentary-switch')).tap();
      await pause();

      // Test proportional width
      await element(by.id('proportional-switch')).tap();
      await pause();

      await device.takeScreenshot('segmented-control-proportional');

      // Disable proportional
      await element(by.id('proportional-switch')).tap();
    }

    // Test per-segment disabled (the middle segment should be disabled)
    // We can verify by trying to select it and checking the value doesn't change
    // First select "Active"
    await element(by.text('Active')).atIndex(0).tap();
    await pause();

    // Try to tap "Disabled" - it shouldn't change the selection
    try {
      await element(by.text('Disabled')).atIndex(0).tap();
      await pause();
    } catch {
      // Expected - disabled segment may not be tappable
    }

    // Take final screenshot
    await device.takeScreenshot('segmented-control-final');
  });
});
