// TabBarDemo.tsx
import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  FloatingToolbar,
  TabBar,
  isLiquidGlassSupported,
  type TabBarItemLayout,
  type TabBarItemProps,
  type TabBarLabelVisibility,
} from 'react-native-platform-components';
import { ChipTabs, Divider, Row, Section, ui, useDemoColors } from './DemoUI';

// A native symbol per platform; iOS shows the filled symbol when selected,
// as the system apps do. The search tab is the platform's search tab: on
// iOS 26 its own glass circle at the end of the bar.
function tabs(unread: number, dot: boolean): TabBarItemProps[] {
  return [
    {
      label: 'Home',
      value: 'home',
      testID: 'tab-home',
      icon: { ios: 'house', android: 'home' },
      selectedIcon: { ios: 'house.fill' },
    },
    {
      label: 'Search',
      value: 'search',
      testID: 'tab-search',
      role: 'search',
    },
    {
      label: 'Inbox',
      value: 'inbox',
      testID: 'tab-inbox',
      icon: { ios: 'bell', android: 'notifications' },
      selectedIcon: { ios: 'bell.fill' },
      badge: dot ? '' : unread > 0 ? unread : undefined,
    },
    {
      label: 'Profile',
      value: 'profile',
      testID: 'tab-profile',
      icon: { ios: 'person', android: 'person' },
      selectedIcon: { ios: 'person.fill' },
    },
  ];
}

const LABEL_VISIBILITY_OPTIONS: {
  label: string;
  value: TabBarLabelVisibility;
}[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Labeled', value: 'labeled' },
  { label: 'Selected', value: 'selected' },
  { label: 'Unlabeled', value: 'unlabeled' },
];

type IndicatorShapeOption = 'pill' | 'circle' | 'rounded';
const INDICATOR_SHAPE_OPTIONS: {
  label: string;
  value: IndicatorShapeOption;
}[] = [
  { label: 'Pill', value: 'pill' },
  { label: 'Circle', value: 'circle' },
  { label: 'Rounded', value: 'rounded' },
];

const ITEM_LAYOUT_OPTIONS: { label: string; value: TabBarItemLayout }[] = [
  { label: 'Vertical', value: 'vertical' },
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Auto', value: 'auto' },
];

const BRAND = '#FF6B35';
const FEED = Array.from({ length: 30 }, (_, i) => `Post ${i + 1}`);
const STYLED_BADGE = { backgroundColor: '#1E88E5' };

