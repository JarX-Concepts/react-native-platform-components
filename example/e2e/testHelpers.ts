import { expect } from 'detox';

export const isAndroid = () => device.getPlatform() === 'android';

export const pause = async (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
    // Android: Tap the MaterialTextView inside the Spinner to open dropdown
    const spinnerText = element(
      by
        .type('com.google.android.material.textview.MaterialTextView')
        .withAncestor(by.id(menuId))
    );
    await spinnerText.tap();
    // Wait for dropdown to fully appear
    await new Promise((r) => setTimeout(r, 300));
    await element(by.text(optionLabel)).atIndex(0).tap();
  } else {
    // iOS: Tap the menu to open it
    await element(by.id(menuId)).tap();
    await waitFor(element(by.text(optionLabel)))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text(optionLabel)).atIndex(0).tap();
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
