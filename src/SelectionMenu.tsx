// SelectionMenu.tsx
import React, { useCallback, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import NativeSelectionMenu, {
  type SelectionMenuSelectEvent,
  type SelectionMenuVisible,
  type SelectionMenuPresentation,
} from './SelectionMenuNativeComponent';

export type SelectionMenuProps = {
  style?: StyleProp<ViewStyle>;

  options: readonly string[];
  selectedIndex: number;

  disabled?: boolean;
  placeholder?: string;

  /**
   * If true, native renders its own inline anchor and manages open/close internally.
   * If false (default), component is headless and controlled by `visible`.
   */
  inlineMode?: boolean;

  /**
   * Headless mode only (inlineMode === false):
   * controls whether the native menu UI is presented.
   */
  visible?: SelectionMenuVisible;

  /**
   * Headless mode only (inlineMode === false):
   * presentation hint ("auto" | "popover" | "sheet").
   */
  presentation?: SelectionMenuPresentation;

  /**
   * Called when the user selects an option.
   * Receives the selected index and value.
   */
  onSelect?: (index: number, value: string) => void;

  /**
   * Called when the user dismisses without selecting.
   */
  onRequestClose?: () => void;

  /**
   * Pass-through platform props (reserved for future extension).
   */
  ios?: {};
  android?: {};
};

function clampSelectedIndex(
  selectedIndex: number,
  optionsLength: number
): number {
  if (!Number.isFinite(selectedIndex)) return -1;
  const i = Math.trunc(selectedIndex);
  if (i < -1) return -1;
  if (i >= optionsLength) return optionsLength > 0 ? optionsLength - 1 : -1;
  return i;
}

function normalizeVisible(
  inlineMode: boolean | undefined,
  visible: SelectionMenuVisible | undefined
): SelectionMenuVisible | undefined {
  // Inline mode ignores visible; keep it undefined so native isn't spammed.
  if (inlineMode) return undefined;
  return visible ?? 'closed';
}

function normalizePresentation(
  inlineMode: boolean | undefined,
  presentation: SelectionMenuPresentation | undefined
): SelectionMenuPresentation | undefined {
  // Inline mode ignores presentation.
  if (inlineMode) return undefined;
  return presentation ?? 'auto';
}

export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    style,
    options,
    selectedIndex,
    disabled,
    placeholder,
    inlineMode,
    visible,
    presentation,
    onSelect,
    onRequestClose,
    ios,
    android,
  } = props;

  const normalizedSelectedIndex = useMemo(
    () => clampSelectedIndex(selectedIndex, options.length),
    [selectedIndex, options.length]
  );

  const normalizedVisible = useMemo(
    () => normalizeVisible(inlineMode, visible),
    [inlineMode, visible]
  );

  const normalizedPresentation = useMemo(
    () => normalizePresentation(inlineMode, presentation),
    [inlineMode, presentation]
  );

  const handleSelect = useCallback(
    (e: { nativeEvent: SelectionMenuSelectEvent }) => {
      const { index, value } = e.nativeEvent;
      onSelect?.(index, value);
    },
    [onSelect]
  );

  const handleRequestClose = useCallback(() => {
    onRequestClose?.();
  }, [onRequestClose]);

  return (
    <NativeSelectionMenu
      style={style}
      options={options}
      selectedIndex={normalizedSelectedIndex}
      disabled={disabled}
      placeholder={placeholder}
      inlineMode={inlineMode}
      visible={normalizedVisible}
      presentation={normalizedPresentation}
      onSelect={onSelect ? handleSelect : undefined}
      onRequestClose={onRequestClose ? handleRequestClose : undefined}
      ios={ios}
      android={android}
    />
  );
}
