// ChipDemo.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Chip,
  ChipGroup,
  type ChipGroupItem,
} from 'react-native-platform-components';
import { Divider, PillButton, Row, Section, ui, useDemoColors } from './DemoUI';

// A report's time frame: too many options, with labels too long, for a
// segmented control
const TIME_FRAMES: readonly ChipGroupItem[] = [
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: '6months', label: 'Last 6 months' },
  { value: 'year', label: 'Last year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range…' },
];

const CATEGORIES: readonly ChipGroupItem[] = [
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'parks', label: 'Parks' },
  { value: 'museums', label: 'Museums' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'nightlife', label: 'Nightlife' },
];

const DIETS: readonly ChipGroupItem[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten', label: 'Gluten free' },
  { value: 'dairy', label: 'Dairy free' },
  { value: 'nuts', label: 'Nut free', disabled: true },
];

const DEFAULT_DIETS = ['vegetarian'];

function labelOf(items: readonly ChipGroupItem[], value: string): string {
  return items.find((item) => item.value === value)?.label ?? value;
}

export function ChipDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [timeFrame, setTimeFrame] = useState<string[]>(['month']);
  const [category, setCategory] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>(DEFAULT_DIETS);
  const [favorite, setFavorite] = useState(false);
  const [lastEvent, setLastEvent] = useState('(none)');

  // The active filters, as removable input chips
  const active: ChipGroupItem[] = diets.map((value) => ({
    value,
    label: labelOf(DIETS, value),
  }));

  return (
    <>
      <Section title="Time frame (single, required)">
        <ChipGroup
          testID="chip-timeframe"
          style={styles.group}
          chips={TIME_FRAMES}
          selection="single"
          selectionRequired
          selectedValues={timeFrame}
          haptics="selection"
          onSelectionChange={setTimeFrame}
          onPress={(value) => setLastEvent(`press: ${value}`)}
        />
        <Divider />
        <Row label="Time frame">
          <Text testID="chip-timeframe-value" style={ui.valueText}>
            {timeFrame.map((v) => labelOf(TIME_FRAMES, v)).join(', ') || 'None'}
          </Text>
        </Row>
      </Section>

      <Section title="One row, scrolling (single)">
        <ChipGroup
          testID="chip-category"
          style={styles.group}
          chips={CATEGORIES}
          wrap={false}
          selection="single"
          selectionRequired={false}
          selectedValues={category}
          onSelectionChange={setCategory}
        />
        <Divider />
        <Row label="Category">
          <Text testID="chip-category-value" style={ui.valueText}>
            {category.map((v) => labelOf(CATEGORIES, v)).join(', ') || 'Any'}
          </Text>
        </Row>
      </Section>

      <Section title="Filters (multiple)">
        <ChipGroup
          testID="chip-filters"
          style={styles.group}
          chips={DIETS}
          selection="multiple"
          selectedValues={diets}
          onSelectionChange={setDiets}
        />
        <Divider />
        <Row label="Filters">
          <Text testID="chip-filters-value" style={ui.valueText}>
            {diets.map((v) => labelOf(DIETS, v)).join(', ') || 'None'}
          </Text>
        </Row>
      </Section>

      <Section title="Active filters (input, removable)">
        {active.length > 0 ? (
          <ChipGroup
            testID="chip-active"
            style={styles.group}
            variant="input"
            chips={active}
            onClose={(value) => {
              setDiets((current) => current.filter((v) => v !== value));
              setLastEvent(`close: ${value}`);
            }}
          />
        ) : (
          <Text
            testID="chip-active-empty"
            style={[styles.empty, { color: colors.placeholder }]}
          >
            No active filters
          </Text>
        )}
        <Divider />
        <View style={styles.actions}>
          <PillButton
            testID="chip-reset"
            label="Reset filters"
            onPress={() => {
              setDiets(DEFAULT_DIETS);
              setLastEvent('reset');
            }}
          />
        </View>
      </Section>

      <Section title="Standalone chips">
        <View style={styles.standalone}>
          <Chip
            testID="chip-calendar"
            label="Add to calendar"
            icon={{ ios: 'calendar', android: 'calendar' }}
            onPress={() => setLastEvent('press: calendar')}
          />
          <Chip
            testID="chip-share"
            label="Share"
            icon={{ ios: 'square.and.arrow.up', android: 'share' }}
            onPress={() => setLastEvent('press: share')}
          />
          <Chip
            testID="chip-directions"
            label="Directions"
            icon={{
              ios: 'arrow.triangle.turn.up.right.diamond',
              android: 'send',
            }}
            disabled
            onPress={() => setLastEvent('press: directions')}
          />
          <Chip
            testID="chip-favorite"
            label="Favorites"
            icon={{ ios: 'star', android: 'star' }}
            selected={favorite}
            onPress={() => {
              setFavorite((value) => !value);
              setLastEvent('press: favorite');
            }}
          />
          <Chip
            testID="chip-suggestion"
            variant="suggestion"
            label="Sounds good!"
            onPress={() => setLastEvent('press: suggestion')}
          />
          <Chip
            testID="chip-person"
            variant="input"
            label="Ada Lovelace"
            icon={{ ios: 'person.crop.circle', android: 'person' }}
            onClose={() => setLastEvent('close: person')}
          />
        </View>
        <Divider />
        <Row label="Last event">
          <Text testID="chip-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
      </Section>

      <Section title="Notes">
        <Text style={[styles.caption, { color: colors.placeholder }]}>
          Android: Material 3 Chip and ChipGroup, one style per variant. iOS has
          no system chip: capsule buttons, Liquid Glass on iOS 26 and prominent
          glass with the tint color while selected. Selection is controlled; the
          chips show selectedValues.
        </Text>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  group: { margin: 12 },
  standalone: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  empty: { padding: 12, fontSize: 15 },
  actions: { flexDirection: 'row', padding: 12 },
  caption: { padding: 12, fontSize: 13 },
});
