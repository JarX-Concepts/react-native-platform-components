import { useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { PlatformComponentsView } from 'react-native-platform-components';

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Button title="Open" onPress={() => setOpen(true)} />
      <PlatformComponentsView style={styles.box} open={open} />
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
