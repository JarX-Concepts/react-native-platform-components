// FloatingToolbarDemo.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Button,
  ButtonGroup,
  FloatingToolbar,
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

// Placeholder "content" for the toolbar to float over
const LINES = [0.9, 0.7, 0.8, 0.5, 0.85, 0.6, 0.75, 0.4, 0.8];

export function FloatingToolbarDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [vertical, setVertical] = useState(false);
  const [tinted, setTinted] = useState(false);
  const [variant, setVariant] =
    useState<FloatingToolbarAndroidVariant>('standard');

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
    </>
  );
}

const styles = StyleSheet.create({
  canvas: {
    height: 380,
    overflow: 'hidden',
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
