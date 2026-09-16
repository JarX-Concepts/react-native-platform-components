// NativeTheme.ts
import { useLayoutEffect } from 'react';
import { processColor, type ColorValue } from 'react-native';

import NativePlatformComponentsTheme from './NativePlatformComponentsTheme';

/**
 * The part of an app theme that is applied to the native platform theme. A
 * React Navigation theme has this shape, so it can be passed as is.
 */
export type NativeTheme = {
  colors: {
    /**
     * Brand color. Android generates a Material 3 color scheme from it for
     * light and dark mode (Android 13+); iOS uses it as the tint color.
     */
    primary: ColorValue;
  };
};

function applyProcessedPrimary(primary: unknown): void {
  NativePlatformComponentsTheme?.setTheme(primary == null ? {} : { primary });
}

/**
 * Applies the theme's brand color to the native platform theme, app-wide:
 * these components and other native views that use the theme colors (the
 * window tint color on iOS, the Material theme on Android). Pass `null` to
 * restore the app's own theme colors.
 *
 * Light and dark mode follow the native appearance; use
 * `Appearance.setColorScheme` to change it from JavaScript.
 */
export function setNativeTheme(theme: NativeTheme | null): void {
  applyProcessedPrimary(theme ? processColor(theme.colors.primary) : null);
}

/**
 * Keeps the native platform theme's brand color in sync with `theme`. Call it
 * once, near the root of the app. See {@link setNativeTheme}.
 */
export function useNativeTheme(theme: NativeTheme | null | undefined): void {
  // Processed colors are numbers or plain objects (PlatformColor,
  // DynamicColorIOS); compare them by value so a theme object recreated on
  // every render does not re-apply the same color.
  const primary = JSON.stringify(
    theme ? (processColor(theme.colors.primary) ?? null) : null
  );

  useLayoutEffect(() => {
    applyProcessedPrimary(JSON.parse(primary));
  }, [primary]);
}
