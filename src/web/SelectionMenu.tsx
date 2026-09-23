// web/SelectionMenu.tsx
import React from 'react';
import { View } from 'react-native';

import type { SelectionMenuProps } from '../SelectionMenu';
import { Dialog } from './Dialog';
import { eventValue, usePrimaryColor } from './shared';

/**
 * `embedded` renders a `<select>`. `modal` stays headless like on native: while
 * `visible`, it opens the options in a `<dialog>`; picking one calls
 * `onSelect`, and Escape or a click outside calls `onRequestClose`.
 */
export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    options,
    selected,
    disabled,
    placeholder,
    presentation = 'modal',
    visible,
    onSelect,
    onRequestClose,
    ios,
    android,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();

  const select = (index: number) => {
    const option = options[index];
    if (option) onSelect?.(option.data, option.label, index);
  };

  if (presentation === 'embedded') {
    return (
      <View {...viewProps}>
        <select
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
        <Dialog label={placeholder} onDismiss={dismiss}>
          <div
            role="listbox"
            aria-label={placeholder}
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
                  {option.label}
                </button>
              );
            })}
          </div>
        </Dialog>
      ) : null}
    </View>
  );
}
