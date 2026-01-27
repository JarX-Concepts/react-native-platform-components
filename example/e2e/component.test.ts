import { expect } from 'detox';

const isAndroid = () => device.getPlatform() === 'android';

const selectMenuOption = async (menuId: string, optionLabel: string) => {
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
    // Tap the option in the dropdown
    await element(by.text(optionLabel)).atIndex(0).tap();
  } else {
    // iOS: Simple tap on menu then option
    await element(by.id(menuId)).tap();
    await waitFor(element(by.text(optionLabel)))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text(optionLabel)).atIndex(0).tap();
  }
};

describe('Platform Components Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should test Date Picker functionality', async () => {
    const pause = async (ms = 1000) =>
      new Promise((resolve) => setTimeout(resolve, ms));

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
        await element(by.id('demo-tabs-datePicker')).tap();
        return;
      } catch {
        // Not Android or back not available.
      }
    };

    // Ensure we're on the DatePicker tab
    await element(by.id('demo-tabs-datePicker')).tap();

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
    await pause();

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
    await pause();

    // Enable the modal mode
    await ensureModalMode(true);

    // Open the modal (then pause)
    await element(by.id('picker-toggle-button')).tap();
    await pause();

    // Dismiss it
    await dismissModal();
  });

  it('should test Selection Menu functionality', async () => {
    // Navigate to SelectionMenu tab
    await element(by.id('demo-tabs-selectionMenu')).tap();

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

    // Test inline mode
    await element(by.id('inline-switch')).tap();

    // In inline mode, the inline menu should exist (scroll to top first on Android)
    if (isAndroid()) {
      await element(
        by.type('com.facebook.react.views.scroll.ReactScrollView')
      ).scrollTo('top');
    }
    // iOS doesn't need explicit scroll - the element should be visible
    await waitFor(element(by.id('state-menu-inline')))
      .toExist()
      .withTimeout(2000);

    // Select a state in inline mode - tap the menu to open it
    if (isAndroid()) {
      // Android: tap the MaterialTextView inside the menu
      const inlineMenuText = element(
        by
          .type('com.google.android.material.textview.MaterialTextView')
          .withAncestor(by.id('state-menu-inline'))
      );
      await inlineMenuText.tap();
    } else {
      // iOS: simple tap on the menu
      await element(by.id('state-menu-inline')).tap();
    }

    // Wait for the menu to appear and select Arizona (near top of list)
    await waitFor(element(by.text('Arizona')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Arizona')).atIndex(0).tap();

    // Verify selection (use toExist since the menu might be partially visible)
    await expect(element(by.id('state-menu-inline'))).toExist();

    // Test disabled state
    await element(by.id('disabled-switch')).tap();

    // The menu should be disabled now
    // (Can't easily verify disabled state in Detox, but we can ensure it doesn't crash)

    // Re-enable
    await element(by.id('disabled-switch')).tap();

    // Toggle back to headless mode
    await element(by.id('inline-switch')).tap();

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

      await element(by.id('inline-switch')).tap();

      await element(by.id('state-menu-inline')).tap();
    } catch {
      // Not on Android.
    }
  });
});
