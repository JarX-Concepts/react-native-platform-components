// ButtonDemo.tsx
import React, { useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Button,
  ButtonGroup,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
  type ContextMenuAction,
  type Haptics,
  type PlatformIcon,
  SelectionMenu,
  SplitButton,
} from 'react-native-platform-components';
import { Divider, Row, Section, ui } from './DemoUI';

const VARIANTS: ButtonVariant[] = [
  'filled',
  'tonal',
  'outlined',
  'text',
  'elevated',
];

// Haptic played on press; 'default' leaves the prop unset.
const HAPTICS = [
  'default',
  'selection',
  'light',
  'medium',
  'heavy',
  'success',
  'warning',
  'error',
  'none',
].map((value) => ({ label: value, data: value }));

const SIZES: { label: string; value: ButtonSize }[] = [
  { label: 'XS', value: 'xsmall' },
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
  { label: 'XL', value: 'xlarge' },
];

// Icons take a native symbol per platform, or one image asset for both.
const EDIT_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'pencil' },
  android: { type: 'drawable', name: 'edit' },
};
const SEND_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'paperplane' },
  android: { type: 'drawable', name: 'send' },
};
const SHARE_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'square.and.arrow.up' },
  android: { type: 'drawable', name: 'share' },
};
const COPY_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'doc.on.doc' },
  android: { type: 'drawable', name: 'content_copy' },
};
const PASTE_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'doc.on.clipboard' },
  android: { type: 'drawable', name: 'content_paste' },
};
const CUT_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'scissors' },
  android: { type: 'drawable', name: 'cut' },
};
const BELL_ICON: PlatformIcon = {
  type: 'image',
  source: require('./assets/bell.png'),
};
const STAR_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'star' },
  android: { type: 'drawable', name: 'star' },
};
const ALERT_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'bell' },
  android: { type: 'drawable', name: 'notifications' },
};
const SORT_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'arrow.up.arrow.down' },
  android: { type: 'drawable', name: 'sort' },
};

type SortKey = 'name' | 'date' | 'size';
const SORT_KEYS: { id: SortKey; title: string }[] = [
  { id: 'name', title: 'Name' },
  { id: 'date', title: 'Date' },
  { id: 'size', title: 'Size' },
];

// The same items as ContextMenu: a section with checkmarks, a submenu with
// icons and a destructive action
function sortMenu(sortBy: SortKey): ContextMenuAction[] {
  return [
    {
      id: 'sort-by',
      title: 'Sort by',
      displayInline: true,
      subactions: SORT_KEYS.map(({ id, title }) => ({
        id,
        title,
        state: id === sortBy ? 'on' : 'off',
      })),
    },
    {
      id: 'view',
      title: 'View as',
      subactions: [
        {
          id: 'list',
          title: 'List',
          image: { ios: 'list.bullet', android: 'list_bullet' },
        },
        {
          id: 'grid',
          title: 'Grid',
          image: { ios: 'square.grid.2x2', android: 'grid_view' },
        },
      ],
    },
    {
      id: 'reset',
      title: 'Reset',
      image: { ios: 'trash', android: 'delete' },
      attributes: { destructive: true },
    },
  ];
}

// Split button menus
const REPLY_MENU: ContextMenuAction[] = [
  {
    id: 'reply-all',
    title: 'Reply All',
    image: { ios: 'arrowshape.turn.up.left.2', android: 'send' },
  },
  {
    id: 'forward',
    title: 'Forward',
    image: { ios: 'arrowshape.turn.up.right', android: 'share' },
  },
  {
    id: 'delete',
    title: 'Delete',
    image: { ios: 'trash', android: 'delete' },
    attributes: { destructive: true },
  },
];
const SAVE_MENU: ContextMenuAction[] = [
  { id: 'save-as', title: 'Save As…' },
  { id: 'duplicate', title: 'Duplicate' },
];
const EXPORT_MENU: ContextMenuAction[] = [
  { id: 'pdf', title: 'PDF' },
  { id: 'png', title: 'PNG' },
];

// More buttons than a phone's width holds: the trailing ones overflow
const OVERFLOW_BUTTONS = [
  { label: 'Undo', value: 'undo' },
  { label: 'Redo', value: 'redo' },
  { label: 'Indent', value: 'indent' },
  { label: 'Outdent', value: 'outdent' },
  { label: 'Link', value: 'link' },
  { label: 'Quote', value: 'quote' },
  { label: 'Code', value: 'code' },
];

