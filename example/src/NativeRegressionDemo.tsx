import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  ButtonGroup,
  DatePicker,
  SegmentedControl,
  SelectionMenu,
  TextField,
  type PlatformIcon,
  type TextFieldSelection,
} from 'react-native-platform-components';
import { ChipTabs, PillButton, Section, useDemoColors } from './DemoUI';

const CASES = [
  { label: 'Selection', value: 'selection' },
  { label: 'Date', value: 'date' },
  { label: 'Text', value: 'text' },
  { label: 'Options', value: 'options' },
  { label: 'Images', value: 'images' },
] as const;

const SEGMENTS = [
  { label: 'First segment', value: 'first' },
  { label: 'Second segment', value: 'second' },
];
const BUTTONS = [
  { label: 'First button', value: 'first' },
  { label: 'Second button', value: 'second' },
];
const OPTIONS = [
  { label: 'First option', data: 'first' },
  { label: 'Second option', data: 'second' },
];

// Separate data URIs exercise both asynchronous image callbacks without a
// network dependency. Each PNG is a 24-point colored square.
const LEADING_IMAGE: PlatformIcon = {
  type: 'image',
  source: {
    uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAJUlEQVR4nGNQ6n72n5aYYdSCUQtGLRi1YNSCUQtGLRi1YGhYAADpH8jMH5oZfAAAAABJRU5ErkJggg==',
  },
  tinted: false,
};
const TRAILING_IMAGE: PlatformIcon = {
  type: 'image',
  source: {
    uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAJUlEQVR4nGN4Fav3n5aYYdSCUQtGLRi1YNSCUQtGLRi1YGhYAAArnoVMxz5kxQAAAABJRU5ErkJggg==',
  },
  tinted: false,
};

function Status({ id, children }: { id: string; children: React.ReactNode }) {
  const colors = useDemoColors();
  return (
    <Text testID={id} style={[styles.status, { color: colors.text }]}>
      {children}
    </Text>
  );
}

function ControlledSelectionCases() {
  const [segmentRequest, setSegmentRequest] = useState('none');
  const [groupRequest, setGroupRequest] = useState('none');
  const [menuRequest, setMenuRequest] = useState('none');

  return (
    <Section title="Rejected selection changes">
      <View style={styles.content}>
        <Status id="regression-selection-help">
          Each parent keeps the first choice selected after every request.
        </Status>
        <SegmentedControl
          testID="regression-segments"
          segments={SEGMENTS}
          selectedValue="first"
          onSelect={setSegmentRequest}
        />
        <Status id="regression-segment-request">{segmentRequest}</Status>
        <ButtonGroup
          testID="regression-buttons"
          buttons={BUTTONS}
          selection="single"
          selectedValues={['first']}
          onSelectionChange={(values) => setGroupRequest(values.join(','))}
        />
        <Status id="regression-button-request">{groupRequest}</Status>
        <SelectionMenu
          testID="regression-menu"
          options={OPTIONS}
          selected="first"
          presentation="embedded"
          onSelect={setMenuRequest}
          android={{ material: 'system' }}
        />
        <Status id="regression-menu-request">{menuRequest}</Status>
      </View>
    </Section>
  );
}

function DisabledOptionsCase() {
  const [unavailable, setUnavailable] = useState(true);
  const [modal, setModal] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState('ready');
  const [reported, setReported] = useState('none');
  return (
    <Section title="Disabled menu options">
      <View style={styles.content}>
        <PillButton
          testID="regression-menu-mode"
          label={modal ? 'Use embedded' : 'Use modal'}
          onPress={() => setModal(!modal)}
        />
        <PillButton
          testID="regression-menu-enable"
          label={unavailable ? 'Enable choice' : 'Disable choice'}
          onPress={() => setUnavailable(!unavailable)}
        />
        {modal && (
          <PillButton
            testID="regression-menu-open"
            label="Open options"
            onPress={() => setVisible(true)}
          />
        )}
        <SelectionMenu
          testID="regression-disabled-menu"
          options={[
            { label: 'Ready choice', data: 'ready' },
            {
              label: 'Unavailable choice',
              data: 'unavailable',
              disabled: unavailable,
            },
            { label: 'Another choice', data: 'another' },
          ]}
          selected={selected}
          presentation={modal ? 'modal' : 'embedded'}
          visible={visible}
          android={{ material: 'system' }}
          onSelect={(data, _label, index) => {
            setSelected(data);
            setReported(`${data}:${index}`);
            setVisible(false);
          }}
          onRequestClose={() => setVisible(false)}
        />
        <Status id="regression-disabled-request">{reported}</Status>
      </View>
    </Section>
  );
}

