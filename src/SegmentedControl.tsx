// SegmentedControl.tsx
import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import NativeSegmentedControl, {
  type SegmentedControlSelectEvent,
} from './SegmentedControlNativeComponent';

// Android: Minimum height to ensure visibility.
// Fabric's shadow node measurement isn't being called on initial render,
// so we apply a minHeight that matches Material design touch target guidelines.
const ANDROID_MIN_HEIGHT = 48;

export interface SegmentedControlSegmentProps {
  /** Display label for the segment */
  label: string;

  /** Unique value identifier for the segment */
  value: string;

  /** Whether this specific segment is disabled */
  disabled?: boolean;

  /** Optional SF Symbol name (iOS) or drawable resource name (Android) */
  icon?: string;
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

  /** Whether the entire control is disabled */
  disabled?: boolean;

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
     * Selected segment tint color (hex string, e.g., "#007AFF")
     */
    selectedSegmentTintColor?: string;
  };

  /**
   * Android-specific configuration
   */
  android?: {
    /**
     * Whether one segment must always be selected.
     * Default: false
     */
    selectionRequired?: boolean;
  };

  /** Test identifier */
  testID?: string;
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
    onSelect,
    ios,
    android,
    ...viewProps
  } = props;

  // Normalize segments for native
  const nativeSegments = useMemo(() => {
    return segments.map((seg) => ({
      label: seg.label,
      value: seg.value,
      disabled: seg.disabled ? 'disabled' : 'enabled',
      icon: seg.icon ?? '',
    }));
  }, [segments]);

  const selectedData = useMemo(
    () => normalizeSelectedValue(selectedValue),
    [selectedValue]
  );

  const handleSelect = useCallback(
    (e: { nativeEvent: SegmentedControlSelectEvent }) => {
      const { index, value } = e.nativeEvent;
      onSelect?.(value, index);
    },
    [onSelect]
  );

  // Normalize iOS props to native string format
  const nativeIos = useMemo(() => {
    if (!ios) return undefined;
    return {
      momentary: ios.momentary ? 'true' : 'false',
      apportionsSegmentWidthsByContent: ios.apportionsSegmentWidthsByContent
        ? 'true'
        : 'false',
      selectedSegmentTintColor: ios.selectedSegmentTintColor ?? '',
    };
  }, [ios]);

  // Normalize Android props
  const nativeAndroid = useMemo(() => {
    if (!android) return undefined;
    return {
      selectionRequired: android.selectionRequired ? 'true' : 'false',
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
      onSelect={onSelect ? handleSelect : undefined}
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
