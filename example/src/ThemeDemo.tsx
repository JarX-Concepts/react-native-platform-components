// ThemeDemo.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Checkbox,
  ChipGroup,
  DatePicker,
  ProgressIndicator,
  RadioGroup,
  SegmentedControl,
  SelectionMenu,
  Switch,
  type ChipGroupItem,
  type RadioGroupOption,
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

const FILTER_CHIPS: readonly ChipGroupItem[] = [
  { value: 'photos', label: 'Photos' },
  { value: 'videos', label: 'Videos' },
  { value: 'files', label: 'Files' },
];

const PLAN_OPTIONS: readonly RadioGroupOption[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
];

const FRUIT_OPTIONS = [
  { label: 'Apple', data: 'apple' },
  { label: 'Banana', data: 'banana' },
  { label: 'Cherry', data: 'cherry' },
];

/**
 * The brand color and appearance apply to the whole native layer, so the
 * other demos pick them up too. The components here are the ones that show
 * the brand color at rest on both platforms (filled and toggled states,
 * progress), so a change of brand visibly recolors them.
 */
export function ThemeDemo(props: {
  brand: BrandColor;
  onBrandChange: (brand: BrandColor) => void;
  appearance: AppearanceSetting;
  onAppearanceChange: (appearance: AppearanceSetting) => void;
}): React.JSX.Element {
  const colors = useDemoColors();
  const [notify, setNotify] = useState(true);
  const [remember, setRemember] = useState(true);
  const [plan, setPlan] = useState<string | null>('pro');
  const [filters, setFilters] = useState<string[]>(['photos']);
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
        <View style={styles.buttons}>
          <Button testID="theme-button-filled" label="Save" />
          <Button testID="theme-button-tonal" label="Share" variant="tonal" />
          <Button
            testID="theme-button-outlined"
            label="Cancel"
            variant="outlined"
          />
        </View>
        <Divider />
        <Switch
          testID="theme-switch"
          style={styles.switchRow}
          label="Notifications"
          value={notify}
          onValueChange={setNotify}
        />
        <Divider />
        <View style={styles.content}>
          <Checkbox
            testID="theme-checkbox"
            label="Remember me"
            checked={remember}
            onCheckedChange={setRemember}
          />
          <RadioGroup
            testID="theme-radio"
            accessibilityLabel="Plan"
            options={PLAN_OPTIONS}
            value={plan}
            onValueChange={setPlan}
          />
        </View>
        <Divider />
        <View style={styles.progress}>
          <ProgressIndicator
            testID="theme-progress"
            style={styles.fullFlex}
            progress={0.6}
            accessibilityLabel="Upload"
          />
          <ProgressIndicator
            testID="theme-progress-circular"
            variant="circular"
            size="small"
            accessibilityLabel="Syncing"
          />
        </View>
        <Divider />
        <ChipGroup
          testID="theme-chips"
          style={styles.chips}
          chips={FILTER_CHIPS}
          selection="multiple"
          selectedValues={filters}
          onSelectionChange={setFilters}
        />
        <Divider />
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
        {/* Android's embedded date picker is the spinner, which carries
            almost no accent color; its modal one above shows the brand */}
        {Platform.OS === 'ios' && (
          <>
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
          </>
        )}
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
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
  },
  // The style's padding is part of the row: a tap there toggles it too
  switchRow: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 48 },
  content: { paddingHorizontal: 14, paddingVertical: 4 },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  chips: { margin: 10 },
  fullFlex: { flex: 1 },
});