export function TabBarDemo(): React.JSX.Element {
  const colors = useDemoColors();
  const [tab, setTab] = useState('home');
  const [lastEvent, setLastEvent] = useState('(none)');
  const [unread, setUnread] = useState(3);
  const [dot, setDot] = useState(false);
  const [styled, setStyled] = useState(false);
  const [labelVisibility, setLabelVisibility] =
    useState<TabBarLabelVisibility>('auto');
  const [indicator, setIndicator] = useState(true);
  const [indicatorShape, setIndicatorShape] =
    useState<IndicatorShapeOption>('pill');
  const [itemLayout, setItemLayout] = useState<TabBarItemLayout>('vertical');
  const items = useMemo(() => tabs(unread, dot), [unread, dot]);
  const select = (value: string) => {
    setTab(value);
    setLastEvent(`select: ${value}`);
    if (value === 'inbox') setUnread(0);
  };

  const android = useMemo(
    () => ({
      indicatorColor: styled ? '#FFE0D1' : undefined,
      indicator,
      // A corner radius in dp, or a named shape; the bar keeps its height, so
      // the indicator keeps the Material height
      indicatorShape:
        indicatorShape === 'rounded'
          ? 8
          : (indicatorShape as 'pill' | 'circle'),
      indicatorWidth: indicatorShape === 'rounded' ? 48 : undefined,
      itemLayout,
    }),
    [styled, indicator, indicatorShape, itemLayout]
  );

  // The same tabs, with their own ids, for the floating bar
  const floatingItems = useMemo(
    () =>
      items
        .slice(0, 3)
        .map((item) => ({ ...item, testID: `${item.testID}-floating` })),
    [items]
  );
  const floatingBar = (
    <TabBar
      testID="tab-bar-floating"
      style={
        isLiquidGlassSupported ? styles.floatingAlone : styles.floatingTabs
      }
      items={floatingItems}
      selectedValue={tab}
      onSelect={select}
      labelVisibility="labeled"
      barColor="transparent"
    />
  );

  return (
    <>
      <Section title="Tab Bar">
        <TabBar
          testID="tab-bar"
          items={items}
          selectedValue={tab}
          onSelect={select}
          onReselect={(value) => setLastEvent(`reselect: ${value}`)}
          labelVisibility={labelVisibility}
          activeTintColor={styled ? BRAND : undefined}
          android={android}
          badgeStyle={styled ? STYLED_BADGE : undefined}
        />
        <Divider />
        <Row label="Selected">
          <Text testID="tab-bar-value" style={ui.valueText}>
            {tab}
          </Text>
        </Row>
        <Divider />
        <Row label="Last event">
          <Text testID="tab-bar-last-event" style={ui.valueText}>
            {lastEvent}
          </Text>
        </Row>
      </Section>

      <Section title="Floating">
        {/* Tabs floating over the content. The iOS 26 tab bar is a floating
            Liquid Glass bar of its own; elsewhere a FloatingToolbar carries it */}
        <View style={[styles.canvas, { backgroundColor: colors.fill }]}>
          {isLiquidGlassSupported ? (
            floatingBar
          ) : (
            <FloatingToolbar style={styles.toolbar}>
              {floatingBar}
            </FloatingToolbar>
          )}
        </View>
      </Section>

      <Section title="Minimize on scroll">
        {/* A feed with the bar over it; scrolling down minimizes the bar */}
        <View style={styles.feed}>
          <ScrollView
            nativeID="tab-feed"
            testID="tab-feed"
            // Android scrolls a vertical ScrollView inside another only with this
            nestedScrollEnabled
            contentContainerStyle={styles.feedContent}
          >
            {FEED.map((line) => (
              <View
                key={line}
                style={[styles.feedRow, { backgroundColor: colors.fill }]}
              >
                <Text style={{ color: colors.text }}>{line}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.feedBar} pointerEvents="box-none">
            <TabBar
              testID="tab-bar-minimize"
              items={floatingItems.map((item) => ({
                ...item,
                testID: item.testID?.replace('-floating', '-minimize'),
              }))}
              selectedValue={tab}
              onSelect={select}
              minimizeBehavior="onScrollDown"
              scrollViewNativeID="tab-feed"
            />
          </View>
        </View>
      </Section>

      <Section title="Controls">
        <View style={styles.chips}>
          <ChipTabs
            testID="tab-labels"
            value={labelVisibility}
            options={LABEL_VISIBILITY_OPTIONS}
            onChange={setLabelVisibility}
          />
        </View>
        <Divider />
        <Row label="Unread">
          <Switch
            style={ui.alignEnd}
            testID="tab-unread-switch"
            value={unread > 0}
            onValueChange={(on) => setUnread(on ? 3 : 0)}
          />
        </Row>
        <Divider />
        <Row label="Dot badge">
          <Switch
            style={ui.alignEnd}
            testID="tab-dot-switch"
            value={dot}
            onValueChange={setDot}
          />
        </Row>
        <Divider />
        <Row label="Custom style">
          <Switch
            style={ui.alignEnd}
            testID="tab-styled-switch"
            value={styled}
            onValueChange={setStyled}
          />
        </Row>
        {Platform.OS === 'android' ? (
          <>
            {/* The Material active indicator and item layout */}
            <Divider />
            <Row label="Indicator">
              <Switch
                style={ui.alignEnd}
                testID="tab-indicator-switch"
                value={indicator}
                onValueChange={setIndicator}
              />
            </Row>
            <Divider />
            <View style={styles.chips}>
              <ChipTabs
                testID="tab-indicator-shape"
                value={indicatorShape}
                options={INDICATOR_SHAPE_OPTIONS}
                onChange={setIndicatorShape}
              />
            </View>
            <Divider />
            <View style={styles.chips}>
              <ChipTabs
                testID="tab-item-layout"
                value={itemLayout}
                options={ITEM_LAYOUT_OPTIONS}
                onChange={setItemLayout}
              />
            </View>
          </>
        ) : null}
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  canvas: {
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
  toolbar: { alignSelf: 'stretch' },
  // In the toolbar (a row) the bar takes the width; alone (iOS 26) it
  // spans the canvas and keeps its own height
  floatingTabs: { flex: 1 },
  floatingAlone: { alignSelf: 'stretch' },
  chips: { padding: 10 },
  feed: { height: 360, overflow: 'hidden' },
  feedContent: { padding: 12, gap: 8, paddingBottom: 110 },
  feedRow: { padding: 14, borderRadius: 10 },
  feedBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
