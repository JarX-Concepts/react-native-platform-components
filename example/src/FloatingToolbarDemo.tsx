// FloatingToolbarDemo.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Button,
  ButtonGroup,
  FloatingToolbar,
  SegmentedControl,
  type FloatingToolbarAndroidVariant,
  type PlatformIcon,
} from 'react-native-platform-components';
import { Divider, Row, Section, ui, useDemoColors } from './DemoUI';

const SHARE_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'square.and.arrow.up' },
  android: { type: 'drawable', name: 'share' },
};
const EDIT_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'pencil' },
  android: { type: 'drawable', name: 'edit' },
};
const ARCHIVE_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'archivebox' },
  android: { type: 'drawable', name: 'archive' },
};
const DELETE_ICON: PlatformIcon = {
  ios: { type: 'sfSymbol', name: 'trash' },
  android: { type: 'drawable', name: 'delete' },
};

const ACTIONS = [
  { id: 'share', label: 'Share', icon: SHARE_ICON },
  { id: 'edit', label: 'Edit', icon: EDIT_ICON },
  { id: 'archive', label: 'Archive', icon: ARCHIVE_ICON },
  { id: 'delete', label: 'Delete', icon: DELETE_ICON },
];

const VARIANT_BUTTONS: {
  label: string;
  value: FloatingToolbarAndroidVariant;
}[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Vibrant', value: 'vibrant' },
];

// A view switcher inside a toolbar: the Photos picker on iOS 26
const VIEWS = [
  { label: 'Years', value: 'years' },
  { label: 'Months', value: 'months' },
  { label: 'All', value: 'all' },
];

// Placeholder "content" for the toolbar to float over
const LINES = [0.9, 0.7, 0.8, 0.5, 0.85, 0.6, 0.75, 0.4, 0.8];

export function FloatingToolbarDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [vertical, setVertical] = useState(false);
  const [tinted, setTinted] = useState(false);
  const [variant, setVariant] =
    useState<FloatingToolbarAndroidVariant>('standard');
  const [view, setView] = useState('all');

  return (
    <>
      <Section title="Floating Toolbar">
        <View style={[styles.canvas, { backgroundColor: colors.fill }]}>
          <View style={styles.content}>
            {LINES.map((width, index) => (
              <View
                key={index}
                style={[
                  styles.line,
                  { width: `${width * 100}%`, backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>

          <FloatingToolbar
            testID="toolbar"
            orientation={vertical ? 'vertical' : 'horizontal'}
            color={tinted ? '#FF6B35' : undefined}
            android={{ variant }}
            style={vertical ? styles.toolbarVertical : styles.toolbarHorizontal}
          >
            {ACTIONS.map((action) => (
              <Button
                key={action.id}
                testID={`toolbar-${action.id}`}
                icon={action.icon}
                variant="text"
                accessibilityLabel={action.label}
                onPress={() => setLastAction(action.id)}
              />
            ))}
            <Button
              testID="toolbar-send"
              label="Send"
              variant="tonal"
              onPress={() => setLastAction('send')}
            />
          </FloatingToolbar>
        </View>
        <Divider />
        <Row label="Last action">
          <Text testID="toolbar-last-action" style={ui.valueText}>
            {lastAction ?? '(none)'}
          </Text>
        </Row>
      </Section>

      <Section title="Controls">
        <Row label="Vertical">
          <Switch
            style={ui.alignEnd}
            testID="vertical-switch"
            value={vertical}
            onValueChange={setVertical}
          />
        </Row>
        <Divider />
        <Row label="Tinted">
          <Switch
            style={ui.alignEnd}
            testID="tinted-switch"
            value={tinted}
            onValueChange={setTinted}
          />
        </Row>
        {Platform.OS === 'android' && (
          <>
            <Divider />
            <View style={styles.groupRow}>
              <ButtonGroup
                testID="variant-picker"
                buttons={VARIANT_BUTTONS}
                selection="single"
                selectedValues={[variant]}
                onSelectionChange={(values) => {
                  const next = values[0];
                  if (next) setVariant(next as FloatingToolbarAndroidVariant);
                }}
                size="xsmall"
              />
            </View>
          </>
        )}
      </Section>
      <Section title="View Switcher">
        <View
          style={[
            styles.canvas,
            styles.canvasShort,
            { backgroundColor: colors.fill },
          ]}
        >
          <View style={styles.content}>
            {LINES.slice(0, 4).map((width, index) => (
              <View
                key={index}
                style={[
                  styles.line,
                  { width: `${width * 100}%`, backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>

          <FloatingToolbar
            testID="view-toolbar"
            style={styles.toolbarHorizontal}
          >
            {/* Any component can go in a toolbar; a SegmentedControl needs a width */}
            <SegmentedControl
              testID="view-switcher"
              style={styles.viewSwitcher}
              segments={VIEWS}
              selectedValue={view}
              onSelect={setView}
            />
            <Button
              testID="view-toolbar-share"
              icon={SHARE_ICON}
              variant="text"
              accessibilityLabel="Share"
              onPress={() => setLastAction('share')}
            />
          </FloatingToolbar>
        </View>
        <Divider />
        <Row label="View">
          <Text testID="toolbar-last-view" style={ui.valueText}>
            {view}
          </Text>
        </Row>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  canvas: {
    height: 380,
    overflow: 'hidden',
  },
  canvasShort: {
    height: 220,
  },
  viewSwitcher: {
    width: 250,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  // The toolbar is positioned by the caller; it centers itself by default.
  toolbarHorizontal: {
    position: 'absolute',
    bottom: 16,
  },
  toolbarVertical: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignSelf: 'flex-end',
  },
  groupRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
