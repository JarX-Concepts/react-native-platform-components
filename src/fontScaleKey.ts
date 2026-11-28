// fontScaleKey.ts
//
// A key for the React Native `Text` this library renders in JS, so a runtime
// text-size change can't leave it at its old size.
//
// React Native before 0.87 re-measures `Text` after a system text-size
// change only in the native commit. The next React commit reuses React's
// retained, clean ParagraphShadowNodes, so unchanged `Text` goes back to its
// old box and draws the new-size text clipped (react/react-native#57512,
// fixed in 0.87 by react/react-native#57246). Remounting the `Text` builds a
// fresh node measured at the new size. The key goes on the `Text` elements
// only, never on a container: refs, focus, Animated values, glass morphs and
// native views stay mounted.
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Whether the running React Native keeps a `Text`'s old size after a
 * runtime font-scale change: 0.86 and earlier. A missing version counts as
 * affected. Web has no such bug.
 */
export function textKeepsStaleFontScale(): boolean {
  if (Platform.OS === 'web') return false;
  const version = (
    Platform.constants as
      { reactNativeVersion?: { major?: number; minor?: number } } | undefined
  )?.reactNativeVersion;
  if (version?.major == null || version.minor == null) return true;
  return version.major === 0 && version.minor < 87;
}

/**
 * The `key` for a stateless `Text`: it changes with the window's font scale
 * where React Native needs the remount, and is constant otherwise.
 */
export function useFontScaleRemountKey(): string {
  const { fontScale } = useWindowDimensions();
  return textKeepsStaleFontScale() ? `fontScale:${fontScale}` : 'text';
}
