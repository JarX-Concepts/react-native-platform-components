// ActionSheetDemo.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  ActionSheet,
  type ActionSheetAction,
} from 'react-native-platform-components';
import {
  ChipTabs,
  Divider,
  PillButton,
  Row,
  Section,
  ui,
  useDemoColors,
} from './DemoUI';

// While the sheet is up, the app closes it (visible = false) or unmounts it
type Timer = 'off' | 'close' | 'unmount';

const TIMERS: readonly { label: string; value: Timer }[] = [
  { label: 'Off', value: 'off' },
  { label: 'Close', value: 'close' },
  { label: 'Unmount', value: 'unmount' },
];

const FILES: Record<string, string> = {
  library: 'IMG_0042.heic',
  document: 'Contract.pdf',
  camera: 'Photo.jpg',
};

export function ActionSheetDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState('(none)');
  const [header, setHeader] = useState(true);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [anchored, setAnchored] = useState(true);
  const [timer, setTimer] = useState<Timer>('off');
  const [mounted, setMounted] = useState(true);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const openSheet = () => {
    setOpen(true);
    if (timer === 'off') return;
    timeouts.current.push(
      setTimeout(() => {
        setOpen(false);
        if (timer === 'close') {
          setLastEvent('closed by the app');
          return;
        }
        setMounted(false);
        setLastEvent('unmounted by the app');
        timeouts.current.push(setTimeout(() => setMounted(true), 500));
      }, 2000)
    );
  };

  // A file-source picker: three sources, and Remove once there is a file
  const actions = useMemo<ActionSheetAction[]>(
    () => [
      {
        id: 'library',
        title: 'Photo Library',
        image: { ios: 'photo.on.rectangle', android: 'photo_library' },
        testID: 'source-library',
      },
      {
        id: 'document',
        title: 'Document',
        image: { ios: 'doc', android: 'description' },
        testID: 'source-document',
      },
      {
        id: 'camera',
        title: 'Take Photo',
        image: { ios: 'camera', android: 'photo_camera' },
        attributes: { disabled: !cameraAvailable },
        testID: 'source-camera',
      },
      {
        id: 'remove',
        title: 'Remove File',
        image: { ios: 'trash', android: 'delete' },
        attributes: { destructive: true, hidden: file === null },
        haptics: 'warning',
        testID: 'source-remove',
      },
    ],
    [cameraAvailable, file]
  );

  const trigger = (
    <PillButton
      testID="actionsheet-open"
      label={file ? 'Change…' : 'Add File…'}
      onPress={openSheet}
    />
  );

  // The sheet's children render in place, and the sheet points at them
  // where UIKit shows it as a popover (iPad, iPhone on iOS 26).
  const sheet = (children: React.ReactNode) =>
    mounted ? (
      <ActionSheet
        testID="actionsheet"
        visible={open}
        title={header ? 'Add a file' : undefined}
        message={header ? 'Choose where the file comes from' : undefined}
        actions={actions}
        cancelTestID="source-cancel"
        haptics="selection"
        onSelect={(id) => {
          setOpen(false);
          setLastEvent(`select: ${id}`);
          setFile(id === 'remove' ? null : (FILES[id] ?? id));
        }}
        onCancel={() => {
          setOpen(false);
          setLastEvent('cancel');
        }}
      >
        {children}
      </ActionSheet>
    ) : null;

  return (
    <>
      <Section title="File source">
        <View style={styles.attachment}>
          <Text
            testID="actionsheet-file"
            style={[styles.fileName, { color: colors.text }]}
          >
            {file ?? 'No file'}
          </Text>
          {anchored && mounted ? sheet(trigger) : trigger}
        </View>
        {/* Childless, stretched full width and 0 high in the column: an
            iPhone shows the sheet with its Cancel row, an iPad a centered
            popover */}
        {anchored ? null : sheet(null)}
        <Divider />
        <Row label="Last event">
          <Text testID="actionsheet-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
      </Section>

      <Section title="Controls">
        <Row label="Title and message">
          <Switch
            style={ui.alignEnd}
            testID="actionsheet-header-switch"
            value={header}
            onValueChange={setHeader}
          />
        </Row>
        <Divider />
        <Row label="Camera available">
          <Switch
            style={ui.alignEnd}
            testID="actionsheet-camera-switch"
            value={cameraAvailable}
            onValueChange={setCameraAvailable}
          />
        </Row>
        <Divider />
        <Row label="Anchor to the button">
          <Switch
            style={ui.alignEnd}
            testID="actionsheet-anchored-switch"
            value={anchored}
            onValueChange={setAnchored}
          />
        </Row>
        <Divider />
        <Row label="After 2 s">
          <ChipTabs
            testID="actionsheet-timer"
            value={timer}
            options={TIMERS}
            onChange={setTimer}
          />
        </Row>
        <Divider />
        <Text style={[styles.caption, { color: colors.placeholder }]}>
          iOS shows titles only (UIAlertAction has no public icon API).
          Anchored, the iOS sheet points at the button (iPad, iPhone on iOS 26)
          and a tap outside cancels; without children the iPhone sheet has a
          Cancel row. Android has no cancel row: swipe down, tap outside or go
          back to cancel.
        </Text>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
  },
  fileName: { flex: 1, fontSize: 16 },
  caption: { padding: 12, fontSize: 13 },
});
