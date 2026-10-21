// DialogDemo.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  Dialog,
  type DialogAction,
  type DialogProps,
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

// While a dialog is up, the app closes it (visible = false) or unmounts it
type Timer = 'off' | 'close' | 'unmount';

const TIMERS: readonly { label: string; value: Timer }[] = [
  { label: 'Off', value: 'off' },
  { label: 'Close', value: 'close' },
  { label: 'Unmount', value: 'unmount' },
];

type DialogKey = 'confirm' | 'deleted' | 'share' | 'update' | 'save' | 'live';

type DemoDialog = Pick<
  DialogProps,
  'title' | 'message' | 'actions' | 'dismissable' | 'haptics'
>;

// A dialog whose content changes while it is up: a second after it opens,
// the message shows up and Install turns enabled (with a new testID)
const liveDialog = (ready: boolean): DemoDialog => ({
  title: 'Checking for updates…',
  message: ready ? 'Version 2.0 is ready to install.' : undefined,
  actions: [
    {
      id: 'cancel',
      title: 'Cancel',
      role: 'cancel',
      testID: 'dialog-live-cancel',
    },
    {
      id: 'install',
      title: 'Install',
      preferred: true,
      disabled: !ready,
      testID: ready ? 'dialog-live-install' : 'dialog-live-waiting',
    },
  ],
});

const DIALOGS: Record<DialogKey, DemoDialog> = {
  // A confirmation: Cancel and a destructive, preferred Delete
  confirm: {
    title: 'Delete this photo?',
    message: 'It will be removed from all your devices.',
    actions: [
      {
        id: 'cancel',
        title: 'Cancel',
        role: 'cancel',
        testID: 'dialog-cancel',
      },
      {
        id: 'delete',
        title: 'Delete',
        role: 'destructive',
        preferred: true,
        haptics: 'warning',
        testID: 'dialog-delete',
      },
    ],
  },
  // Shown from the confirmation's onDismiss
  deleted: {
    title: 'Photo deleted',
    actions: [{ id: 'ok', title: 'OK', preferred: true, testID: 'dialog-ok' }],
  },
  // More actions than Android's three button slots: stacked
  share: {
    title: 'Share to',
    message: 'Pick where the link goes.',
    actions: [
      { id: 'messages', title: 'Messages', testID: 'dialog-share-messages' },
      { id: 'mail', title: 'Mail', testID: 'dialog-share-mail' },
      { id: 'notes', title: 'Notes', testID: 'dialog-share-notes' },
      { id: 'copy', title: 'Copy Link', testID: 'dialog-share-copy' },
      {
        id: 'cancel',
        title: 'Cancel',
        role: 'cancel',
        testID: 'dialog-share-cancel',
      },
    ],
  },
  // No cancel: back and a tap outside do nothing on Android
  update: {
    title: 'Update required',
    message: 'Install the latest version to keep syncing.',
    dismissable: false,
    actions: [
      {
        id: 'update',
        title: 'Update',
        preferred: true,
        testID: 'dialog-update',
      },
    ],
  },
  // A disabled action
  save: {
    title: 'Save changes?',
    message: 'The document has a name that is already taken.',
    actions: [
      {
        id: 'discard',
        title: 'Don’t Save',
        role: 'destructive',
        testID: 'dialog-discard',
      },
      {
        id: 'cancel',
        title: 'Cancel',
        role: 'cancel',
        testID: 'dialog-save-cancel',
      },
      {
        id: 'save',
        title: 'Save',
        preferred: true,
        disabled: true,
        testID: 'dialog-save',
      },
    ],
  },
  // Changes while it is up (see liveDialog)
  live: liveDialog(false),
};

const SECOND_DIALOG_ACTIONS: readonly DialogAction[] = [
  { id: 'ok', title: 'OK', testID: 'dialog-second-ok' },
];

