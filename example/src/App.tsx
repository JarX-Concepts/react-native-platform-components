import { useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { DatePickerDemo } from './DatePickerDemo';
import { SelectionMenuDemo } from './SelectionMenuDemo';

export default function App() {
  const [demo, setDemo] = useState<
    'datePicker' | 'selectionMenu' | undefined
  >();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Platform Componnents</Text>
      <Text style={styles.header}>Demo</Text>

      {demo === 'datePicker' && <DatePickerDemo />}
      {demo === 'selectionMenu' && <SelectionMenuDemo />}

      <View style={styles.space}>
        <Button
          title={'DatePicker Demo'}
          onPress={() => setDemo('datePicker')}
        />
      </View>

      <Button
        title={'SelectionMenu Demo'}
        onPress={() => setDemo('selectionMenu')}
      />

      <Text style={styles.footer}>react-native-platform-components</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingTop: 100,
    padding: 30,
    backgroundColor: '#ecf0f1',
  },
  footer: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
  },
  space: {
    marginVertical: 20,
  },
});
