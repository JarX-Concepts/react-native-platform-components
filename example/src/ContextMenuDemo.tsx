// ContextMenuDemo.tsx
import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  ContextMenu,
  type ContextMenuAction,
} from 'react-native-platform-components';
import { ActionField, Divider, PillButton, Row, Section } from './DemoUI';

const BASIC_ACTIONS: ContextMenuAction[] = [
  {
    id: 'copy',
    title: 'Copy',
    subtitle: 'Copy to clipboard',
    image: Platform.OS === 'ios' ? 'doc.on.doc' : 'content_copy',
  },
  {
    id: 'paste',
    title: 'Paste',
    subtitle: 'Paste from clipboard',
    image: Platform.OS === 'ios' ? 'doc.on.clipboard' : 'content_paste',
  },
  {
    id: 'share',
    title: 'Share',
    subtitle: 'Share with others',
    image: Platform.OS === 'ios' ? 'square.and.arrow.up' : 'share',
  },
];

const ACTIONS_WITH_SUBMENU: ContextMenuAction[] = [
  {
    id: 'edit',
    title: 'Edit',
    subtitle: 'Modify content',
    image: Platform.OS === 'ios' ? 'pencil' : 'edit',
    subactions: [
      {
        id: 'cut',
        title: 'Cut',
        subtitle: 'Remove and copy',
        image: Platform.OS === 'ios' ? 'scissors' : 'content_cut',
      },
      {
        id: 'copy',
        title: 'Copy',
        image: Platform.OS === 'ios' ? 'doc.on.doc' : 'content_copy',
      },
      {
        id: 'paste',
        title: 'Paste',
        image: Platform.OS === 'ios' ? 'doc.on.clipboard' : 'content_paste',
      },
    ],
  },
  {
    id: 'share',
    title: 'Share',
    subtitle: 'Send to friends',
    image: Platform.OS === 'ios' ? 'square.and.arrow.up' : 'share',
  },
  {
    id: 'delete',
    title: 'Delete',
    subtitle: 'Remove permanently',
    image: Platform.OS === 'ios' ? 'trash' : 'delete',
    attributes: { destructive: true },
  },
];

const ACTIONS_WITH_STATE: ContextMenuAction[] = [
  {
    id: 'sort-name',
    title: 'Sort by Name',
    subtitle: 'Alphabetical order',
    state: 'on',
  },
  {
    id: 'sort-date',
    title: 'Sort by Date',
    subtitle: 'Most recent first',
    state: 'off',
  },
  {
    id: 'sort-size',
    title: 'Sort by Size',
    subtitle: 'Largest first',
    state: 'off',
  },
];

