// TabBar.tsx
import React, { useCallback, useMemo } from 'react';
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import NativeTabBar, { type TabBarSelectEvent } from './TabBarNativeComponent';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import {
  MAX_TAB_ITEMS,
  toNativeTabItems,
  type TabBarItemProps,
} from './tabItems';

export type { TabBarItemProps } from './tabItems';

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

/**
 * When the bar gets out of the way of scrolling content, following the
 * ScrollView named by `scrollViewNativeID`.
 *
 * - `onScrollDown`: minimize while scrolling down, come back scrolling up.
 * - `onScrollUp`: the reverse.
 * - `automatic`: the platform default (iOS 26: minimize on scroll down).
 * - `never`: always full size.
 */
export type TabBarMinimizeBehavior =
  'automatic' | 'never' | 'onScrollDown' | 'onScrollUp';

/** Badge colors. Both default to the platform look. */
export interface TabBarBadgeStyle {
  backgroundColor?: ColorValue;
  color?: ColorValue;
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

  /**
   * Minimizes the bar as the content scrolls. iOS 26: the system tab bar
   * minimization, the bar shrinking to the selected tab. Needs
   * `scrollViewNativeID`.
   */
  minimizeBehavior?: TabBarMinimizeBehavior;

  /**
   * The `nativeID` of the ScrollView (or FlatList) whose scrolling drives
   * `minimizeBehavior`.
   */
  scrollViewNativeID?: string;

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
    minimizeBehavior,
    scrollViewNativeID,
    android,
    ...viewProps
  } = props;

  if (__DEV__ && items.length > MAX_TAB_ITEMS) {
    console.warn(
      `TabBar: ${items.length} tabs given; the platform tab bars show at most ${MAX_TAB_ITEMS}, so the rest are dropped.`
    );
  }

  const nativeItems = useMemo(() => toNativeTabItems(items), [items]);

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
      minimizeBehavior={minimizeBehavior ?? ''}
      scrollViewNativeID={scrollViewNativeID ?? ''}
      androidIndicatorColor={android?.indicatorColor}
      androidRippleColor={android?.rippleColor}
      onTabPress={onSelect || onReselect ? handleTabPress : undefined}
      {...viewProps}
    />
  );
}
