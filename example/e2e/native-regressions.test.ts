import { expect } from 'detox';
import { expect as jestExpect } from '@jest/globals';
import { isAndroid, selectDemo, selectMenuOption } from './testHelpers';

const expectText = async (testID: string, text: string) => {
  await waitFor(element(by.id(testID)))
    .toHaveText(text)
    .withTimeout(5000);
};

// Inspect the native widget's selection, independently of the React event
// display. A callback alone cannot detect an incorrectly optimistic control.
const expectSelected = async (
  groupID: string,
  label: string,
  selected: boolean
) => {
  if (isAndroid()) {
    await expect(
      element(by.text(label).withAncestor(by.id(groupID)))
    ).toHaveToggleValue(selected);
  } else {
    const selectedControl = element(
      by
        .label(label)
        .and(by.traits(['selected']))
        .withAncestor(by.id(groupID))
    );
    if (selected) {
      await expect(selectedControl).toExist();
    } else {
      await expect(selectedControl).not.toExist();
    }
  }
};

describe('Native regression cases', () => {
  beforeEach(async () => {
    // A fresh process also empties the native image cache so the accessory
    // test continues to exercise asynchronous loads on repeated runs.
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('demo-picker')))
      .toBeVisible()
      .withTimeout(15000);
    await selectDemo('Native Regressions');
  });

  it('keeps controlled selections when the parent rejects a change', async () => {
    await expectSelected('regression-segments', 'First segment', true);
    await element(by.text('Second segment')).tap();
    await expectText('regression-segment-request', 'second');
    await expectSelected('regression-segments', 'First segment', true);
    await expectSelected('regression-segments', 'Second segment', false);

    await expectSelected('regression-buttons', 'First button', true);
    await element(by.text('Second button')).tap();
    await expectText('regression-button-request', 'second');
    await expectSelected('regression-buttons', 'First button', true);
    await expectSelected('regression-buttons', 'Second button', false);

    await selectMenuOption('regression-menu', 'Second option', 'First option');
    await expectText('regression-menu-request', 'second');
    await expect(
      element(by.text('First option').withAncestor(by.id('regression-menu')))
    ).toBeVisible();
    await expect(
      element(by.text('Second option').withAncestor(by.id('regression-menu')))
    ).not.toExist();
  });

  it('presents with initial options and dismisses when its host unmounts', async () => {
    await element(by.id('regression-case-date')).tap();
    await element(by.id('regression-mount-date')).tap();

    const picker = isAndroid()
      ? element(by.text('Regression time'))
      : element(by.type('UIDatePicker'));
    await waitFor(picker).toBeVisible().withTimeout(5000);
    if (!isAndroid()) {
      await expect(element(by.label('Done'))).not.toExist();
      await expect(element(by.label('Cancel'))).not.toExist();
    }

    // The fixture removes an open native modal after eight seconds, without
    // first changing visible to false or pressing a native dismiss button.
    await waitFor(picker).not.toExist().withTimeout(15000);
    await expectText('regression-date-state', 'unmounted');
    await expectText('regression-date-closed', '0');
    await expect(element(by.id('regression-mount-date'))).toBeVisible();
  });

  it('renders both independently loaded text field image accessories', async () => {
    await element(by.id('regression-case-text')).tap();
    await waitFor(element(by.id('regression-leading-image')))
      .toBeVisible()
      .withTimeout(5000);
    await waitFor(element(by.id('regression-trailing-image')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('regression-leading-image'))).toHaveLabel(
      'Blue image'
    );
    await expect(element(by.id('regression-trailing-image'))).toHaveLabel(
      'Orange image'
    );
    await element(by.id('regression-trailing-image')).tap();
    await expectText('regression-image-presses', '1');
  });

  const itOnIOS = isAndroid() ? it.skip : it;
  itOnIOS(
    'retains focus and selection when switching the iOS input between line modes',
    async () => {
      await element(by.id('regression-case-text')).tap();
      const field = element(by.id('regression-text'));
      await field.tap();
      await expect(field).toBeFocused();
      await element(by.id('regression-select-word')).tap();
      await element(by.id('regression-toggle-lines')).tap();
      await expectText('regression-text-mode', 'multiline');
      await expect(field).toBeFocused();
      await expect(field).toHaveText('Hello there');
      // A tap inside the existing highlighted word opens the edit menu. It
      // does not create a selection; Cut is absent if the rebuild lost it.
      // This also works with the simulator's hardware keyboard connected.
      const cutSelectedWord = async () => {
        await field.tap({ x: 70, y: 17 });
        const cut = element(by.label('Cut')).atIndex(0);
        await waitFor(cut).toBeVisible().withTimeout(5000);
        await cut.tap();
        // UIKit's default smart deletion also removes the adjacent space.
        const attributes =
          (await field.getAttributes()) as Detox.IosElementAttributes;
        jestExpect(attributes.text).toBe('Hello');
      };
      await cutSelectedWord();

      await field.replaceText('Hello there');
      await element(by.id('regression-select-word')).tap();
      await element(by.id('regression-toggle-lines')).tap();
      await expectText('regression-text-mode', 'single line');
      await expect(field).toBeFocused();
      await expect(field).toHaveText('Hello there');
      await cutSelectedWord();
      await element(by.id('regression-text-done')).tap();
      await expect(field).not.toBeFocused();
    }
  );
});
