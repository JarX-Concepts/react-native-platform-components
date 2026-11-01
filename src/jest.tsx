// jest.tsx
//
// Jest mock of the library, published as `react-native-platform-components/jest`:
//
//   jest.mock('react-native-platform-components', () =>
//     require('react-native-platform-components/jest')
//   );
//
// The native components can't render under Jest, so each one is rebuilt from
// React Native primitives (TextInput, Pressable, Text, View) that
// @testing-library/react-native can query and drive. Props are typed against
// the real components, and the pure helpers are the real ones.

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

import type { ActionSheetProps } from './ActionSheet';
import type { DialogProps } from './Dialog';
import type { ButtonProps } from './Button';
import type { ButtonGroupProps } from './ButtonGroup';
import type { ChipProps } from './Chip';
import type { ChipGroupProps } from './ChipGroup';
import type { CheckboxProps } from './Checkbox';
import type { RadioGroupProps } from './RadioGroup';
import type { ContextMenuAction, ContextMenuProps } from './ContextMenu';
import type { DatePickerProps, DateRangePickerProps } from './DatePicker';
import type { FloatingActionButtonProps } from './FloatingActionButton';
import type { FloatingToolbarProps } from './FloatingToolbar';
import type { GlassDisclosureProps } from './GlassDisclosure';
import type { LiquidGlassProps } from './LiquidGlass';
import type { LiquidGlassContainerProps } from './LiquidGlassContainer';
import type { NavigationRailProps } from './NavigationRail';
import type { NativeTheme } from './NativeTheme';
import type { ProgressIndicatorProps } from './ProgressIndicator';
import type { SegmentedControlProps } from './SegmentedControl';
import type { SelectionMenuProps } from './SelectionMenu';
import type { SplitButtonProps } from './SplitButton';
import type { SwitchProps } from './Switch';
import type { TabBarProps } from './TabBar';
import type {
  TextFieldChangeEvent,
  TextFieldEvent,
  TextFieldProps,
  TextFieldRef,
} from './TextField';
import { resolveIcon } from './icons';
import {
  normalizeProgress,
  progressAccessibility,
} from './progressIndicatorSupport';
import { resolveSubmitBehavior } from './submitBehavior';
import { nextSelection } from './web/ButtonGroup';

export type * from './DatePicker';
export type * from './SelectionMenu';
export type * from './ContextMenu';
export type * from './ActionSheet';
export type * from './Dialog';
export type * from './Button';
export type * from './ButtonGroup';
export type * from './SplitButton';
export type * from './Chip';
export type * from './ChipGroup';
export type * from './Switch';
export type * from './Checkbox';
export type * from './RadioGroup';
export type * from './FloatingToolbar';
export type * from './GlassDisclosure';
export type * from './LiquidGlass';
export type * from './LiquidGlassContainer';
export type * from './TextField';
export type * from './TabBar';
export type * from './FloatingActionButton';
export type * from './NavigationRail';
export type * from './ProgressIndicator';
export type * from './sharedTypes';
export type * from './haptics';
export type * from './NativeTheme';
export type {
  SegmentedControlBadgeStyle,
  SegmentedControlIcon,
  SegmentedControlIconSource,
  SegmentedControlLabelStyle,
  SegmentedControlLabelVisibility,
  SegmentedControlProps,
  SegmentedControlSegmentProps,
} from './SegmentedControl';

export * from './icons';
export * from './labelStyle';

/** Same as the real export: an alias of {@link resolveIcon}. */
export const resolveSegmentIcon = resolveIcon;

/**
 * Props that are handlers but not React Native view props, passed onto a
 * host view so `fireEvent(element, 'select', ...)` can reach them.
 */
function handlers(props: Record<string, unknown>): ViewProps {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') out[key] = value;
  }
  return out as ViewProps;
}

function withText<E extends { nativeEvent: object }>(
  event: unknown,
  extra: object
): E {
  const base = (event ?? {}) as { nativeEvent?: object };
  return { ...base, nativeEvent: { ...base.nativeEvent, ...extra } } as E;
}

// ---------------------------------------------------------------------------
// TextField

/**
 * A `TextInput` carrying `testID`, with the label, prefix, suffix, supporting
 * or error text and character count as `Text`. A trailing icon renders as a
 * button with the test ID `trailingIconTestID`, else
 * `${testID}-trailing-icon`; a leading icon with `leadingIconTestID` renders
 * as a view with that ID. A non-editable field with `onPress` calls it when
 * the input is pressed. The iOS keyboard toolbar's buttons render as
 * buttons with their `testID`, else `${testID}-toolbar-${id}`; Done
 * (`doneTestID`, else `${testID}-toolbar-done`) calls `onBlur`.
 */
