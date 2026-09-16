// ThemeDemo.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  ContextMenu,
  DatePicker,
  SegmentedControl,
  SelectionMenu,
  type ContextMenuAction,
} from 'react-native-platform-components';

import {
  ChipTabs,
  Divider,
  PillButton,
  Row,
  Section,
  ui,
  useDemoColors,
} from './DemoUI';

export type BrandColor = 'default' | 'teal' | 'indigo' | 'orange';
export type AppearanceSetting = 'system' | 'light' | 'dark';

export const BRAND_COLORS: Record<Exclude<BrandColor, 'default'>, string> = {
  teal: '#00897B',
  indigo: '#3F51B5',
  orange: '#E65100',
};

const BRAND_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Teal', value: 'teal' },
  { label: 'Indigo', value: 'indigo' },
  { label: 'Orange', value: 'orange' },
] as const;

const APPEARANCE_OPTIONS = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
] as const;

const RANGE_SEGMENTS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

const FRUIT_OPTIONS = [
  { label: 'Apple', data: 'apple' },
  { label: 'Banana', data: 'banana' },
  { label: 'Cherry', data: 'cherry' },
];

const ACTIONS: ContextMenuAction[] = [
  {
    id: 'copy',
    title: 'Copy',
    image: Platform.OS === 'ios' ? 'doc.on.doc' : 'content_copy',
  },
  {
    id: 'share',
    title: 'Share',
    image: Platform.OS === 'ios' ? 'square.and.arrow.up' : 'share',
  },
];

/**
 * The brand color and appearance apply to the whole native layer, so the
 * other demos pick them up too.
 */
export function ThemeDemo(props: {
  brand: BrandColor;
  onBrandChange: (brand: BrandColor) => void;
  appearance: AppearanceSetting;
  onAppearanceChange: (appearance: AppearanceSetting) => void;
}): React.JSX.Element {
  const colors = useDemoColors();
  const [range, setRange] = useState('week');
  const [fruit, setFruit] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Section title="Native theme">
        <View style={styles.control}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            Brand color
          </Text>
          <ChipTabs
            testID="native-theme-brand"
            value={props.brand}
            options={BRAND_OPTIONS}
            onChange={props.onBrandChange}
          />
        </View>
        <Divider />
        <View style={styles.control}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            Appearance
          </Text>
          <ChipTabs
            testID="native-theme-appearance"
            value={props.appearance}
            options={APPEARANCE_OPTIONS}
            onChange={props.onAppearanceChange}
          />
        </View>
        <Divider />
        <Text style={[styles.note, { color: colors.placeholder }]}>
          useNativeTheme() applies the brand color and
          Appearance.setColorScheme() the appearance, app-wide. Android brand
          colors need Android 13 or later.
        </Text>
      </Section>

      <Section title="Components">
        <View style={styles.block}>
          <SegmentedControl
            testID="theme-segmented-control"
            segments={RANGE_SEGMENTS}
            selectedValue={range}
            onSelect={setRange}
          />
        </View>
        <Divider />
        <Row label="Selection">
          <SelectionMenu
            testID="theme-selection-menu"
            style={ui.alignEnd}
            options={FRUIT_OPTIONS}
            selected={fruit}
            placeholder="Pick a fruit"
            presentation="embedded"
            android={{ material: 'm3' }}
            onSelect={(data) => setFruit(data)}
          />
        </Row>
        <Divider />
        <Row label="Context menu">
          <ContextMenu
            testID="theme-context-menu"
            title="Actions"
            actions={ACTIONS}
            trigger="tap"
            style={styles.fullFlex}
          >
            <View style={[styles.menuTarget, { backgroundColor: colors.fill }]}>
              <Text style={{ color: colors.text }}>Tap for menu</Text>
            </View>
          </ContextMenu>
        </Row>
        <Divider />
        <Row
          label="Modal date"
          right={
            <PillButton
              testID="theme-date-open"
              label="Open"
              onPress={() => setModalOpen(true)}
            />
          }
        >
          <Text style={ui.valueText}>
            {date ? date.toLocaleDateString() : 'None'}
          </Text>
          <DatePicker
            date={date}
            presentation="modal"
            visible={modalOpen}
            onConfirm={(d) => {
              setDate(d);
              setModalOpen(false);
            }}
            onClosed={() => setModalOpen(false)}
            ios={{ preferredStyle: 'inline' }}
            android={{ material: 'm3' }}
          />
        </Row>
        <Divider />
        <View style={ui.datePickerContainer}>
          <DatePicker
            testID="theme-date-picker"
            date={date}
            presentation="embedded"
            onConfirm={(d) => setDate(d)}
            ios={{ preferredStyle: 'inline' }}
          />
        </View>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  control: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  controlLabel: { fontSize: 14, opacity: 0.65 },
  note: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  block: { padding: 10 },
  fullFlex: { flex: 1 },
  menuTarget: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
