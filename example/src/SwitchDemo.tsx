// SwitchDemo.tsx
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Switch } from 'react-native-platform-components';
import { Divider, Row, Section, ui } from './DemoUI';

export function SwitchDemo(): React.JSX.Element {
  const [wifi, setWifi] = useState(true);
  const [cellular, setCellular] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [checkIcon, setCheckIcon] = useState(true);
  const [starIcon, setStarIcon] = useState(false);
  const [brand, setBrand] = useState(true);
  const [brandOff, setBrandOff] = useState(false);
  const [lastEvent, setLastEvent] = useState('(none)');

  return (
    <>
      <Section title="Settings rows (label)">
        <Switch
          testID="switch-wifi"
          style={styles.row}
          label="Wi-Fi"
          value={wifi}
          haptics="selection"
          onValueChange={(value) => {
            setWifi(value);
            setLastEvent(`wifi: ${value}`);
          }}
        />
        <Divider />
        <Switch
          testID="switch-cellular"
          style={styles.row}
          label="Download over cellular data when Wi-Fi isn't available, which your carrier may charge for"
          value={cellular}
          onValueChange={(value) => {
            setCellular(value);
            setLastEvent(`cellular: ${value}`);
          }}
        />
        <Divider />
        <Switch
          testID="switch-bluetooth"
          style={styles.row}
          label="Bluetooth (disabled)"
          value
          disabled
          onValueChange={(value) => setLastEvent(`bluetooth: ${value}`)}
        />
      </Section>

      <Section title="Standalone">
        <Row
          label="Notifications"
          right={
            <Switch
              testID="switch-notifications"
              accessibilityLabel="Notifications"
              value={notifications}
              onValueChange={(value) => {
                setNotifications(value);
                setLastEvent(`notifications: ${value}`);
              }}
            />
          }
        >
          <Text testID="switch-notifications-value" style={ui.valueText}>
            {notifications ? 'On' : 'Off'}
          </Text>
        </Row>
        <Divider />
        <Row
          label="Disabled"
          right={
            <Switch
              testID="switch-plain-disabled"
              accessibilityLabel="Disabled switch"
              value={false}
              disabled
              onValueChange={(value) => setLastEvent(`disabled: ${value}`)}
            />
          }
        >
          <Text style={ui.valueText}>Off</Text>
        </Row>
      </Section>

      <Section title="Controlled (the parent keeps it off)">
        <Switch
          testID="switch-locked"
          style={styles.row}
          label="Requires a subscription"
          value={false}
          onValueChange={(value) => setLastEvent(`locked: ${value}`)}
        />
        <Divider />
        <Row label="Last event">
          <Text testID="switch-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
      </Section>

      <Section title="Colors and thumb icons">
        <Switch
          testID="switch-colors"
          style={styles.row}
          label="Custom colors"
          value={brand}
          color="#2E7D32"
          trackColor="#F8BBD0"
          thumbColor="#FFF59D"
          onValueChange={setBrand}
        />
        <Divider />
        <Switch
          testID="switch-colors-off"
          style={styles.row}
          label="Custom colors, off"
          value={brandOff}
          color="#2E7D32"
          trackColor="#F8BBD0"
          thumbColor="#FFF59D"
          onValueChange={setBrandOff}
        />
        <Divider />
        <Switch
          testID="switch-check"
          style={styles.row}
          label="Check icon (Android)"
          value={checkIcon}
          android={{ thumbIcon: 'check' }}
          onValueChange={setCheckIcon}
        />
        <Divider />
        <Switch
          testID="switch-star"
          style={styles.row}
          label="Star icon (Android)"
          value={starIcon}
          android={{ thumbIcon: { type: 'drawable', name: 'star' } }}
          onValueChange={setStarIcon}
        />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  // The style's padding is part of the row: a tap there toggles it too
  row: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 48 },
});
