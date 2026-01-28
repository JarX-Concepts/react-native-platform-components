import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  DatePicker,
  SelectionMenu,
  ContextMenu,
} from 'react-native-platform-components';

type Tab = 'datePicker' | 'selectionMenu' | 'contextMenu';

export default function App() {
  const [tab, setTab] = useState<Tab>('datePicker');

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Platform Components</Text>
      <Text style={styles.subtitle}>Expo Dev Client Example</Text>

      <View style={styles.tabs}>
        {(['datePicker', 'selectionMenu', 'contextMenu'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'datePicker'
                ? 'DatePicker'
                : t === 'selectionMenu'
                  ? 'SelectionMenu'
                  : 'ContextMenu'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'datePicker' && <DatePickerDemo />}
      {tab === 'selectionMenu' && <SelectionMenuDemo />}
      {tab === 'contextMenu' && <ContextMenuDemo />}

      <Text style={styles.footer}>react-native-platform-components</Text>
    </ScrollView>
  );
}

function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Modal DatePicker</Text>
      <View style={styles.card}>
        <Pressable style={styles.button} onPress={() => setShowModal(true)}>
          <Text style={styles.buttonText}>Open DatePicker</Text>
        </Pressable>
        <Text style={styles.value}>
          {date ? date.toLocaleDateString() : 'No date selected'}
        </Text>
      </View>

      <DatePicker
        date={date}
        visible={showModal}
        presentation="modal"
        mode="date"
        onConfirm={(d) => {
          setDate(d);
          setShowModal(false);
        }}
        onClosed={() => setShowModal(false)}
        ios={{ preferredStyle: 'inline' }}
        android={{ material: 'system' }}
      />

      <Text style={styles.sectionTitle}>Embedded DatePicker</Text>
      <View style={styles.card}>
        <DatePicker
          date={date}
          presentation="embedded"
          mode="date"
          onConfirm={(d) => setDate(d)}
          ios={{ preferredStyle: 'inline' }}
          android={{ material: 'system' }}
        />
      </View>
    </View>
  );
}

function SelectionMenuDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const options = [
    { label: 'Apple', data: 'apple' },
    { label: 'Banana', data: 'banana' },
    { label: 'Cherry', data: 'cherry' },
    { label: 'Date', data: 'date' },
    { label: 'Elderberry', data: 'elderberry' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Modal SelectionMenu</Text>
      <View style={styles.card}>
        <Pressable style={styles.button} onPress={() => setShowModal(true)}>
          <Text style={styles.buttonText}>Open Menu</Text>
        </Pressable>
        <Text style={styles.value}>
          {selected ? `Selected: ${selected}` : 'Nothing selected'}
        </Text>
      </View>

      <SelectionMenu
        options={options}
        selected={selected}
        visible={showModal}
        onSelect={(data) => {
          setSelected(data);
          setShowModal(false);
        }}
        onRequestClose={() => setShowModal(false)}
      />

      <Text style={styles.sectionTitle}>Embedded SelectionMenu</Text>
      <View style={styles.card}>
        <SelectionMenu
          options={options}
          selected={selected}
          presentation="embedded"
          placeholder="Select a fruit"
          onSelect={(data) => setSelected(data)}
          android={{ material: 'm3' }}
        />
      </View>
    </View>
  );
}

function ContextMenuDemo() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const actions = [
    {
      id: 'copy',
      title: 'Copy',
      image: Platform.OS === 'ios' ? 'doc.on.doc' : 'content_copy',
    },
    {
      id: 'share',
      title: 'Share',
      image: Platform.OS === 'ios' ? 'square.and.arrow.up' : 'share',
    },
    {
      id: 'edit',
      title: 'Edit',
      image: Platform.OS === 'ios' ? 'pencil' : 'edit',
    },
    {
      id: 'delete',
      title: 'Delete',
      image: Platform.OS === 'ios' ? 'trash' : 'delete',
      attributes: { destructive: true },
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Long-Press Context Menu</Text>
      <View style={styles.card}>
        <ContextMenu
          title="Actions"
          actions={actions}
          onPressAction={(id, title) => setLastAction(title)}
        >
          <View style={styles.contextTarget}>
            <Text style={styles.contextTargetText}>Long-press me</Text>
          </View>
        </ContextMenu>
        <Text style={styles.value}>
          {lastAction ? `Last action: ${lastAction}` : 'No action selected'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Tap Context Menu</Text>
      <View style={styles.card}>
        <ContextMenu
          title="Quick Actions"
          actions={actions}
          trigger="tap"
          onPressAction={(id, title) => setLastAction(title)}
        >
          <View style={[styles.contextTarget, styles.contextTargetTap]}>
            <Text style={styles.contextTargetText}>Tap me</Text>
          </View>
        </ContextMenu>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  contextTarget: {
    backgroundColor: '#E8F4FD',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  contextTargetTap: {
    backgroundColor: '#FFF3E0',
  },
  contextTargetText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 32,
  },
});
