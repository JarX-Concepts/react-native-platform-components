// FormSectionDemo.tsx
import React, { useState } from 'react';
import { Platform, PlatformColor, StyleSheet, Text, View } from 'react-native';
import {
  Checkbox,
  FormSection,
  SelectionMenu,
  Switch,
  TextField,
} from 'react-native-platform-components';
import { useDemoColors } from './DemoUI';

// The grouped forms of Settings and Contacts on iOS: TextField rows with the
// label in a leading column, settings rows and a header and footer on a
// rounded card. Android and web show the same children as they are.
export function FormSectionDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [overnight, setOvernight] = useState(false);
  const [memo, setMemo] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [receipt, setReceipt] = useState(true);
  const [signature, setSignature] = useState(false);
  const [carrier, setCarrier] = useState<string | null>('usps');

  return (
    <View style={styles.page}>
      <FormSection
        testID="form-payee"
        header="Payee"
        footer="We'll mail the check to this address. Overnight mail arrives the next business day."
        labelWidth={90}
        style={styles.section}
      >
        <TextField
          testID="form-name"
          label="Name"
          placeholder="Required"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          autoCapitalize="words"
        />
        <TextField
          testID="form-phone"
          label="Phone"
          placeholder="Optional"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <Switch
          testID="form-overnight"
          label="Overnight mail"
          value={overnight}
          onValueChange={setOvernight}
        />
        <Switch
          testID="form-memo-switch"
          label="Add a memo"
          value={memo}
          onValueChange={setMemo}
        />
        {/* A row that comes and goes: the separators follow */}
        {memo && (
          <TextField
            testID="form-memo"
            label="Memo"
            placeholder="Printed on the check"
            value={memoText}
            onChangeText={setMemoText}
          />
        )}
      </FormSection>

      <FormSection
        testID="form-delivery"
        header="Delivery confirmation"
        maxFontSizeMultiplier={2}
        style={styles.section}
      >
        <Switch
          testID="form-signature"
          label="Ask for a signature when the check is delivered to the payee"
          value={signature}
          onValueChange={setSignature}
        />
        {/* Any view is a row: your own label beside a menu */}
        <View style={styles.menuRow}>
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            Carrier
          </Text>
          <SelectionMenu
            testID="form-carrier"
            options={CARRIERS}
            selected={carrier}
            presentation="embedded"
            onSelect={(data) => setCarrier(data)}
          />
        </View>
        <Checkbox
          testID="form-receipt"
          label="Email me a receipt"
          checked={receipt}
          onCheckedChange={setReceipt}
        />
      </FormSection>

      <Text style={[styles.note, { color: colors.placeholder }]}>
        {Platform.OS === 'ios'
          ? "The second section's header stops growing at twice the default text size (maxFontSizeMultiplier)."
          : 'Android shows the rows as they are, with the header and footer as text.'}
      </Text>
    </View>
  );
}

const CARRIERS = [
  { label: 'USPS', data: 'usps' },
  { label: 'UPS', data: 'ups' },
  { label: 'FedEx', data: 'fedex' },
];

const styles = StyleSheet.create({
  // iOS: the grouped background the card sits on, out to the screen's edges
  page: Platform.select({
    ios: {
      marginHorizontal: -20,
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 32,
      backgroundColor: PlatformColor('systemGroupedBackground'),
    },
    default: { marginTop: 8, gap: 24 },
  }),
  // Android and web: the rows as they are, spaced out
  section: Platform.select({ ios: {}, default: { gap: 8 } }),
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuLabel: { flexShrink: 1, fontSize: 17 },
  note: { fontSize: 12, paddingHorizontal: 4 },
});
