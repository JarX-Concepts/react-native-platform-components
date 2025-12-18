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

type Presentation = 'auto' | 'popover' | 'sheet';

export function SelectionMenuDemo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const [disabled, setDisabled] = useState(false);
  const [inlineMode, setInlineMode] = useState(false);

  const [presentation, setPresentation] = useState<Presentation>('popover');
  const [material, setMaterial] = useState<AndroidMaterialMode>('system');

  const selectedLabel = useMemo(() => selected ?? 'None', [selected]);

  const presentationOptions = useMemo(
    () =>
      [
        { label: 'Auto', data: 'auto' },
        { label: 'Popover', data: 'popover' },
        { label: 'Sheet', data: 'sheet' },
      ] as const,
    []
  );

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
        <Row label="Inline">
          <Switch
            value={inlineMode}
            onValueChange={(v) => {
              setInlineMode(v);
              if (v) setOpen(false);
            }}
          />
        </Row>

        <Divider />

        <Row label="Disabled">
          <Switch
            value={disabled}
            onValueChange={(v) => {
              setDisabled(v);
              if (v) setOpen(false);
            }}
          />
        </Row>

        <Divider />

        <Row label="Presentation">
          <SelectionMenu
            style={ui.fullFlex}
            options={presentationOptions as any}
            selected={presentation}
            inlineMode
            placeholder="Presentation"
            onSelect={(data) => setPresentation(data as Presentation)}
          />
        </Row>

        {Platform.OS === 'android' && (
          <>
            <Divider />
            <Row label="Material">
              <SelectionMenu
                style={ui.fullFlex}
                options={materialOptions as any}
                selected={material}
                inlineMode
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
          {inlineMode ? (
            // ✅ Inline anchor lives INSIDE the row → feels attached
            <SelectionMenu
              style={ui.fullFlex}
              options={STATE_OPTIONS}
              selected={selected}
              disabled={disabled}
              placeholder="Select a state"
              inlineMode={true}
              // headless-only props omitted on purpose
              onSelect={(data) => setSelected(data)}
            />
          ) : (
            // ✅ Headless row anchor
            <ActionField
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

        {!inlineMode && (
          <>
            <Divider />
            <Row
              label="Menu"
              right={
                <PillButton
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
                text={open ? 'open' : 'closed'}
                disabled={disabled}
                onPress={() => {
                  if (disabled) return;
                  setOpen((p) => !p);
                }}
              />
            </Row>
          </>
        )}
      </Section>

      {!inlineMode && (
        <SelectionMenu
          options={STATE_OPTIONS}
          selected={selected}
          disabled={disabled}
          placeholder="Select a state"
          inlineMode={false}
          visible={open}
          presentation={presentation as any}
          android={Platform.OS === 'android' ? { material } : undefined}
          onSelect={(data) => {
            setSelected(data);
            setOpen(false);
          }}
          onRequestClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