export const TextField = forwardRef<TextFieldRef, TextFieldProps>(
  function TextFieldMock(props, ref): React.ReactElement {
    const {
      value,
      defaultValue,
      onChangeText,
      onChange,
      onFocus,
      onBlur,
      onSubmitEditing,
      submitBehavior,
      onSelectionChange,
      selection,
      label,
      placeholder,
      supportingText,
      error,
      prefix,
      suffix,
      leadingIcon,
      trailingIcon,
      onTrailingIconPress,
      leadingIconTestID,
      leadingIconAccessibilityLabel,
      trailingIconTestID,
      trailingIconAccessibilityLabel,
      onPress,
      activeColor,
      outlineColor,
      errorColor,
      containerColor,
      textColor,
      placeholderTextColor,
      maxFontSizeMultiplier,
      textAlign,
      minLines,
      maxLines,
      clearButtonMode,
      passwordToggle,
      showCharacterCount,
      maxLength,
      keyboardType,
      returnKeyType,
      autoCapitalize,
      autoCorrect,
      secureTextEntry,
      multiline,
      editable,
      autoFocus,
      selectTextOnFocus,
      autoComplete,
      keyboardAppearance,
      textStyle,
      accessibilityLabel,
      ios,
      android,
      testID,
      ...viewProps
    } = props;

    const inputRef = useRef<React.ComponentRef<typeof TextInput> | null>(null);
    const focused = useRef(false);
    const eventCount = useRef(0);
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
    const text = value ?? uncontrolled;

    const handleChangeText = useCallback(
      (next: string) => {
        eventCount.current += 1;
        setUncontrolled(next);
        onChange?.(
          withText<TextFieldChangeEvent>(undefined, {
            text: next,
            eventCount: eventCount.current,
          })
        );
        onChangeText?.(next);
      },
      [onChange, onChangeText]
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          focused.current = true;
          inputRef.current?.focus?.();
        },
        blur: () => {
          focused.current = false;
          inputRef.current?.blur?.();
        },
        clear: () => handleChangeText(''),
        isFocused: () => focused.current,
        setSelection: (start: number, end?: number) => {
          inputRef.current?.setSelection?.(start, end ?? start);
        },
      }),
      [handleChangeText]
    );

    const handleFocus = (event: unknown) => {
      focused.current = true;
      onFocus?.(withText<TextFieldEvent>(event, { text }));
    };
    const handleBlur = (event: unknown) => {
      focused.current = false;
      onBlur?.(withText<TextFieldEvent>(event, { text }));
    };
    const handleSubmit = (event: unknown) => {
      onSubmitEditing?.(withText<TextFieldEvent>(event, { text }));
    };

    const helper = typeof error === 'string' && error ? error : supportingText;
    const toolbar = ios?.keyboardToolbar;

    return (
      <View {...viewProps}>
        {label ? <Text>{label}</Text> : null}
        {leadingIconTestID ? (
          <View
            testID={leadingIconTestID}
            accessibilityLabel={leadingIconAccessibilityLabel}
          />
        ) : null}
        {prefix ? <Text>{prefix}</Text> : null}
        <TextInput
          ref={inputRef}
          testID={testID}
          value={text}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          submitBehavior={resolveSubmitBehavior(submitBehavior, multiline)}
          selection={
            selection
              ? {
                  start: selection.start,
                  end: selection.end ?? selection.start,
                }
              : undefined
          }
          onSelectionChange={onSelectionChange}
          placeholder={placeholder}
          editable={editable}
          onPress={editable === false ? onPress : undefined}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          selectTextOnFocus={selectTextOnFocus}
          autoComplete={autoComplete}
          keyboardAppearance={keyboardAppearance}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: editable === false }}
          aria-invalid={error ? true : undefined}
        />
        {suffix ? <Text>{suffix}</Text> : null}
        {trailingIcon || onTrailingIconPress ? (
          <Pressable
            testID={
              trailingIconTestID ??
              (testID ? `${testID}-trailing-icon` : undefined)
            }
            accessibilityLabel={trailingIconAccessibilityLabel}
            accessibilityRole="button"
            onPress={() => onTrailingIconPress?.()}
          />
        ) : null}
        {helper ? <Text>{helper}</Text> : null}
        {toolbar?.items?.map((item, index) =>
          item === 'flexibleSpace' ? null : (
            <Pressable
              key={`${item.id}-${index}`}
              testID={
                item.testID ??
                (testID ? `${testID}-toolbar-${item.id}` : undefined)
              }
              accessibilityLabel={item.accessibilityLabel ?? item.title}
              accessibilityRole="button"
              onPress={() => toolbar.onItemPress?.(item.id)}
            />
          )
        )}
        {toolbar?.done ? (
          <Pressable
            testID={
              toolbar.doneTestID ??
              (testID ? `${testID}-toolbar-done` : undefined)
            }
            accessibilityLabel={
              typeof toolbar.done === 'string' ? toolbar.done : 'Done'
            }
            accessibilityRole="button"
            onPress={() => {
              focused.current = false;
              onBlur?.(withText<TextFieldEvent>(undefined, { text }));
            }}
          />
        ) : null}
        {showCharacterCount ? (
          <Text>
            {maxLength ? `${text.length} / ${maxLength}` : `${text.length}`}
          </Text>
        ) : null}
      </View>
    );
  }
);

TextField.displayName = 'TextField';

// ---------------------------------------------------------------------------
// Button, ButtonGroup, SegmentedControl

