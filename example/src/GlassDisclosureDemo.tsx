// GlassDisclosureDemo.tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Button,
  GlassDisclosure,
  isLiquidGlassSupported,
  type PlatformIcon,
} from 'react-native-platform-components';
import { PillButton, Row, Section, ui, useDemoColors } from './DemoUI';

const MORE_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'ellipsis' },
  android: { type: 'drawable', name: 'more_vert' },
};

const MORE_MENU = [
  { id: 'copy', title: 'Copy link' },
  { id: 'star', title: 'Star channel' },
  { id: 'leave', title: 'Leave channel', attributes: { destructive: true } },
];

// A channel's messages, for the backdrop and the glass to sit over
const MESSAGES = [
  {
    from: 'Ada',
    text: 'The concept plans are up in the tab.',
    color: '#FF6B35',
  },
  { from: 'Grace', text: 'Love the new lobby layout!', color: '#2A9D8F' },
  {
    from: 'Linus',
    text: 'Can we move the stairs to the east wall?',
    color: '#6C5CE7',
  },
  { from: 'Ada', text: 'Sure, I will sketch it tonight.', color: '#FF6B35' },
  {
    from: 'Margaret',
    text: 'Budget review moved to Thursday.',
    color: '#E84393',
  },
  { from: 'Grace', text: 'Thursday works for me.', color: '#2A9D8F' },
  { from: 'Linus', text: 'Pushed the revised elevations.', color: '#6C5CE7' },
];

const ROWS = [
  { id: 'members', label: 'Members', value: '5' },
  { id: 'tabs', label: 'Tabs', value: '3' },
  { id: 'files', label: 'Files', value: '12' },
];

export function GlassDisclosureDemo(): React.ReactElement {
  const colors = useDemoColors();
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [lastEvent, setLastEvent] = useState('—');

  const setOpen = (open: boolean) => {
    setExpanded(open);
    setLastEvent(open ? 'Expanded' : 'Collapsed');
  };

  return (
    <View>
      <Section title="Channel card">
        <View
          testID="disclosure-stage"
          style={[styles.stage, { backgroundColor: colors.background }]}
        >
          <View style={styles.messages}>
            {MESSAGES.map((message, index) => (
              <View key={index} style={styles.message}>
                <View
                  style={[styles.avatar, { backgroundColor: message.color }]}
                />
                <View style={ui.fullFlex}>
                  <Text style={[styles.from, { color: colors.text }]}>
                    {message.from}
                  </Text>
                  <Text style={[styles.text, { color: colors.text }]}>
                    {message.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <GlassDisclosure
            testID="disclosure"
            style={styles.overlay}
            expanded={expanded}
            onExpandedChange={setOpen}
            title="concept-plans"
            subtitle="5 members • 3 tabs"
            headerRight={
              <Button
                testID="disclosure-more"
                icon={MORE_ICON}
                accessibilityLabel="More"
                variant={isLiquidGlassSupported ? 'glass' : 'text'}
                shape="round"
                menu={MORE_MENU}
                onMenuSelect={(_id, title) => setLastEvent(title)}
              />
            }
          >
            {ROWS.map((row) => (
              <Pressable
                key={row.id}
                testID={`disclosure-row-${row.id}`}
                accessibilityRole="button"
                onPress={() => setLastEvent(row.label)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {row.label}
                </Text>
                <Text style={[styles.rowValue, { color: colors.placeholder }]}>
                  {row.value}
                </Text>
                <Text style={[styles.chevron, { color: colors.placeholder }]}>
                  ›
                </Text>
              </Pressable>
            ))}
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                Notifications
              </Text>
              <Switch
                testID="disclosure-notifications"
                value={notifications}
                onValueChange={(value) => {
                  setNotifications(value);
                  setLastEvent(
                    value ? 'Notifications on' : 'Notifications off'
                  );
                }}
              />
            </View>
          </GlassDisclosure>
        </View>
      </Section>

      <Section title="Events">
        <Row label="Controlled">
          {/* `expanded` is the app's state: it can open the panel too */}
          <View style={styles.alignStart}>
            <PillButton
              testID="disclosure-open"
              label="Open"
              onPress={() => setOpen(true)}
            />
          </View>
        </Row>
        <Row label="Last event">
          <Text testID="disclosure-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
        <Row label="Surface">
          <Text style={ui.valueText}>
            {isLiquidGlassSupported ? 'Liquid Glass morph' : 'Card'}
          </Text>
        </Row>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  // Stands in for a screen: the disclosure fills it
  stage: { height: 520 },
  alignStart: { alignSelf: 'flex-start' },
  messages: { paddingTop: 72, paddingHorizontal: 14, gap: 14 },
  message: { flexDirection: 'row', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 8 },
  from: { fontSize: 14, fontWeight: '700' },
  text: { fontSize: 14 },
  overlay: { paddingTop: 12, paddingHorizontal: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowPressed: { backgroundColor: 'rgba(128, 128, 128, 0.15)' },
  rowLabel: { flex: 1, fontSize: 16 },
  rowValue: { fontSize: 16, marginRight: 6 },
  chevron: { fontSize: 22, marginTop: -2 },
});
