// SelectionMenu.tsx
import React, { useCallback, useMemo } from 'react';
import { type ViewProps } from 'react-native';

import NativeSelectionMenu, {
  type SelectionMenuOption,
  type SelectionMenuSelectEvent,
} from './SelectionMenuNativeComponent';

export type { SelectionMenuOption };

import type { AndroidMaterialMode, Presentation } from './sharedTypes';

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
   * Presentation mode:
   * - 'modal' (default): Headless mode, controlled by `visible` prop.
   * - 'embedded': Native renders its own inline anchor and manages open/close internally.
   */
  presentation?: Presentation;

  /**
   * Modal mode only (presentation === 'modal'):
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
    /** Material preference ('system' | 'm3'). */
    material?: AndroidMaterialMode;
  };

  /** Test identifier */
  testID?: string;
}

function normalizeSelectedData(selected: string | null): string {
  return selected ?? '';
}

function normalizeNativeVisible(
  presentation: Presentation | undefined,
  visible: boolean | undefined
): 'open' | 'closed' | undefined {
  // Embedded mode ignores visible; keep it undefined so native isn't spammed.
  if (presentation === 'embedded') return undefined;
  return visible ? 'open' : 'closed';
}

export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    style,
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

  const selectedData = useMemo(
    () => normalizeSelectedData(selected),
    [selected]
  );

  const nativeVisible = useMemo(
    () => normalizeNativeVisible(presentation, visible),
    [presentation, visible]
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

  return (
    <NativeSelectionMenu
      style={style}
      options={options}
      selectedData={selectedData}
      interactivity={disabled ? 'disabled' : 'enabled'}
      placeholder={placeholder}
      anchorMode={presentation === 'embedded' ? 'inline' : 'headless'}
      visible={nativeVisible}
      onSelect={onSelect ? handleSelect : undefined}
      onRequestClose={onRequestClose ? handleRequestClose : undefined}
      ios={ios}
      android={nativeAndroid}
      {...viewProps}
    />
  );
}
