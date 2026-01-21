// App.tsx
import React, { useState } from 'react';
import { DatePickerDemo } from './DatePickerDemo';
import { SelectionMenuDemo } from './SelectionMenuDemo';
import { ChipTabs, Screen } from './DemoUI';

type DemoKey = 'datePicker' | 'selectionMenu';

export default function App(): React.ReactElement {
  const [demo, setDemo] = useState<DemoKey>('datePicker');

  return (
    <Screen title="Platform Components" subtitle="Demo">
      <ChipTabs
        testID="demo-tabs"
        value={demo}
        onChange={setDemo}
        options={[
          { label: 'DatePicker', value: 'datePicker' },
          { label: 'SelectionMenu', value: 'selectionMenu' },
        ]}
      />

      {demo === 'datePicker' && <DatePickerDemo />}
      {demo === 'selectionMenu' && <SelectionMenuDemo />}
    </Screen>
  );
}
