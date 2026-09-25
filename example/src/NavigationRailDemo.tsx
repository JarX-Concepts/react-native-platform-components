// NavigationRailDemo.tsx
import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import {
  Button,
  NavigationRail,
  type NavigationRailItemProps,
  type NavigationRailMenuGravity,
  type TabBarLabelVisibility,
} from 'react-native-platform-components';
import { ChipTabs, Divider, Row, Section, ui, useDemoColors } from './DemoUI';

function destinations(unread: number): NavigationRailItemProps[] {
  return [
    {
      label: 'Home',
      value: 'home',
      testID: 'rail-home',
      icon: { ios: 'house', android: 'home' },
      selectedIcon: { ios: 'house.fill' },
    },
    {
      label: 'Search',
      value: 'search',
      testID: 'rail-search',
      icon: { ios: 'magnifyingglass', android: 'search' },
    },
    {
      label: 'Inbox',
      value: 'inbox',
      testID: 'rail-inbox',
      icon: { ios: 'bell', android: 'notifications' },
      selectedIcon: { ios: 'bell.fill' },
      badge: unread > 0 ? unread : undefined,
    },
    {
      label: 'Photos',
      value: 'photos',
      testID: 'rail-photos',
      icon: { ios: 'photo.on.rectangle', android: 'photo_library' },
      badge: '',
    },
    {
      label: 'Profile',
      value: 'profile',
      testID: 'rail-profile',
      icon: { ios: 'person', android: 'person' },
      selectedIcon: { ios: 'person.fill' },
    },
  ];
}

const GRAVITY_OPTIONS: { label: string; value: NavigationRailMenuGravity }[] = [
  { label: 'Top', value: 'top' },
  { label: 'Center', value: 'center' },
  { label: 'Bottom', value: 'bottom' },
];

const LABEL_OPTIONS: { label: string; value: TabBarLabelVisibility }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Selected', value: 'selected' },
  { label: 'Unlabeled', value: 'unlabeled' },
];

const BRAND = '#FF6B35';
const STYLED_ANDROID = { indicatorColor: '#FFE0D1' };

export function NavigationRailDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [selected, setSelected] = useState('home');
  const [lastEvent, setLastEvent] = useState('(none)');
  const [unread, setUnread] = useState(3);
  const [gravity, setGravity] = useState<NavigationRailMenuGravity>('top');
  const [labels, setLabels] = useState<TabBarLabelVisibility>('auto');
  const [expanded, setExpanded] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [styled, setStyled] = useState(false);
  const items = useMemo(() => destinations(unread), [unread]);

  const select = (value: string) => {
    setSelected(value);
    setLastEvent(`select: ${value}`);
    if (value === 'inbox') setUnread(0);
  };

  return (
    <>
      <Section title="Navigation Rail">
        {/* A screen: the rail at the start edge, the content beside it */}
        <View style={[styles.screen, { backgroundColor: colors.fill }]}>
          <NavigationRail
            testID="rail"
            items={items}
            selectedValue={selected}
            onSelect={select}
            onReselect={(value) => setLastEvent(`reselect: ${value}`)}
            menuGravity={gravity}
            labelVisibility={labels}
            expanded={expanded}
            activeTintColor={styled ? BRAND : undefined}
            android={styled ? STYLED_ANDROID : undefined}
            header={
              showHeader ? (
                <Button
                  testID="rail-header-button"
                  icon={{ ios: 'square.and.pencil', android: 'edit' }}
                  accessibilityLabel="Compose"
                  variant="tonal"
                  size="medium"
                  shape="square"
                  onPress={() => setLastEvent('header: compose')}
                />
              ) : undefined
            }
          />
          <View style={styles.content}>
            <Text style={[styles.contentTitle, { color: colors.text }]}>
              {items.find((item) => item.value === selected)?.label}
            </Text>
          </View>
        </View>
        <Divider />
        <Row label="Selected">
          <Text testID="rail-value" style={ui.valueText}>
            {selected}
          </Text>
        </Row>
        <Divider />
        <Row label="Last event">
          <Text testID="rail-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
      </Section>

      <Section title="Controls">
        <View style={styles.chips}>
          <ChipTabs
            testID="rail-gravity"
            value={gravity}
            options={GRAVITY_OPTIONS}
            onChange={setGravity}
          />
        </View>
        <Divider />
        <View style={styles.chips}>
          <ChipTabs
            testID="rail-labels"
            value={labels}
            options={LABEL_OPTIONS}
            onChange={setLabels}
          />
        </View>
        <Divider />
        <Row label="Expanded">
          <Switch
            style={ui.alignEnd}
            testID="rail-expanded-switch"
            value={expanded}
            onValueChange={setExpanded}
          />
        </Row>
        <Divider />
        <Row label="Header">
          <Switch
            style={ui.alignEnd}
            testID="rail-header-switch"
            value={showHeader}
            onValueChange={setShowHeader}
          />
        </Row>
        <Divider />
        <Row label="Unread">
          <Switch
            style={ui.alignEnd}
            testID="rail-unread-switch"
            value={unread > 0}
            onValueChange={(on) => setUnread(on ? 3 : 0)}
          />
        </Row>
        <Divider />
        <Row label="Custom style">
          <Switch
            style={ui.alignEnd}
            testID="rail-styled-switch"
            value={styled}
            onValueChange={setStyled}
          />
        </Row>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { height: 600, flexDirection: 'row' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contentTitle: { fontSize: 22, fontWeight: '600' },
  chips: { padding: 10 },
});
