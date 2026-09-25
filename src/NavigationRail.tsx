// NavigationRail.tsx
import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  type ColorValue,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

import NativeNavigationRail, {
  type NavigationRailItem as NativeItem,
  type NavigationRailSelectEvent,
} from './NavigationRailNativeComponent';
import { resolveIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import type {
  TabBarBadgeStyle,
  TabBarItemProps,
  TabBarLabelVisibility,
} from './TabBar';

/** The collapsed Material rail shows at most seven destinations. */
const MAX_COLLAPSED_ITEMS = 7;

/** A destination: the same item as a TabBar tab. */
export type NavigationRailItemProps = TabBarItemProps;

/**
 * Where the destinations sit in the rail's height, below the header.
 * Android: `NavigationRailView.setMenuGravity`.
 */
export type NavigationRailMenuGravity = 'top' | 'center' | 'bottom';

export interface NavigationRailProps extends ViewProps {
  /**
   * The destinations. The collapsed Android rail shows seven; the expanded
   * rail and the iOS fallback show all of them.
   */
  items: readonly NavigationRailItemProps[];

  /** Selected destination's `value`; `null` for none. */
  selectedValue: string | null;

  /** Called when the user selects a destination. */
  onSelect?: (value: string, index: number) => void;

  /** Called when the user presses the destination that is already selected. */
  onReselect?: (value: string, index: number) => void;

  /**
   * How labels show. Default: `'auto'`, which labels every destination;
   * `'selected'` labels only the selected one, `'unlabeled'` none.
   */
  labelVisibility?: TabBarLabelVisibility;

  /**
   * Where the destinations sit: at the top below the header (default), in
   * the middle, or at the bottom.
   */
  menuGravity?: NavigationRailMenuGravity;

  /**
   * The expanded rail: wider, with the labels beside the icons. Changing it
   * animates. Android: `NavigationRailView.expand()` / `collapse()`, the
   * Material 3 Expressive expanded rail. iOS: the buttons put the icon
   * before the label.
   */
  expanded?: boolean;

  /**
   * Shown above the destinations, usually a FloatingActionButton or a
   * Button. Android: the rail's header view (`addHeaderView`).
   */
  header?: React.ReactNode;

  /** Icon and label color of the selected destination. */
  activeTintColor?: ColorValue;

  /** Icon and label color of the other destinations. */
  inactiveTintColor?: ColorValue;

  /**
   * Background of the rail. Default: the Material surface on Android, none
   * on iOS.
   */
  railColor?: ColorValue;

  /** Colors for the badges. */
  badgeStyle?: TabBarBadgeStyle;

  /** Label font. */
  labelStyle?: LabelStyle;

  /**
   * Largest scale the labels may reach with the system font scale, as on
   * `Text`. Unset or `0`: no cap.
   */
  maxFontSizeMultiplier?: number;

  /** Android-specific configuration. */
  android?: {
    /** Color of the active indicator behind the selected icon. */
    indicatorColor?: ColorValue;

    /** Ripple shown while pressing a destination. */
    rippleColor?: ColorValue;
  };

  /** Test identifier of the rail. */
  testID?: string;
}

export function NavigationRail(props: NavigationRailProps): React.ReactElement {
  const {
    items,
    selectedValue,
    onSelect,
    onReselect,
    labelVisibility,
    menuGravity,
    expanded,
    header,
    activeTintColor,
    inactiveTintColor,
    railColor,
    badgeStyle,
    labelStyle,
    maxFontSizeMultiplier,
    android,
    ...viewProps
  } = props;

  if (__DEV__ && items.length > MAX_COLLAPSED_ITEMS) {
    console.warn(
      `NavigationRail: ${items.length} destinations given; the collapsed Material rail shows at most ${MAX_COLLAPSED_ITEMS}.`
    );
  }

  const nativeItems = useMemo((): NativeItem[] => {
    return items.map((item) => {
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

  const handleItemPress = useCallback(
    (event: NativeSyntheticEvent<NavigationRailSelectEvent>) => {
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
    <NativeNavigationRail
      items={nativeItems}
      selectedValue={selectedValue ?? ''}
      labelVisibility={labelVisibility ?? 'auto'}
      menuGravity={menuGravity ?? 'top'}
      expanded={expanded ? 'true' : 'false'}
      activeTintColor={activeTintColor}
      inactiveTintColor={inactiveTintColor}
      railColor={railColor}
      badgeBackgroundColor={badgeStyle?.backgroundColor}
      badgeTextColor={badgeStyle?.color}
      labelStyle={nativeLabelStyle}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      androidIndicatorColor={android?.indicatorColor}
      androidRippleColor={android?.rippleColor}
      onItemPress={onSelect || onReselect ? handleItemPress : undefined}
      {...viewProps}
    >
      {header ? (
        // Native places the header; out of the flow, it leaves the rail's
        // width to native
        <View collapsable={false} style={styles.header}>
          {header}
        </View>
      ) : null}
    </NativeNavigationRail>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', left: 0, top: 0 },
});
