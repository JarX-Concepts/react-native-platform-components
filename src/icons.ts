// icons.ts
//
// Icon props shared by SegmentedControl, Button and ButtonGroup. Icons are
// resolved on the JS side so native only deals with flat strings.
import {
  Image,
  Platform,
  type ImageRequireSource,
  type ImageURISource,
} from 'react-native';

/**
 * A single icon source.
 *
 * - `string`: shorthand for an SF Symbol name on iOS and a drawable resource
 *   name on Android.
 * - `{ type: 'sfSymbol' }`: an SF Symbol. iOS only; ignored on Android.
 * - `{ type: 'drawable' }`: a drawable from the app's `res/drawable`.
 *   Android only; ignored on iOS.
 * - `{ type: 'image' }`: an image asset (`require('./icon.png')`) or a
 *   `{ uri }` source. Works on both platforms. Images are drawn as tinted
 *   templates unless `tinted` is `false`.
 */
export type PlatformIconSource =
  | string
  | { type: 'sfSymbol'; name: string }
  | { type: 'drawable'; name: string }
  | {
      type: 'image';
      source: ImageRequireSource | ImageURISource;
      tinted?: boolean;
    };

/**
 * An icon: a single source used on both platforms, or a per-platform pair so
 * callers don't need to branch on `Platform.OS`.
 */
export type PlatformIcon =
  | PlatformIconSource
  | {
      ios?: PlatformIconSource;
      android?: PlatformIconSource;
    };

/** The flat icon fields the native specs expect. */
export type NativeIconFields = {
  /** '' | 'sfSymbol' | 'drawable' | 'image' */
  iconType: string;
  /** SF Symbol (iOS) or drawable resource name (Android) */
  iconName: string;
  /** Resolved image URI when iconType === 'image' */
  iconUri: string;
  /** Resolved image scale when iconType === 'image' */
  iconScale: number;
  /** 'true' | 'false': draw the image as a tinted template */
  iconTinted: string;
};

export const NO_ICON: NativeIconFields = {
  iconType: '',
  iconName: '',
  iconUri: '',
  iconScale: 1,
  iconTinted: 'true',
};

function pickIconSource(
  icon: PlatformIcon | undefined
): PlatformIconSource | undefined {
  if (icon === undefined || typeof icon === 'string' || 'type' in icon) {
    return icon;
  }
  return Platform.OS === 'ios' ? icon.ios : icon.android;
}

/**
 * Flattens the public icon shape into the strings native expects, dropping
 * sources that don't apply to the current platform.
 */
export function resolveIcon(icon: PlatformIcon | undefined): NativeIconFields {
  const source = pickIconSource(icon);
  if (source === undefined) return NO_ICON;

  if (typeof source === 'string') {
    if (source.length === 0) return NO_ICON;
    return {
      ...NO_ICON,
      iconType: Platform.OS === 'ios' ? 'sfSymbol' : 'drawable',
      iconName: source,
    };
  }

  switch (source.type) {
    case 'sfSymbol':
      return Platform.OS === 'ios'
        ? { ...NO_ICON, iconType: 'sfSymbol', iconName: source.name }
        : NO_ICON;
    case 'drawable':
      return Platform.OS === 'android'
        ? { ...NO_ICON, iconType: 'drawable', iconName: source.name }
        : NO_ICON;
    case 'image': {
      const resolved = Image.resolveAssetSource(source.source);
      if (!resolved?.uri) return NO_ICON;
      return {
        iconType: 'image',
        iconName: '',
        iconUri: resolved.uri,
        iconScale: resolved.scale > 0 ? resolved.scale : 1,
        iconTinted: source.tinted === false ? 'false' : 'true',
      };
    }
    default:
      return NO_ICON;
  }
}
