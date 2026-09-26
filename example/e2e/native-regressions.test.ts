import { expect } from 'detox';
import { expect as jestExpect } from '@jest/globals';
import { isAndroid, pause, selectDemo, selectMenuOption } from './testHelpers';
import { startImageServer } from './imageServer';
import { expectImageColors } from './imageAssertions';

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

  it('keeps unavailable options disabled in embedded and modal menus', async () => {
    await element(by.id('regression-case-options')).tap();
    let currentLabel = 'Ready choice';
    for (const modal of [false, true]) {
      if (modal) {
        await element(by.id('regression-menu-mode')).tap();
        await element(by.id('regression-menu-enable')).tap();
      }
      const open = async () => {
        if (modal) await element(by.id('regression-menu-open')).tap();
        else
          await element(
            by
              .text(currentLabel)
              .withAncestor(by.id('regression-disabled-menu'))
          ).tap();
        await waitFor(element(by.text('Unavailable choice')).atIndex(0))
          .toBeVisible()
          .withTimeout(5000);
      };
      await open();
      // PopupMenu's label stays enabled; its containing menu row owns the
      // disabled flag. Spinner applies that flag directly to its text row.
      const androidChoice = element(
        modal
          ? by
              .type('androidx.appcompat.view.menu.ListMenuItemView')
              .withDescendant(by.text('Unavailable choice'))
          : by.text('Unavailable choice')
      ).atIndex(0);
      if (isAndroid()) {
        const disabled = await androidChoice.getAttributes();
        jestExpect('enabled' in disabled && disabled.enabled).toBe(false);
      } else {
        await expect(
          element(
            by.label('Unavailable choice').and(by.traits(['notEnabled']))
          ).atIndex(0)
        ).toExist();
      }
      await element(by.text('Another choice')).atIndex(0).tap();
      await expectText('regression-disabled-request', 'another:2');
      currentLabel = 'Another choice';
      await element(by.id('regression-menu-enable')).tap();
      await open();
      if (isAndroid()) {
        const enabled = await androidChoice.getAttributes();
        jestExpect('enabled' in enabled && enabled.enabled).toBe(true);
      } else {
        await expect(
          element(by.label('Unavailable choice').and(by.traits(['notEnabled'])))
        ).not.toExist();
      }
      await element(by.text('Unavailable choice')).atIndex(0).tap();
      await expectText('regression-disabled-request', 'unavailable:1');
      currentLabel = 'Unavailable choice';
    }
  });

  it('forwards image credentials and bodies and isolates cached accounts', async () => {
    const server = await startImageServer();
    try {
      await element(by.id('regression-case-images')).tap();
      await waitFor(element(by.id('regression-request-image')))
        .toBeVisible()
        .withTimeout(5000);
      jestExpect(server.requests).toEqual([
        { authorization: 'Bearer first', method: 'POST', body: 'size=small' },
      ]);
      const icon = element(by.id('regression-request-image'));
      await expectImageColors(
        () => icon.takeScreenshot('authenticated-icon-first'),
        ['blue'],
        ['orange']
      );
      await element(by.id('regression-request-switch')).tap();
      await waitFor(element(by.id('regression-request-image')))
        .toBeVisible()
        .withTimeout(5000);
      jestExpect(server.requests).toEqual([
        { authorization: 'Bearer first', method: 'POST', body: 'size=small' },
        { authorization: 'Bearer second', method: 'POST', body: 'size=small' },
      ]);
      await expectImageColors(
        () => icon.takeScreenshot('authenticated-icon-second'),
        ['orange'],
        ['blue']
      );
      await element(by.id('regression-request-cache')).tap();
      await expect(element(by.id('regression-request-image'))).toBeVisible();
      await expectImageColors(
        () => icon.takeScreenshot('authenticated-icon-cached'),
        ['orange'],
        ['blue']
      );
      jestExpect(server.requests).toHaveLength(2);
      await element(by.id('regression-request-reload')).tap();
      await waitFor(element(by.id('regression-request-image')))
        .toBeVisible()
        .withTimeout(5000);
      jestExpect(server.requests).toHaveLength(3);
      jestExpect(server.requests[2]).toEqual(server.requests[1]);
      await expectImageColors(
        () => icon.takeScreenshot('authenticated-icon-reloaded'),
        ['orange'],
        ['blue']
      );
    } finally {
      await server.close();
    }
  });

  const itOnIOS = isAndroid() ? it.skip : it;
  itOnIOS(
    'retains reload and no-store menu images without refetch loops',
    async () => {
      const server = await startImageServer();
      // Hold an old account response while replacing that same URI's credentials.
      // Synchronization is restored before inspecting the settled native menu.
      await device.disableSynchronization();
      try {
        await element(by.id('regression-case-images')).tap();
        await element(by.id('regression-image-mode')).tap();
        const waitForAccount = async (authorization: string) => {
          const deadline = Date.now() + 5000;
          while (
            !server.menuRequests.some(
              (entry) => entry.authorization === authorization
            ) &&
            Date.now() < deadline
          ) {
            await pause(100);
          }
          jestExpect(server.menuRequests).toContainEqual({
            path: '/menu/account',
            authorization,
          });
        };
        await waitForAccount('Bearer first');
        await element(by.id('regression-menu-account')).tap();
        await waitForAccount('Bearer second');
        server.releaseFirstMenuImage();
        await device.enableSynchronization();

        for (const opening of [1, 2]) {
          await element(by.text('Request menu')).tap();
          await waitFor(element(by.text('Reload icon')).atIndex(0))
            .toBeVisible()
            .withTimeout(5000);
          await expectImageColors(
            () => device.takeScreenshot(`request-menu-${opening}`),
            ['blue', 'orange', 'green'],
            ['purple']
          );
          await element(by.text('Reload icon')).atIndex(0).tap();
        }
        jestExpect(
          server.menuRequests.filter(({ path }) => path === '/menu/reload')
        ).toHaveLength(1);
        jestExpect(
          server.menuRequests.filter(({ path }) => path === '/menu/no-store')
        ).toHaveLength(1);
        jestExpect(
          server.menuRequests.filter(({ path }) => path === '/menu/account')
        ).toHaveLength(2);
      } finally {
        await server.close();
        await device.enableSynchronization();
      }
    }
  );

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
