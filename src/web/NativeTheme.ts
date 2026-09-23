// web/NativeTheme.ts
import { useLayoutEffect } from 'react';

import type { NativeTheme } from '../NativeTheme';
import { cssColor, setThemePrimary } from './shared';

/**
 * Applies the theme's brand color to the web components (filled buttons, the
 * selected segment, focus rings and the browser's own controls through
 * `accent-color`). Pass `null` to restore the default.
 */
export function setNativeTheme(theme: NativeTheme | null): void {
  setThemePrimary(theme ? cssColor(theme.colors.primary) : undefined);
}

/** Keeps the web components' brand color in sync with `theme`. */
export function useNativeTheme(theme: NativeTheme | null | undefined): void {
  const primary = theme ? cssColor(theme.colors.primary) : undefined;

  useLayoutEffect(() => {
    setThemePrimary(primary);
  }, [primary]);
}
