// SegmentedControl.tsx
import React, { useCallback, useMemo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  type ColorValue,
  type ImageRequireSource,
  type ImageURISource,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import NativeSegmentedControl, {
  type SegmentedControlSegment as NativeSegment,
  type SegmentedControlSelectEvent,
} from './SegmentedControlNativeComponent';

// Android: Minimum height to ensure visibility.
// Fabric's shadow node measurement isn't being called on initial render,
// so we apply a minHeight that matches Material design touch target guidelines.
const ANDROID_MIN_HEIGHT = 48;

/**
 * A single icon source.
 *
 * - `string`: shorthand for an SF Symbol name on iOS and a drawable resource
 *   name on Android (the original API).
 * - `{ type: 'sfSymbol' }`: an SF Symbol. iOS only; ignored on Android.
 * - `{ type: 'drawable' }`: a drawable from the app's `res/drawable`.
 *   Android only; ignored on iOS.
 * - `{ type: 'image' }`: an image asset (`require('./icon.png')`) or a
 *   `{ uri }` source. Works on both platforms. Images are drawn as tinted
 *   templates unless `tinted` is `false`.
 */
export type SegmentedControlIconSource =
  | string
  | { type: 'sfSymbol'; name: string }
  | { type: 'drawable'; name: string }
  | {
      type: 'image';
      source: ImageRequireSource | ImageURISource;
      tinted?: boolean;
    };

/**
 * An icon for a segment: a single source used on both platforms, or a
 * per-platform pair so callers don't need to branch on `Platform.OS`.
 */
export type SegmentedControlIcon =
  | SegmentedControlIconSource
  | {
      ios?: SegmentedControlIconSource;
      android?: SegmentedControlIconSource;
    };

/**
 * How labels and icons combine for segments that have an icon.
 *
 * - `auto` (default): platform behavior. iOS shows the icon in place of the
 *   label (UISegmentedControl cannot show both); Android shows icon and label.
 * - `labeled`: always show the label. iOS drops the icon; Android shows both.
 * - `unlabeled`: show only the icon. Segments without an icon still show
 *   their label. Screen readers still announce the label on both platforms.
 */
export type SegmentedControlLabelVisibility = 'auto' | 'labeled' | 'unlabeled';

/**
 * Font for segment labels. Each field falls back to the platform default.
 */
export interface SegmentedControlLabelStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  fontStyle?: 'normal' | 'italic';
}

/**
 * Badge colors. Both default to the platform look (red with white text).
 */
export interface SegmentedControlBadgeStyle {
  backgroundColor?: ColorValue;
  color?: ColorValue;
}

export interface SegmentedControlSegmentProps {
  /** Display label for the segment */
  label: string;

  /** Unique value identifier for the segment */
  value: string;

  /** Whether this specific segment is disabled */
  disabled?: boolean;

  /** Optional icon. See {@link SegmentedControlIcon}. */
  icon?: SegmentedControlIcon;

  /**
   * Badge shown at the segment's top-right corner, e.g. an unread count.
   * Numbers are shown as-is; use `undefined` to hide the badge.
   */
  badge?: string | number;

  /**
   * Screen-reader label. Defaults to `label`.
   * On iOS this applies to segments rendered as icons; text segments are
   * announced by their title.
   */
  accessibilityLabel?: string;
}

export interface SegmentedControlProps extends ViewProps {
  /** Array of segments to display */
  segments: readonly SegmentedControlSegmentProps[];

  /**
   * Currently selected segment value.
   * Use `null` for no selection.
   */
  selectedValue: string | null;

  /**
   * Called when the user selects a segment.
   * @param value - The selected segment's value
   * @param index - The selected segment's index
   */
  onSelect?: (value: string, index: number) => void;

  /**
   * Called when the user clears the selection by tapping the selected segment.
   * Only possible on Android with `android.selectionRequired` set to `false`;
   * iOS never clears a selection from a tap.
   */
  onDeselect?: () => void;

  /** Whether the entire control is disabled */
  disabled?: boolean;

  /**
   * How labels and icons combine. Default: `'auto'`.
   * See {@link SegmentedControlLabelVisibility}.
   */
  labelVisibility?: SegmentedControlLabelVisibility;

  /**
   * Background color of the selected segment.
   * iOS: `selectedSegmentTintColor`. Android: checked button background.
   */
  selectedSegmentColor?: ColorValue;

  /** Text and icon color of the selected segment. */
  activeTintColor?: ColorValue;

  /** Text and icon color of unselected segments. */
  inactiveTintColor?: ColorValue;

  /** Font for segment labels. See {@link SegmentedControlLabelStyle}. */
  labelStyle?: SegmentedControlLabelStyle;

  /** Colors for segment badges. See {@link SegmentedControlBadgeStyle}. */
  badgeStyle?: SegmentedControlBadgeStyle;

  /**
   * iOS-specific configuration
   */
  ios?: {
    /**
     * Momentary mode: segment springs back after touch (no persistent selection)
     * Default: false
     */
    momentary?: boolean;

    /**
     * Whether segment widths are proportional to content
     * Default: false (equal widths)
     */
    apportionsSegmentWidthsByContent?: boolean;

    /**
     * @deprecated Use `selectedSegmentColor`, which works on both platforms.
     */
    selectedSegmentTintColor?: string;
  };

