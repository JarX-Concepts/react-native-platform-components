// web/TabBar.tsx
import React from 'react';
import { View } from 'react-native';

import type { TabBarProps } from '../TabBar';
import { Icon } from './Icon';
import { cssColor, cssFont, usePrimaryColor } from './shared';

/**
 * A `tablist` of `<button>` tabs, icon over label, with the selected tab's
 * icon in a pill as on the Material navigation bar.
 */
export function TabBar(props: TabBarProps): React.ReactElement {
  const {
    items,
    selectedValue,
    onSelect,
    onReselect,
    labelVisibility = 'auto',
    activeTintColor,
    inactiveTintColor,
    barColor,
    badgeStyle,
    labelStyle,
    maxFontSizeMultiplier,
    android,
    style,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();
  const activeColor = cssColor(activeTintColor) ?? primary;
  const inactiveColor = cssColor(inactiveTintColor) ?? 'GrayText';

  return (
    <View
      {...viewProps}
      role="tablist"
      style={[
        {
          flexDirection: 'row',
          backgroundColor: cssColor(barColor) ?? 'rgba(118, 118, 128, 0.08)',
        },
        style,
      ]}
    >
      {items.slice(0, 5).map((item, index) => {
        const isSelected = item.value === selectedValue;
        const color = isSelected ? activeColor : inactiveColor;
        const showLabel =
          labelVisibility === 'labeled' ||
          labelVisibility === 'auto' ||
          (labelVisibility === 'selected' && isSelected);
        const icon = isSelected ? (item.selectedIcon ?? item.icon) : item.icon;
        return (
          <button
            key={item.value}
            data-testid={item.testID}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={item.accessibilityLabel ?? item.label}
            disabled={item.disabled}
            onClick={() => {
              if (isSelected) onReselect?.(item.value, index);
              else onSelect?.(item.value, index);
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 4px',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: isSelected ? 600 : 500,
              color,
              backgroundColor: 'transparent',
              outlineColor: primary,
              opacity: item.disabled ? 0.38 : 1,
              cursor: item.disabled ? 'default' : 'pointer',
              ...cssFont(labelStyle),
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'flex',
                padding: '4px 20px',
                borderRadius: 16,
                backgroundColor: isSelected
                  ? (cssColor(android?.indicatorColor) ??
                    'rgba(118, 118, 128, 0.16)')
                  : 'transparent',
              }}
            >
              <Icon icon={icon} color={color} size={24} />
              {item.badge !== undefined ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 12,
                    minWidth: item.badge === '' ? 8 : 16,
                    height: item.badge === '' ? 8 : 16,
                    padding: item.badge === '' ? 0 : '0 4px',
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
                  {item.badge}
                </span>
              ) : null}
            </span>
            {showLabel ? item.label : null}
          </button>
        );
      })}
    </View>
  );
}
