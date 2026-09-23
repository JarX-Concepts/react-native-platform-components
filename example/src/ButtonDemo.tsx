// ButtonDemo.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Button,
  ButtonGroup,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
  type PlatformIcon,
} from 'react-native-platform-components';
import { Divider, Row, Section, ui } from './DemoUI';

const VARIANTS: ButtonVariant[] = [
  'filled',
  'tonal',
  'outlined',
  'text',
  'elevated',
];

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

  const shape: ButtonShape | undefined = square ? 'square' : undefined;
  const common = {
    size,
    shape,
    disabled,
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
});
