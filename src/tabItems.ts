// tabItems.ts
//
// The tab model of TabBar, and its flattening into the fields the native
// specs take. Kept apart from the bar so other navigation components can
// share it.
import type { TabBarItem as NativeItem } from './TabBarNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';

/**
 * A system tab item on iOS (`UITabBarItem.SystemItem`), with the system's
 * localized title and icon.
 */
export type TabBarSystemItem =
  | 'bookmarks'
  | 'contacts'
  | 'downloads'
  | 'favorites'
  | 'featured'
  | 'history'
  | 'more'
  | 'mostRecent'
  | 'mostViewed'
  | 'recents'
  | 'search'
  | 'topRated';

export interface TabBarItemProps {
  /**
   * Tab label. Also the screen-reader label unless `accessibilityLabel` is
   * set. iOS system items (`role: 'search'`, `systemItem`) show the system's
   * title instead.
   */
  label: string;

  /** Unique value returned in callbacks. */
  value: string;

  /** Tab icon. See {@link PlatformIcon}. */
  icon?: PlatformIcon;

  /**
   * Icon of the selected tab, e.g. the filled variant of an SF Symbol
   * (`house.fill`). Defaults to `icon`.
   */
  selectedIcon?: PlatformIcon;

  /**
   * Badge on the tab, e.g. an unread count. Numbers are shown as-is; an
   * empty string shows a dot; `undefined` hides the badge.
   */
  badge?: string | number;

  /** Whether the tab can be selected. */
  disabled?: boolean;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /** Test identifier of the tab, for E2E taps. */
  testID?: string;

  /**
   * `'search'`: the app's search tab.
   *
   * - iOS: the system search item, with its localized title and magnifying
   *   glass. iOS 26 sets it apart from the other tabs, as its own glass
   *   circle at the end of the bar.
   * - Android: a regular tab, with a search icon unless `icon` is set.
   */
  role?: 'search';

  /**
   * iOS: a system item (`UITabBarItem.SystemItem`) with the system's
   * localized title and icon, in place of `label` and `icon`. Android
   * has no system items and shows `label` and `icon`.
   */
  systemItem?: TabBarSystemItem;
}

/** Material and iOS tab bars show at most five tabs on a phone. */
export const MAX_TAB_ITEMS = 5;

/** The tabs as the native specs take them, at most `max`. */
export function toNativeTabItems(
  items: readonly TabBarItemProps[],
  max: number = MAX_TAB_ITEMS
): NativeItem[] {
  return items.slice(0, max).map((item) => {
    const icon = resolveIcon(item.icon);
    const selected = resolveIcon(item.selectedIcon);
    return {
      label: item.label,
      value: item.value,
      disabled: item.disabled ? 'disabled' : 'enabled',
      ...icon,
      selectedIconType: selected.iconType,
      selectedIconName: selected.iconName,
      selectedIconRequest: selected.iconRequest,
      selectedIconUri: selected.iconUri,
      selectedIconScale: selected.iconScale,
      selectedIconTinted: selected.iconTinted,
      badge:
        item.badge === undefined || item.badge === null
          ? ''
          : // An empty badge is a dot; native tells it from none by a space
            String(item.badge) || ' ',
      accessibilityLabel: item.accessibilityLabel ?? '',
      testID: item.testID ?? '',
      role: item.role ?? '',
      systemItem: item.systemItem ?? '',
    };
  });
}
