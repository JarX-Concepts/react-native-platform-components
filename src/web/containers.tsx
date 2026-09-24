// web/containers.tsx
//
// The components that wrap children: ContextMenu, FloatingToolbar and
// LiquidGlass. They keep their layout on web and render their children.
import React from 'react';
import { View } from 'react-native';

import type { ContextMenuProps } from '../ContextMenu';
import type { FloatingToolbarProps } from '../FloatingToolbar';
import type { LiquidGlassProps } from '../LiquidGlass';
import { warnOnce } from './shared';

/**
 * Renders its children without a menu: browsers have no native menu to
 * attach. Provide a web menu with a `.web.tsx` file in your app.
 */
export function ContextMenu(props: ContextMenuProps): React.ReactElement {
  const {
    title,
    actions,
    disabled,
    trigger,
    onPressAction,
    onMenuOpen,
    onMenuClose,
    ios,
    android,
    children,
    ...viewProps
  } = props;

  warnOnce(
    'ContextMenu',
    'ContextMenu has no web implementation; its children render without a menu. ' +
      'See https://jarx-concepts.github.io/react-native-platform-components/guides/web'
  );

  return <View {...viewProps}>{children}</View>;
}

/**
 * A pill-shaped surface that lays out its children in a row or column. It
 * doesn't follow a linked ScrollView (`scrollViewNativeID`, `hideOnScroll`).
 */
export function FloatingToolbar(
  props: FloatingToolbarProps
): React.ReactElement {
  const {
    orientation = 'horizontal',
    color,
    scrollViewNativeID,
    hideOnScroll,
    ios,
    android,
    children,
    style,
    ...viewProps
  } = props;

  return (
    <View
      {...viewProps}
      style={[
        {
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 4,
          padding: 8,
          borderRadius: 32,
          backgroundColor: color ?? 'rgba(128, 128, 128, 0.16)',
          // @ts-expect-error: react-native-web style
          backdropFilter: 'blur(20px)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * A plain view: Liquid Glass is iOS 26 only, so `isLiquidGlassSupported` is
 * `false` on web, as on Android.
 */
export function LiquidGlass(props: LiquidGlassProps): React.ReactElement {
  const { cornerRadius, ios, android, children, style, ...viewProps } = props;

  return (
    <View
      {...viewProps}
      style={[
        cornerRadius
          ? { borderRadius: cornerRadius, overflow: 'hidden' }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export const isLiquidGlassSupported = false;
