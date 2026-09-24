// web/SegmentedControl.tsx
import React from 'react';
import { View } from 'react-native';

import type { SegmentedControlProps } from '../SegmentedControl';
import { Icon } from './Icon';
import { cssColor, cssFont, usePrimaryColor, webIcon } from './shared';

/**
 * A radio group of `<button>`s in a track, like the iOS segmented control.
 * Like iOS, tapping the selected segment keeps it selected.
 */
export function SegmentedControl(
  props: SegmentedControlProps
): React.ReactElement {
  const {
    segments,
    selectedValue,
    onSelect,
    onDeselect,
    disabled,
    labelVisibility = 'auto',
    selectedSegmentColor,
    activeTintColor,
    inactiveTintColor,
    labelStyle,
    maxFontSizeMultiplier,
    badgeStyle,
    ios,
    android,
    style,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();
  const selectedBackground =
    cssColor(selectedSegmentColor) ?? ios?.selectedSegmentTintColor ?? 'Canvas';
  const activeColor = cssColor(activeTintColor) ?? 'CanvasText';
  const inactiveColor = cssColor(inactiveTintColor) ?? 'CanvasText';

  return (
    <View
      {...viewProps}
      role="radiogroup"
      style={[
        {
          flexDirection: 'row',
          padding: 2,
          borderRadius: 9,
          backgroundColor: 'rgba(118, 118, 128, 0.12)',
        },
        style,
      ]}
    >
      {segments.map((segment, index) => {
        const isSelected = segment.value === selectedValue;
        const isDisabled = disabled || segment.disabled;
        const hasIcon = webIcon(segment.icon) !== undefined;
        // Web can show both, so `auto` behaves like `labeled`.
        const showLabel = labelVisibility !== 'unlabeled' || !hasIcon;
        const foreground = isSelected ? activeColor : inactiveColor;
        return (
          <button
            key={segment.value}
            data-testid={segment.testID}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={segment.accessibilityLabel ?? segment.label}
            disabled={isDisabled}
            onClick={() => {
              if (!isSelected) onSelect?.(segment.value, index);
            }}
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 28,
              padding: '0 12px',
              border: 'none',
              borderRadius: 7,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: isSelected ? 600 : 400,
              color: foreground,
              backgroundColor: isSelected ? selectedBackground : 'transparent',
              boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.15)' : 'none',
              outlineColor: primary,
              opacity: isDisabled ? 0.38 : 1,
              cursor: isDisabled || isSelected ? 'default' : 'pointer',
              ...cssFont(labelStyle),
            }}
          >
            <Icon icon={segment.icon} color={foreground} size={16} />
            {showLabel ? segment.label : null}
            {segment.badge !== undefined ? (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  boxSizing: 'border-box',
                  borderRadius: 8,
                  fontSize: 11,
                  lineHeight: '16px',
                  fontWeight: 600,
                  textAlign: 'center',
                  backgroundColor:
                    cssColor(badgeStyle?.backgroundColor) ?? '#FF3B30',
                  color: cssColor(badgeStyle?.color) ?? '#fff',
                }}
              >
                {segment.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </View>
  );
}
