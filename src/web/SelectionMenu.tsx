// web/SelectionMenu.tsx
import React from 'react';
import { View } from 'react-native';

import type { SelectionMenuProps } from '../SelectionMenu';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { eventValue, usePrimaryColor } from './shared';

/**
 * `embedded` renders a `<select>` (labels only). `modal` stays headless like on
 * native: while `visible`, it opens the options in a `<dialog>`, with their
 * image icons and subtitles; picking one calls `onSelect`, and Escape or a
 * click outside calls `onRequestClose`. `android.searchable` is ignored.
 */
export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    options,
    selected,
    disabled,
    placeholder,
    accessibilityLabel,
    presentation = 'modal',
    visible,
    onSelect,
    onRequestClose,
    ios,
    android,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();
  const label = accessibilityLabel ?? placeholder ?? 'Select an option';

  const select = (index: number) => {
    const option = options[index];
    if (option) onSelect?.(option.data, option.label, index);
  };

  if (presentation === 'embedded') {
    return (
      <View {...viewProps}>
        <select
          aria-label={label}
          value={selected ?? ''}
          disabled={disabled}
          onChange={(event) => {
            const data = eventValue(event);
            select(options.findIndex((o) => o.data === data));
          }}
          style={{
            boxSizing: 'border-box',
            width: '100%',
            minHeight: 40,
            padding: '0 8px',
            border: '1px solid color-mix(in srgb, CanvasText 30%, transparent)',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 16,
            color: 'inherit',
            backgroundColor: 'transparent',
            accentColor: primary,
          }}
        >
          {selected === null ? (
            <option value="" disabled>
              {placeholder ?? ''}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.data} value={option.data}>
              {option.label}
            </option>
          ))}
        </select>
      </View>
    );
  }

  const dismiss = () => onRequestClose?.();

  return (
    <View {...viewProps}>
      {visible && !disabled ? (
        <Dialog label={label} onDismiss={dismiss}>
          <div
            role="listbox"
            aria-label={label}
            style={{ display: 'flex', flexDirection: 'column', minWidth: 200 }}
          >
            {options.map((option, index) => {
              const isSelected = option.data === selected;
              return (
                <button
                  key={option.data}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  autoFocus={isSelected || (selected === null && index === 0)}
                  onClick={() => select(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 44,
                    padding: '0 12px',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 16,
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'start',
                    color: isSelected ? primary : 'inherit',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <Icon
                    icon={option.icon}
                    color={isSelected ? primary : 'CanvasText'}
                  />
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{option.label}</span>
                    {option.subtitle ? (
                      <span style={{ fontSize: 13, opacity: 0.7 }}>
                        {option.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </Dialog>
      ) : null}
    </View>
  );
}
