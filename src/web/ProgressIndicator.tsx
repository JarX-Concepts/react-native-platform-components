// web/ProgressIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

import type { ProgressIndicatorProps } from '../ProgressIndicator';
import {
  defaultProgressIndicatorStyle,
  normalizeProgress,
  normalizeSegments,
  progressAccessibility,
} from '../progressIndicatorSupport';
import { cssColor, usePrimaryColor } from './shared';

/** The Web Animations API surface the spinner uses (no DOM lib here). */
type AnimatableElement = {
  animate?: (
    keyframes: object[],
    options: { duration: number; iterations: number; easing?: string }
  ) => { cancel: () => void };
};

/** Material 3's track color: the primary color, faded into the page. */
const trackFor = (primary: string) =>
  `color-mix(in srgb, ${primary} 24%, Canvas)`;

/**
 * The browser's `<progress>` for a linear bar (one per segment), and a
 * CSS ring for the circular and loading variants, spinning while
 * indeterminate. The view carries the `progressbar` role, the label and
 * the value; the elements inside are hidden from assistive technology.
 * `android.wavy` is ignored.
 */
export function ProgressIndicator(
  props: ProgressIndicatorProps
): React.ReactElement {
  const {
    variant = 'linear',
    progress,
    color,
    trackColor,
    size,
    segments,
    android: _android,
    style,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();
  const value = variant === 'loading' ? undefined : normalizeProgress(progress);
  const indicator = cssColor(color) ?? primary;
  const track = cssColor(trackColor) ?? trackFor(primary);
  const { accessibilityValue, accessibilityState } = progressAccessibility(
    value,
    Platform.OS
  );

  // The Web Animations API spins the ring without a stylesheet.
  const spinnerRef = useRef<AnimatableElement | null>(null);
  const spins = variant !== 'linear' && value === undefined;
  useEffect(() => {
    const spinner = spinnerRef.current;
    if (!spins || !spinner?.animate) return undefined;
    const animation = spinner.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 1000, iterations: Infinity, easing: 'linear' }
    );
    return () => animation.cancel();
  }, [spins]);

  let content: React.ReactNode;
  if (variant === 'linear') {
    const count =
      value === undefined ? 1 : Math.max(1, normalizeSegments(segments));
    content = (
      <div
        aria-hidden
        style={{ display: 'flex', gap: 4, width: '100%', height: '100%' }}
      >
        {Array.from({ length: count }, (_, index) => {
          const fill =
            value === undefined
              ? undefined
              : Math.min(1, Math.max(0, value * count - index));
          return (
            <progress
              key={index}
              max={1}
              value={fill}
              style={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                accentColor: indicator,
                backgroundColor: track,
                border: 'none',
                borderRadius: 999,
              }}
            />
          );
        })}
      </div>
    );
  } else {
    // A ring: the determinate one fills clockwise from the top
    // (conic-gradient), the spinning one is three quarters of a circle
    const thickness = variant === 'loading' ? 6 : size === 'small' ? 2.5 : 4;
    const fill = value === undefined ? 0.75 : value;
    const background =
      variant === 'loading' && trackColor === undefined ? 'transparent' : track;
    content = (
      <div
        aria-hidden
        ref={(element) => {
          spinnerRef.current = element as unknown as AnimatableElement;
        }}
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          borderRadius: '50%',
          background: `conic-gradient(${indicator} ${fill * 360}deg, ${background} 0deg)`,
          // Cut the middle out, leaving a ring
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
        }}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={accessibilityValue}
      accessibilityState={accessibilityState}
      {...viewProps}
      style={[
        defaultProgressIndicatorStyle(
          Platform.OS,
          variant,
          size,
          value === undefined,
          false
        ),
        style,
      ]}
    >
      {content}
    </View>
  );
}
