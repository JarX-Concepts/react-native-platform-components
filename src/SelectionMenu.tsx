// SelectionMenu.tsx
import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, type ViewProps } from 'react-native';

import NativeSelectionMenu, {
  type SelectionMenuOption,
  type SelectionMenuSelectEvent,
} from './SelectionMenuNativeComponent';

import type { AndroidMaterialMode } from './sharedTypes';

export interface SelectionMenuProps extends ViewProps {
  /** Options are label + data (payload) */
  options: readonly SelectionMenuOption[];

  /**
   * Controlled selection by the option's `data`.
   * Use `null` for "no selection".
   */
  selected: string | null;

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
  visible?: boolean;

  /**
   * Called when the user selects an option.
   * Receives the selected `data` payload, plus label/index for convenience.
   */
  onSelect?: (data: string, label: string, index: number) => void;

  /**
   * Called when the user dismisses without selecting.
   */
  onRequestClose?: () => void;

  /**
   * Pass-through platform props.
   */
  ios?: {};

  android?: {
    /** Material preference ("auto" | "m2" | "m3"). */
    material?: AndroidMaterialMode;
  };

  /** Test identifier */
  testID?: string;
}

function normalizeSelectedData(selected: string | null): string {
  return selected ?? '';
}

function normalizeNativeVisible(
  inlineMode: boolean | undefined,
  visible: boolean | undefined
): 'open' | 'closed' | undefined {
  // Inline mode ignores visible; keep it undefined so native isn't spammed.
  if (inlineMode) return undefined;
  return visible ? 'open' : 'closed';
}

export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    style,
    options,
    selected,
    disabled,
    placeholder,
    inlineMode,
    visible,
    onSelect,
    onRequestClose,
    ios,
    android,
    ...viewProps
  } = props;

  const selectedData = useMemo(
    () => normalizeSelectedData(selected),
    [selected]
  );

  const nativeVisible = useMemo(
    () => normalizeNativeVisible(inlineMode, visible),
    [inlineMode, visible]
  );

  const handleSelect = useCallback(
    (e: { nativeEvent: SelectionMenuSelectEvent }) => {
      const { index, label, data } = e.nativeEvent;
      onSelect?.(data, label, index);
    },
    [onSelect]
  );

  const handleRequestClose = useCallback(() => {
    onRequestClose?.();
  }, [onRequestClose]);

  // Keep android prop stable and codegen-friendly (string unions live in native spec).
  const nativeAndroid = useMemo(() => {
    if (!android) return undefined;
    return { material: android.material };
  }, [android]);

  const isAndroidM3Inline =
    android?.material &&
    inlineMode &&
    android.material === 'm3' &&
    Platform.OS === 'android';

  return (
    <NativeSelectionMenu
      style={[style, isAndroidM3Inline && styles.androidInline]}
      options={options}
      selectedData={selectedData}
      interactivity={disabled ? 'disabled' : 'enabled'}
      placeholder={placeholder}
      anchorMode={inlineMode ? 'inline' : 'headless'}
      visible={nativeVisible}
      onSelect={onSelect ? handleSelect : undefined}
      onRequestClose={onRequestClose ? handleRequestClose : undefined}
      ios={ios}
      android={nativeAndroid}
      {...viewProps}
    />
  );
}

const styles = StyleSheet.create({
  androidInline: { minHeight: 60 },
});
