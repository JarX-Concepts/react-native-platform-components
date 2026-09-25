// ContextMenuDemo.tsx
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import {
  ContextMenu,
  SegmentedControl,
  type ContextMenuAction,
  type Haptics,
} from 'react-native-platform-components';
import { ActionField, Divider, PillButton, Row, Section, ui } from './DemoUI';

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

const BELL = require('./assets/bell.png');

// Inline sections (separated groups), an image-asset icon and a submenu
// inside a section.
const SECTION_ACTIONS: ContextMenuAction[] = [
  {
    id: 'section-edit',
    title: '',
    displayInline: true,
    subactions: [
      {
        id: 'copy',
        title: 'Copy',
        image: { ios: 'doc.on.doc', android: 'content_copy' },
      },
      {
        id: 'duplicate',
        title: 'Duplicate',
        image: { ios: 'plus.square.on.square', android: 'crop_square' },
      },
    ],
  },
  {
    id: 'section-share',
    title: 'Share',
    displayInline: true,
    subactions: [
      {
        id: 'remind',
        title: 'Remind Me',
        subtitle: 'Icon from an image asset',
        image: { type: 'image', source: BELL },
      },
      {
        id: 'send',
        title: 'Send To',
        image: { ios: 'paperplane', android: 'send' },
        subactions: [
          { id: 'send-messages', title: 'Messages' },
          { id: 'send-mail', title: 'Mail' },
        ],
      },
    ],
  },
  {
    id: 'section-danger',
    title: '',
    displayInline: true,
    subactions: [
      {
        id: 'delete',
        title: 'Delete',
        image: { ios: 'trash', android: 'delete' },
        attributes: { destructive: true },
      },
    ],
  },
];

const HAPTICS_SEGMENTS = [
  { label: 'Default', value: 'default' },
  { label: 'Light', value: 'light' },
  { label: 'None', value: 'none' },
];

export function ContextMenuDemo(): React.JSX.Element {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [enablePreview, setEnablePreview] = useState(true);
  // Haptic on an action press; 'none' also drops Android's long-press one
  const [haptics, setHaptics] = useState<Haptics | undefined>(undefined);

  // Modal mode state
  const [modalOpen, setModalOpen] = useState(false);

  // A stepper and a toggle that keep the menu open (iOS 16+; Android menus
  // close on every press)
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);

  const stepperActions = useMemo<ContextMenuAction[]>(
    () => [
      {
        id: 'quantity',
        title: `Quantity: ${quantity}`,
        displayInline: true,
        subactions: [
          {
            id: 'decrease',
            title: 'Decrease',
            image: { ios: 'minus', android: 'remove_circle' },
            attributes: { keepsMenuPresented: true, disabled: quantity <= 0 },
          },
          {
            id: 'increase',
            title: 'Increase',
            image: { ios: 'plus', android: 'add_circle' },
            attributes: { keepsMenuPresented: true },
          },
        ],
      },
      {
        id: 'favorite',
        title: 'Favorite',
        image: { ios: favorite ? 'star.fill' : 'star' },
        state: favorite ? 'on' : 'off',
        attributes: { keepsMenuPresented: true },
      },
    ],
    [quantity, favorite]
  );

  const handleAction = (actionId: string, actionTitle: string) => {
    console.log('Action pressed:', actionId, actionTitle);
    setLastAction(`${actionTitle} (${actionId})`);
  };

  const handleStepperAction = (actionId: string, actionTitle: string) => {
    if (actionId === 'increase') setQuantity((q) => q + 1);
    if (actionId === 'decrease') setQuantity((q) => Math.max(0, q - 1));
    if (actionId === 'favorite') setFavorite((f) => !f);
    handleAction(actionId, actionTitle);
  };

  return (
    <>
      <Section title="Controls">
        <Row label="Disabled">
          <Switch
            style={ui.alignEnd}
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
                style={ui.alignEnd}
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
            haptics={haptics}
            onPressAction={handleAction}
            onPreviewPress={() => setLastAction('Preview pressed')}
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
            haptics={haptics}
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
            haptics={haptics}
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
            haptics={haptics}
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
              haptics={haptics}
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
                // Its own haptic, in place of the menu's
                haptics: 'warning',
              },
            ]}
            disabled={disabled}
            haptics={haptics}
            onPressAction={handleAction}
            ios={{ enablePreview }}
            android={{ anchorPosition: 'right' }}
            style={styles.fullFlex}
          >
            <View style={styles.dangerDemoBox}>
              <Text style={styles.demoText}>Destructive actions</Text>
            </View>
          </ContextMenu>
        </Row>
      </Section>

      <Section title="Sections & Stepper">
        <Row label="Sections">
          <ContextMenu
            testID="context-menu-sections"
            title="Document"
            actions={SECTION_ACTIONS}
            disabled={disabled}
            haptics={haptics}
            onPressAction={handleAction}
            ios={{ enablePreview }}
            style={styles.fullFlex}
          >
            <View style={styles.demoBox}>
              <Text style={styles.demoText}>Grouped actions</Text>
            </View>
          </ContextMenu>
        </Row>

        <Divider />

        <Row label="Stepper">
          <ContextMenu
            testID="context-menu-stepper"
            actions={stepperActions}
            disabled={disabled}
            haptics={haptics}
            trigger="tap"
            onPressAction={handleStepperAction}
            style={styles.fullFlex}
          >
            <View style={styles.demoBox}>
              <Text testID="stepper-value" style={styles.demoText}>
                {`Qty ${quantity}${favorite ? ' ★' : ''}`}
              </Text>
            </View>
          </ContextMenu>
        </Row>
      </Section>

      {/* Haptic on an action press for every menu above; 'None' also drops
          Android's long-press haptic */}
      <Section title="Haptics">
        <Row label="Haptics">
          <SegmentedControl
            testID="haptics-picker"
            segments={HAPTICS_SEGMENTS}
            selectedValue={haptics ?? 'default'}
            onSelect={(value) =>
              setHaptics(value === 'default' ? undefined : (value as Haptics))
            }
          />
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
