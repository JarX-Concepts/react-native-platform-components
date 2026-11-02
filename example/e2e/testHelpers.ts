import { execFileSync } from 'child_process';
import { expect } from 'detox';

export const isAndroid = () => device.getPlatform() === 'android';

/**
 * CI splits the iOS flows across parallel jobs, each on a runner of its own:
 * with E2E_SHARD="2/3" a test file runs every third test from the second on
 * and skips the rest. Unset, every test runs.
 */
export const shardIt = (test: jest.It): jest.It => {
  const [index, count] = (process.env.E2E_SHARD ?? '1/1')
    .split('/')
    .map(Number);
  let next = 0;
  const sharded = (...args: Parameters<jest.It>) =>
    (next++ % count === index - 1 ? test : test.skip)(...args);
  return Object.assign(sharded, test);
};

export const pause = async (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The element with the testID (or the matcher) tells the screen reader it is
 * disabled, or that it isn't. Android: the view isn't enabled (TalkBack
 * "disabled"; Detox's `enabled` attribute). iOS: the notEnabled trait
 * (VoiceOver "dimmed"); Detox's `enabled` there only reflects touch handling
 * and stays true on UIKit's own alert and menu rows. Waits, since the state
 * can land after the step that changes it.
 */
export const expectDisabled = async (
  target: string | Detox.NativeMatcher,
  disabled = true
) => {
  const matcher = typeof target === 'string' ? by.id(target) : target;
  if (isAndroid()) {
    let enabled: boolean | undefined;
    for (const deadline = Date.now() + 5000; ; await pause(250)) {
      const attributes = await element(matcher).atIndex(0).getAttributes();
      enabled = 'enabled' in attributes ? attributes.enabled : undefined;
      if (enabled === !disabled || Date.now() > deadline) break;
    }
    if (enabled !== !disabled) {
      const name = typeof target === 'string' ? target : 'the element';
      throw new Error(
        `Expected ${name} to be ${disabled ? 'disabled' : 'enabled'}`
      );
    }
  } else {
    const dimmed = element(matcher.and(by.traits(['notEnabled'])));
    if (disabled) {
      await waitFor(dimmed.atIndex(0)).toExist().withTimeout(5000);
    } else {
      await waitFor(dimmed).not.toExist().withTimeout(5000);
    }
  }
};

export type ResourceIdExpectation = {
  /** The node's content description or text. */
  label: string;
  /** Default: true. */
  enabled?: boolean;
  /**
   * Default: true. A popup menu row's title reports false: the tap on it
   * lands on the row around it.
   */
  clickable?: boolean;
};

type AccessibilityNode = Record<string, string>;

const decodeXml = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&');

/** Every node of every window on screen, as UI Automator reports it. */
const dumpAccessibilityNodes = (): AccessibilityNode[] => {
  const xml = execFileSync(
    'adb',
    [
      '-s',
      device.id,
      'exec-out',
      'uiautomator',
      'dump',
      '--windows',
      '/dev/tty',
    ],
    { encoding: 'utf8', timeout: 30000 }
  );
  return [...xml.matchAll(/<node\s([^>]*?)\/?>/g)].map(([, attributes]) =>
    Object.fromEntries(
      [...attributes!.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [
        k!,
        decodeXml(v!),
      ])
    )
  );
};

const resourceIdProblems = (
  nodes: AccessibilityNode[],
  expected: Record<string, ResourceIdExpectation>
) =>
  Object.entries(expected).flatMap(([testID, want]) => {
    const matches = nodes.filter((node) => node['resource-id'] === testID);
    if (matches.length !== 1) {
      return [`${testID}: ${matches.length} nodes have this resource-id`];
    }
    const node = matches[0]!;
    const problems: string[] = [];
    const label = [node['content-desc'], node.text];
    if (!label.includes(want.label)) {
      problems.push(`label ${JSON.stringify(label)}, expected "${want.label}"`);
    }
    if (node.enabled !== String(want.enabled ?? true)) {
      problems.push(`enabled=${node.enabled}`);
    }
    if (node.clickable !== String(want.clickable ?? true)) {
      problems.push(`clickable=${node.clickable}`);
    }
    return problems.map((problem) => `${testID} (${node.class}): ${problem}`);
  });

/**
 * Android: the node that UI Automator reports with `resource-id == testID`
 * (what Maestro's `id:` and Appium's id locators match) is the only one, and
 * it is the element with the label, the touches and the enabled state, the
 * same element Detox's `by.id` finds by view tag. Waits for the screen to
 * settle; no-op on iOS, where `accessibilityIdentifier` serves both.
 */
export const expectResourceIds = async (
  expected: Record<string, ResourceIdExpectation>
) => {
  if (!isAndroid()) return;
  let problems: string[] = [];
  for (const deadline = Date.now() + 8000; ; await pause(500)) {
    try {
      problems = resourceIdProblems(dumpAccessibilityNodes(), expected);
    } catch (error) {
      // "could not get idle state" while something animates
      problems = [`uiautomator dump failed: ${error}`];
    }
    if (problems.length === 0 || Date.now() > deadline) break;
  }
  if (problems.length > 0) {
    throw new Error(`Resource ids:\n  ${problems.join('\n  ')}`);
  }
};

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
  // Later demos are below the menu's initial viewport (the iOS system menu,
  // and on Android a PopupMenu taller than the emulator's screen); swipe the
  // menu until the item is shown, since Espresso taps need the row 75% shown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await waitFor(element(by.text(label)).atIndex(0))
        .toBeVisible()
        .withTimeout(1000);
      break;
    } catch {
      if (isAndroid()) {
        await element(by.type('android.widget.ListView')).swipe(
          'up',
          'slow',
          0.4
        );
      } else {
        await element(by.text('Tab Bar')).atIndex(0).swipe('up', 'slow', 0.5);
      }
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
  // An embedded SelectionMenu's testID is on its field (the iOS menu button,
  // the Android Spinner or Material text field), labeled by what it shows
  if (currentLabel) {
    await waitFor(element(by.id(menuId)))
      .toHaveLabel(currentLabel)
      .withTimeout(5000);
  }
  await element(by.id(menuId)).tap();
  if (isAndroid()) {
    const option = element(
      by
        .text(optionLabel)
        .withAncestor(by.type('android.widget.DropDownListView'))
    );
    await waitFor(option).toBeVisible().withTimeout(5000);
    await option.tap();
    await waitFor(option).not.toExist().withTimeout(5000);
  } else {
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
