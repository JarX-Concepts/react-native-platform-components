import { device, expect, waitFor } from 'detox';

const step = async (label: string, fn: () => Promise<void>) => {
  console.log(`\n🧪 STEP: ${label}`);
  await fn();
};

const expectMenuItem = async (text: string, not: boolean) => {
  console.log(
    not
      ? `🔍 Expecting "${text}" to NOT be selected`
      : `🔍 Expecting "${text}" to be selected`
  );

  // Locate the menu item by its text within the spinnerTesting label
  const selectedItem = element(
    by.text(text).withAncestor(by.label('spinnerTesting'))
  );

  if (not) {
    await expect(selectedItem).not.toExist();
    return;
  }

  try {
    await expect(selectedItem).toHaveText(text);
  } catch (err) {
    // Helpful debug info only when it fails
    try {
      const attr = await selectedItem.getAttributes();
      console.error('❌ Selection assertion failed');
      console.error('🔎 Element attributes:', attr);
    } catch (attrErr) {
      console.error('❌ Selection assertion failed (and getAttributes failed)');
      console.error('🔎 getAttributes error:', attrErr);
    }
    throw err;
  }
};

describe('Agent Testing', () => {
  beforeAll(async () => {
    console.log('\n🚀 Launching app');
    await device.launchApp();
  });

  it('changes selection from Date → Time', async () => {
    await step('Open DatePicker tab', async () => {
      await element(by.id('demo-tabs-datePicker')).tap();
    });

    await step('Verify initial selection is "Date"', async () => {
      await expectMenuItem('Date', false);
    });

    await step('Open mode menu', async () => {
      await element(by.id('mode-menu')).tap();
    });

    await step('Wait for "Time" option to appear', async () => {
      await waitFor(element(by.text('Time')))
        .toBeVisible()
        .withTimeout(2000);
    });

    await step('Select "Time"', async () => {
      await element(by.text('Time')).atIndex(0).tap();
    });

    await step('Verify "Date" is no longer selected', async () => {
      await expectMenuItem('Date', true);
    });

    await step('Verify "Time" is now selected', async () => {
      await expectMenuItem('Time', false);
    });
  });

  it('compare inline and headless modes', async () => {
    // Navigate to SelectionMenu tab
    await element(by.id('demo-tabs-selectionMenu')).tap();

    // Verify we're on the SelectionMenu screen
    await expect(element(by.id('state-field-headless'))).toBeVisible();

    // Test opening the headless menu
    await element(by.id('state-field-headless')).tap();

    // puase a second for menu to open
    await new Promise((r) => setTimeout(r, 1000));

    // take a screenshot
    await device.takeScreenshot('SelectionMenu-Headless-Open');

    await new Promise((r) => setTimeout(r, 100));

    // dismiss it
    await element(by.id('demo-tabs-selectionMenu')).tap();

    await element(by.id('inline-switch')).tap();

    await element(by.id('state-menu-inline')).tap();

    // puase a second for menu to open
    await new Promise((r) => setTimeout(r, 1000));

    // take a screenshot
    await device.takeScreenshot('SelectionMenu-Inline-Open');
  });
});