// A photo behind the clear glass buttons; the color shows while it loads
const BACKDROP_URI =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

const ACTION_BUTTONS = [
  { label: 'Copy', value: 'copy', icon: COPY_ICON },
  { label: 'Paste', value: 'paste', icon: PASTE_ICON },
  { label: 'Cut', value: 'cut', icon: CUT_ICON, disabled: true },
];

const RANGE_BUTTONS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

const FORMAT_BUTTONS = [
  { label: 'Bold', value: 'bold' },
  { label: 'Italic', value: 'italic' },
  { label: 'Underline', value: 'underline' },
];

// Colors accept anything React Native does (hex, rgba, named, PlatformColor).
const CUSTOM_STYLE = {
  color: '#FF6B35',
  tintColor: 'white',
  labelStyle: { fontWeight: '700' as const, fontSize: 15 },
  android: { rippleColor: 'rgba(255, 255, 255, 0.3)' },
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ButtonDemo(): React.JSX.Element {
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [size, setSize] = useState<ButtonSize>('small');
  const [square, setSquare] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [range, setRange] = useState<string[]>(['week']);
  const [format, setFormat] = useState<string[]>(['bold']);
  const [styled, setStyled] = useState(true);
  const [expressive, setExpressive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [lockedPresses, setLockedPresses] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [menuPick, setMenuPick] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bounces, setBounces] = useState(0);
  const [wiggles, setWiggles] = useState(0);
  const [splitAction, setSplitAction] = useState<string | null>(null);
  const [overflowPressed, setOverflowPressed] = useState<string | null>(null);

  const menu = useMemo(() => sortMenu(sortBy), [sortBy]);
  const toggled = [
    favorite && 'favorite',
    bold && 'bold',
    italic && 'italic',
    alerts && 'alerts',
  ].filter(Boolean);
  const [haptics, setHaptics] = useState('default');

  const shape: ButtonShape | undefined = square ? 'square' : undefined;
  const hapticsProp = haptics === 'default' ? undefined : (haptics as Haptics);
  const common = {
    size,
    shape,
    disabled,
    haptics: hapticsProp,
    android: { material: expressive ? 'expressive' : 'm3' } as const,
  };

  return (
    <>
      <Section title="Variants">
        <View style={styles.wrap}>
          {VARIANTS.map((variant) => (
            <Button
              key={variant}
              testID={`button-${variant}`}
              label={capitalize(variant)}
              variant={variant}
              onPress={() => setLastPressed(variant)}
              {...common}
            />
          ))}
        </View>
        <Divider />
        <Row label="Last pressed">
          <Text testID="button-last-pressed" style={ui.valueText}>
            {lastPressed ?? '(none)'}
          </Text>
        </Row>
      </Section>

      <Section title="Icons">
        <View style={styles.wrap}>
          <Button
            testID="button-icon-label"
            label="Edit"
            icon={EDIT_ICON}
            variant="tonal"
            onPress={() => setLastPressed('edit')}
            {...common}
          />
          <Button
            label="Alerts"
            icon={BELL_ICON}
            variant="outlined"
            onPress={() => setLastPressed('alerts')}
            {...common}
          />
        </View>
        <Divider />
        <View style={styles.wrap}>
          <Button
            testID="button-icon-trailing"
            label="Send"
            icon={SEND_ICON}
            iconPosition="trailing"
            onPress={() => setLastPressed('send')}
            {...common}
          />
          <Button
            testID="button-corner-radius"
            label="Radius 6"
            variant="tonal"
            cornerRadius={6}
            onPress={() => setLastPressed('radius 6')}
            {...common}
          />
        </View>
        <Divider />
        <View style={styles.wrap}>
          {VARIANTS.map((variant) => (
            <Button
              key={variant}
              testID={`icon-button-${variant}`}
              icon={SHARE_ICON}
              variant={variant}
              accessibilityLabel={`Share, ${variant}`}
              onPress={() => setLastPressed(`share (${variant})`)}
              {...common}
            />
          ))}
        </View>
      </Section>

      <Section title="Loading">
        <View style={styles.wrap}>
          <Button
            testID="button-loading"
            label="Save"
            loading={loading}
            onPress={() => setLastPressed('save')}
            {...common}
          />
          <Button
            label="Share"
            icon={SHARE_ICON}
            variant="tonal"
            loading={loading}
            onPress={() => setLastPressed('share (loading)')}
            {...common}
          />
          <Button
            icon={EDIT_ICON}
            variant="outlined"
            accessibilityLabel="Edit"
            loading={loading}
            onPress={() => setLastPressed('edit (loading)')}
            {...common}
          />
        </View>
        <Divider />
        <Row label="Loading">
          <Switch
            style={ui.alignEnd}
            testID="loading-switch"
            value={loading}
            onValueChange={setLoading}
          />
        </Row>
      </Section>

      <Section title="Liquid Glass">
        <View style={styles.wrap}>
          <Button
            testID="button-glass"
            label="Glass"
            variant="glass"
            onPress={() => setLastPressed('glass')}
            {...common}
          />
          <Button
            testID="button-prominent-glass"
            label="Prominent"
            variant="prominentGlass"
            onPress={() => setLastPressed('prominent glass')}
            {...common}
          />
          <Button
            label="Tinted"
            variant="prominentGlass"
            color="#FF6B35"
            tintColor="white"
            onPress={() => setLastPressed('tinted glass')}
            {...common}
          />
          <Button
            icon={SHARE_ICON}
            variant="glass"
            accessibilityLabel="Share, glass"
            onPress={() => setLastPressed('share (glass)')}
            {...common}
          />
        </View>
      </Section>

      {/* The selection groups keep the small size: three labels at the large
          sizes don't fit a phone's width. */}
      <Section title="Button Group">
        <View style={styles.groupRow}>
          <ButtonGroup
            testID="button-group-actions"
            buttons={ACTION_BUTTONS}
            variant="tonal"
            onPress={(value) => setLastPressed(value)}
            android={{ overflow: 'wrap' }}
            {...common}
          />
        </View>
        <Divider />
        <View style={styles.groupRow}>
          <ButtonGroup
            testID="button-group-single"
            style={styles.stretch}
            buttons={RANGE_BUTTONS}
            selection="single"
            selectedValues={range}
            onSelectionChange={setRange}
            shape={shape}
            disabled={disabled}
            haptics={hapticsProp}
          />
        </View>
        <Divider />
        <View style={styles.groupRow}>
          <ButtonGroup
            testID="button-group-multiple"
            buttons={FORMAT_BUTTONS}
            variant="tonal"
            selection="multiple"
            selectedValues={format}
            onSelectionChange={setFormat}
            shape={shape}
            disabled={disabled}
            haptics={hapticsProp}
          />
        </View>
        <Divider />
        <Row label="Selected">
          <Text testID="button-group-value" style={ui.valueText}>
            {range.join(', ') || '(none)'} · {format.join(', ') || '(none)'}
          </Text>
        </Row>
      </Section>

      <Section title="Styling">
        <View style={styles.wrap}>
          <Button
            testID="button-styled"
            label="Brand"
            onPress={() => setLastPressed('brand')}
            {...(styled ? CUSTOM_STYLE : {})}
            {...common}
          />
          <Button
            label="Outlined"
            variant="outlined"
            onPress={() => setLastPressed('outlined brand')}
            {...(styled
              ? { tintColor: '#FF6B35', android: { strokeColor: '#FF6B35' } }
              : {})}
            {...common}
          />
        </View>
        <Divider />
        <View style={styles.wrap}>
          <Button
            testID="button-disabled-colors"
            label="Brand disabled"
            color="#FF6B35"
            tintColor="white"
            disabledColor="rgba(255, 107, 53, 0.4)"
            disabledTintColor="rgba(255, 255, 255, 0.8)"
            {...common}
            disabled
          />
          <Button label="Default disabled" {...common} disabled />
        </View>
        <Divider />
        <Row label="Custom style">
          <Switch
            style={ui.alignEnd}
            testID="styled-switch"
            value={styled}
            onValueChange={setStyled}
          />
        </Row>
      </Section>

      <Section title="Controls">
        <View style={styles.groupRow}>
          <ButtonGroup
            testID="size-picker"
            style={styles.stretch}
            buttons={SIZES}
            selection="single"
            selectedValues={[size]}
            onSelectionChange={(values) => {
              const next = values[0];
              if (next) setSize(next as ButtonSize);
            }}
            size="xsmall"
          />
        </View>
        <Divider />
        <Row label="Square">
          <Switch
            style={ui.alignEnd}
            testID="square-switch"
            value={square}
            onValueChange={setSquare}
          />
        </Row>
        <Divider />
        <Row label="Disabled">
          <Switch
            style={ui.alignEnd}
            testID="disabled-switch"
            value={disabled}
            onValueChange={setDisabled}
          />
        </Row>
        <Divider />
        <Row label="Haptics">
          <SelectionMenu
            testID="haptics-menu"
            style={ui.alignEnd}
            options={HAPTICS}
            selected={haptics}
            presentation="embedded"
            onSelect={setHaptics}
          />
        </Row>
        {Platform.OS === 'android' && (
          <>
            <Divider />
            <Row label="Expressive">
              <Switch
                style={ui.alignEnd}
                testID="expressive-switch"
                value={expressive}
                onValueChange={setExpressive}
              />
            </Row>
          </>
        )}
      </Section>

      {/* Toggles are controlled: the last one's parent never takes the new
          state, so it goes back */}
      <Section title="Toggle">
        <View style={styles.wrap}>
          <Button
            testID="button-toggle"
            label="Favorite"
            icon={STAR_ICON}
            variant="tonal"
            selected={favorite}
            onSelectedChange={setFavorite}
            {...common}
          />
          <Button
            testID="button-toggle-filled"
            label="Bold"
            selected={bold}
            onSelectedChange={setBold}
            {...common}
          />
          <Button
            label="Italic"
            variant="outlined"
            selected={italic}
            onSelectedChange={setItalic}
            {...common}
          />
          <Button
            testID="button-toggle-icon"
            icon={ALERT_ICON}
            variant="outlined"
            accessibilityLabel="Alerts"
            selected={alerts}
            onSelectedChange={setAlerts}
            {...common}
          />
          <Button
            testID="button-toggle-locked"
            label="Locked"
            variant="text"
            selected={false}
            onSelectedChange={() => setLockedPresses((count) => count + 1)}
            {...common}
          />
        </View>
        <Divider />
        <Row label="Selected">
          <Text testID="button-toggle-value" style={ui.valueText}>
            {toggled.join(', ') || '(none)'} · locked {lockedPresses}
          </Text>
        </Row>
      </Section>

      <Section title="Menu">
        <View style={styles.wrap}>
          <Button
            testID="button-menu"
            label="Sort"
            icon={SORT_ICON}
            variant="tonal"
            menu={menu}
            onMenuSelect={(id) => {
              setMenuPick(id);
              if (SORT_KEYS.some((key) => key.id === id)) {
                setSortBy(id as SortKey);
              }
            }}
            onMenuOpen={() => setMenuOpen(true)}
            onMenuClose={() => setMenuOpen(false)}
            {...common}
          />
        </View>
        <Divider />
        <Row label="Picked">
          <Text testID="button-menu-value" style={ui.valueText}>
            {menuPick ?? '(none)'} · {menuOpen ? 'open' : 'closed'}
          </Text>
        </Row>
      </Section>

      <Section title="Icon Placement">
        <View style={styles.wrap}>
          <Button
            testID="button-icon-top"
            label="Share"
            icon={SHARE_ICON}
            iconPosition="top"
            variant="tonal"
            onPress={() => setLastPressed('share (top)')}
            {...common}
          />
          <Button
            testID="button-icon-bottom"
            label="Edit"
            icon={EDIT_ICON}
            iconPosition="bottom"
            variant="outlined"
            onPress={() => setLastPressed('edit (bottom)')}
            {...common}
          />
          <Button
            label="Send"
            icon={SEND_ICON}
            iconPosition="top"
            onPress={() => setLastPressed('send (top)')}
            {...common}
          />
        </View>
      </Section>

      {/* Clear glass is for buttons over photos: the backdrop shows the
          difference from the regular glass */}
      <Section title="Clear Glass">
        <View style={styles.backdrop}>
          <Image
            source={{ uri: BACKDROP_URI }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.wrap}>
            <Button
              testID="button-clear-glass"
              label="Clear"
              variant="clearGlass"
              onPress={() => setLastPressed('clear glass')}
              {...common}
            />
            <Button
              label="Prominent"
              variant="prominentClearGlass"
              onPress={() => setLastPressed('prominent clear glass')}
              {...common}
            />
            <Button
              icon={SHARE_ICON}
              variant="clearGlass"
              accessibilityLabel="Share, clear glass"
              onPress={() => setLastPressed('share (clear glass)')}
              {...common}
            />
          </View>
          <View style={styles.wrap}>
            <Button
              label="Glass"
              variant="glass"
              onPress={() => setLastPressed('glass')}
              {...common}
            />
            <Button
              label="Prominent"
              variant="prominentGlass"
              onPress={() => setLastPressed('prominent glass')}
              {...common}
            />
            <Button
              icon={SHARE_ICON}
              variant="glass"
              accessibilityLabel="Share, glass"
              onPress={() => setLastPressed('share (glass)')}
              {...common}
            />
          </View>
        </View>
      </Section>

      {/* SF Symbol effects: a trigger plays the effect once per change,
          without one it repeats */}
      {Platform.OS === 'ios' && (
        <Section title="Symbol Effects">
          <View style={styles.wrap}>
            <Button
              testID="button-symbol-bounce"
              label="Bounce"
              icon="bell"
              variant="tonal"
              ios={{ symbolEffect: 'bounce', symbolEffectTrigger: bounces }}
              onPress={() => setBounces((count) => count + 1)}
              {...common}
            />
            <Button
              label="Wiggle"
              icon="hand.wave"
              variant="tonal"
              ios={{ symbolEffect: 'wiggle', symbolEffectTrigger: wiggles }}
              onPress={() => setWiggles((count) => count + 1)}
              {...common}
            />
          </View>
          <Divider />
          <View style={styles.wrap}>
            <Button
              label="Syncing"
              icon="arrow.triangle.2.circlepath"
              variant="outlined"
              ios={{ symbolEffect: 'rotate' }}
              {...common}
            />
            <Button
              label="Live"
              icon="dot.radiowaves.left.and.right"
              variant="outlined"
              ios={{ symbolEffect: 'variableColor' }}
              {...common}
            />
            <Button
              icon="heart.fill"
              accessibilityLabel="Breathe"
              variant="outlined"
              ios={{ symbolEffect: 'breathe' }}
              {...common}
            />
          </View>
          <Divider />
          <Row label="Bounces">
            <Text testID="button-bounce-count" style={ui.valueText}>
              {bounces}
            </Text>
          </Row>
        </Section>
      )}

      {/* A main action with an attached menu */}
      <Section title="Split Button">
        <View style={styles.wrap}>
          <SplitButton
            testID="split-button"
            label="Reply"
            menu={REPLY_MENU}
            menuAccessibilityLabel="Reply options"
            onPress={() => setSplitAction('reply')}
            onMenuSelect={(id) => setSplitAction(id)}
            size={size}
            disabled={disabled}
            android={common.android}
          />
          <SplitButton
            label="Save"
            variant="tonal"
            menu={SAVE_MENU}
            menuAccessibilityLabel="Save options"
            onPress={() => setSplitAction('save')}
            onMenuSelect={(id) => setSplitAction(id)}
            size={size}
            disabled={disabled}
            android={common.android}
          />
        </View>
        <Divider />
        <View style={styles.wrap}>
          <SplitButton
            label="Export"
            variant="outlined"
            menu={EXPORT_MENU}
            menuAccessibilityLabel="Export options"
            onPress={() => setSplitAction('export')}
            onMenuSelect={(id) => setSplitAction(id)}
            size={size}
            disabled={disabled}
            android={common.android}
          />
        </View>
        <Divider />
        <Row label="Action">
          <Text testID="split-value" style={ui.valueText}>
            {splitAction ?? '(none)'}
          </Text>
        </Row>
      </Section>

      {/* The buttons that don't fit fold into an overflow menu; its picks
          are presses */}
      <Section title="Overflow">
        <View style={styles.groupRow}>
          <ButtonGroup
            testID="button-group-overflow"
            buttons={OVERFLOW_BUTTONS}
            variant="tonal"
            overflow="menu"
            onPress={(value) => setOverflowPressed(value)}
            {...common}
          />
        </View>
        <Divider />
        <Row label="Pressed">
          <Text testID="overflow-value" style={ui.valueText}>
            {overflowPressed ?? '(none)'}
          </Text>
        </Row>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  groupRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stretch: { alignSelf: 'stretch' },
  backdrop: {
    backgroundColor: '#3B6E8F',
    paddingVertical: 12,
  },
});
