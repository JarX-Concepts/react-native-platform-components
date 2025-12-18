// SelectionMenu.web.tsx
import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type {
  SelectionMenuOption,
  SelectionMenuPresentation,
} from './SelectionMenuNativeComponent';

export type SelectionMenuProps = {
  style?: StyleProp<ViewStyle>;

  options: readonly SelectionMenuOption[];
  selected: string | null;

  disabled?: boolean;
  placeholder?: string;

  // kept for parity; ignored by <select>
  inlineMode?: boolean;
  visible?: boolean;
  presentation?: SelectionMenuPresentation;

  onSelect?: (data: string, label: string, index: number) => void;
  onRequestClose?: () => void;

  ios?: {};
  android?: {};
};

function toCssStyle(
  style: StyleProp<ViewStyle>
): React.CSSProperties | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    const merged: any = {};
    for (const s of style) {
      if (s && typeof s === 'object') Object.assign(merged, s as any);
    }
    return merged as React.CSSProperties;
  }
  if (typeof style === 'object') return style as any;
  return undefined;
}

export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    style,
    options,
    selected,
    disabled,
    placeholder,
    onSelect,
    onRequestClose,
  } = props;

  const cssStyle = useMemo(() => toCssStyle(style), [style]);
  const value = selected ?? '';

  return (
    <select
      style={cssStyle}
      value={value}
      disabled={!!disabled}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        const data = (e.currentTarget as any).value as string;

        // placeholder chosen (or no selection)
        if (data === '') return;

        const index = options.findIndex((o) => o.data === data);
        const opt = index >= 0 ? options[index] : undefined;

        onSelect?.(data, opt?.label ?? '', index);
      }}
      onBlur={() => {
        onRequestClose?.();
      }}
    >
      {placeholder ? (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      ) : null}

      {options.map((opt, idx) => (
        <option key={`${opt.data}-${idx}`} value={opt.data}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
