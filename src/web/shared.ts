// web/shared.ts
//
// Helpers shared by the web implementations. The web entry point renders
// through react-native-web: `style` and the rest of the view props go on a
// `View`, and the browser's own controls (`<button>`, `<input>`, `<select>`,
// `<dialog>`) are rendered inside it.
import { useSyncExternalStore } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';

import type { PlatformIcon, PlatformIconSource } from '../icons';
import type { LabelStyle } from '../labelStyle';

/** A CSS style object for a DOM element. */
export type CSSStyle = Record<string, string | number | undefined>;

/** The Material 3 baseline primary color, used until a theme is set. */
const DEFAULT_PRIMARY = '#6750A4';

let themePrimary: string | undefined;
const themeListeners = new Set<() => void>();

/** Sets the brand color the web components use; `undefined` restores the default. */
export function setThemePrimary(primary: string | undefined): void {
  if (primary === themePrimary) return;
  themePrimary = primary;
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

function getThemePrimary(): string {
  return themePrimary ?? DEFAULT_PRIMARY;
}

/** The current brand color, from `setNativeTheme` / `useNativeTheme`. */
export function usePrimaryColor(): string {
  return useSyncExternalStore(subscribeTheme, getThemePrimary, getThemePrimary);
}

/**
 * A color prop as CSS. `PlatformColor` and `DynamicColorIOS` have no web
 * equivalent and fall back to the default.
 */
export function cssColor(color: ColorValue | undefined): string | undefined {
  return typeof color === 'string' ? color : undefined;
}

/** A label font as CSS. */
export function cssFont(labelStyle: LabelStyle | undefined): CSSStyle {
  if (!labelStyle) return {};
  return {
    fontFamily: labelStyle.fontFamily,
    fontSize: labelStyle.fontSize,
    fontWeight: labelStyle.fontWeight,
    fontStyle: labelStyle.fontStyle,
  };
}

/**
 * The image to draw for an icon on web. Only `{ type: 'image' }` sources
 * render: SF Symbols and Android drawables don't exist in a browser.
 */
export function webIcon(
  icon: PlatformIcon | undefined
): { source: ImageSourcePropType; tinted: boolean } | undefined {
  if (icon === undefined || typeof icon === 'string') return undefined;
  const candidates: (PlatformIconSource | undefined)[] =
    'type' in icon ? [icon] : [icon.ios, icon.android];
  for (const source of candidates) {
    if (source && typeof source !== 'string' && source.type === 'image') {
      return { source: source.source, tinted: source.tinted !== false };
    }
  }
  return undefined;
}

const warned = new Set<string>();

function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  return (
    typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  );
}

/** Logs a development warning once per key. */
export function warnOnce(key: string, message: string): void {
  if (warned.has(key) || !isDev()) return;
  warned.add(key);
  console.warn(`react-native-platform-components: ${message}`);
}

/** Resets `warnOnce`; for tests. */
export function resetWarnings(): void {
  warned.clear();
}

/** The value of the form control that fired a DOM event. */
export function eventValue(event: { target: unknown }): string {
  return (event.target as { value: string }).value;
}

/** Styles for the variants shared by Button and ButtonGroup. */
export function buttonColors(
  variant: string,
  primary: string,
  color: string | undefined,
  tintColor: string | undefined
): CSSStyle {
  switch (variant) {
    // Glass is an iOS 26 material; browsers get the Android mapping.
    case 'tonal':
    case 'glass':
      return {
        backgroundColor: color ?? `color-mix(in srgb, ${primary} 18%, Canvas)`,
        color: tintColor ?? 'CanvasText',
        border: 'none',
      };
    case 'outlined':
      return {
        backgroundColor: color ?? 'transparent',
        color: tintColor ?? primary,
        border: '1px solid color-mix(in srgb, CanvasText 30%, transparent)',
      };
    case 'text':
      return {
        backgroundColor: color ?? 'transparent',
        color: tintColor ?? primary,
        border: 'none',
      };
    case 'elevated':
      return {
        backgroundColor: color ?? 'Canvas',
        color: tintColor ?? primary,
        border: 'none',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
      };
    default:
      return {
        backgroundColor: color ?? primary,
        color: tintColor ?? '#fff',
        border: 'none',
      };
  }
}

/** Height and horizontal padding for each button size. */
export const BUTTON_SIZES: Record<
  string,
  { height: number; padding: number; fontSize: number }
> = {
  xsmall: { height: 32, padding: 12, fontSize: 14 },
  small: { height: 40, padding: 16, fontSize: 14 },
  medium: { height: 56, padding: 24, fontSize: 16 },
  large: { height: 96, padding: 48, fontSize: 24 },
  xlarge: { height: 136, padding: 64, fontSize: 32 },
};

/** Base style of a `<button>` rendered by these components. */
export const BUTTON_BASE: CSSStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
