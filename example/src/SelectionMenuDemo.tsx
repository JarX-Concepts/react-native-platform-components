// SelectionMenuTest.tsx
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  SelectionMenu,
  type AndroidMaterialMode,
} from 'react-native-platform-components';

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
  // Headless control
  const [open, setOpen] = useState(false);

  // Controlled selection by `data`
  const [selected, setSelected] = useState<string | null>(null);

  // Wrapper-level booleans
  const [disabled, setDisabled] = useState(false);
  const [inlineMode, setInlineMode] = useState(false);

  // Headless-only knobs (ignored if inlineMode === true)
  const [presentation, setPresentation] = useState<Presentation>('popover');

  // Android knob
  const [material, setMaterial] = useState<AndroidMaterialMode>('auto');

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
        { label: 'Auto', data: 'auto' },
        { label: 'M2', data: 'm2' },
        { label: 'M3', data: 'm3' },
      ] as const,
    []
  );

  const openAllowed = !disabled && !inlineMode;

  return (
    <>
      {/* Controls */}
      <View style={styles.panel}>
        <View style={styles.row}>
          <Text style={styles.label}>Inline</Text>
          <Switch
            value={inlineMode}
            onValueChange={(v) => {
              setInlineMode(v);
              // Headless open state is irrelevant in inline mode
              if (v) setOpen(false);
            }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Disabled</Text>
          <Switch
            value={disabled}
            onValueChange={(v) => {
              setDisabled(v);
              if (v) setOpen(false);
            }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Presentation</Text>
          <SelectionMenu
            style={styles.smenu}
            options={presentationOptions as any}
            selected={presentation}
            inlineMode
            placeholder="Presentation"
            onSelect={(data) => setPresentation(data as Presentation)}
          />
        </View>

        {Platform.OS === 'android' && (
          <View style={styles.row}>
            <Text style={styles.label}>Material</Text>
            <SelectionMenu
              style={styles.smenu}
              options={materialOptions as any}
              selected={material}
              inlineMode
              placeholder="Material"
              onSelect={(data) => setMaterial(data as AndroidMaterialMode)}
            />
          </View>
        )}

        <View style={styles.divider} />

        {/* Anchor (headless open trigger) */}
        <View style={styles.row}>
          <Text style={styles.label}>US State</Text>
          <Pressable
            style={[
              styles.input,
              (!openAllowed || !STATE_OPTIONS.length) && styles.inputDisabled,
            ]}
            onPress={() => {
              if (!openAllowed) return;
              setOpen(true);
            }}
          >
            <Text style={styles.valueText}>{selectedLabel}</Text>
          </Pressable>

          <Pressable
            style={[
              styles.smallBtn,
              (!selected || disabled) && styles.smallBtnDisabled,
            ]}
            onPress={() => {
              if (disabled) return;
              setSelected(null);
              setOpen(false);
            }}
          >
            <Text style={styles.smallBtnText}>Clear</Text>
          </Pressable>
        </View>

        {!inlineMode && (
          <View style={styles.row}>
            <Text style={styles.label}>Open</Text>
            <Pressable
              style={[styles.input, !openAllowed && styles.inputDisabled]}
              onPress={() => {
                if (!openAllowed) return;
                setOpen((p) => !p);
              }}
            >
              <Text style={styles.valueText}>
                {open ? 'open' : 'closed'} (tap)
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* The menu itself */}
      <SelectionMenu
        options={STATE_OPTIONS}
        selected={selected}
        disabled={disabled}
        placeholder="Select a state"
        inlineMode={inlineMode}
        visible={open}
        presentation={presentation as any}
        android={Platform.OS === 'android' ? { material } : undefined}
        onSelect={(data) => {
          setSelected(data);
          setOpen(false);
        }}
        onRequestClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 6,
  },
  row: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  label: {
    opacity: 0.7,
    width: 120,
  },
  divider: {
    marginHorizontal: 10,
    borderColor: '#bdc3c7',
    borderBottomWidth: 0.5,
  },
  smenu: {
    flex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 6,
  },
  inputDisabled: {
    opacity: 0.4,
  },
  valueText: {
    color: 'blue',
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginLeft: 8,
  },
  smallBtnDisabled: {
    opacity: 0.4,
  },
  smallBtnText: {
    opacity: 0.8,
  },
});
