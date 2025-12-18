import { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Switch,
  Pressable,
  Platform,
} from 'react-native';
import {
  DatePicker,
  SelectionMenu,
  type AndroidMaterialMode,
} from 'react-native-platform-components';

const pretty = (date?: Date | null) =>
  date ? date.toISOString().split('T')[0] : '—';

export function DatePickerDemo() {
  // ----- Core controls -----
  const [presentationModal, setPresentationModal] = useState(true);
  const [open, setOpen] = useState(false);

  const [mode, setMode] = useState<'date' | 'time' | 'dateAndTime'>('date');
  const [date, setDate] = useState<Date | null>(null);

  const [minEnabled, setMinEnabled] = useState(false);
  const [maxEnabled, setMaxEnabled] = useState(false);

  // keep bounds deterministic for demo
  const minDate = useMemo(() => {
    if (!minEnabled) return null;
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minEnabled]);

  const maxDate = useMemo(() => {
    if (!maxEnabled) return null;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [maxEnabled]);

  // ----- iOS controls -----
  const [iosStyle, setIosStyle] = useState<
    'automatic' | 'compact' | 'inline' | 'wheels'
  >('automatic');
  const [iosMinuteInterval, setIosMinuteInterval] = useState<
    'inherit' | '1' | '5' | '10' | '15'
  >('inherit');
  const [iosRounds, setIosRounds] = useState<'inherit' | 'round' | 'noRound'>(
    'inherit'
  );

  // ----- Android controls -----
  const [androidMaterial, setAndroidMaterial] =
    useState<AndroidMaterialMode>('auto');
  const [androidTitleEnabled, setAndroidTitleEnabled] = useState(true);
  const [androidButtonsEnabled, setAndroidButtonsEnabled] = useState(true);

  const dialogTitle = androidTitleEnabled ? 'Custom Title' : undefined;
  const positiveTitle = androidButtonsEnabled ? 'Custom OK' : undefined;
  const negativeTitle = androidButtonsEnabled ? 'Custom Cancel' : undefined;

  // ----- Selection menu options -----
  const modeOptions = useMemo(
    () =>
      [
        { label: 'Date', data: 'date' },
        { label: 'Time', data: 'time' },
        { label: 'Date & Time', data: 'dateAndTime' },
      ] as const,
    []
  );

  const iosStyleOptions = useMemo(
    () =>
      [
        { label: 'Automatic', data: 'automatic' },
        { label: 'Compact', data: 'compact' },
        { label: 'Inline', data: 'inline' },
        { label: 'Wheels', data: 'wheels' },
      ] as const,
    []
  );

  const iosMinuteOptions = useMemo(
    () =>
      [
        { label: 'Default', data: 'inherit' },
        { label: '1', data: '1' },
        { label: '5', data: '5' },
        { label: '10', data: '10' },
        { label: '15', data: '15' },
      ] as const,
    []
  );

  const iosRoundsOptions = useMemo(
    () =>
      [
        { label: 'Inherit', data: 'inherit' },
        { label: 'Round', data: 'round' },
        { label: 'No Round', data: 'noRound' },
      ] as const,
    []
  );

  const androidMaterialOptions = useMemo(
    () =>
      [
        { label: 'Auto', data: 'auto' },
        { label: 'M2', data: 'm2' },
        { label: 'M3', data: 'm3' },
      ] as const,
    []
  );

  // ----- Presentation behavior -----
  const presentation = presentationModal ? 'modal' : 'inline';
  const visible = presentationModal ? open : undefined;

  return (
    <>
      <View style={styles.options}>
        {/* Presentation */}
        <View style={styles.row}>
          <Text style={styles.label}>Modal</Text>
          <Switch
            value={presentationModal}
            onValueChange={(val) => {
              setPresentationModal(val);
              if (!val) setOpen(false);
            }}
          />
        </View>

        <View style={styles.divider} />

        {/* Mode */}
        <View style={styles.row}>
          <Text style={styles.label}>Mode</Text>
          <SelectionMenu
            style={styles.smenu}
            options={modeOptions as any}
            selected={mode}
            inlineMode
            placeholder="Mode"
            onSelect={(data) => setMode(data as any)}
          />
        </View>

        {/* Controlled value */}
        <View style={styles.row}>
          <Text style={styles.label}>Value</Text>
          <Pressable
            style={styles.input}
            onPress={() => {
              // quick set "today"
              const d = new Date();
              d.setSeconds(0, 0);
              setDate(d);
            }}
          >
            <Text style={styles.valueText}>
              {date ? date.toISOString() : '— (tap to set now)'}
            </Text>
          </Pressable>

          <Pressable style={styles.smallBtn} onPress={() => setDate(null)}>
            <Text style={styles.smallBtnText}>Clear</Text>
          </Pressable>
        </View>

        {/* Min/Max */}
        <View style={styles.row}>
          <Text style={styles.label}>Min (−30d)</Text>
          <Switch value={minEnabled} onValueChange={setMinEnabled} />
          <Text style={styles.miniValue}>
            {minEnabled ? pretty(minDate) : 'off'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Max (+30d)</Text>
          <Switch value={maxEnabled} onValueChange={setMaxEnabled} />
          <Text style={styles.miniValue}>
            {maxEnabled ? pretty(maxDate) : 'off'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* iOS controls */}
        {Platform.OS === 'ios' && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>iOS Style</Text>
              <SelectionMenu
                style={styles.smenu}
                options={iosStyleOptions as any}
                selected={iosStyle}
                inlineMode
                placeholder="Style"
                onSelect={(data) => setIosStyle(data as any)}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Minute Int</Text>
              <SelectionMenu
                style={styles.smenu}
                options={iosMinuteOptions as any}
                selected={iosMinuteInterval}
                inlineMode
                placeholder="Minute Interval"
                onSelect={(data) => setIosMinuteInterval(data as any)}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Rounds</Text>
              <SelectionMenu
                style={styles.smenu}
                options={iosRoundsOptions as any}
                selected={iosRounds}
                inlineMode
                placeholder="Rounds"
                onSelect={(data) => setIosRounds(data as any)}
              />
            </View>

            <View style={styles.divider} />
          </>
        )}

        {/* Android controls */}
        {Platform.OS === 'android' && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Material</Text>
              <SelectionMenu
                style={styles.smenu}
                options={androidMaterialOptions as any}
                selected={androidMaterial}
                inlineMode
                placeholder="Material"
                onSelect={(data) =>
                  setAndroidMaterial(data as AndroidMaterialMode)
                }
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Dialog Title</Text>
              <Switch
                value={androidTitleEnabled}
                onValueChange={setAndroidTitleEnabled}
              />
              <Text style={styles.miniValue}>
                {androidTitleEnabled ? 'on' : 'off'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Buttons</Text>
              <Switch
                value={androidButtonsEnabled}
                onValueChange={setAndroidButtonsEnabled}
              />
              <Text style={styles.miniValue}>
                {androidButtonsEnabled ? 'on' : 'off'}
              </Text>
            </View>

            <View style={styles.divider} />
          </>
        )}

        {/* Open control (modal only) */}
        {presentationModal && (
          <View style={styles.row}>
            <Text style={styles.label}>Open</Text>
            <Pressable style={styles.input} onPress={() => setOpen((p) => !p)}>
              <Text style={styles.valueText}>
                {open ? 'open' : 'closed'} (tap)
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.divider} />

        {/* Picker */}
        <View style={styles.picker}>
          <DatePicker
            style={styles.box}
            presentation={presentation}
            visible={visible}
            date={date}
            minDate={minDate ?? undefined}
            maxDate={maxDate ?? undefined}
            mode={mode}
            ios={{
              preferredStyle: iosStyle,
              minuteInterval:
                iosMinuteInterval === 'inherit'
                  ? undefined
                  : Number(iosMinuteInterval),
              roundsToMinuteInterval: iosRounds,
            }}
            android={{
              material: androidMaterial,
              dialogTitle,
              positiveButtonTitle: positiveTitle,
              negativeButtonTitle: negativeTitle,
            }}
            onCancel={() => {
              setOpen(false);
            }}
            onConfirm={(newDate: Date) => {
              setDate(newDate);
            }}
          />
        </View>
      </View>

      <Text style={styles.footer}>react-native-platform-components</Text>
    </>
  );
}

const styles = StyleSheet.create({
  options: {
    backgroundColor: 'white',
    borderRadius: 10,
  },
  row: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  divider: {
    marginHorizontal: 10,
    borderColor: '#bdc3c7',
    borderBottomWidth: 0.5,
  },
  label: {
    opacity: 0.7,
    width: 120,
  },
  smenu: { flex: 1 },
  input: { flex: 1, paddingVertical: 6 },
  valueText: { color: 'blue' },
  miniValue: { marginLeft: 10, opacity: 0.6 },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginLeft: 8,
  },
  smallBtnText: { opacity: 0.8 },
  picker: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignSelf: 'center',
    paddingVertical: 6,
  },
  box: { alignSelf: 'center' },
  footer: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
  },
});
