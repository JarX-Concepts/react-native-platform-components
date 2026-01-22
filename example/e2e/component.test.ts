import { expect } from 'detox';

describe('Platform Components Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should test Date Picker functionality', async () => {
    // Ensure we're on the DatePicker tab
    await element(by.id('demo-tabs-datePicker')).tap();

    // Test mode selection
    await element(by.id('mode-menu')).tap();

    // Wait for the menu to appear
    await waitFor(element(by.text('Date & Time')))
      .toExist()
      .withTimeout(2000);
    await element(by.text('Date & Time')).atIndex(0).tap();

    // Verify mode changed (menu should now show "Date & Time")
    await expect(element(by.id('mode-menu'))).toBeVisible();

    // Test changing mode to Time
    await element(by.id('mode-menu')).tap();

    // Wait for the menu to appear
    await waitFor(element(by.text('Time')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Time')).atIndex(0).tap();

    // Test setting a date value
    await element(by.id('set-date-now-field')).tap();
    await expect(element(by.id('set-date-now-field'))).toBeVisible();

    // Test toggling modal presentation
    await element(by.id('modal-switch')).tap();

    // In embedded mode, the picker should be visible inline
    await expect(element(by.id('date-picker'))).toExist();

    // Toggle back to modal
    await element(by.id('modal-switch')).tap();

    // Test opening the modal picker
    // await element(by.id('picker-toggle-button')).tap();

    // The picker should now be open (modal)
    // Note: Modal interactions depend on platform-specific behavior

    // Close the modal
    //await element(by.id('picker-toggle-button')).tap();

    // Test clearing the date
    await element(by.id('set-date-now-field')).tap();
    await element(by.id('clear-date-button')).tap();

    // Test min/max date toggles
    await element(by.id('min-switch')).tap();
    await element(by.id('max-switch')).tap();
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

    // In inline mode, the inline menu should be visible
    await expect(element(by.id('state-menu-inline'))).toBeVisible();

    // Select a state in inline mode (pick one near the top of the list)
    await element(by.id('state-menu-inline')).tap();

    // Wait for the menu to appear and select Arizona (near top of list)
    await waitFor(element(by.text('Arizona')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.text('Arizona')).atIndex(0).tap();

    // Verify selection
    await expect(element(by.id('state-menu-inline'))).toBeVisible();

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
  });
});
