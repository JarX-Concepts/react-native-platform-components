// SelectionMenuTest.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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

export function SelectionMenuDemo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const selectedLabel = useMemo(() => {
    if (selectedIndex < 0 || selectedIndex >= US_STATES.length) return 'None';
    return US_STATES[selectedIndex];
  }, [selectedIndex]);

  return (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>US State:</Text>
        <Pressable style={styles.input} onPress={() => setOpen(true)}>
          <Text style={styles.dateLabel}>{selectedLabel}</Text>
        </Pressable>
      </View>

      <SelectionMenu
        options={US_STATES}
        selectedIndex={selectedIndex}
        inlineMode={false}
        visible={open ? 'open' : 'closed'}
        placeholder="Select a state"
        presentation="popover"
        onSelect={(index, _value) => {
          setSelectedIndex(index);
          setOpen(false);
        }}
        onRequestClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    paddingTop: 100,
    padding: 30,
    backgroundColor: '#ecf0f1',
  },
  options: {
    backgroundColor: 'white',
    borderRadius: 10,
  },
  row: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smenu: {
    flex: 1,
  },
  divider: {
    marginHorizontal: 10,
    borderColor: '#bdc3c7',
    borderBottomWidth: 0.5,
  },
  button: {
    backgroundColor: 'lightgray',
  },
  box: {
    alignSelf: 'center',
  },
  input: { flex: 1 },
  footer: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignSelf: 'center',
  },
  dateLabel: {
    color: 'blue',
  },
  label: {
    opacity: 0.7,
    width: 140,
  },
});
