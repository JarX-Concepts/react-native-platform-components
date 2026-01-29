// App.tsx
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SegmentedControl } from 'react-native-platform-components';
import { ContextMenuDemo } from './ContextMenuDemo';
import { DatePickerDemo } from './DatePickerDemo';
import { LiquidGlassDemo } from './LiquidGlassDemo';
import { SelectionMenuDemo } from './SelectionMenuDemo';
import { SegmentedControlDemo } from './SegmentedControlDemo';
import { Screen } from './DemoUI';

type DemoKey =
  | 'datePicker'
  | 'selectionMenu'
  | 'contextMenu'
  | 'segmentedControl'
  | 'liquidGlass';

const BASE_TABS = [
  { label: 'Date', value: 'datePicker' as const },
  { label: 'Select', value: 'selectionMenu' as const },
  { label: 'Context', value: 'contextMenu' as const },
  { label: 'Segment', value: 'segmentedControl' as const },
];

// LiquidGlass is iOS 26+ only, so hide the tab on Android
const IOS_ONLY_TABS = [{ label: 'Glass', value: 'liquidGlass' as const }];

export default function App(): React.ReactElement {
  const [demo, setDemo] = useState<DemoKey>('datePicker');

  const tabs = useMemo(
    () =>
      Platform.OS === 'ios' ? [...BASE_TABS, ...IOS_ONLY_TABS] : BASE_TABS,
    []
  );

  return (
    <Screen title="Platform Components" subtitle="Demo">
      <View style={styles.tabContainer}>
        <SegmentedControl
          testID="demo-tabs"
          style={styles.segmentedControl}
          segments={tabs}
          selectedValue={demo}
          onSelect={(value) => setDemo(value as DemoKey)}
          ios={{ apportionsSegmentWidthsByContent: true }}
        />
      </View>

      {demo === 'datePicker' && <DatePickerDemo />}
      {demo === 'selectionMenu' && <SelectionMenuDemo />}
      {demo === 'contextMenu' && <ContextMenuDemo />}
      {demo === 'segmentedControl' && <SegmentedControlDemo />}
      {demo === 'liquidGlass' && <LiquidGlassDemo />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignSelf: 'stretch',
    marginTop: 4,
    marginBottom: 8,
  },
  segmentedControl: {
    alignSelf: 'stretch',
    marginHorizontal: 8,
  },
});
