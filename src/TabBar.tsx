// TabBar.tsx
import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  type ColorValue,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

import NativeTabBar, {
  type TabBarAccessoryLayoutEvent,
  type TabBarSelectEvent,
} from './TabBarNativeComponent';
import NativeTabBarAccessory from './TabBarAccessoryNativeComponent';
import { isLiquidGlassSupported } from './LiquidGlass';
import type { Haptics } from './haptics';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import {
  MAX_TAB_ITEMS,
  toNativeTabItems,
  type TabBarItemProps,
} from './tabItems';

export type { TabBarItemProps, TabBarSystemItem } from './tabItems';

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

/**
 * Where the iOS 26 bottom accessory sits: `regular`, its own row above the
 * bar, or `inline`, beside the minimized bar.
 */
export type TabBarAccessoryEnvironment = 'regular' | 'inline';

/**
 * Android: the tab layout. `vertical` puts the icon above the label,
 * `horizontal` beside it (Material 3 Expressive, for wide bars), and `auto`
 * picks horizontal when the bar is at least 600dp wide.
 */
export type TabBarItemLayout = 'vertical' | 'horizontal' | 'auto';

/**
 * Android: the shape of the active indicator. `pill` (default) has fully
 * rounded ends; `circle` is a circle the indicator's height across; a number
 * is the corner radius, in dp, of a rounded rectangle.
 */
export type TabBarIndicatorShape = 'pill' | 'circle' | number;

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

  /**
   * Haptic played when the user presses a tab, including the selected one
   * (a reselect). Default: none, like the native tab bars. See
   * {@link Haptics}.
   */
  haptics?: Haptics;

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

  /**
   * A view carried with the bar, such as a mini player.
   *
   * - iOS 26: the tab bar's bottom accessory (`UITabAccessory`), a glass row
   *   above the bar that moves inline beside the bar while it's minimized.
   *   Your view is laid out at the accessory's size.
   * - Android and iOS before 26: a plain view above the bar, drawn by you.
   *   On Android it slides away with the bar under `minimizeBehavior`.
   *
   * The bar's height includes the accessory.
   */
  accessory?: React.ReactNode;

  /**
   * Called when the iOS 26 accessory moves between `'regular'` (its row
   * above the bar) and `'inline'` (beside the minimized bar), to switch to a
   * compact layout. Elsewhere the accessory is always regular.
   */
  onAccessoryEnvironmentChange?: (
    environment: TabBarAccessoryEnvironment
  ) => void;

  /** Android-specific configuration. */
  android?: {
    /** Color of the active indicator pill behind the selected icon. */
    indicatorColor?: ColorValue;

    /** Ripple shown while pressing a tab. */
    rippleColor?: ColorValue;

    /** Whether the selected tab shows the active indicator. Default: `true`. */
    indicator?: boolean;

    /** Shape of the active indicator. Default: `'pill'`. See {@link TabBarIndicatorShape}. */
    indicatorShape?: TabBarIndicatorShape;

    /**
     * Width of the active indicator, in dp. Default: the Material width
     * (64). Horizontal tabs size their indicator to the icon and label.
     */
    indicatorWidth?: number;

    /** Height of the active indicator, in dp. Default: the Material height (32). */
    indicatorHeight?: number;

    /** Icon above or beside the label. Default: `'vertical'`. See {@link TabBarItemLayout}. */
    itemLayout?: TabBarItemLayout;
  };

  /** Test identifier of the bar. */
  testID?: string;
}

type AccessoryFrame = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export function TabBar(props: TabBarProps): React.ReactElement {
  const {
    items,
    selectedValue,
    onSelect,
    onReselect,
    haptics,
    labelVisibility,
    activeTintColor,
    inactiveTintColor,
    barColor,
    badgeStyle,
    labelStyle,
    maxFontSizeMultiplier,
    minimizeBehavior,
    scrollViewNativeID,
    accessory,
    onAccessoryEnvironmentChange,
    android,
    style,
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

  // --- Accessory ---
  // iOS 26 hosts it in UIKit's accessory: the content mounts into the
  // accessory view, laid out at the size and place native reports. Elsewhere
  // it is a plain view above the bar.
  const hasAccessory =
    accessory !== undefined && accessory !== null && accessory !== false;
  const hostsAccessory = hasAccessory && isLiquidGlassSupported;
  const accessoryID = `pc-tab-accessory${useId()}`;
  const [accessoryFrame, setAccessoryFrame] = useState<AccessoryFrame | null>(
    null
  );
  const environment = useRef<TabBarAccessoryEnvironment>('regular');

  const handleAccessoryLayout = useCallback(
    (event: NativeSyntheticEvent<TabBarAccessoryLayoutEvent>) => {
      const { x, y, width, height } = event.nativeEvent;
      setAccessoryFrame((current) =>
        current &&
        current.x === x &&
        current.y === y &&
        current.width === width &&
        current.height === height
          ? current
          : { x, y, width, height }
      );
      const next: TabBarAccessoryEnvironment =
        event.nativeEvent.environment === 'inline' ? 'inline' : 'regular';
      if (next !== environment.current) {
        environment.current = next;
        onAccessoryEnvironmentChange?.(next);
      }
    },
    [onAccessoryEnvironmentChange]
  );

  const indicatorShape = android?.indicatorShape;

  const bar = (
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
      accessoryID={hasAccessory ? accessoryID : ''}
      androidIndicatorColor={android?.indicatorColor}
      androidRippleColor={android?.rippleColor}
      androidIndicator={
        android?.indicator === undefined ? '' : String(android.indicator)
      }
      androidIndicatorShape={
        typeof indicatorShape === 'number' ? 'rounded' : (indicatorShape ?? '')
      }
      androidIndicatorCornerRadius={
        typeof indicatorShape === 'number' ? indicatorShape : 0
      }
      androidIndicatorWidth={android?.indicatorWidth ?? 0}
      androidIndicatorHeight={android?.indicatorHeight ?? 0}
      androidItemLayout={android?.itemLayout ?? ''}
      haptics={haptics ?? ''}
      onTabPress={onSelect || onReselect ? handleTabPress : undefined}
      onAccessoryLayout={hostsAccessory ? handleAccessoryLayout : undefined}
      style={hasAccessory ? undefined : style}
      {...viewProps}
    />
  );

  if (!hasAccessory) {
    return bar;
  }

  if (hostsAccessory) {
    // The inner view has no padding, so the accessory's offsets are in the
    // bar's coordinates. The content's place in the layout matches where
    // UIKit shows it, for touch handling that measures views.
    return (
      <View style={style} pointerEvents="box-none">
        <View pointerEvents="box-none">
          {bar}
          <NativeTabBarAccessory
            accessoryID={accessoryID}
            style={[
              styles.hostedAccessory,
              accessoryFrame
                ? {
                    left: accessoryFrame.x,
                    top: accessoryFrame.y,
                    width: accessoryFrame.width,
                    height: accessoryFrame.height,
                  }
                : styles.accessoryPlaceholder,
            ]}
          >
            {accessory}
          </NativeTabBarAccessory>
        </View>
      </View>
    );
  }

  return (
    <View style={style} pointerEvents="box-none">
      <View nativeID={accessoryID} collapsable={false}>
        {accessory}
      </View>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  hostedAccessory: { position: 'absolute' },
  // Until the first layout: the accessory's usual row across the bar
  accessoryPlaceholder: { left: 0, right: 0, top: 0, height: 48 },
});
