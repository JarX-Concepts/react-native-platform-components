// progressIndicatorSupport.ts
//
// Helpers shared by the native, web and Jest ProgressIndicator.
import type { AccessibilityState, AccessibilityValue } from 'react-native';

import type {
  ProgressIndicatorSize,
  ProgressIndicatorVariant,
} from './ProgressIndicator';

/** `progress` clamped to 0–1, or `undefined` (indeterminate) when it isn't a number. */
export function normalizeProgress(
  progress: number | null | undefined
): number | undefined {
  if (typeof progress !== 'number' || Number.isNaN(progress)) return undefined;
  return Math.min(1, Math.max(0, progress));
}

/** The segment count to draw: at least 2, else 0 (one bar). */
export function normalizeSegments(segments: number | undefined): number {
  if (typeof segments !== 'number' || !Number.isFinite(segments)) return 0;
  const count = Math.floor(segments);
  return count >= 2 ? count : 0;
}

/**
 * The progress read out by screen readers: 0–100 for a determinate
 * indicator, nothing for an indeterminate one, which is busy instead.
 * Except on Android: React Native appends the busy state to the content
 * description there, so the view's label would no longer be the
 * `accessibilityLabel`; TalkBack announces it as a progress bar.
 */
export function progressAccessibility(
  progress: number | undefined,
  os: string
): {
  accessibilityValue: AccessibilityValue | undefined;
  accessibilityState: AccessibilityState;
} {
  if (progress === undefined) {
    return {
      accessibilityValue: undefined,
      accessibilityState: os === 'android' ? {} : { busy: true },
    };
  }
  return {
    accessibilityValue: { min: 0, max: 100, now: Math.round(progress * 100) },
    accessibilityState: { busy: false },
  };
}

/**
 * The view's default size, which a `style` width or height overrides: the
 * platform's own size for each variant (see the ProgressIndicator docs).
 * A linear bar only gets a height; it takes the width of its container.
 */
export function defaultProgressIndicatorStyle(
  os: string,
  variant: ProgressIndicatorVariant,
  size: ProgressIndicatorSize | undefined,
  indeterminate: boolean,
  wavy: boolean
): { width?: number; height: number } {
  if (os === 'ios') {
    if (variant === 'linear') {
      // UIProgressView is 4pt tall. iOS has no indeterminate bar: the
      // spinner stands in for it, so the view is the spinner's height then.
      return { height: indeterminate ? 20 : 4 };
    }
    // UIActivityIndicatorView .medium (20pt) and .large (37pt); the
    // determinate ring takes the same sizes
    const side = size === 'large' ? 37 : 20;
    return { width: side, height: side };
  }
  if (os === 'android') {
    if (variant === 'linear') {
      // 4dp track; the Expressive wave adds its 3dp amplitude above and below
      return { height: wavy ? 10 : 4 };
    }
    if (variant === 'loading') return { width: 48, height: 48 };
    // Material ExtraSmall (20dp + 2dp inset) and the default (40dp + 4dp inset)
    const side = size === 'small' ? 24 : 48;
    return { width: side, height: side };
  }
  // Web
  if (variant === 'linear') return { height: 4 };
  if (variant === 'loading') return { width: 48, height: 48 };
  const side = size === 'small' ? 20 : 40;
  return { width: side, height: side };
}
