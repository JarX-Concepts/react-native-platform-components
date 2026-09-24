// TabBar.tsx
import React, { useCallback, useMemo } from 'react';
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import NativeTabBar, {
  type TabBarItem as NativeItem,
  type TabBarSelectEvent,
} from './TabBarNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';

/** Material and iOS tab bars show at most five tabs on a phone. */
const MAX_ITEMS = 5;

/**
 * How labels show under the icons.
 *
 * - `auto` (default): the platform default. iOS labels every tab; Android
 *   labels every tab up to three, and only the selected one from four.
 * - `labeled`: every tab shows its label.
 * - `selected`: only the selected tab shows its label. Android only; iOS
 *   labels every tab.
 * - `unlabeled`: icons only. Screen readers still announce the labels.
 */
export type TabBarLabelVisibility =
  'auto' | 'labeled' | 'selected' | 'unlabeled';

/** Badge colors. Both default to the platform look. */
export interface TabBarBadgeStyle {
  backgroundColor?: ColorValue;
  color?: ColorValue;
}

export interface TabBarItemProps {
  /** Tab label. Also the screen-reader label unless `accessibilityLabel` is set. */
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
}

export interface TabBarProps extends ViewProps {
  /** The tabs, at most five. */
  items: readonly TabBarItemProps[];

  /** Selected tab's `value`; `null` for none. */
  selectedValue: string | null;

  /** Called when the user selects a tab. */
  onSelect?: (value: string, index: number) => void;

  /**
   * Called when the user presses the tab that is already selected, the
   * conventional "scroll to top" or "back to root" gesture.
   */
  onReselect?: (value: string, index: number) => void;

  /** How labels show. Default: `'auto'`. See {@link TabBarLabelVisibility}. */
  labelVisibility?: TabBarLabelVisibility;

  /** Icon and label color of the selected tab. Default: the tint / Material primary color. */
  activeTintColor?: ColorValue;

  /** Icon and label color of the other tabs. */
  inactiveTintColor?: ColorValue;

  /**
   * Background of the bar. Default: the platform's bar material (the system
   * chrome on iOS, the Material surface container on Android). Use
   * `'transparent'` to place the bar on your own background, such as a
   * FloatingToolbar.
   */
  barColor?: ColorValue;

  /** Colors for the badges. */
  badgeStyle?: TabBarBadgeStyle;

  /** Label font. */
  labelStyle?: LabelStyle;

  /**
   * Largest scale the labels may reach with the system font scale, as on
   * `Text`. Android only: iOS tab bar labels keep a fixed size and show the
   * large content viewer instead. Unset or `0`: no cap.
   */
  maxFontSizeMultiplier?: number;

  /** Android-specific configuration. */
  android?: {
    /** Color of the active indicator pill behind the selected icon. */
    indicatorColor?: ColorValue;

    /** Ripple shown while pressing a tab. */
    rippleColor?: ColorValue;
  };

  /** Test identifier of the bar. */
  testID?: string;
}

export function TabBar(props: TabBarProps): React.ReactElement {
  const {
    items,
    selectedValue,
    onSelect,
    onReselect,
    labelVisibility,
    activeTintColor,
    inactiveTintColor,
    barColor,
    badgeStyle,
    labelStyle,
    maxFontSizeMultiplier,
    android,
    ...viewProps
  } = props;

  if (__DEV__ && items.length > MAX_ITEMS) {
    console.warn(
      `TabBar: ${items.length} tabs given; the platform tab bars show at most ${MAX_ITEMS}, so the rest are dropped.`
    );
  }

  const nativeItems = useMemo((): NativeItem[] => {
    return items.slice(0, MAX_ITEMS).map((item) => {
      const icon = resolveIcon(item.icon);
      const selected = resolveIcon(item.selectedIcon);
      return {
        label: item.label,
        value: item.value,
        disabled: item.disabled ? 'disabled' : 'enabled',
        ...icon,
        selectedIconType: selected.iconType,
        selectedIconName: selected.iconName,
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
      };
    });
  }, [items]);

  const handleTabPress = useCallback(
    (event: NativeSyntheticEvent<TabBarSelectEvent>) => {
      const { index, value, reselected } = event.nativeEvent;
      if (reselected === 'true') {
        onReselect?.(value, index);
      } else {
        onSelect?.(value, index);
      }
    },
    [onSelect, onReselect]
  );

  const nativeLabelStyle = useMemo(
    () => normalizeLabelStyle(labelStyle),
    [labelStyle]
  );

  return (
    <NativeTabBar
      items={nativeItems}
      selectedValue={selectedValue ?? ''}
      labelVisibility={labelVisibility ?? 'auto'}
      activeTintColor={activeTintColor}
      inactiveTintColor={inactiveTintColor}
      barColor={barColor}
      badgeBackgroundColor={badgeStyle?.backgroundColor}
      badgeTextColor={badgeStyle?.color}
      labelStyle={nativeLabelStyle}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      androidIndicatorColor={android?.indicatorColor}
      androidRippleColor={android?.rippleColor}
      onTabPress={onSelect || onReselect ? handleTabPress : undefined}
      {...viewProps}
    />
  );
}
