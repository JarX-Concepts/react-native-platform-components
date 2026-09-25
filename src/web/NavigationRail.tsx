// web/NavigationRail.tsx
import React from 'react';
import { View } from 'react-native';

import type { NavigationRailProps } from '../NavigationRail';
import { Icon } from './Icon';
import { cssColor, cssFont, usePrimaryColor } from './shared';

const JUSTIFY = { top: 'flex-start', center: 'center', bottom: 'flex-end' };

/**
 * A vertical `tablist` of `<button>` destinations, icon over label (beside it
 * when expanded), with the header above them.
 */
export function NavigationRail(props: NavigationRailProps): React.ReactElement {
  const {
    items,
    selectedValue,
    onSelect,
    onReselect,
    labelVisibility = 'auto',
    menuGravity = 'top',
    expanded,
    header,
    activeTintColor,
    inactiveTintColor,
    railColor,
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
      style={[
        {
          alignItems: expanded ? 'stretch' : 'center',
          width: expanded ? 220 : 96,
          paddingVertical: 12,
          gap: 12,
          backgroundColor: cssColor(railColor),
        },
        style,
      ]}
    >
      {header ? <View style={{ alignItems: 'center' }}>{header}</View> : null}
      <View
        role="tablist"
        aria-orientation="vertical"
        style={{
          flex: 1,
          gap: 4,
          justifyContent: JUSTIFY[menuGravity] as 'flex-start',
        }}
      >
        {items.map((item, index) => {
          const isSelected = item.value === selectedValue;
          const color = isSelected ? activeColor : inactiveColor;
          const showLabel =
            labelVisibility !== 'unlabeled' &&
            (labelVisibility !== 'selected' || isSelected);
          const icon = isSelected
            ? (item.selectedIcon ?? item.icon)
            : item.icon;
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
                display: 'flex',
                flexDirection: expanded ? 'row' : 'column',
                alignItems: 'center',
                gap: expanded ? 12 : 4,
                padding: expanded ? '0 12px' : '4px',
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
                  padding: '4px 16px',
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
                      right: 8,
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
    </View>
  );
}
