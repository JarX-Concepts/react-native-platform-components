// App.tsx
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedControl } from 'react-native-platform-components';
import { ContextMenuDemo } from './ContextMenuDemo';
import { DatePickerDemo } from './DatePickerDemo';
import { SelectionMenuDemo } from './SelectionMenuDemo';
import { SegmentedControlDemo } from './SegmentedControlDemo';
import { Screen } from './DemoUI';

type DemoKey =
  | 'datePicker'
  | 'selectionMenu'
  | 'contextMenu'
  | 'segmentedControl';

const DEMO_TABS = [
  { label: 'Date', value: 'datePicker' as const },
  { label: 'Selection', value: 'selectionMenu' as const },
  { label: 'Context', value: 'contextMenu' as const },
  { label: 'Segment', value: 'segmentedControl' as const },
];

export default function App(): React.ReactElement {
  const [demo, setDemo] = useState<DemoKey>('datePicker');

  return (
    <Screen title="Platform Components" subtitle="Demo">
      <View style={styles.tabContainer}>
        <SegmentedControl
          testID="demo-tabs"
          style={styles.segmentedControl}
          segments={DEMO_TABS}
          selectedValue={demo}
          onSelect={(value) => setDemo(value as DemoKey)}
          ios={{ apportionsSegmentWidthsByContent: true }}
        />
      </View>

      {demo === 'datePicker' && <DatePickerDemo />}
      {demo === 'selectionMenu' && <SelectionMenuDemo />}
      {demo === 'contextMenu' && <ContextMenuDemo />}
      {demo === 'segmentedControl' && <SegmentedControlDemo />}
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
    width: 340,
    alignSelf: 'center',
  },
});
