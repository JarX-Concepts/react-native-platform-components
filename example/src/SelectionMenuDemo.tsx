// SelectionMenuDemo.tsx
import React, { useMemo, useState } from 'react';
import { Platform, Switch } from 'react-native';
import {
  SelectionMenu,
  type AndroidMaterialMode,
} from 'react-native-platform-components';
import { ActionField, Divider, PillButton, Row, Section, ui } from './DemoUI';

const US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
] as const;

const STATE_OPTIONS = US_STATES.map((s) => ({ label: s, data: s }));

export function SelectionMenuDemo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const [disabled, setDisabled] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  const [material, setMaterial] = useState<AndroidMaterialMode>('system');

  const selectedLabel = useMemo(() => selected ?? 'None', [selected]);

  const materialOptions = useMemo(
    () =>
      [
        { label: 'System', data: 'system' },
        { label: 'M3', data: 'm3' },
      ] as const,
    []
  );

  return (
    <>
      <Section title="Controls">
        <Row label="Embedded">
          <Switch
            testID="embedded-switch"
            value={embedded}
            onValueChange={(v) => {
              setEmbedded(v);
              if (v) setOpen(false);
            }}
          />
        </Row>

        <Divider />

        <Row label="Disabled">
          <Switch
            testID="disabled-switch"
            value={disabled}
            onValueChange={(v) => {
              setDisabled(v);
              if (v) setOpen(false);
            }}
          />
        </Row>

        {Platform.OS === 'android' && (
          <>
            <Divider />
            <Row label="Material">
              <SelectionMenu
                testID="android-material-menu"
                style={ui.fullFlex}
                options={materialOptions}
                selected={material}
                presentation="embedded"
                placeholder="Material"
                onSelect={(data) => setMaterial(data as AndroidMaterialMode)}
              />
            </Row>
          </>
        )}
      </Section>

      <Section title="Picker">
        <Row
          label="US State"
          right={
            <PillButton
              testID="clear-state-button"
              label="Clear"
              disabled={!selected || disabled}
              onPress={() => {
                if (disabled) return;
                setSelected(null);
                setOpen(false);
              }}
            />
          }
        >
          {embedded ? (
            // ✅ Embedded anchor lives INSIDE the row → feels attached
            <SelectionMenu
              testID="state-menu-embedded"
              style={ui.fullFlex}
              options={STATE_OPTIONS}
              selected={selected}
              disabled={disabled}
              placeholder="Select a state"
              presentation="embedded"
              android={Platform.OS === 'android' ? { material } : undefined}
              // modal-only props omitted on purpose
              onSelect={(data) => setSelected(data)}
            />
          ) : (
            // ✅ Headless row anchor
            <ActionField
              testID="state-field-headless"
              text={selectedLabel}
              placeholder="Select a state"
              disabled={disabled || !STATE_OPTIONS.length}
              onPress={() => {
                if (disabled) return;
                setOpen(true);
              }}
            />
          )}
        </Row>

        {!embedded && (
          <>
            <Divider />
            <Row
              label="Menu"
              right={
                <PillButton
                  testID="menu-toggle-button"
                  label={open ? 'Close' : 'Open'}
                  disabled={disabled}
                  onPress={() => {
                    if (disabled) return;
                    setOpen((p) => !p);
                  }}
                />
              }
            >
              <ActionField
                testID="menu-toggle-field"
                text={open ? 'open' : 'closed'}
                disabled={disabled}
                onPress={() => {
                  if (disabled) return;
                  setOpen((p) => !p);
                }}
              />

              <SelectionMenu
                testID="state-menu-modal"
                options={STATE_OPTIONS}
                selected={selected}
                disabled={disabled}
                placeholder="Select a state"
                presentation="modal"
                visible={open}
                android={Platform.OS === 'android' ? { material } : undefined}
                onSelect={(data) => {
                  console.log('Selected:', data);
                  setSelected(data);
                  setOpen(false);
                }}
                onRequestClose={() => {
                  console.log('cancelled');
                  setOpen(false);
                }}
              />
            </Row>
          </>
        )}
      </Section>
    </>
  );
}
