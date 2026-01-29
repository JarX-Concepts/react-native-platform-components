// LiquidGlassDemo.tsx
import React, { useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  LiquidGlass,
  isLiquidGlassSupported,
  type LiquidGlassColorScheme,
  type LiquidGlassEffect,
  SelectionMenu,
} from 'react-native-platform-components';
import { Divider, Row, Section, ui } from './DemoUI';

const EFFECT_OPTIONS = [
  { label: 'Regular', data: 'regular' },
  { label: 'Clear', data: 'clear' },
  { label: 'None', data: 'none' },
] as const;

const COLOR_SCHEME_OPTIONS = [
  { label: 'System', data: 'system' },
  { label: 'Light', data: 'light' },
  { label: 'Dark', data: 'dark' },
] as const;

const TINT_COLOR_OPTIONS = [
  { label: 'None', data: '' },
  { label: 'Blue', data: '#007AFF' },
  { label: 'Red', data: '#FF3B30' },
  { label: 'Green', data: '#34C759' },
  { label: 'Purple', data: '#AF52DE' },
  { label: 'Orange', data: '#FF9500' },
] as const;

export function LiquidGlassDemo(): React.JSX.Element {
  const [effect, setEffect] = useState<LiquidGlassEffect>('regular');
  const [interactive, setInteractive] = useState(true);
  const [colorScheme, setColorScheme] =
    useState<LiquidGlassColorScheme>('system');
  const [tintColor, setTintColor] = useState('');
  const [cornerRadius, setCornerRadius] = useState(20);
  const [shadowRadius, setShadowRadius] = useState(20);

  const effectOptions = useMemo(() => EFFECT_OPTIONS, []);
  const colorSchemeOptions = useMemo(() => COLOR_SCHEME_OPTIONS, []);
  const tintColorOptions = useMemo(() => TINT_COLOR_OPTIONS, []);

  const cornerRadiusOptions = useMemo(
    () => [
      { label: '0', data: '0' },
      { label: '10', data: '10' },
      { label: '20', data: '20' },
      { label: '30', data: '30' },
      { label: '50', data: '50' },
    ],
    []
  );

  const shadowRadiusOptions = useMemo(
    () => [
      { label: '0', data: '0' },
      { label: '10', data: '10' },
      { label: '20', data: '20' },
      { label: '40', data: '40' },
    ],
    []
  );

  const tintColorLabel = useMemo(() => {
    const option = TINT_COLOR_OPTIONS.find((o) => o.data === tintColor);
    return option?.label ?? 'None';
  }, [tintColor]);

  return (
    <>
      <Section title="Preview">
        <View style={styles.previewContainer}>
          {/* Background image for glass effect demonstration */}
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />

          {/* Glass effect card */}
          <LiquidGlass
            testID="liquid-glass-demo"
            style={styles.glassCard}
            cornerRadius={cornerRadius}
            ios={{
              effect,
              interactive,
              colorScheme,
              tintColor: tintColor || undefined,
              shadowRadius,
            }}
            android={{
              fallbackBackgroundColor: '#FFFFFF80',
            }}
          >
            <View style={styles.glassContent}>
              <Text style={styles.glassTitle}>Liquid Glass</Text>
              <Text style={styles.glassSubtitle}>
                {isLiquidGlassSupported
                  ? 'iOS 26+ Glass Effect'
                  : Platform.OS === 'ios'
                    ? `iOS ${Platform.Version} (requires iOS 26+)`
                    : 'Not available on Android'}
              </Text>
            </View>
          </LiquidGlass>

          {/* Second glass card for visual interest */}
          <LiquidGlass
            testID="liquid-glass-demo-2"
            style={styles.glassCardSmall}
            cornerRadius={Math.max(10, cornerRadius - 10)}
            ios={{
              effect,
              interactive,
              colorScheme,
              tintColor: tintColor || undefined,
              shadowRadius: shadowRadius / 2,
            }}
            android={{
              fallbackBackgroundColor: '#FFFFFF60',
            }}
          >
            <View style={styles.glassContentSmall}>
              <Text style={styles.glassIcon}>✨</Text>
            </View>
          </LiquidGlass>
        </View>
      </Section>

      {Platform.OS === 'ios' && (
        <Section title="iOS Options">
          <Row label="Effect">
            <SelectionMenu
              testID="effect-menu"
              style={ui.fullFlex}
              options={effectOptions}
              selected={effect}
              presentation="embedded"
              placeholder="Effect"
              onSelect={(data) => setEffect(data as LiquidGlassEffect)}
            />
          </Row>

          <Divider />

          <Row label="Interactive">
            <Switch
              testID="interactive-switch"
              value={interactive}
              onValueChange={setInteractive}
            />
          </Row>

          <Divider />

          <Row label="Color Scheme">
            <SelectionMenu
              testID="color-scheme-menu"
              style={ui.fullFlex}
              options={colorSchemeOptions}
              selected={colorScheme}
              presentation="embedded"
              placeholder="Color Scheme"
              onSelect={(data) =>
                setColorScheme(data as LiquidGlassColorScheme)
              }
            />
          </Row>

          <Divider />

          <Row label="Tint Color">
            <SelectionMenu
              testID="tint-color-menu"
              style={ui.fullFlex}
              options={tintColorOptions}
              selected={tintColor}
              presentation="embedded"
              placeholder={tintColorLabel}
              onSelect={(data) => setTintColor(data)}
            />
          </Row>

          <Divider />

          <Row label="Shadow Radius">
            <SelectionMenu
              testID="shadow-radius-menu"
              style={ui.fullFlex}
              options={shadowRadiusOptions}
              selected={String(shadowRadius)}
              presentation="embedded"
              placeholder="Shadow"
              onSelect={(data) => setShadowRadius(Number(data))}
            />
          </Row>
        </Section>
      )}

      <Section title="Shared Options">
        <Row label="Corner Radius">
          <SelectionMenu
            testID="corner-radius-menu"
            style={ui.fullFlex}
            options={cornerRadiusOptions}
            selected={String(cornerRadius)}
            presentation="embedded"
            placeholder="Corner Radius"
            onSelect={(data) => setCornerRadius(Number(data))}
          />
        </Row>
      </Section>

      <Section title="Support Status">
        <Row label="Supported">
          <Text style={styles.statusText}>
            {isLiquidGlassSupported ? '✅ Yes' : '❌ No'}
          </Text>
        </Row>

        <Divider />

        <Row label="Platform">
          <Text style={styles.statusText}>
            {Platform.OS === 'ios'
              ? `iOS ${Platform.Version}`
              : `Android ${Platform.Version}`}
          </Text>
        </Row>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  glassCard: {
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    height: 100,
  },
  glassContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  glassTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  glassSubtitle: {
    fontSize: 13,
    color: '#FFFFFFCC',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  glassCardSmall: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
  },
  glassContentSmall: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassIcon: {
    fontSize: 28,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
});
