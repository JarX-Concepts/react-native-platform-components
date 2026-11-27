// GlassDisclosureDemo.tsx
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
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

const CHANNELS_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'line.3.horizontal' },
  android: { type: 'drawable', name: 'list_bullet' },
};

const SEARCH_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'magnifyingglass' },
  android: { type: 'drawable', name: 'search' },
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

// The header's text, the pill's included, grows to 1.5x at most
const HEADER_TEXT_CAP = 1.5;

export function GlassDisclosureDemo(): React.ReactElement {
  const colors = useDemoColors();
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [lastEvent, setLastEvent] = useState('—');
  // The header buttons grow with the text size: the pill keeps clear of the
  // wider of the two
  const [buttonWidths, setButtonWidths] = useState({
    leading: 44,
    trailing: 44,
  });
  const measureButton =
    (side: 'leading' | 'trailing') => (event: LayoutChangeEvent) => {
      const width = Math.ceil(event.nativeEvent.layout.width);
      setButtonWidths((current) =>
        current[side] === width ? current : { ...current, [side]: width }
      );
    };
  const buttonWidth = Math.max(buttonWidths.leading, buttonWidths.trailing);

  const setOpen = (open: boolean) => {
    setExpanded(open);
    setLastEvent(open ? 'Expanded' : 'Collapsed');
  };

  const headerVariant = isLiquidGlassSupported ? 'glass' : 'text';

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

          {/* A screen header: buttons on either side of the closed pill,
              which must stay visible and tappable beside it */}
          <View style={styles.header}>
            <View onLayout={measureButton('leading')}>
              <Button
                testID="disclosure-header-channels"
                icon={CHANNELS_ICON}
                accessibilityLabel="Channels"
                variant={headerVariant}
                shape="round"
                maxFontSizeMultiplier={HEADER_TEXT_CAP}
                onPress={() => setLastEvent('Channels')}
              />
            </View>
            <View onLayout={measureButton('trailing')}>
              <Button
                testID="disclosure-header-search"
                icon={SEARCH_ICON}
                accessibilityLabel="Search"
                variant={headerVariant}
                shape="round"
                maxFontSizeMultiplier={HEADER_TEXT_CAP}
                onPress={() => setLastEvent('Search')}
              />
            </View>
          </View>

          <GlassDisclosure
            testID="disclosure"
            style={styles.overlay}
            // Between the header buttons; the panel opens across the stage
            pillStyle={{ marginHorizontal: buttonWidth + 8 }}
            maxFontSizeMultiplier={HEADER_TEXT_CAP}
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
  // The pill's row: the overlay's padding, and the pill's 44 pt height
  header: {
    position: 'absolute',
    top: 12,
    left: 10,
    right: 10,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