export function ContextMenuDemo(): React.JSX.Element {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [enablePreview, setEnablePreview] = useState(false);

  // Modal mode state
  const [modalOpen, setModalOpen] = useState(false);

  const handleAction = (actionId: string, actionTitle: string) => {
    console.log('Action pressed:', actionId, actionTitle);
    setLastAction(`${actionTitle} (${actionId})`);
  };

  return (
    <>
      <Section title="Controls">
        <Row label="Disabled">
          <Switch
            testID="disabled-switch"
            value={disabled}
            onValueChange={(v) => {
              setDisabled(v);
              if (v) setModalOpen(false);
            }}
          />
        </Row>

        {Platform.OS === 'ios' && (
          <>
            <Divider />
            <Row label="Preview">
              <Switch
                testID="preview-switch"
                value={enablePreview}
                onValueChange={setEnablePreview}
              />
            </Row>
          </>
        )}
      </Section>

      <Section title="Last Action">
        <Row label="Selected">
          <ActionField
            testID="last-action-field"
            text={lastAction ?? 'None'}
            placeholder="Press an action..."
          />
        </Row>
      </Section>

      <Section title="Gesture Mode (Long-Press)">
        <Row label="Basic">
          <ContextMenu
            testID="context-menu-basic"
            title="Actions"
            actions={BASIC_ACTIONS}
            disabled={disabled}
            onPressAction={handleAction}
            ios={{ enablePreview }}
            style={styles.fullFlex}
          >
            <View style={styles.demoBox}>
              <Text style={styles.demoText}>Long-press me</Text>
            </View>
          </ContextMenu>
        </Row>

        <Divider />

        <Row label="With Submenu">
          <ContextMenu
            testID="context-menu-submenu"
            title="Options"
            actions={ACTIONS_WITH_SUBMENU}
            disabled={disabled}
            onPressAction={handleAction}
            ios={{ enablePreview }}
            style={styles.fullFlex}
          >
            <View style={styles.demoBox}>
              <Text style={styles.demoText}>Has nested menu</Text>
            </View>
          </ContextMenu>
        </Row>

        <Divider />

        <Row label="With State">
          <ContextMenu
            testID="context-menu-state"
            title="Sort By"
            actions={ACTIONS_WITH_STATE}
            disabled={disabled}
            onPressAction={handleAction}
            ios={{ enablePreview }}
            style={styles.fullFlex}
          >
            <View style={styles.demoBox}>
              <Text style={styles.demoText}>Checkmark items</Text>
            </View>
          </ContextMenu>
        </Row>
      </Section>

      <Section title="Tap Mode">
        <Row label="Tap to Open">
          <ContextMenu
            testID="context-menu-tap"
            title="Tap Menu"
            actions={BASIC_ACTIONS}
            disabled={disabled}
            trigger="tap"
            onPressAction={handleAction}
            style={styles.fullFlex}
          >
            <View style={styles.demoBox}>
              <Text style={styles.demoText}>Tap me</Text>
            </View>
          </ContextMenu>
        </Row>
      </Section>

      {Platform.OS === 'android' && (
        <Section title="Programmatic (Android)">
          <Row
            label="Menu"
            right={
              <PillButton
                testID="programmatic-toggle-button"
                label={modalOpen ? 'Close' : 'Open'}
                disabled={disabled}
                onPress={() => {
                  if (disabled) return;
                  setModalOpen((p) => !p);
                }}
              />
            }
          >
            <ContextMenu
              testID="context-menu-programmatic"
              title="Programmatic Menu"
              actions={BASIC_ACTIONS}
              disabled={disabled}
              android={{ visible: modalOpen }}
              onPressAction={(id, title) => {
                handleAction(id, title);
                setModalOpen(false);
              }}
              onMenuClose={() => setModalOpen(false)}
              style={styles.fullFlex}
            >
              <ActionField
                testID="programmatic-field"
                text={modalOpen ? 'Menu Open' : 'Menu Closed'}
                onPress={() => {
                  if (disabled) return;
                  setModalOpen(true);
                }}
                disabled={disabled}
              />
            </ContextMenu>
          </Row>
        </Section>
      )}

      <Section title="Destructive Actions">
        <Row label="Danger">
          <ContextMenu
            testID="context-menu-destructive"
            title="Danger Zone"
            actions={[
              {
                id: 'archive',
                title: 'Archive',
                image: Platform.OS === 'ios' ? 'archivebox' : 'archive',
              },
              {
                id: 'delete',
                title: 'Delete Forever',
                image: Platform.OS === 'ios' ? 'trash.fill' : 'delete_forever',
                attributes: { destructive: true },
              },
            ]}
            disabled={disabled}
            onPressAction={handleAction}
            ios={{ enablePreview }}
            style={styles.fullFlex}
          >
            <View style={styles.dangerDemoBox}>
              <Text style={styles.demoText}>Destructive actions</Text>
            </View>
          </ContextMenu>
        </Row>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  demoBox: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerDemoBox: {
    flex: 1,
    backgroundColor: '#FDEDEE',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  demoText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
    flex: 1,
  },
  fullFlex: { flex: 1 },
});
