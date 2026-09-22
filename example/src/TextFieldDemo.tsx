// TextFieldDemo.tsx
import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  TextField,
  type PlatformIcon,
  type TextFieldRef,
} from 'react-native-platform-components';
import { Divider, PillButton, Row, Section, ui } from './DemoUI';

// Icons take a native symbol per platform, or one image asset for both.
const PERSON_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'person' },
  android: { type: 'drawable', name: 'person' },
};
const SEARCH_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'magnifyingglass' },
  android: { type: 'drawable', name: 'search' },
};
const SEND_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'paperplane' },
  android: { type: 'drawable', name: 'send' },
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function TextFieldDemo(): React.JSX.Element {
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [amount, setAmount] = useState('');
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [lastEvent, setLastEvent] = useState('(none)');
  const [editable, setEditable] = useState(true);
  const [filled, setFilled] = useState(false);
  const [dense, setDense] = useState(false);
  const [material, setMaterial] = useState(true);
  const [writingTools, setWritingTools] = useState(true);
  const nameField = useRef<TextFieldRef>(null);

  const emailError =
    emailTouched && email.length > 0 && !isValidEmail(email)
      ? 'Enter a valid email address'
      : undefined;

  const android = {
    material: material ? 'm3' : 'system',
    variant: filled ? 'filled' : 'outlined',
    dense,
  } as const;
  const common = { editable, android };

  // The grouped form of Contacts and Settings on iOS: the label in a leading
  // column, a borderless field beside it, one row per field. Android keeps
  // its Material fields.
  const formRow = {
    ios: { labelPlacement: 'leading', borderStyle: 'none' },
    ...common,
  } as const;

  return (
    <>
      <Section title="Name">
        <View style={styles.form}>
          <TextField
            testID="field-first-name"
            label="First"
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
            autoCapitalize="words"
            returnKeyType="next"
            {...formRow}
          />
          <Divider />
          <TextField
            testID="field-middle-name"
            label="Middle"
            placeholder="optional"
            value={middleName}
            onChangeText={setMiddleName}
            autoCapitalize="words"
            returnKeyType="next"
            {...formRow}
          />
          <Divider />
          <TextField
            testID="field-last-name"
            label="Last"
            value={lastName}
            onChangeText={setLastName}
            autoComplete="family-name"
            autoCapitalize="words"
            returnKeyType="done"
            {...formRow}
          />
        </View>
      </Section>

      <Section title="Basics">
        <View style={styles.fields}>
          <TextField
            testID="field-name"
            label="Name"
            placeholder="Ada Lovelace"
            supportingText="As it appears on your ID"
            value={name}
            onChangeText={setName}
            leadingIcon={PERSON_ICON}
            autoComplete="name"
            autoCapitalize="words"
            returnKeyType="next"
            onFocus={() => setLastEvent('focus: name')}
            onBlur={() => setLastEvent('blur: name')}
            onSubmitEditing={() => setLastEvent('submit: name')}
            ref={nameField}
            {...common}
          />
          <TextField
            testID="field-email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailTouched(true)}
            error={emailError}
            supportingText="We never share it"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            {...common}
          />
          <TextField
            testID="field-password"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            passwordToggle
            autoComplete="password"
            supportingText="At least 8 characters"
            error={password.length > 0 && password.length < 8}
            {...common}
          />
        </View>
        <Divider />
        <Row label="Value">
          <Text testID="field-name-value" style={ui.valueText}>
            {name || '(empty)'}
          </Text>
        </Row>
        <Divider />
        <Row label="Last event">
          <Text testID="field-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
        <Divider />
        <View style={styles.actions}>
          <PillButton
            testID="field-focus"
            label="Focus name"
            onPress={() => nameField.current?.focus()}
          />
          <PillButton
            testID="field-blur"
            label="Blur"
            onPress={() => nameField.current?.blur()}
          />
          <PillButton
            testID="field-clear"
            label="Clear"
            onPress={() => nameField.current?.clear()}
          />
          <PillButton
            testID="field-set"
            label="Set 'Grace'"
            onPress={() => setName('Grace Hopper')}
          />
        </View>
      </Section>

      <Section title="Affixes and counters">
        <View style={styles.fields}>
          <TextField
            testID="field-amount"
            label="Amount"
            prefix="$"
            suffix="USD"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            {...common}
          />
          <TextField
            testID="field-search"
            placeholder="Search"
            value={query}
            onChangeText={setQuery}
            leadingIcon={SEARCH_ICON}
            trailingIcon={SEND_ICON}
            onTrailingIconPress={() => setLastEvent(`search: ${query}`)}
            returnKeyType="search"
            onSubmitEditing={() => setLastEvent(`search: ${query}`)}
            {...common}
          />
          <TextField
            testID="field-notes"
            label="Notes"
            placeholder="Anything else?"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={120}
            showCharacterCount
            ios={{ writingTools: writingTools ? 'default' : 'none' }}
            {...common}
          />
        </View>
      </Section>

      <Section title="Controls">
        <Row label="Editable">
          <Switch
            style={ui.alignEnd}
            testID="editable-switch"
            value={editable}
            onValueChange={setEditable}
          />
        </Row>
        {Platform.OS === 'android' && (
          <>
            <Divider />
            <Row label="Material 3">
              <Switch
                style={ui.alignEnd}
                testID="material-switch"
                value={material}
                onValueChange={setMaterial}
              />
            </Row>
            <Divider />
            <Row label="Filled">
              <Switch
                style={ui.alignEnd}
                testID="filled-switch"
                value={filled}
                onValueChange={setFilled}
              />
            </Row>
            <Divider />
            <Row label="Dense">
              <Switch
                style={ui.alignEnd}
                testID="dense-switch"
                value={dense}
                onValueChange={setDense}
              />
            </Row>
          </>
        )}
        {Platform.OS === 'ios' && (
          <>
            <Divider />
            <Row label="Writing Tools">
              <Switch
                style={ui.alignEnd}
                testID="writing-tools-switch"
                value={writingTools}
                onValueChange={setWritingTools}
              />
            </Row>
          </>
        )}
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  fields: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  form: Platform.select({
    ios: { paddingHorizontal: 16, paddingVertical: 4, gap: 6 },
    default: { paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  }),
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
