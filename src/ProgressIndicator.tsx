// ProgressIndicator.tsx
import React from 'react';
import { Platform, type ColorValue, type ViewProps } from 'react-native';

import NativeProgressIndicator from './ProgressIndicatorNativeComponent';
import {
  defaultProgressIndicatorStyle,
  normalizeProgress,
  normalizeSegments,
  progressAccessibility,
} from './progressIndicatorSupport';

/**
 * - `linear`: a bar. Android: Material 3 `LinearProgressIndicator`. iOS:
 *   `UIProgressView`; iOS has no indeterminate bar, so an indeterminate
 *   one is the spinner.
 * - `circular`: Android: Material 3 `CircularProgressIndicator`. iOS:
 *   `UIActivityIndicatorView` when indeterminate, a ring when determinate.
 * - `loading`: Android: the Material 3 Expressive `LoadingIndicator` (the
 *   morphing shape), always indeterminate. iOS has no equivalent and shows
 *   the spinner.
 */
export type ProgressIndicatorVariant = 'linear' | 'circular' | 'loading';

/**
 * Size of a circular indicator, mapped onto each platform's own scale.
 *
 * | Size    | iOS                                     | Android                            |
 * | ------- | --------------------------------------- | ---------------------------------- |
 * | `small` | 20pt (`UIActivityIndicatorView.medium`) | 20dp (Material extra small)        |
 * | `large` | 37pt (`UIActivityIndicatorView.large`)  | 40dp (Material default; 48dp wavy) |
 *
 * Default: each platform's default, `small` on iOS and `large` on Android.
 */
export type ProgressIndicatorSize = 'small' | 'large';

export interface ProgressIndicatorAndroidProps {
  /**
   * The Material 3 Expressive wavy indicator: the active part of a linear
   * or circular indicator is drawn as a wave. Default: `false`.
   */
  wavy?: boolean;
}

export interface ProgressIndicatorProps extends ViewProps {
  /** Default: `'linear'`. See {@link ProgressIndicatorVariant}. */
  variant?: ProgressIndicatorVariant;

  /**
   * Progress from 0 to 1. Omit it (or pass `undefined`) for an
   * indeterminate indicator. Changes animate. Ignored by `loading`.
   */
  progress?: number;

  /** Indicator color. Default: the platform's (tint color / Material primary). */
  color?: ColorValue;

  /**
   * Track color: the unfilled part. On Android a `loading` indicator takes
   * it as its container color (the contained loading indicator). Default:
   * the platform's.
   */
  trackColor?: ColorValue;

  /** Size of a `circular` indicator. See {@link ProgressIndicatorSize}. */
  size?: ProgressIndicatorSize;

  /**
   * Splits a determinate `linear` bar into this many segments, for step
   * progress: segment `i` fills as `progress` passes `i / segments`. Each
   * segment is a native bar; on Android each carries Material's stop
   * indicator at its end until it fills. Ignored below 2, by indeterminate
   * bars and by the other variants.
   */
  segments?: number;

  /** Screen-reader label. The progress is read out as its value. */
  accessibilityLabel?: string;

  /** Android-specific props. */
  android?: ProgressIndicatorAndroidProps;

  /** Test identifier, on the view that carries the label and value. */
  testID?: string;
}

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
    android,
    style,
    ...viewProps
  } = props;

  const value = variant === 'loading' ? undefined : normalizeProgress(progress);
  const wavy = android?.wavy === true;
  const { accessibilityValue, accessibilityState } = progressAccessibility(
    value,
    Platform.OS
  );

  return (
    <NativeProgressIndicator
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
          wavy
        ),
        style,
      ]}
      variant={variant}
      progress={value ?? -1}
      color={color}
      trackColor={trackColor}
      size={size ?? ''}
      segments={normalizeSegments(segments)}
      android={{ wavy: wavy ? 'true' : 'false' }}
    />
  );
}