function ImageRequestCase() {
  const [account, setAccount] = useState('first');
  const [generation, setGeneration] = useState(0);
  const [cache, setCache] = useState<'default' | 'reload' | 'only-if-cached'>(
    'default'
  );
  return (
    <Section title="Authenticated image requests">
      <View style={styles.content}>
        <Status id="regression-network-help">
          Requires the local E2E image server on port 18763.
        </Status>
        <TextField
          key={generation}
          defaultValue="Authenticated image"
          leadingIcon={{
            type: 'image',
            tinted: false,
            source: {
              uri: `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:18763/icon`,
              headers: { Authorization: `Bearer ${account}` },
              method: 'POST',
              body: 'size=small',
              cache,
            },
          }}
          leadingIconTestID="regression-request-image"
          leadingIconAccessibilityLabel="Authenticated icon"
        />
        <Status id="regression-request-account">{account}</Status>
        <PillButton
          testID="regression-request-switch"
          label="Switch account"
          onPress={() => setAccount(account === 'first' ? 'second' : 'first')}
        />
        <PillButton
          testID="regression-request-cache"
          label="Use cached image"
          onPress={() => {
            setCache('only-if-cached');
            setGeneration(generation + 1);
          }}
        />
        <PillButton
          testID="regression-request-reload"
          label="Reload image"
          onPress={() => {
            setCache('reload');
            setGeneration(generation + 1);
          }}
        />
      </View>
    </Section>
  );
}

function MenuImageRequestCase() {
  const [account, setAccount] = useState('first');
  const image = (path: string, reload = false): PlatformIcon => ({
    type: 'image',
    tinted: false,
    source: {
      uri: `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:18763/menu/${path}`,
      ...(path === 'account'
        ? { headers: { Authorization: `Bearer ${account}` } }
        : {}),
      ...(reload ? { cache: 'reload' as const } : {}),
    },
  });
  return (
    <Section title="Menu image requests">
      <View style={styles.content}>
        <PillButton
          testID="regression-menu-account"
          label="Replace account image"
          onPress={() => setAccount('second')}
        />
        <Button
          label="Request menu"
          menu={[
            {
              id: 'reload',
              title: 'Reload icon',
              image: image('reload', true),
            },
            {
              id: 'no-store',
              title: 'No-store icon',
              image: image('no-store'),
            },
            { id: 'account', title: 'Account icon', image: image('account') },
          ]}
        />
      </View>
    </Section>
  );
}

function ImageCases() {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <PillButton
        testID="regression-image-mode"
        label={menu ? 'Accessory image' : 'Menu images'}
        onPress={() => setMenu(!menu)}
      />
      {menu ? <MenuImageRequestCase /> : <ImageRequestCase />}
    </>
  );
}

function DateLifecycleCase() {
  const [mounted, setMounted] = useState(false);
  const [closedCount, setClosedCount] = useState(0);

  useEffect(() => {
    if (!mounted) return undefined;
    // The native modal blocks the page, so a timer removes its host while
    // it is still open. Unmounting must dismiss it without a cancel event.
    const timer = setTimeout(() => setMounted(false), 8000);
    return () => clearTimeout(timer);
  }, [mounted]);

  return (
    <Section title="Initially visible date picker">
      <View style={styles.content}>
        <Status id="regression-date-help">
          Mounts open, then unmounts after eight seconds. On iOS the picker has
          no Cancel or Done toolbar.
        </Status>
        <PillButton
          testID="regression-mount-date"
          label="Mount open picker"
          disabled={mounted}
          onPress={() => setMounted(true)}
        />
        <Status id="regression-date-state">
          {mounted ? 'mounted' : 'unmounted'}
        </Status>
        <Status id="regression-date-closed">{String(closedCount)}</Status>
        {mounted && (
          <DatePicker
            testID="regression-date"
            date={new Date('2025-06-15T12:30:00Z')}
            presentation="modal"
            visible
            mode="time"
            locale="en_GB"
            timeZoneName="UTC"
            is24Hour
            ios={{ preferredStyle: 'wheels', showConfirmToolbar: false }}
            android={{ material: 'system', dialogTitle: 'Regression time' }}
            onClosed={() => setClosedCount((count) => count + 1)}
          />
        )}
      </View>
    </Section>
  );
}

