// FloatingActionButtonDemo.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  FloatingActionButton,
  type FloatingActionButtonSize,
  type PlatformIcon,
} from 'react-native-platform-components';
import { Divider, Row, Section, ui, useDemoColors } from './DemoUI';

const ADD_ICON: PlatformIcon = { ios: 'plus', android: 'add' };
const EDIT_ICON: PlatformIcon = { ios: 'pencil', android: 'edit' };

const SIZES: FloatingActionButtonSize[] = [
  'small',
  'regular',
  'medium',
  'large',
];

const FEED = Array.from({ length: 30 }, (_, i) => `Message ${i + 1}`);

export function FloatingActionButtonDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [lastPressed, setLastPressed] = useState('(none)');
  const [extended, setExtended] = useState(true);
  const [styled, setStyled] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <>
      <Section title="Sizes">
        <View style={styles.sizes}>
          {SIZES.map((size) => (
            <FloatingActionButton
              key={size}
              testID={`fab-${size}`}
              icon={ADD_ICON}
              size={size}
              accessibilityLabel={`Add (${size})`}
              onPress={() => setLastPressed(size)}
            />
          ))}
        </View>
        <Divider />
        <Row label="Last pressed">
          <Text testID="fab-last-pressed" style={ui.valueText}>
            {lastPressed}
          </Text>
        </Row>
      </Section>

      <Section title="Extended">
        {/* Placed by the app: absolute, at the bottom end of its container */}
        <View style={[styles.canvas, { backgroundColor: colors.fill }]}>
          <FloatingActionButton
            testID="fab-extended"
            style={styles.corner}
            icon={EDIT_ICON}
            label="Compose"
            extended={extended}
            disabled={disabled}
            color={styled ? '#FF6B35' : undefined}
            tintColor={styled ? '#FFFFFF' : undefined}
            onPress={() => setLastPressed('compose')}
          />
        </View>
        <Divider />
        <Row label="Extended">
          <Switch
            style={ui.alignEnd}
            testID="fab-extended-switch"
            value={extended}
            onValueChange={setExtended}
          />
        </Row>
        <Divider />
        <Row label="Custom colors">
          <Switch
            style={ui.alignEnd}
            testID="fab-styled-switch"
            value={styled}
            onValueChange={setStyled}
          />
        </Row>
        <Divider />
        <Row label="Disabled">
          <Switch
            style={ui.alignEnd}
            testID="fab-disabled-switch"
            value={disabled}
            onValueChange={setDisabled}
          />
        </Row>
      </Section>

      <Section title="Shrink on scroll">
        {/* Scrolling the feed down shrinks the button; scrolling up extends it */}
        <View style={styles.feed}>
          <ScrollView
            nativeID="fab-feed"
            testID="fab-feed"
            // Android scrolls a vertical ScrollView inside another only with this
            nestedScrollEnabled
            contentContainerStyle={styles.feedContent}
          >
            {FEED.map((line) => (
              <View
                key={line}
                style={[styles.feedRow, { backgroundColor: colors.fill }]}
              >
                <Text style={{ color: colors.text }}>{line}</Text>
              </View>
            ))}
          </ScrollView>
          <FloatingActionButton
            testID="fab-scroll"
            style={styles.corner}
            icon={EDIT_ICON}
            label="Compose"
            scrollViewNativeID="fab-feed"
            onPress={() => setLastPressed('scroll')}
          />
        </View>
        <Divider />
        <Text style={[styles.caption, { color: colors.placeholder }]}>
          Scroll the list: the button shrinks to its icon, and extends again
          scrolling back up.
        </Text>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  sizes: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 20,
    padding: 16,
  },
  canvas: { height: 160 },
  corner: { position: 'absolute', right: 16, bottom: 16 },
  feed: { height: 360, overflow: 'hidden' },
  feedContent: { padding: 12, gap: 8, paddingBottom: 96 },
  feedRow: { padding: 14, borderRadius: 10 },
  caption: { padding: 12, fontSize: 13 },
});
