// App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Appearance,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SelectionMenu,
  useNativeTheme,
} from 'react-native-platform-components';
import { ButtonDemo } from './ButtonDemo';
import { ContextMenuDemo } from './ContextMenuDemo';
import { DatePickerDemo } from './DatePickerDemo';
import { FloatingToolbarDemo } from './FloatingToolbarDemo';
import { LiquidGlassDemo } from './LiquidGlassDemo';
import { SelectionMenuDemo } from './SelectionMenuDemo';
import { SegmentedControlDemo } from './SegmentedControlDemo';
import { Screen, useDemoColors } from './DemoUI';
import {
  BRAND_COLORS,
  ThemeDemo,
  type AppearanceSetting,
  type BrandColor,
} from './ThemeDemo';

type DemoKey =
  | 'datePicker'
  | 'selectionMenu'
  | 'contextMenu'
  | 'segmentedControl'
  | 'button'
  | 'floatingToolbar'
  | 'liquidGlass'
  | 'theme';

const COMPONENT_DEMOS = [
  { label: 'Date Picker', data: 'datePicker' },
  { label: 'Selection Menu', data: 'selectionMenu' },
  { label: 'Context Menu', data: 'contextMenu' },
  { label: 'Segmented Control', data: 'segmentedControl' },
  { label: 'Button', data: 'button' },
  { label: 'Floating Toolbar', data: 'floatingToolbar' },
];

// LiquidGlass is iOS 26+ only, so hide the demo on Android
const IOS_ONLY_DEMOS = [{ label: 'Liquid Glass', data: 'liquidGlass' }];

const THEME_DEMO = { label: 'Theme', data: 'theme' };

export default function App(): React.ReactElement {
  const colors = useDemoColors();
  const [demo, setDemo] = useState<DemoKey>('datePicker');
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [brand, setBrand] = useState<BrandColor>('default');
  const [appearance, setAppearance] = useState<AppearanceSetting>('system');

  const demos = useMemo(
    () => [
      ...COMPONENT_DEMOS,
      ...(Platform.OS === 'ios' ? IOS_ONLY_DEMOS : []),
      THEME_DEMO,
    ],
    []
  );

  // The native theme is app-wide, so it lives here rather than in ThemeDemo.
  useNativeTheme(
    brand === 'default' ? null : { colors: { primary: BRAND_COLORS[brand] } }
  );

  useEffect(() => {
    Appearance.setColorScheme(
      appearance === 'system' ? 'unspecified' : appearance
    );
  }, [appearance]);

  return (
    <Screen title="Platform Components" subtitle="Demo">
      <Pressable
        testID="demo-picker"
        accessibilityRole="button"
        accessibilityHint="Choose a demo"
        onPress={() => setDemoMenuOpen(true)}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
      >
        <Text style={[styles.caption, { color: colors.placeholder }]}>
          Platform Components
        </Text>
        <View style={styles.titleRow}>
          <Text
            testID="demo-picker-title"
            style={[styles.title, { color: colors.text }]}
          >
            {demos.find((d) => d.data === demo)?.label}
          </Text>
          <Text style={[styles.chevron, { color: colors.placeholder }]}>▾</Text>
        </View>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <SelectionMenu
            testID="demo-menu"
            style={styles.menuAnchor}
            options={demos}
            selected={demo}
            presentation="modal"
            visible={demoMenuOpen}
            onSelect={(data) => {
              setDemo(data as DemoKey);
              setDemoMenuOpen(false);
            }}
            onRequestClose={() => setDemoMenuOpen(false)}
          />
        </View>
      </Pressable>

      {demo === 'datePicker' && <DatePickerDemo />}
      {demo === 'selectionMenu' && <SelectionMenuDemo />}
      {demo === 'contextMenu' && <ContextMenuDemo />}
      {demo === 'segmentedControl' && <SegmentedControlDemo />}
      {demo === 'button' && <ButtonDemo />}
      {demo === 'floatingToolbar' && <FloatingToolbarDemo />}
      {demo === 'liquidGlass' && <LiquidGlassDemo />}
      {demo === 'theme' && (
        <ThemeDemo
          brand={brand}
          onBrandChange={setBrand}
          appearance={appearance}
          onAppearanceChange={setAppearance}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 4,
  },
  headerPressed: { opacity: 0.6 },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 28, fontWeight: '700' },
  chevron: { fontSize: 20, marginTop: 4 },
  // The menu anchors to this view: the bottom edge of the header.
  menuAnchor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1 },
});
