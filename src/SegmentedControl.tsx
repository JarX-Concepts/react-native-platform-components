// SegmentedControl.tsx
import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  type ColorValue,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import NativeSegmentedControl, {
  type SegmentedControlSegment as NativeSegment,
  type SegmentedControlSelectEvent,
} from './SegmentedControlNativeComponent';
import {
  resolveIcon,
  type PlatformIcon,
  type PlatformIconSource,
} from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import type { AndroidMaterialStyle } from './sharedTypes';

// Android: Minimum height to ensure visibility.
// Fabric's shadow node measurement isn't being called on initial render,
// so we apply a minHeight that matches Material design touch target guidelines.
const ANDROID_MIN_HEIGHT = 48;

/** A single icon source. Alias of {@link PlatformIconSource}. */
export type SegmentedControlIconSource = PlatformIconSource;

/**
 * An icon for a segment: a single source used on both platforms, or a
 * per-platform pair. Alias of {@link PlatformIcon}.
 */
export type SegmentedControlIcon = PlatformIcon;

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

/** Font for segment labels. Alias of {@link LabelStyle}. */
export type SegmentedControlLabelStyle = LabelStyle;

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

  /**
   * Test identifier of the segment, for E2E taps. iOS: the segment's
   * accessibility element. Android: the segment's button.
   */
  testID?: string;
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

  /**
   * Largest scale the labels may reach with the system text size (Dynamic
   * Type / font scale), as on React Native `Text`. Unset or `0`: no cap.
   */
  maxFontSizeMultiplier?: number;

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

    /**
     * Material style: the Material 3 Expressive connected buttons (default),
     * or the classic Material 3 segmented buttons.
     */
    material?: AndroidMaterialStyle;
  };

  /** Test identifier */
  testID?: string;
}

/** Flattens a segment icon for native. Alias of {@link resolveIcon}. */
export const resolveSegmentIcon = resolveIcon;

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
    maxFontSizeMultiplier,
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
      testID: seg.testID ?? '',
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
  const nativeLabelStyle = useMemo(
    () => normalizeLabelStyle(labelStyle),
    [labelStyle]
  );

  // Normalize Android props
  const nativeAndroid = useMemo(() => {
    if (!android) return undefined;
    return {
      selectionRequired: android.selectionRequired === false ? 'false' : 'true',
      material: android.material ?? 'expressive',
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
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
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