  /**
   * Android-specific configuration
   */
  android?: {
    /**
     * Whether one segment must always be selected. When `false`, tapping the
     * selected segment clears the selection and calls `onDeselect`.
     * Default: true (matches iOS, which cannot clear a selection by tapping)
     */
    selectionRequired?: boolean;

    /** Ripple color shown while pressing a segment. */
    rippleColor?: ColorValue;

    /** Outline color of the segments. */
    strokeColor?: ColorValue;
  };

  /** Test identifier */
  testID?: string;
}

type NativeIconFields = Pick<
  NativeSegment,
  'iconType' | 'iconName' | 'iconUri' | 'iconScale' | 'iconTinted'
>;

const NO_ICON: NativeIconFields = {
  iconType: '',
  iconName: '',
  iconUri: '',
  iconScale: 1,
  iconTinted: 'true',
};

function pickIconSource(
  icon: SegmentedControlIcon | undefined
): SegmentedControlIconSource | undefined {
  if (icon === undefined || typeof icon === 'string' || 'type' in icon) {
    return icon;
  }
  return Platform.OS === 'ios' ? icon.ios : icon.android;
}

/**
 * Flattens the public icon shape into the strings native expects, dropping
 * sources that don't apply to the current platform.
 */
export function resolveSegmentIcon(
  icon: SegmentedControlIcon | undefined
): NativeIconFields {
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

function normalizeSelectedValue(selected: string | null): string {
  return selected ?? '';
}

export function SegmentedControl(
  props: SegmentedControlProps
): React.ReactElement {
  const {
    style,
    segments,
    selectedValue,
    disabled,
    labelVisibility,
    selectedSegmentColor,
    activeTintColor,
    inactiveTintColor,
    labelStyle,
    badgeStyle,
    onSelect,
    onDeselect,
    ios,
    android,
    ...viewProps
  } = props;

  // Normalize segments for native
  const nativeSegments = useMemo((): NativeSegment[] => {
    return segments.map((seg) => ({
      label: seg.label,
      value: seg.value,
      disabled: seg.disabled ? 'disabled' : 'enabled',
      badge:
        seg.badge === undefined || seg.badge === null ? '' : String(seg.badge),
      accessibilityLabel: seg.accessibilityLabel ?? '',
      ...resolveSegmentIcon(seg.icon),
    }));
  }, [segments]);

  const selectedData = useMemo(
    () => normalizeSelectedValue(selectedValue),
    [selectedValue]
  );

  const handleSelect = useCallback(
    (e: { nativeEvent: SegmentedControlSelectEvent }) => {
      const { index, value } = e.nativeEvent;
      // Native reports a cleared selection as index -1 with an empty value.
      if (index < 0) {
        onDeselect?.();
        return;
      }
      onSelect?.(value, index);
    },
    [onSelect, onDeselect]
  );

  // Normalize iOS props to native string format
  const nativeIos = useMemo(() => {
    if (!ios) return undefined;
    return {
      momentary: ios.momentary ? 'true' : 'false',
      apportionsSegmentWidthsByContent: ios.apportionsSegmentWidthsByContent
        ? 'true'
        : 'false',
    };
  }, [ios]);

  // Deprecated iOS-only tint falls back to the cross-platform prop
  const nativeSelectedSegmentColor =
    selectedSegmentColor ??
    (Platform.OS === 'ios' ? ios?.selectedSegmentTintColor : undefined);

  // Normalize the label font; empty / 0 means platform default
  const nativeLabelStyle = useMemo(() => {
    if (!labelStyle) return undefined;
    return {
      fontFamily: labelStyle.fontFamily ?? '',
      fontSize: labelStyle.fontSize ?? 0,
      fontWeight:
        labelStyle.fontWeight === undefined
          ? ''
          : String(labelStyle.fontWeight),
      fontStyle: labelStyle.fontStyle ?? '',
    };
  }, [labelStyle]);

  // Normalize Android props
  const nativeAndroid = useMemo(() => {
    if (!android) return undefined;
    return {
      selectionRequired: android.selectionRequired === false ? 'false' : 'true',
    };
  }, [android]);

  // Merge user style with Android minHeight default
  const mergedStyle = useMemo((): StyleProp<ViewStyle> => {
    if (Platform.OS === 'android') {
      return [styles.androidDefault, style];
    }
    return style;
  }, [style]);

  return (
    <NativeSegmentedControl
      style={mergedStyle}
      segments={nativeSegments}
      selectedValue={selectedData}
      interactivity={disabled ? 'disabled' : 'enabled'}
      labelVisibility={labelVisibility ?? 'auto'}
      selectedSegmentColor={nativeSelectedSegmentColor}
      activeTintColor={activeTintColor}
      inactiveTintColor={inactiveTintColor}
      androidRippleColor={android?.rippleColor}
      androidStrokeColor={android?.strokeColor}
      labelStyle={nativeLabelStyle}
      badgeBackgroundColor={badgeStyle?.backgroundColor}
      badgeTextColor={badgeStyle?.color}
      onSelect={onSelect || onDeselect ? handleSelect : undefined}
      ios={nativeIos}
      android={nativeAndroid}
      {...viewProps}
    />
  );
}

const styles = StyleSheet.create({
  androidDefault: {
    minHeight: ANDROID_MIN_HEIGHT,
  },
});
