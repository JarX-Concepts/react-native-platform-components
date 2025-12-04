import { View, StyleSheet } from 'react-native';
import { PlatformComponentsView } from 'react-native-platform-components';

export default function App() {
  return (
    <View style={styles.container}>
      <PlatformComponentsView style={styles.box} />
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
