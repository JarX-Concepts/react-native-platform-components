// CheckboxDemo.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Checkbox,
  RadioGroup,
  type CheckboxState,
  type RadioGroupOption,
} from 'react-native-platform-components';
import { Divider, PillButton, Row, Section, ui } from './DemoUI';

const TERMS =
  'I have read and agree to the Terms of Service and the Privacy Policy, ' +
  'and I agree to receive account notices by email.';

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push notifications' },
  { value: 'sms', label: 'Text messages' },
] as const;
type Channel = (typeof CHANNELS)[number]['value'];

const DELIVERY: readonly RadioGroupOption[] = [
  {
    value: 'standard',
    label: 'Standard',
    description: '3–5 business days · Free',
  },
  {
    value: 'express',
    label: 'Express',
    description: 'Next business day · $9.99',
  },
  {
    value: 'sameDay',
    label: 'Same day',
    description: 'Not available at your address',
    disabled: true,
  },
  {
    value: 'pickup',
    label: 'Pick up in store',
    description: 'Ready in 2 hours',
  },
];

const ACCOUNT_TYPES: readonly RadioGroupOption[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
];

function labelOf(options: readonly RadioGroupOption[], value: string | null) {
  return options.find((o) => o.value === value)?.label ?? 'None';
}

export function CheckboxDemo(): React.JSX.Element {
  // Agreement, validated on submit
  const [terms, setTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState('Not submitted');

  // A parent checkbox over its children
  const [channels, setChannels] = useState<Channel[]>(['email']);
  const allChannels: CheckboxState =
    channels.length === CHANNELS.length
      ? true
      : channels.length === 0
        ? false
        : 'indeterminate';

  // A checkbox whose parent never takes the change: it snaps back
  const [lockedAttempts, setLockedAttempts] = useState(0);

  // Delivery method, validated on continue
  const [delivery, setDelivery] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | undefined>();
  const [lastEvent, setLastEvent] = useState('(none)');

  return (
    <>
      <Section title="Agreement (long label, error on submit)">
        <View style={styles.content}>
          <Checkbox
            testID="checkbox-terms"
            label={TERMS}
            checked={terms}
            error={termsError}
            haptics="selection"
            onCheckedChange={(checked) => {
              setTerms(checked);
              if (checked) setTermsError(undefined);
              setLastEvent(`terms: ${checked}`);
            }}
          />
        </View>
        <Divider />
        <View style={styles.actions}>
          <PillButton
            testID="checkbox-submit"
            label="Create account"
            onPress={() => {
              if (terms) {
                setSubmitted('Submitted');
              } else {
                setTermsError('Accept the terms to create your account');
                setSubmitted('Not submitted');
              }
            }}
          />
        </View>
        <Divider />
        <Row label="Status">
          <Text testID="checkbox-terms-value" style={ui.valueText}>
            {terms ? 'Accepted' : 'Not accepted'} · {submitted}
          </Text>
        </Row>
      </Section>

      <Section title="Indeterminate (parent and children)">
        <View style={styles.content}>
          <Checkbox
            testID="checkbox-all"
            label="All notifications"
            checked={allChannels}
            onCheckedChange={(checked) => {
              setChannels(checked ? CHANNELS.map((c) => c.value) : []);
              setLastEvent(`all: ${checked}`);
            }}
          />
          <View style={styles.children}>
            {CHANNELS.map((channel) => (
              <Checkbox
                key={channel.value}
                testID={`checkbox-${channel.value}`}
                label={channel.label}
                checked={channels.includes(channel.value)}
                onCheckedChange={(checked) => {
                  setChannels((current) =>
                    CHANNELS.map((c) => c.value).filter((v) =>
                      v === channel.value ? checked : current.includes(v)
                    )
                  );
                  setLastEvent(`${channel.value}: ${checked}`);
                }}
              />
            ))}
          </View>
        </View>
        <Divider />
        <Row label="Notify by">
          <Text testID="checkbox-channels-value" style={ui.valueText}>
            {channels.length > 0 ? channels.join(', ') : 'None'}
          </Text>
        </Row>
      </Section>

      <Section title="States">
        <View style={styles.content}>
          <Checkbox
            testID="checkbox-disabled"
            label="Disabled"
            checked={false}
            disabled
            onCheckedChange={() => setLastEvent('disabled: changed')}
          />
          <Checkbox
            testID="checkbox-disabled-checked"
            label="Disabled and checked"
            checked
            disabled
          />
          <Checkbox
            testID="checkbox-error"
            label="Error state without a message"
            checked={false}
            error
          />
          <Checkbox
            testID="checkbox-locked"
            label="Controlled: the parent ignores changes"
            checked={false}
            onCheckedChange={() => setLockedAttempts((count) => count + 1)}
          />
        </View>
        <Divider />
        <Row label="Ignored">
          <Text testID="checkbox-locked-value" style={ui.valueText}>
            {lockedAttempts}
          </Text>
        </Row>
      </Section>

      <Section title="Radio group (descriptions, disabled option)">
        <View style={styles.content}>
          <RadioGroup
            testID="radio-delivery"
            accessibilityLabel="Delivery method"
            options={DELIVERY}
            value={delivery}
            error={deliveryError}
            haptics="selection"
            onValueChange={(value) => {
              setDelivery(value);
              setDeliveryError(undefined);
              setLastEvent(`delivery: ${value}`);
            }}
          />
        </View>
        <Divider />
        <View style={styles.actions}>
          <PillButton
            testID="radio-submit"
            label="Continue"
            onPress={() => {
              if (!delivery) setDeliveryError('Choose a delivery method');
            }}
          />
          <PillButton
            testID="radio-clear"
            label="Clear"
            onPress={() => {
              setDelivery(null);
              setDeliveryError(undefined);
            }}
          />
        </View>
        <Divider />
        <Row label="Delivery">
          <Text testID="radio-delivery-value" style={ui.valueText}>
            {labelOf(DELIVERY, delivery)}
          </Text>
        </Row>
      </Section>

      <Section title="Disabled group">
        <View style={styles.content}>
          <RadioGroup
            testID="radio-account"
            options={ACCOUNT_TYPES}
            value="personal"
            disabled
            onValueChange={(value) => setLastEvent(`account: ${value}`)}
          />
        </View>
        <Divider />
        <Row label="Last event">
          <Text testID="checkbox-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingVertical: 4 },
  // A child checkbox starts under its parent's label
  children: { marginStart: 34 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
