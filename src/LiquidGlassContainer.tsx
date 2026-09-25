// LiquidGlassContainer.tsx
import React from 'react';
import type { ViewProps } from 'react-native';

import NativeLiquidGlassContainer from './LiquidGlassContainerNativeComponent';

export interface LiquidGlassContainerProps extends ViewProps {
  /**
   * How far apart the `LiquidGlass` views inside can be and still merge
   * (`UIGlassContainerEffect.spacing`); larger values blend glass across
   * wider gaps. iOS 26 only.
   *
   * Default: the system's, 0 on iOS 26, where glass doesn't merge across
   * gaps.
   */
  spacing?: number;

  /**
   * Content, with the `LiquidGlass` views that merge. They don't have to be
   * direct children.
   */
  children?: React.ReactNode;
}

/**
 * Groups `LiquidGlass` views so they render as one glass on iOS 26
 * (`UIVisualEffectView` with a `UIGlassContainerEffect`): neighbours within
 * `spacing` blend together, and glass that appears, disappears or changes
 * frame morphs in and out of its neighbours. A plain container on Android,
 * on older iOS and on web.
 */
export function LiquidGlassContainer(
  props: LiquidGlassContainerProps
): React.ReactElement {
  const { spacing, children, ...viewProps } = props;

  return (
    <NativeLiquidGlassContainer spacing={spacing ?? -1} {...viewProps}>
      {children}
    </NativeLiquidGlassContainer>
  );
}
