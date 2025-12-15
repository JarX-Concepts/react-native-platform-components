// SelectionMenuTest.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SelectionMenu } from 'react-native-platform-components';

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

export function SelectionMenuTest(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const selectedLabel = useMemo(() => {
    if (selectedIndex < 0 || selectedIndex >= US_STATES.length) return 'None';
    return US_STATES[selectedIndex];
  }, [selectedIndex]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>SelectionMenu Test</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Selected:</Text>
        <Text style={styles.value}>{selectedLabel}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.buttonText}>Open menu</Text>
      </Pressable>

      <View style={{ height: 16 }} />

      {/* This is the anchor view for the native popover/sheet */}
      <SelectionMenu
        style={styles.anchor}
        options={US_STATES}
        selectedIndex={selectedIndex}
        visible={open ? 'open' : 'closed'}
        placeholder="Select a state"
        presentation="popover"
        onSelect={(index, _value) => {
          setSelectedIndex(index);
          setOpen(false);
        }}
        onRequestClose={() => setOpen(false)}
      />

      <Text style={styles.hint}>
        iOS: tap "Open menu" or tap the field. iPad should popover-anchor to the
        field; iPhone uses a sheet (auto).
        {'\n'}
        Platform: {Platform.OS}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, opacity: 0.7 },
  value: { fontSize: 16, fontWeight: '600' },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  anchor: {
    height: 44,
    justifyContent: 'center',
  },
  hint: { marginTop: 16, fontSize: 13, opacity: 0.7, lineHeight: 18 },
});

export default SelectionMenuTest;
