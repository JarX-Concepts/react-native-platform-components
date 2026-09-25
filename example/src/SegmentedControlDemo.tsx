// SegmentedControlDemo.tsx
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  SegmentedControl,
  type SegmentedControlLabelVisibility,
  type SegmentedControlSegmentProps,
} from 'react-native-platform-components';
import { Divider, PillButton, Row, Section, ui } from './DemoUI';

// Each segment carries a testID, so E2E tests can tap it by id
const TIME_SEGMENTS = [
  { label: 'Day', value: 'day', testID: 'segment-day' },
  { label: 'Week', value: 'week', testID: 'segment-week' },
  { label: 'Month', value: 'month', testID: 'segment-month' },
  { label: 'Year', value: 'year', testID: 'segment-year' },
];

// Icons no longer need a Platform.OS branch: give each platform its native
// symbol, or share one image asset that is tinted on both.
const VIEW_SEGMENTS: SegmentedControlSegmentProps[] = [
  {
    label: 'List',
    value: 'list',
    icon: {
      ios: { type: 'sfSymbol', name: 'list.bullet' },
      android: { type: 'drawable', name: 'list_bullet' },
    },
  },
  {
    label: 'Grid',
    value: 'grid',
    icon: {
      ios: { type: 'sfSymbol', name: 'square.grid.2x2' },
      android: { type: 'drawable', name: 'grid_view' },
    },
  },
  {
    label: 'Alerts',
    value: 'alerts',
    icon: { type: 'image', source: require('./assets/bell.png') },
  },
];

const LABEL_VISIBILITY_OPTIONS: {
  label: string;
  value: SegmentedControlLabelVisibility;
}[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Labeled', value: 'labeled' },
  { label: 'Icon only', value: 'unlabeled' },
];

const PRIORITY_SEGMENTS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

// Colors accept anything React Native does (hex, rgba, named, PlatformColor).
const CUSTOM_STYLE = {
  selectedSegmentColor: '#FF6B35',
  activeTintColor: 'white',
  inactiveTintColor: '#8E8E93',
  labelStyle: { fontWeight: '700' as const, fontSize: 14 },
  android: { rippleColor: 'rgba(255, 107, 53, 0.25)', strokeColor: '#FF6B35' },
};

const PARTIAL_DISABLED_SEGMENTS = [
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled', disabled: true },
  { label: 'Also Active', value: 'also-active' },
];

// A full-width row so four segments fit comfortably on a phone.
function ControlRow(props: { children: React.ReactNode }) {
  return <View style={styles.controlRow}>{props.children}</View>;
}

export function SegmentedControlDemo(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>('day');
  const [iconSelected, setIconSelected] = useState<string>('list');
  const [labelVisibility, setLabelVisibility] =
    useState<SegmentedControlLabelVisibility>('auto');
  const [mailbox, setMailbox] = useState<string>('inbox');
  const [unread, setUnread] = useState(3);
  const mailboxSegments = useMemo(
    (): SegmentedControlSegmentProps[] => [
      // Numbers show as-is; undefined hides the badge
      {
        label: 'Inbox',
        value: 'inbox',
        badge: unread > 0 ? unread : undefined,
      },
      { label: 'Sent', value: 'sent' },
      { label: 'Drafts', value: 'drafts', badge: 'new' },
    ],
    [unread]
  );
  const [prioritySelected, setPrioritySelected] = useState<string>('medium');
  const [styled, setStyled] = useState(true);
  const [partialSelected, setPartialSelected] = useState<string>('active');

  const [disabled, setDisabled] = useState(false);
  const [momentary, setMomentary] = useState(false);
  const [proportional, setProportional] = useState(false);
  const [selectionRequired, setSelectionRequired] = useState(true);
  const [expressive, setExpressive] = useState(true);

  return (
    <>
      <Section title="Basic">
        <ControlRow>
          <SegmentedControl
            testID="segment-basic"
            segments={TIME_SEGMENTS}
            haptics="selection"
            selectedValue={selected}
            disabled={disabled}
            onSelect={(value) => setSelected(value)}
            onDeselect={() => setSelected(null)}
            ios={{
              momentary,
              apportionsSegmentWidthsByContent: proportional,
            }}
            android={{
              selectionRequired,
              material: expressive ? 'expressive' : 'm3',
            }}
          />
        </ControlRow>
        <Divider />
        <Row label="Selected">
          <Text testID="segment-basic-value" style={ui.valueText}>
            {selected ?? '(none)'}
          </Text>
        </Row>
      </Section>

      <Section title="With Icons">
        <ControlRow>
          <SegmentedControl
            testID="segment-icons"
            segments={VIEW_SEGMENTS}
            selectedValue={iconSelected}
            disabled={disabled}
            labelVisibility={labelVisibility}
            onSelect={(value) => setIconSelected(value)}
            ios={{ apportionsSegmentWidthsByContent: true }}
          />
        </ControlRow>
        <Divider />
        <ControlRow>
          <SegmentedControl
            testID="label-visibility"
            segments={LABEL_VISIBILITY_OPTIONS}
            selectedValue={labelVisibility}
            onSelect={(value) =>
              setLabelVisibility(value as SegmentedControlLabelVisibility)
            }
          />
        </ControlRow>
        <Divider />
        <Row label="Selected">
          <Text testID="segment-icons-value" style={ui.valueText}>
            {iconSelected}
          </Text>
        </Row>
      </Section>

      <Section title="Badges">
        <ControlRow>
          <SegmentedControl
            testID="segment-badges"
            segments={mailboxSegments}
            selectedValue={mailbox}
            disabled={disabled}
            onSelect={(value) => setMailbox(value)}
          />
        </ControlRow>
        <Divider />
        <Row label="Unread">
          <View style={styles.buttonRow}>
            <PillButton
              testID="badge-increment"
              label="+1"
              onPress={() => setUnread((n) => n + 1)}
            />
            <PillButton
              testID="badge-clear"
              label="Clear"
              onPress={() => setUnread(0)}
            />
            <Text style={ui.valueText}>{unread}</Text>
          </View>
        </Row>
      </Section>

      <Section title="Styling">
        <ControlRow>
          <SegmentedControl
            testID="segment-styled"
            segments={PRIORITY_SEGMENTS}
            selectedValue={prioritySelected}
            disabled={disabled}
            onSelect={(value) => setPrioritySelected(value)}
            {...(styled ? CUSTOM_STYLE : {})}
          />
        </ControlRow>
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

      <Section title="Per-Segment Disabled">
        <ControlRow>
          <SegmentedControl
            testID="segment-partial-disabled"
            segments={PARTIAL_DISABLED_SEGMENTS}
            selectedValue={partialSelected}
            onSelect={(value) => setPartialSelected(value)}
          />
        </ControlRow>
        <Divider />
        <Row label="Selected">
          <Text style={ui.valueText}>{partialSelected}</Text>
        </Row>
      </Section>

      <Section title="Controls">
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
            <Row label="Selection required">
              <Switch
                style={ui.alignEnd}
                testID="selection-required-switch"
                value={selectionRequired}
                onValueChange={setSelectionRequired}
              />
            </Row>
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

        {Platform.OS === 'ios' && (
          <>
            <Divider />
            <Row label="Momentary">
              <Switch
                style={ui.alignEnd}
                testID="momentary-switch"
                value={momentary}
                onValueChange={setMomentary}
              />
            </Row>
            <Divider />
            <Row label="Proportional">
              <Switch
                style={ui.alignEnd}
                testID="proportional-switch"
                value={proportional}
                onValueChange={setProportional}
              />
            </Row>
          </>
        )}
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  controlRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