export function DialogDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [active, setActive] = useState<DialogKey | null>(null);
  const [second, setSecond] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [failure, setFailure] = useState('(none)');
  const [timer, setTimer] = useState<Timer>('off');
  const [mounted, setMounted] = useState(true);
  const [liveReady, setLiveReady] = useState(false);
  // The dialog to show once the current one has gone (onDismiss)
  const next = useRef<DialogKey | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const log = (event: string) => setEvents((list) => [...list, event]);

  const open = (key: DialogKey) => {
    setEvents([]);
    setFailure('(none)');
    setActive(key);
    if (key === 'live') {
      setLiveReady(false);
      timeouts.current.push(setTimeout(() => setLiveReady(true), 1000));
    }
    if (timer === 'off') return;
    timeouts.current.push(
      setTimeout(() => {
        setActive(null);
        if (timer === 'close') {
          log('closed by the app');
          return;
        }
        setMounted(false);
        log('unmounted by the app');
        timeouts.current.push(setTimeout(() => setMounted(true), 500));
      }, 2000)
    );
  };

  // The confirmation, and a second dialog asked for while it is up: it
  // doesn't show, and onPresentFailed says why
  const openTwo = () => {
    open('confirm');
    timeouts.current.push(setTimeout(() => setSecond(true), 1000));
  };

  return (
    <>
      <Section title="Dialogs">
        <Row label="Confirm">
          <PillButton
            testID="dialog-open-confirm"
            label="Delete Photo…"
            onPress={() => open('confirm')}
          />
        </Row>
        <Divider />
        <Row label="Five actions">
          <PillButton
            testID="dialog-open-share"
            label="Share…"
            onPress={() => open('share')}
          />
        </Row>
        <Divider />
        <Row label="Not dismissable">
          <PillButton
            testID="dialog-open-update"
            label="Update…"
            onPress={() => open('update')}
          />
        </Row>
        <Divider />
        <Row label="Disabled action">
          <PillButton
            testID="dialog-open-save"
            label="Close Document…"
            onPress={() => open('save')}
          />
        </Row>
        <Divider />
        <Row label="Changes while up">
          <PillButton
            testID="dialog-open-live"
            label="Check…"
            onPress={() => open('live')}
          />
        </Row>
        <Divider />
        <Row label="Two at once">
          <PillButton
            testID="dialog-open-two"
            label="Open Two…"
            onPress={openTwo}
          />
        </Row>
      </Section>

      <Section title="Events">
        <Row label="Events">
          <Text testID="dialog-events" style={ui.valueText}>
            {events.length ? events.join(', ') : '(none)'}
          </Text>
        </Row>
        <Divider />
        <Row label="Present failed">
          <Text testID="dialog-failure" style={ui.valueText}>
            {failure}
          </Text>
        </Row>
        <Divider />
        <Row label="After 2 s">
          <ChipTabs
            testID="dialog-timer"
            value={timer}
            options={TIMERS}
            onChange={setTimer}
          />
        </Row>
        <Divider />
        <Text style={[styles.caption, { color: colors.placeholder }]}>
          {Platform.OS === 'ios'
            ? 'An iOS alert never closes on a tap outside; its Cancel button cancels.'
            : 'Back and a tap outside cancel, except on the Update dialog (dismissable={false}).'}{' '}
          After Delete, the next dialog opens from onDismiss.
        </Text>
      </Section>

      {mounted ? (
        <View>
          {(Object.keys(DIALOGS) as DialogKey[]).map((key) => (
            <Dialog
              key={key}
              testID={`${key}-dialog`}
              visible={active === key}
              {...(key === 'live' ? liveDialog(liveReady) : DIALOGS[key])}
              haptics="selection"
              onShow={() => log('show')}
              onSelect={(id) => {
                setActive(null);
                log(`select: ${id}`);
                if (key === 'confirm' && id === 'delete')
                  next.current = 'deleted';
              }}
              onCancel={() => {
                setActive(null);
                log('cancel');
              }}
              onDismiss={() => {
                log('dismiss');
                const following = next.current;
                next.current = null;
                if (following) setActive(following);
              }}
              onPresentFailed={(reason) => {
                setActive(null);
                setFailure(reason);
              }}
            />
          ))}
          <Dialog
            testID="second-dialog"
            visible={second}
            title="Second dialog"
            actions={SECOND_DIALOG_ACTIONS}
            onSelect={() => setSecond(false)}
            onCancel={() => setSecond(false)}
            onPresentFailed={(reason) => {
              setSecond(false);
              setFailure(reason);
            }}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  caption: { padding: 12, fontSize: 13 },
});
