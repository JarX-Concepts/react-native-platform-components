// SegmentedControlDemo.tsx
import React, { useState } from 'react';
import { Platform, Switch, Text } from 'react-native';
import { SegmentedControl } from 'react-native-platform-components';
import { Divider, Row, Section, ui } from './DemoUI';

const TIME_SEGMENTS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

// Platform-specific icon names: SF Symbols on iOS, drawable names on Android
const VIEW_SEGMENTS =
  Platform.OS === 'ios'
    ? [
        { label: 'List', value: 'list', icon: 'list.bullet' },
        { label: 'Grid', value: 'grid', icon: 'square.grid.2x2' },
        { label: 'Gallery', value: 'gallery', icon: 'photo.on.rectangle' },
      ]
    : [
        { label: 'List', value: 'list', icon: 'list_bullet' },
        { label: 'Grid', value: 'grid', icon: 'grid_view' },
      ];

const PARTIAL_DISABLED_SEGMENTS = [
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled', disabled: true },
  { label: 'Also Active', value: 'also-active' },
];

export function SegmentedControlDemo(): React.JSX.Element {
  const [selected, setSelected] = useState<string>('day');
  const [iconSelected, setIconSelected] = useState<string>('list');
  const [partialSelected, setPartialSelected] = useState<string>('active');

  const [disabled, setDisabled] = useState(false);
  const [momentary, setMomentary] = useState(false);
  const [proportional, setProportional] = useState(false);

  return (
    <>
      <Section title="Basic">
        <Row label="Time Period">
          <SegmentedControl
            testID="segment-basic"
            style={ui.fullFlex}
            segments={TIME_SEGMENTS}
            selectedValue={selected}
            disabled={disabled}
            onSelect={(value) => setSelected(value)}
            ios={{
              momentary,
              apportionsSegmentWidthsByContent: proportional,
            }}
          />
        </Row>
        <Divider />
        <Row label="Selected">
          <Text testID="segment-basic-value" style={ui.valueText}>
            {selected}
          </Text>
        </Row>
      </Section>

      <Section title="With Icons">
        <Row label="View Mode">
          <SegmentedControl
            testID="segment-icons"
            style={ui.fullFlex}
            segments={VIEW_SEGMENTS}
            selectedValue={iconSelected}
            disabled={disabled}
            onSelect={(value) => setIconSelected(value)}
            ios={{ apportionsSegmentWidthsByContent: true }}
          />
        </Row>
        <Divider />
        <Row label="Selected">
          <Text style={ui.valueText}>{iconSelected}</Text>
        </Row>
      </Section>

      <Section title="Per-Segment Disabled">
        <Row label="Status">
          <SegmentedControl
            testID="segment-partial-disabled"
            style={ui.fullFlex}
            segments={PARTIAL_DISABLED_SEGMENTS}
            selectedValue={partialSelected}
            onSelect={(value) => setPartialSelected(value)}
          />
        </Row>
        <Divider />
        <Row label="Selected">
          <Text style={ui.valueText}>{partialSelected}</Text>
        </Row>
      </Section>

      <Section title="Controls">
        <Row label="Disabled">
          <Switch
            testID="disabled-switch"
            value={disabled}
            onValueChange={setDisabled}
          />
        </Row>

        {Platform.OS === 'ios' && (
          <>
            <Divider />
            <Row label="Momentary">
              <Switch
                testID="momentary-switch"
                value={momentary}
                onValueChange={setMomentary}
              />
            </Row>
            <Divider />
            <Row label="Proportional">
              <Switch
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