function TextLifecycleCase() {
  const [multiline, setMultiline] = useState(false);
  const [selection, setSelection] = useState<TextFieldSelection>();
  const [lastSelection, setLastSelection] = useState('none');
  const [focused, setFocused] = useState(false);
  const [iconPresses, setIconPresses] = useState(0);

  const selectWord = () => {
    setSelection({ start: 6, end: 11 });
  };
  const toggleMultiline = () => {
    // Stop controlling the range before rebuilding. The native input must
    // retain it; sending it again from JS would conceal a native regression.
    setSelection(undefined);
    setMultiline((current) => !current);
  };

  return (
    <Section title="Text input lifecycle">
      <View style={styles.content}>
        <TextField
          testID="regression-text"
          defaultValue="Hello there"
          multiline={multiline}
          selection={selection}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSelectionChange={(event) => {
            const { start, end } = event.nativeEvent.selection;
            setLastSelection(`${start}-${end}`);
          }}
          ios={{
            keyboardToolbar: {
              items: [
                {
                  id: 'select',
                  title: 'Select word',
                  testID: 'regression-select-word',
                },
                {
                  id: 'toggle',
                  title: 'Toggle lines',
                  testID: 'regression-toggle-lines',
                },
              ],
              onItemPress: (id) => {
                if (id === 'select') selectWord();
                if (id === 'toggle') toggleMultiline();
              },
              done: true,
              doneTestID: 'regression-text-done',
            },
          }}
        />
        <Status id="regression-text-mode">
          {multiline ? 'multiline' : 'single line'}
        </Status>
        <Status id="regression-text-focus">
          {focused ? 'focused' : 'blurred'}
        </Status>
        <Status id="regression-text-selection">{lastSelection}</Status>
        {Platform.OS === 'android' && (
          <View style={styles.actions}>
            <PillButton
              testID="regression-select-word"
              label="Select word"
              onPress={selectWord}
            />
            <PillButton
              testID="regression-toggle-lines"
              label="Toggle lines"
              onPress={toggleMultiline}
            />
          </View>
        )}
        <TextField
          testID="regression-images"
          defaultValue="Both image accessories"
          leadingIcon={LEADING_IMAGE}
          trailingIcon={TRAILING_IMAGE}
          leadingIconTestID="regression-leading-image"
          trailingIconTestID="regression-trailing-image"
          leadingIconAccessibilityLabel="Blue image"
          trailingIconAccessibilityLabel="Orange image"
          onTrailingIconPress={() => setIconPresses((count) => count + 1)}
        />
        <Status id="regression-image-presses">{String(iconPresses)}</Status>
      </View>
    </Section>
  );
}

/** Isolated edge cases for native regression tests and manual inspection. */
export function NativeRegressionDemo() {
  const [activeCase, setActiveCase] =
    useState<(typeof CASES)[number]['value']>('selection');
  return (
    <>
      <ChipTabs
        testID="regression-case"
        value={activeCase}
        options={CASES}
        onChange={setActiveCase}
      />
      {activeCase === 'selection' && <ControlledSelectionCases />}
      {activeCase === 'date' && <DateLifecycleCase />}
      {activeCase === 'text' && <TextLifecycleCase />}
      {activeCase === 'options' && <DisabledOptionsCase />}
      {activeCase === 'images' && <ImageCases />}
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 8 },
  status: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8 },
});
