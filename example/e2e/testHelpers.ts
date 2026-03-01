import { expect } from 'detox';

export const isAndroid = () => device.getPlatform() === 'android';

export const pause = async (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper to select a tab from the native SegmentedControl
export const selectTab = async (tabLabel: string) => {
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
const TAB_LABELS = ['Date', 'Select', 'Context', 'Segment', 'Glass'];

export const selectMenuOption = async (menuId: string, optionLabel: string) => {
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