/**
 * A `Pressable` with the button role and the label as `Text`. While
 * `loading` it ignores presses and reports `busy`. With `selected` it is a
 * `togglebutton` (`accessibilityState.checked`) and a press calls
 * `onSelectedChange(!selected)`. A button with a `menu` doesn't call
 * `onPress`; `fireEvent(button, 'menuSelect', id, title)`, `'menuOpen'` and
 * `'menuClose'` reach the menu callbacks.
 */
export function Button(props: ButtonProps): React.ReactElement {
  const {
    label,
    icon,
    iconPosition,
    variant,
    size,
    shape,
    cornerRadius,
    disabled,
    loading,
    color,
    tintColor,
    disabledColor,
    disabledTintColor,
    labelStyle,
    maxFontSizeMultiplier,
    accessibilityLabel,
    accessibilityState,
    haptics,
    onPress,
    selected,
    onSelectedChange,
    menu,
    onMenuSelect,
    onMenuOpen,
    onMenuClose,
    ios,
    android,
    ...viewProps
  } = props;

  const isToggle = selected !== undefined;
  const hasMenu = !!menu && menu.length > 0;

  return (
    <Pressable
      {...viewProps}
      {...handlers({ onMenuSelect, onMenuOpen, onMenuClose })}
      accessibilityRole={isToggle && !hasMenu ? 'togglebutton' : 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{
        ...accessibilityState,
        disabled: !!disabled,
        busy: loading ? true : accessibilityState?.busy,
        ...(isToggle ? { checked: selected } : null),
      }}
      disabled={disabled || loading}
      onPress={() => {
        if (hasMenu) return;
        if (isToggle) onSelectedChange?.(!selected);
        onPress?.();
      }}
    >
      {label ? <Text>{label}</Text> : null}
    </Pressable>
  );
}

/**
 * A `Pressable` with the button role, labeled by `accessibilityLabel` or
 * `label`, showing the label as `Text` while extended.
 */
export function FloatingActionButton(
  props: FloatingActionButtonProps
): React.ReactElement {
  const {
    icon,
    label,
    extended,
    size,
    color,
    tintColor,
    disabled,
    accessibilityLabel,
    haptics,
    onPress,
    scrollViewNativeID,
    accessibilityState,
    ...viewProps
  } = props;

  return (
    <Pressable
      {...viewProps}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onPress?.()}
    >
      {label && extended !== false ? <Text>{label}</Text> : null}
    </Pressable>
  );
}

/**
 * A view of `Pressable`s, one per button, with the button's `testID`, else
 * `${testID}-${value}`. Selection follows the native rules.
 */
