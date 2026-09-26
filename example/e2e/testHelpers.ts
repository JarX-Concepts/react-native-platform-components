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
  if (!isAndroid()) {
    try {
      await waitFor(element(by.text(label)).atIndex(0))
        .toBeVisible()
        .withTimeout(1000);
    } catch {
      // Later demos are below the system menu's initial viewport.
      await element(by.text('Tab Bar')).atIndex(0).swipe('up', 'slow', 0.5);
      await pause(500);
    }
  }
  await element(by.text(label)).atIndex(0).tap();
  // Let the demo mount and settle; the README GIFs are trimmed to start here
  await pause(1000);
};

export const selectMenuOption = async (
  menuId: string,
  optionLabel: string,
  currentLabel?: string
) => {
  if (isAndroid()) {
    // The system Spinner's selected item is a platform TextView.
    const spinnerText = element(
      by.type('android.widget.TextView').withAncestor(by.id(menuId))
    );
    await spinnerText.tap();
    const option = element(
      by
        .text(optionLabel)
        .withAncestor(by.type('android.widget.DropDownListView'))
    );
    await waitFor(option).toBeVisible().withTimeout(5000);
    await option.tap();
    await waitFor(option).not.toExist().withTimeout(5000);
  } else {
    // An embedded host can stretch wider than its intrinsic UIButton. Aim
    // at the button title when supplied, so the tap reaches the control.
    const anchor = currentLabel
      ? element(by.text(currentLabel).withAncestor(by.id(menuId)))
      : element(by.id(menuId));
    await anchor.tap();
    const option = element(
      by.text(optionLabel).withAncestor(by.type('_UIContextMenuContainerView'))
    ).atIndex(0);
    await waitFor(option).toBeVisible().withTimeout(5000);
    await option.tap();
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
