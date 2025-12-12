import { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Switch,
  Pressable,
  Platform,
} from 'react-native';
import { DatePicker } from 'react-native-platform-components';

const printPrettyDate = (date?: Date | null) => {
  return date?.toISOString().split('T')[0];
};

export default function App() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [modal, setModal] = useState<boolean>(false);
  const [wheel, setWheel] = useState<boolean>(false);
  const [m3, setM3] = useState<boolean>(false);

  console.log('Render');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Demo App</Text>

      <View style={styles.row}>
        <Text>Modal Mode:</Text>
        <Switch
          value={modal}
          onValueChange={(val) => {
            setModal(val);
            if (!val) setOpen(false);
          }}
        />
      </View>

      {Platform.OS === 'ios' && (
        <View style={styles.row}>
          <Text>Wheel Mode: </Text>
          <Switch value={wheel} onValueChange={setWheel} />
        </View>
      )}

      {Platform.OS === 'android' && (
        <View style={styles.row}>
          <Text>Material 3: </Text>
          <Switch value={m3} onValueChange={setM3} />
        </View>
      )}

      {modal && (
        <Pressable
          onPress={() => {
            if (modal) {
              setOpen((prev) => !prev);
            }
          }}
        >
          <Text style={styles.input}>
            Selected Date: {printPrettyDate(date)}
          </Text>
        </Pressable>
      )}

      <View style={styles.picker}>
        <DatePicker
          style={styles.box}
          visible={open}
          modal={modal}
          date={date}
          mode={'date'}
          ios={{ preferredStyle: wheel ? 'wheels' : 'calendar' }}
          android={{
            useMaterial3: m3,
            dialogTitle: 'Hello',
            positiveButtonTitle: 'Yes',
            negativeButtonTitle: 'No',
          }}
          onCancel={() => {
            console.log('cancel');
            setOpen(false);
          }}
          onConfirm={(newDate: Date) => {
            console.log('confirm', newDate);
            setDate(newDate);
            setOpen(false);
          }}
        />
      </View>

      <Text style={styles.footer}>react-native-platform-components</Text>
    </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: 'lightgray',
  },
  box: {
    alignSelf: 'center',

    width: 400,
    height: 500,
  },
  input: {
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    padding: 10,
    color: 'gray',
  },
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
});
