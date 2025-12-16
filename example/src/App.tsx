import { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Switch,
  Pressable,
  Platform,
} from 'react-native';
import { DatePicker, SelectionMenu } from 'react-native-platform-components';

const printPrettyDate = (date?: Date | null) => {
  return date?.toISOString().split('T')[0];
};

export default function App() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [modal, setModal] = useState<boolean>(false);
  const [wheel, setWheel] = useState<boolean>(false);
  const [m3, setM3] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DatePicker Demo</Text>

      <View style={styles.options}>
        <View style={styles.row}>
          <Text style={styles.label}>Modal Mode</Text>
          <Switch
            value={modal}
            onValueChange={(val) => {
              setModal(val);
              if (!val) setOpen(false);
            }}
          />
        </View>

        <View style={styles.divider} />

        {Platform.OS === 'ios' && (
          <View style={styles.row}>
            <Text style={styles.label}>Mode</Text>

            <SelectionMenu
              style={styles.smenu}
              options={['Wheels', 'Calendar']}
              selectedIndex={wheel ? 0 : 1}
              inlineMode={true}
              placeholder="Date Picker Style"
              onSelect={(index, _value) => {
                setWheel(index === 0);
              }}
            />
          </View>
        )}

        {Platform.OS === 'android' && (
          <View style={styles.row}>
            <Text style={styles.label}>Material 3: </Text>
            <Switch value={m3} onValueChange={setM3} />
          </View>
        )}

        <View style={styles.divider} />

        {modal && (
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Pressable
              style={styles.input}
              onPress={() => {
                if (modal) {
                  setOpen((prev) => !prev);
                }
              }}
            >
              <Text style={styles.dateLabel}>{printPrettyDate(date)}</Text>
            </Pressable>
          </View>
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
              dialogTitle: 'Custom Title',
              positiveButtonTitle: 'Custom OK',
              negativeButtonTitle: 'Custom Cancel',
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
  options: {
    backgroundColor: 'white',
    borderRadius: 10,
  },
  row: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
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
    color: 'gray',
    width: 140,
  },
});
