import React, { useCallback } from 'react';
import type {
  NativeSyntheticEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';

import NativeSelectionMenu, {
  type SelectionMenuSelectEvent,
} from './SelectionMenuNativeComponent';

export type SelectionMenuPresentation = 'auto' | 'popover' | 'sheet';

export interface SelectionMenuProps extends ViewProps {
  options: readonly string[];
  selectedIndex: number;

  visible?: 'open' | 'closed';
  disabled?: boolean;
  placeholder?: string;

  ios?: {
    presentation?: SelectionMenuPresentation;
  };

  android?: {
    presentation?: string;
  };

  onSelect?: (index: number, value: string) => void;
  onRequestClose?: () => void;

  style?: StyleProp<ViewStyle>;
}

export function SelectionMenu(props: SelectionMenuProps): React.JSX.Element {
  const {
    options,
    selectedIndex,
    visible = 'closed',
    disabled = false,
    placeholder,
    ios,
    android,
    onSelect,
    onRequestClose,
    style,
    ...rest
  } = props;

  const handleSelect = useCallback(
    (e: NativeSyntheticEvent<SelectionMenuSelectEvent>) => {
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
      {...rest}
      style={style}
      options={options}
      selectedIndex={selectedIndex}
      visible={visible}
      disabled={disabled}
      placeholder={placeholder}
      ios={ios}
      android={android}
      onSelect={handleSelect}
      onRequestClose={handleRequestClose}
    />
  );
}

export default SelectionMenu;
