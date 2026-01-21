import 'detox';

describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should exercise all the calendar knobs', async () => {
    await element(by.id('mode-menu')).tap();

    await element(by.text('Date & Time')).atIndex(0).tap();
  });

  // Do it for menu
});
