import { useState } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import { DatePicker } from 'react-native-platform-components';

export default function App() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(null);

  return (
    <View style={styles.container}>
      <Text>Selected timestamp (ms): {date?.getDay()}</Text>
      <Button title="Open" onPress={() => setOpen(true)} />
      <DatePicker
        visible={open}
        ios={{ mode: 'date', preferredStyle: 'calendar' }}
        onCancel={() => setOpen(false)}
        onConfirm={(newDate: Date) => {
          console.log('Selected date:', newDate);
          setDate(newDate);
          setOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