export function ButtonGroup(props: ButtonGroupProps): React.ReactElement {
  const {
    buttons,
    selection = 'none',
    selectedValues = [],
    selectionRequired,
    disabled,
    onPress,
    onSelectionChange,
    testID,
    variant,
    size,
    shape,
    connected,
    spacing,
    color,
    tintColor,
    labelStyle,
    overflow,
    haptics,
    android,
    ...viewProps
  } = props;

  const selected =
    selection === 'single' ? selectedValues.slice(0, 1) : selectedValues;
  const required = selectionRequired ?? selection === 'single';

  const handlePress = (value: string, index: number) => {
    onPress?.(value, index);
    if (selection === 'none') return;
    const next = nextSelection(
      buttons.map((b) => b.value),
      selected,
      value,
      selection,
      required
    );
    if (next.join('\u0000') !== selected.join('\u0000')) {
      onSelectionChange?.(next);
    }
  };

  return (
    <View {...viewProps} testID={testID} accessibilityRole="toolbar">
      {buttons.map((button, index) => {
        const isDisabled = !!(disabled || button.disabled);
        const isSelected = selected.includes(button.value);
        return (
          <Pressable
            key={button.value}
            testID={
              button.testID ??
              (testID ? `${testID}-${button.value}` : undefined)
            }
            accessibilityRole={selection === 'none' ? 'button' : 'togglebutton'}
            accessibilityLabel={button.accessibilityLabel ?? button.label}
            accessibilityState={{
              disabled: isDisabled,
              ...(selection === 'none' ? null : { checked: isSelected }),
            }}
            disabled={isDisabled}
            onPress={() => handlePress(button.value, index)}
          >
            {button.label ? <Text>{button.label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chip, ChipGroup

/**
 * One chip: a `Pressable` with the label as `Text` (a `togglebutton` with
 * `accessibilityState.checked` when selectable), and beside it, when it has a
 * close icon, a close `Pressable` labeled "Remove {label}".
 */
function MockChip(props: {
  label: string;
  selected: boolean | undefined;
  closeIcon: boolean;
  disabled: boolean;
  accessibilityLabel: string | undefined;
  closeAccessibilityLabel: string | undefined;
  testID: string | undefined;
  closeTestID: string | undefined;
  onPress: () => void;
  onClose: () => void;
}): React.ReactElement {
  const selectable = props.selected !== undefined;
  return (
    <View>
      <Pressable
        testID={props.testID}
        accessibilityRole={selectable ? 'togglebutton' : 'button'}
        accessibilityLabel={props.accessibilityLabel ?? props.label}
        accessibilityState={{
          disabled: props.disabled,
          ...(selectable ? { checked: props.selected } : null),
        }}
        disabled={props.disabled}
        onPress={props.onPress}
      >
        <Text>{props.label}</Text>
      </Pressable>
      {props.closeIcon ? (
        <Pressable
          testID={props.closeTestID}
          accessibilityRole="button"
          accessibilityLabel={
            props.closeAccessibilityLabel ?? `Remove ${props.label}`
          }
          accessibilityState={{ disabled: props.disabled }}
          disabled={props.disabled}
          onPress={props.onClose}
        />
      ) : null}
    </View>
  );
}

/**
 * A chip `Pressable` carrying `testID`, plus a close `Pressable` with
 * `closeTestID` (else `${testID}-close`) when it has a close icon. Pressing
 * the chip calls `onPress`; it doesn't change `selected`, which stays
 * controlled.
 */
export function Chip(props: ChipProps): React.ReactElement {
  const {
    label,
    icon,
    variant,
    selected,
    onPress,
    closeIcon,
    onClose,
    closeAccessibilityLabel,
    disabled,
    haptics,
    maxFontSizeMultiplier,
    minHeight,
    paddingHorizontal,
    accessibilityLabel,
    testID,
    closeTestID,
    ...viewProps
  } = props;

  return (
    <View {...viewProps}>
      <MockChip
        label={label}
        selected={selected}
        closeIcon={closeIcon ?? onClose !== undefined}
        disabled={!!disabled}
        accessibilityLabel={accessibilityLabel}
        closeAccessibilityLabel={closeAccessibilityLabel}
        testID={testID}
        closeTestID={closeTestID ?? (testID ? `${testID}-close` : undefined)}
        onPress={() => onPress?.()}
        onClose={() => onClose?.()}
      />
    </View>
  );
}

/**
 * A view of chips (see `Chip`), each with its `testID`, else
 * `${testID}-${value}`, and its close `Pressable` with its `closeTestID`,
 * else `${testID}-${value}-close`. Selection follows the native rules.
 */
export function ChipGroup(props: ChipGroupProps): React.ReactElement {
  const {
    chips,
    variant,
    selection = 'none',
    selectedValues = [],
    selectionRequired,
    wrap,
    spacing,
    disabled,
    haptics,
    maxFontSizeMultiplier,
    chipMinHeight,
    chipPaddingHorizontal,
    onPress,
    onSelectionChange,
    onClose,
    testID,
    ...viewProps
  } = props;

  const selected =
    selection === 'single' ? selectedValues.slice(0, 1) : selectedValues;
  const required = selectionRequired ?? selection === 'single';

  const handlePress = (value: string, index: number) => {
    onPress?.(value, index);
    if (selection === 'none') return;
    const next = nextSelection(
      chips.map((c) => c.value),
      selected,
      value,
      selection,
      required
    );
    if (next.join('\u0000') !== selected.join('\u0000')) {
      onSelectionChange?.(next);
    }
  };

  return (
    <View {...viewProps} testID={testID}>
      {chips.map((chip, index) => (
        <MockChip
          key={chip.value}
          label={chip.label}
          selected={
            selection === 'none' ? undefined : selected.includes(chip.value)
          }
          closeIcon={chip.closeIcon ?? onClose !== undefined}
          disabled={!!(disabled || chip.disabled)}
          accessibilityLabel={chip.accessibilityLabel}
          closeAccessibilityLabel={chip.closeAccessibilityLabel}
          testID={
            chip.testID ?? (testID ? `${testID}-${chip.value}` : undefined)
          }
          closeTestID={
            chip.closeTestID ??
            (testID ? `${testID}-${chip.value}-close` : undefined)
          }
          onPress={() => handlePress(chip.value, index)}
          onClose={() => onClose?.(chip.value, index)}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Checkbox, RadioGroup

/**
 * A `Pressable` with the checkbox role, `testID`, the label as `Text` and
 * `accessibilityState.checked` (`'mixed'` when indeterminate), plus the
 * error message as `Text`. Pressing it calls `onCheckedChange` with the
 * state asked for; `checked` stays controlled.
 */
export function Checkbox(props: CheckboxProps): React.ReactElement {
  const {
    checked,
    onCheckedChange,
    label,
    disabled,
    error,
    haptics,
    maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    ...viewProps
  } = props;

  return (
    <View {...viewProps}>
      <Pressable
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{
          disabled: !!disabled,
          checked: checked === 'indeterminate' ? 'mixed' : checked,
        }}
        disabled={disabled}
        onPress={() => onCheckedChange?.(checked !== true)}
      >
        {label ? <Text>{label}</Text> : null}
        {typeof error === 'string' && error ? <Text>{error}</Text> : null}
      </Pressable>
    </View>
  );
}

/**
 * A view with the radiogroup role and `testID`, holding a `Pressable` per
 * option with the radio role, its `testID` (else `${testID}-${value}`), the
 * label and description as `Text` and `accessibilityState.checked`, and the
 * validation message as `Text`. Pressing an option calls `onValueChange`
 * unless it is the chosen one; `value` stays controlled.
 */
export function RadioGroup(props: RadioGroupProps): React.ReactElement {
  const {
    options,
    value,
    onValueChange,
    error,
    disabled,
    haptics,
    maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    ...viewProps
  } = props;

  return (
    <View
      {...viewProps}
      testID={testID}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option, index) => {
        const optionDisabled = !!(disabled || option.disabled);
        const chosen = value === option.value;
        return (
          <Pressable
            key={option.value}
            testID={
              option.testID ??
              (testID ? `${testID}-${option.value}` : undefined)
            }
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ disabled: optionDisabled, checked: chosen }}
            disabled={optionDisabled}
            onPress={() => {
              if (!chosen) onValueChange?.(option.value, index);
            }}
          >
            <Text>{option.label}</Text>
            {option.description ? <Text>{option.description}</Text> : null}
          </Pressable>
        );
      })}
      {typeof error === 'string' && error ? <Text>{error}</Text> : null}
    </View>
  );
}

/**
 * A `Pressable` with the button role, `testID` and the label as `Text`, for
 * the main button. Pressing it calls `onPress`. The menu isn't rendered;
 * `fireEvent(button, 'menuSelect', id, title)`, `'menuOpen'` and
 * `'menuClose'` reach the menu callbacks.
 */
export function SplitButton(props: SplitButtonProps): React.ReactElement {
  const {
    label,
    icon,
    accessibilityLabel,
    menu,
    menuAccessibilityLabel,
    variant,
    size,
    disabled,
    color,
    tintColor,
    labelStyle,
    haptics,
    onPress,
    onMenuSelect,
    onMenuOpen,
    onMenuClose,
    android,
    ...viewProps
  } = props;

  return (
    <Pressable
      {...viewProps}
      {...handlers({ onMenuSelect, onMenuOpen, onMenuClose })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onPress?.()}
    >
      {label ? <Text>{label}</Text> : null}
    </Pressable>
  );
}

/**
 * A `tablist` view of `Pressable` tabs (at most five), each with its
 * `testID`, else `${testID}-${value}`. Pressing a tab calls `onSelect`, or
 * `onReselect` when it is the selected one. The `accessory` renders before
 * the tab list.
 */
export function TabBar(props: TabBarProps): React.ReactElement {
  const {
    items,
    selectedValue,
    onSelect,
    onReselect,
    testID,
    labelVisibility,
    activeTintColor,
    inactiveTintColor,
    barColor,
    badgeStyle,
    labelStyle,
    maxFontSizeMultiplier,
    minimizeBehavior,
    scrollViewNativeID,
    accessory,
    onAccessoryEnvironmentChange,
    haptics,
    android,
    ...viewProps
  } = props;

  return (
    <>
      {accessory}
      <View {...viewProps} testID={testID} accessibilityRole="tablist">
        {items.slice(0, 5).map((item, index) => {
          const selected = item.value === selectedValue;
          return (
            <Pressable
              key={item.value}
              testID={
                item.testID ?? (testID ? `${testID}-${item.value}` : undefined)
              }
              accessibilityRole="tab"
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              accessibilityState={{ selected, disabled: !!item.disabled }}
              disabled={item.disabled}
              onPress={() =>
                selected
                  ? onReselect?.(item.value, index)
                  : onSelect?.(item.value, index)
              }
            >
              <Text>{item.label}</Text>
              {item.badge != null && item.badge !== '' ? (
                <Text>{String(item.badge)}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

/**
 * A vertical `tablist` view carrying `testID`: the header, then a
 * `Pressable` per destination with its `testID`, else `${testID}-${value}`.
 * Pressing a destination calls `onSelect`, or `onReselect` when it is the
 * selected one.
 */
export function NavigationRail(props: NavigationRailProps): React.ReactElement {
  const {
    items,
    selectedValue,
    onSelect,
    onReselect,
    haptics,
    header,
    testID,
    labelVisibility,
    menuGravity,
    expanded,
    activeTintColor,
    inactiveTintColor,
    railColor,
    badgeStyle,
    labelStyle,
    maxFontSizeMultiplier,
    android,
    ...viewProps
  } = props;

  return (
    <View {...viewProps} testID={testID}>
      {header}
      <View accessibilityRole="tablist">
        {items.map((item, index) => {
          const selected = item.value === selectedValue;
          return (
            <Pressable
              key={item.value}
              testID={
                item.testID ?? (testID ? `${testID}-${item.value}` : undefined)
              }
              accessibilityRole="tab"
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              accessibilityState={{ selected, disabled: !!item.disabled }}
              disabled={item.disabled}
              onPress={() =>
                selected
                  ? onReselect?.(item.value, index)
                  : onSelect?.(item.value, index)
              }
            >
              <Text>{item.label}</Text>
              {item.badge != null && item.badge !== '' ? (
                <Text>{String(item.badge)}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * A view of `Pressable` tabs, one per segment, with the test ID
 * `${testID}-${value}`. Pressing an unselected segment calls `onSelect`;
 * pressing the selected one calls `onDeselect` only when
 * `android.selectionRequired` is `false`.
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
    testID,
    haptics,
    ios,
    android,
    labelVisibility,
    selectedSegmentColor,
    activeTintColor,
    inactiveTintColor,
    labelStyle,
    maxFontSizeMultiplier,
    badgeStyle,
    minHeight,
    ...viewProps
  } = props;

  const handlePress = (value: string, index: number) => {
    if (value !== selectedValue || ios?.momentary) {
      onSelect?.(value, index);
    } else if (android?.selectionRequired === false) {
      onDeselect?.();
    }
  };

  return (
    <View {...viewProps} testID={testID} accessibilityRole="tablist">
      {segments.map((segment, index) => {
        const isDisabled = !!(disabled || segment.disabled);
        return (
          <Pressable
            key={segment.value}
            testID={
              segment.testID ??
              (testID ? `${testID}-${segment.value}` : undefined)
            }
            accessibilityRole="tab"
            accessibilityLabel={segment.accessibilityLabel ?? segment.label}
            accessibilityState={{
              selected: segment.value === selectedValue,
              disabled: isDisabled,
            }}
            disabled={isDisabled}
            onPress={() => handlePress(segment.value, index)}
          >
            <Text>{segment.label}</Text>
            {segment.badge != null && segment.badge !== '' ? (
              <Text>{String(segment.badge)}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Switch

/**
 * A `Pressable` with the switch role, `testID`, the label as `Text` and
 * `accessibilityState.checked`. Pressing it calls `onValueChange` with the
 * other value, and `fireEvent(element, 'valueChange', true)` works as with
 * React Native's `Switch`. The value stays controlled: the mock shows
 * `value` only.
 */
export function Switch(props: SwitchProps): React.ReactElement {
  const {
    value = false,
    onValueChange,
    disabled,
    label,
    color,
    trackColor,
    thumbColor,
    haptics,
    maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    android,
    ...viewProps
  } = props;

  return (
    <Pressable
      {...viewProps}
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      {...handlers({ onValueChange })}
    >
      {label ? <Text>{label}</Text> : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Pickers and menus

/**
 * A view carrying `testID`. Its handlers are on the view, so
 * `fireEvent(picker, 'confirm', date, true, 0)` and `fireEvent(picker, 'closed')`
 * reach `onConfirm` and `onClosed` (the third `confirm` argument is
 * `durationSeconds`: pass the duration for `countDownTimer`, 0 otherwise).
 */
export function DatePicker(props: DatePickerProps): React.ReactElement {
  const { style, testID, onConfirm, onClosed } = props;
  return (
    <View
      style={style}
      testID={testID}
      {...handlers({ onConfirm, onClosed })}
    />
  );
}

/**
 * A view with `testID` that takes `onConfirm` (with `{ startDate, endDate }`)
 * and `onClosed` through `fireEvent`. The mock renders on every platform.
 */
export function DateRangePicker(
  props: DateRangePickerProps
): React.ReactElement {
  const { style, testID, onConfirm, onClosed } = props;
  return (
    <View
      style={style}
      testID={testID}
      {...handlers({ onConfirm, onClosed })}
    />
  );
}

/** The mock renders `DateRangePicker` everywhere. */
export const isDateRangePickerSupported: boolean = true;

/**
 * Embedded: a view holding the field, an accessible view with the `button`
 * role carrying `testID` that shows the selected option's label (or the
 * placeholder) and is labeled by it, or by `accessibilityLabel` with the
 * shown text as its value, as on a device. Modal: a view carrying `testID`
 * that shows the same text. While the menu is open (embedded, or modal with
 * `visible`), each option is a `Pressable` with the test ID
 * `${testID}-${data}` that calls `onSelect` and shows its label and subtitle.
 * `fireEvent(menu, 'select', data, label, index)` and
 * `fireEvent(menu, 'requestClose')` also work.
 */
export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    options,
    selected,
    disabled,
    placeholder,
    presentation,
    visible,
    haptics,
    onSelect,
    onRequestClose,
    testID,
    accessibilityLabel,
    minFieldHeight,
    fieldPaddingHorizontal,
    ios,
    android,
    ...viewProps
  } = props;

  const current = options.find((option) => option.data === selected);
  const embedded = presentation === 'embedded';
  const open = embedded || !!visible;
  const shown = current ? current.label : placeholder;
  const text = shown ? <Text>{shown}</Text> : null;

  return (
    <View
      {...viewProps}
      testID={embedded ? undefined : testID}
      accessibilityLabel={embedded ? undefined : accessibilityLabel}
      accessibilityState={
        embedded ? undefined : { disabled: !!disabled, expanded: open }
      }
      {...handlers({ onSelect, onRequestClose })}
    >
      {embedded ? (
        <View
          testID={testID}
          accessible
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? shown}
          accessibilityValue={
            accessibilityLabel && shown ? { text: shown } : undefined
          }
          accessibilityState={{ disabled: !!disabled, expanded: open }}
        >
          {text}
        </View>
      ) : (
        text
      )}
      {open && !disabled
        ? options.map((option, index) => (
            <Pressable
              key={option.data}
              testID={testID ? `${testID}-${option.data}` : undefined}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: option.data === selected }}
              onPress={() => onSelect?.(option.data, option.label, index)}
            >
              <Text>{option.label}</Text>
              {option.subtitle ? <Text>{option.subtitle}</Text> : null}
            </Pressable>
          ))
        : null}
    </View>
  );
}

/**
 * Its children in a view carrying `testID`. While `visible` (or the
 * deprecated `android.visible`) is true, each action follows them as a
 * `Pressable` with the `menuitem` role and the action's `testID` (else
 * `${testID}-${id}`) that calls `onPressAction(id, title)`; submenus and
 * sections list their actions. `fireEvent(menu, 'pressAction', id, title)`,
 * `'menuOpen'`, `'menuClose'` and `'previewPress'` reach the callbacks.
 */
export function ContextMenu(props: ContextMenuProps): React.ReactElement {
  const {
    children,
    onPressAction,
    onMenuOpen,
    onMenuClose,
    onPreviewPress,
    title,
    actions,
    disabled,
    trigger,
    visible,
    haptics,
    ios,
    android,
    testID,
    ...viewProps
  } = props;

  const open = !disabled && !!(visible ?? android?.visible);
  const leaves = (list: ContextMenuProps['actions']): ContextMenuAction[] =>
    list.flatMap((action) =>
      action.attributes?.hidden
        ? []
        : action.subactions?.length
          ? leaves(action.subactions)
          : [action]
    );

  return (
    <View
      {...viewProps}
      testID={testID}
      {...handlers({ onPressAction, onMenuOpen, onMenuClose, onPreviewPress })}
    >
      {children}
      {open
        ? leaves(actions).map((action) => (
            <Pressable
              key={action.id}
              testID={
                action.testID ?? (testID ? `${testID}-${action.id}` : undefined)
              }
              accessibilityRole="menuitem"
              accessibilityState={{ disabled: !!action.attributes?.disabled }}
              disabled={action.attributes?.disabled}
              onPress={() => onPressAction?.(action.id, action.title)}
            >
              <Text>{action.title}</Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}

/**
 * Its children in a view carrying `testID`. While `visible`, the title and
 * message show as `Text`, and each shown action is a `Pressable` with its
 * `testID` (else `${testID}-${id}`) that calls `onSelect(id)`; a disabled
 * one ignores presses. A cancel `Pressable` with `cancelTestID` (else
 * `${testID}-cancel`) calls `onCancel`. `fireEvent(sheet, 'select', id)` and
 * `fireEvent(sheet, 'cancel')` also work.
 */
export function ActionSheet(props: ActionSheetProps): React.ReactElement {
  const {
    visible,
    title,
    message,
    actions,
    cancelTitle,
    cancelTestID,
    haptics,
    maxFontSizeMultiplier,
    onSelect,
    onCancel,
    testID,
    children,
    ...viewProps
  } = props;

  return (
    <View
      {...viewProps}
      testID={testID}
      accessibilityState={{ expanded: visible }}
      {...handlers({ onSelect, onCancel })}
    >
      {children}
      {visible ? (
        <View accessibilityRole="menu">
          {title ? <Text>{title}</Text> : null}
          {message ? <Text>{message}</Text> : null}
          {actions
            .filter((action) => !action.attributes?.hidden)
            .map((action) => {
              const disabled = !!action.attributes?.disabled;
              return (
                <Pressable
                  key={action.id}
                  testID={
                    action.testID ??
                    (testID ? `${testID}-${action.id}` : undefined)
                  }
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled }}
                  disabled={disabled}
                  onPress={() => onSelect?.(action.id)}
                >
                  <Text>{action.title}</Text>
                </Pressable>
              );
            })}
          <Pressable
            testID={cancelTestID ?? (testID ? `${testID}-cancel` : undefined)}
            accessibilityRole="button"
            onPress={() => onCancel?.()}
          >
            <Text>{cancelTitle ?? 'Cancel'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/**
 * A view carrying `testID`. While `visible`, the title and message show as
 * `Text`, and each shown action is a `Pressable` with its `testID` (else
 * `${testID}-${id}`): the cancel action calls `onCancel`, the others
 * `onSelect(id)`; a disabled one ignores presses. As on native, `onShow` is
 * called when `visible` turns `true` and `onDismiss` when it turns `false`;
 * the dialog always shows, so `onPresentFailed` is never called.
 * `fireEvent(dialog, 'select', id)`, `'cancel'` and `'presentFailed'` also
 * work.
 */
export function Dialog(props: DialogProps): React.ReactElement {
  const {
    visible,
    title,
    message,
    actions,
    onSelect,
    onCancel,
    onShow,
    onDismiss,
    onPresentFailed,
    testID,
  } = props;

  const callbacks = useRef({ onShow, onDismiss });
  callbacks.current = { onShow, onDismiss };
  const wasVisible = useRef(false);
  useEffect(() => {
    if (visible === wasVisible.current) return;
    wasVisible.current = visible;
    if (visible) callbacks.current.onShow?.();
    else callbacks.current.onDismiss?.();
  }, [visible]);

  const shown = actions.filter((action) => !action.hidden);
  const cancelAction = shown.find((action) => action.role === 'cancel');

  return (
    <View
      testID={testID}
      accessibilityState={{ expanded: visible }}
      {...handlers({ onSelect, onCancel, onPresentFailed })}
    >
      {visible ? (
        <View accessibilityRole="alert">
          {title ? <Text>{title}</Text> : null}
          {message ? <Text>{message}</Text> : null}
          {shown.map((action) => {
            const disabled = !!action.disabled;
            return (
              <Pressable
                key={action.id}
                testID={
                  action.testID ??
                  (testID ? `${testID}-${action.id}` : undefined)
                }
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() =>
                  action === cancelAction ? onCancel?.() : onSelect?.(action.id)
                }
              >
                <Text>{action.title}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Containers

/** A view with the toolbar's children. */
export function FloatingToolbar(
  props: FloatingToolbarProps
): React.ReactElement {
  const {
    orientation,
    color,
    scrollViewNativeID,
    hideOnScroll,
    ios,
    android,
    children,
    ...viewProps
  } = props;
  return <View {...viewProps}>{children}</View>;
}

/**
 * The pill (a button with the title and subtitle), or, while `expanded`, the
 * panel: a close button, `headerRight` and the children. No animation, and
 * no backdrop: tests press the close button (`-close`) to dismiss it.
 */
export function GlassDisclosure(
  props: GlassDisclosureProps
): React.ReactElement {
  const {
    expanded,
    onExpandedChange,
    title,
    subtitle,
    headerRight,
    children,
    style,
    panelStyle,
    backdropColor,
    closeAccessibilityLabel,
    ios,
    fallbackColor,
    testID,
    ...viewProps
  } = props;
  const partID = (part: string) => (testID ? `${testID}-${part}` : undefined);

  return (
    <View testID={testID} {...viewProps}>
      {expanded ? (
        <View testID={partID('panel')}>
          <Pressable
            testID={partID('close')}
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel ?? 'Close'}
            onPress={() => onExpandedChange(false)}
          />
          <Text accessibilityRole="header">{title}</Text>
          {subtitle ? <Text>{subtitle}</Text> : null}
          {headerRight}
          {children}
        </View>
      ) : (
        <Pressable
          testID={partID('pill')}
          accessibilityRole="button"
          accessibilityState={{ expanded: false }}
          onPress={() => onExpandedChange(true)}
        >
          <Text>{title}</Text>
          {subtitle ? <Text>{subtitle}</Text> : null}
        </Pressable>
      )}
    </View>
  );
}

/** A view with its children; a `Pressable` when `onPress` is set. */
export function LiquidGlass(props: LiquidGlassProps): React.ReactElement {
  const {
    cornerRadius,
    cornerStyle,
    ios,
    android,
    onPress,
    children,
    ...viewProps
  } = props;

  if (!onPress) return <View {...viewProps}>{children}</View>;

  return (
    <Pressable
      {...viewProps}
      onPress={(
        event?: NativeSyntheticEvent<{
          locationX?: number;
          locationY?: number;
        }>
      ) =>
        onPress({
          x: event?.nativeEvent?.locationX ?? 0,
          y: event?.nativeEvent?.locationY ?? 0,
        })
      }
    >
      {children}
    </Pressable>
  );
}

/** A view with its children. */
export function LiquidGlassContainer(
  props: LiquidGlassContainerProps
): React.ReactElement {
  const { spacing, children, ...viewProps } = props;
  return <View {...viewProps}>{children}</View>;
}

/** Always `false` under Jest. */
export const isLiquidGlassSupported: boolean = false;

// ---------------------------------------------------------------------------
// ProgressIndicator

/**
 * A `View` with the `progressbar` role, labeled by `accessibilityLabel`,
 * with the progress as its `accessibilityValue` (0–100) or busy while
 * indeterminate.
 */
export function ProgressIndicator(
  props: ProgressIndicatorProps
): React.ReactElement {
  const {
    variant = 'linear',
    progress,
    color: _color,
    trackColor: _trackColor,
    size: _size,
    segments: _segments,
    android: _android,
    ...viewProps
  } = props;
  const value = variant === 'loading' ? undefined : normalizeProgress(progress);
  const { accessibilityValue, accessibilityState } = progressAccessibility(
    value,
    Platform.OS
  );
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={accessibilityValue}
      accessibilityState={accessibilityState}
      {...viewProps}
    />
  );
}

// ---------------------------------------------------------------------------
// Theme

/** No-op under Jest. */
export function setNativeTheme(_theme: NativeTheme | null): void {}

/** No-op under Jest. */
export function useNativeTheme(_theme: NativeTheme | null | undefined): void {}

export { PlatformComponentsProvider } from './PlatformComponentsProvider';
export type {
  PlatformComponentsProviderProps,
  WebComponents,
  WebComponentProps,
} from './webComponents';
