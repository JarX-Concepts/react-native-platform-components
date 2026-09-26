// LiquidGlassDemo.tsx
import React, { useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  LiquidGlass,
  LiquidGlassContainer,
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

// The buttons are 8 apart: 12 keeps them apart, 24 merges them
const SPACING_OPTIONS = [
  { label: 'Default', data: '-1' },
  { label: '12', data: '12' },
  { label: '24', data: '24' },
  { label: '40', data: '40' },
] as const;

const BACKGROUND = {
  uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
};

const TINT_COLOR_OPTIONS = [
  { label: 'None', data: 'none' },
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
  const [spacing, setSpacing] = useState(24);
  const [showExtra, setShowExtra] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  const tintColorLabel = useMemo(() => {
    const option = TINT_COLOR_OPTIONS.find(
      (o) => o.data === (tintColor || 'none')
    );
    return option?.label ?? 'None';
  }, [tintColor]);

  return (
    <>
      <Section title="Preview">
        <View style={styles.previewContainer}>
          {/* Background image for glass effect demonstration */}
          <Image
            source={BACKGROUND}
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
              style={ui.alignEnd}
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
              style={ui.alignEnd}
              testID="interactive-switch"
              value={interactive}
              onValueChange={setInteractive}
            />
          </Row>

          <Divider />

          <Row label="Color Scheme">
            <SelectionMenu
              testID="color-scheme-menu"
              style={ui.alignEnd}
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
              style={ui.alignEnd}
              options={tintColorOptions}
              selected={tintColor || 'none'}
              presentation="embedded"
              placeholder={tintColorLabel}
              onSelect={(data) => setTintColor(data === 'none' ? '' : data)}
            />
          </Row>
        </Section>
      )}

      <Section title="Shared Options">
        <Row label="Corner Radius">
          <SelectionMenu
            testID="corner-radius-menu"
            style={ui.alignEnd}
            options={cornerRadiusOptions}
            selected={String(cornerRadius)}
            presentation="embedded"
            placeholder="Corner Radius"
            onSelect={(data) => setCornerRadius(Number(data))}
          />
        </Row>
      </Section>

      <Section title="Container">
        <View style={styles.previewContainer}>
          <Image
            source={BACKGROUND}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          {/* Glass within `spacing` of each other merges into one shape;
              buttons that appear, go or resize morph through the container */}
          <LiquidGlassContainer
            testID="glass-container"
            spacing={spacing}
            style={styles.glassRow}
          >
            <LiquidGlass
              testID="glass-favorite"
              cornerStyle="capsule"
              ios={{ interactive: true }}
              style={[styles.glassButton, expanded && styles.glassButtonWide]}
            >
              <Text style={styles.glassButtonText}>
                {expanded ? '♥ Favorite' : '♥'}
              </Text>
            </LiquidGlass>
            <LiquidGlass
              testID="glass-share"
              cornerStyle="capsule"
              ios={{ interactive: true }}
              style={styles.glassButton}
            >
              <Text style={styles.glassButtonText}>↑</Text>
            </LiquidGlass>
            {showExtra && (
              <LiquidGlass
                testID="glass-extra"
                cornerStyle="capsule"
                ios={{ interactive: true }}
                style={styles.glassButton}
              >
                <Text style={styles.glassButtonText}>+</Text>
              </LiquidGlass>
            )}
          </LiquidGlassContainer>
        </View>

        <Row label="Spacing">
          <SelectionMenu
            testID="spacing-menu"
            style={ui.alignEnd}
            options={SPACING_OPTIONS}
            selected={String(spacing)}
            presentation="embedded"
            placeholder="Spacing"
            onSelect={(data) => setSpacing(Number(data))}
          />
        </Row>

        <Divider />

        <Row label="Extra Button">
          <Switch
            style={ui.alignEnd}
            testID="glass-extra-switch"
            value={showExtra}
            onValueChange={setShowExtra}
          />
        </Row>

        <Divider />

        <Row label="Expand">
          <Switch
            style={ui.alignEnd}
            testID="glass-expand-switch"
            value={expanded}
            onValueChange={setExpanded}
          />
        </Row>
      </Section>

      <Section title="Corner Styles">
        <View style={styles.previewContainer}>
          <Image
            source={BACKGROUND}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <LiquidGlass
            testID="corner-card"
            cornerRadius={36}
            style={styles.cornerCard}
          >
            <LiquidGlass
              testID="corner-concentric"
              cornerStyle="concentric"
              cornerRadius={8}
              ios={{ tintColor: '#007AFF55' }}
              style={styles.cornerInner}
            >
              <Text style={styles.cornerLabel}>Concentric</Text>
            </LiquidGlass>
            <LiquidGlass
              testID="corner-capsule"
              cornerStyle="capsule"
              ios={{ tintColor: '#AF52DE55' }}
              style={styles.cornerPill}
            >
              <Text style={styles.cornerLabel}>Capsule</Text>
            </LiquidGlass>
          </LiquidGlass>
        </View>
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
    ...StyleSheet.absoluteFill,
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
  glassRow: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  glassButton: {
    height: 52,
    minWidth: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassButtonWide: {
    minWidth: 140,
  },
  glassButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cornerCard: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    bottom: 24,
    padding: 12,
    gap: 10,
  },
  cornerInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerPill: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
});
