import { device } from 'detox';
import { selectMenuOption, selectTab } from './testHelpers';

describe('Agent Testing', () => {
  beforeAll(async () => {
    console.log('\n🚀 Launching app');
    await device.launchApp();
  });

  it('agent changes selection from Date → Time', async () => {
    await selectTab('Date');

    await device.takeScreenshot('DatePicker-Date-Initial');

    // disable sync to allow native menu to open
    await device.disableSynchronization();

    await selectMenuOption('mode-menu', 'Date & Time');

    await new Promise((r) => setTimeout(r, 200));

    // take a screenshot of the open menu for debugging
    await device.takeScreenshot('DatePicker-Date&Time-After-1');

    await device.enableSynchronization();

    // puase a second for menu to open
    await new Promise((r) => setTimeout(r, 2000));

    await device.takeScreenshot('DatePicker-Date&Time-After-2');

    /*     await step('Wait for "Time" option to appear', async () => {
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
    }); */
  });

  /*   it('compare inline and headless modes', async () => {
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
  }); */
});
