// DemoUI.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export function Screen(props: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView style={ui.container}>
      {props.children}
      <Text style={ui.footer}>react-native-platform-components</Text>
    </ScrollView>
  );
}

export function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <View style={ui.section}>
      <Text style={ui.sectionTitle}>{props.title}</Text>
      <View style={ui.card}>{props.children}</View>
    </View>
  );
}

export function Divider() {
  return <View style={ui.divider} />;
}

export function Row(props: {
  label: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View style={ui.row}>
      <Text style={ui.label}>{props.label}</Text>
      <View style={ui.rowMain}>{props.children}</View>
      {props.right ? <View style={ui.rowRight}>{props.right}</View> : null}
    </View>
  );
}

export function RowGroup(props: {
  items: Array<{ label: string; children: React.ReactNode }>;
}) {
  return (
    <View style={ui.rowGroup}>
      {props.items.map((item, idx) => (
        <View key={idx} style={ui.rowGroupItem}>
          <Text style={ui.rowGroupLabel}>{item.label}</Text>
          <View style={ui.rowGroupMain}>{item.children}</View>
        </View>
      ))}
    </View>
  );
}

export function ChipTabs<T extends string>(props: {
  value: T;
  options: readonly { label: string; value: T }[];
  onChange: (v: T) => void;
  testID?: string;
}) {
  return (
    <View style={ui.tabs}>
      {props.options.map((o) => {
        const active = o.value === props.value;
        return (
          <Pressable
            key={o.value}
            testID={props.testID ? `${props.testID}-${o.value}` : undefined}
            onPress={() => props.onChange(o.value)}
            style={({ pressed }) => [
              ui.tab,
              active && ui.tabActive,
              pressed && ui.tabPressed,
            ]}
          >
            <Text style={[ui.tabText, active && ui.tabTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PillButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={props.testID}
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        ui.pill,
        pressed && !props.disabled && ui.pillPressed,
        props.disabled && ui.pillDisabled,
      ]}
    >
      <Text style={ui.pillText}>{props.label}</Text>
    </Pressable>
  );
}

export function ActionField(props: {
  text: string;
  placeholder?: string;
  onPress?: () => void;
  disabled?: boolean;
  numberOfLines?: number;
  testID?: string;
}) {
  const showPlaceholder = !props.text || props.text === '—';
  return (
    <Pressable
      testID={props.testID}
      onPress={props.onPress}
      disabled={props.disabled || !props.onPress}
      style={({ pressed }) => [
        ui.field,
        pressed && !!props.onPress && !props.disabled && ui.fieldPressed,
        props.disabled && ui.fieldDisabled,
      ]}
    >
      <Text
        numberOfLines={props.numberOfLines ?? 1}
        style={[ui.fieldText, showPlaceholder && ui.fieldPlaceholder]}
      >
        {showPlaceholder ? (props.placeholder ?? '—') : props.text}
      </Text>
    </Pressable>
  );
}

export const ui = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 54,
    paddingHorizontal: 20,
    backgroundColor: '#ecf0f1',
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subheader: {
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 5,
    opacity: 0.55,
  },
  footer: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    color: 'gray',
    fontSize: 12,
  },

  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.4,
    opacity: 0.55,
    marginBottom: 1,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6EA',
  },

  row: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { width: 110, opacity: 0.65, fontSize: 14 },
  rowMain: { flex: 1, justifyContent: 'center' },
  rowRight: { marginLeft: 8, justifyContent: 'center' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6EA',
    marginLeft: 10,
  },

  tabs: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'white',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6EA',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tabActive: { backgroundColor: '#F4F4F6' },
  tabPressed: { opacity: 0.85 },
  tabText: { opacity: 0.65, fontSize: 13, fontWeight: '600' },
  tabTextActive: { opacity: 0.95 },

  field: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F4F4F6',
  },
  fieldPressed: { opacity: 0.85 },
  fieldDisabled: { opacity: 0.5 },
  fieldText: { color: '#2A5BD7', fontSize: 13 },
  fieldPlaceholder: { color: '#777' },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EFEFF3',
  },
  pillPressed: { opacity: 0.8 },
  pillDisabled: { opacity: 0.45 },
  pillText: { fontSize: 13, opacity: 0.8 },
  fullFlex: { flex: 1 },
  datePickerContainer: { alignItems: 'center', paddingVertical: 4 },

  androidHardCodedDatePicker: {
    alignItems: 'center',
  },

  rowGroup: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    gap: 16,
  },
  rowGroupItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowGroupLabel: { width: 80, opacity: 0.65, fontSize: 14 },
  rowGroupMain: { justifyContent: 'center' },
});
