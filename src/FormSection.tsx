// FormSection.tsx
import React, {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Platform,
  PlatformColor,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import {
  FormSectionContext,
  type FormSectionRowContent,
  type FormSectionRowContext,
} from './FormSectionContext';
import * as LiquidGlass from './LiquidGlass';

export interface FormSectionProps extends Omit<ViewProps, 'children'> {
  /**
   * Text above the group: on iOS in Apple's section header style, inset to
   * line up with the rows. Plain text on Android and web.
   */
  header?: string;

  /**
   * Text below the group, such as an explanation of its settings: on iOS in
   * Apple's section footer style (footnote, secondary label), inset to line
   * up with the rows. Plain text on Android and web.
   */
  footer?: string;

  /**
   * iOS: the width of the leading label column of the `TextField` rows, so
   * their fields line up. A field's own `ios.labelWidth` wins. Default: the
   * TextField's (100).
   */
  labelWidth?: number;

  /**
   * Largest scale the header and footer text can reach with the system text
   * size (Dynamic Type / font scale), as on `Text`. Unset or `0`: no cap.
   */
  maxFontSizeMultiplier?: number;

  /**
   * The rows: one per child. On iOS each child is a row of the card, with
   * a separator between rows; `null`, `false` and `undefined` children
   * make no row, and a fragment's children are rows of their own. A
   * `TextField` defaults to the leading label and the borderless field
   * there. Android and web render the children as they are.
   */
  children?: React.ReactNode;

  /** Style of the section, the header, card and footer together. */
  style?: StyleProp<ViewStyle>;

  /**
   * Test identifier of the section. Parts get suffixes: `-header`,
   * `-footer`, and on iOS `-card`, `-row-<index>` and `-separator-<index>`
   * (the separator under that row).
   */
  testID?: string;
}

// The iOS inset grouped list, measured on UITableView(style: .insetGrouped)
// and SwiftUI's Form: iOS 26.5 (iPhone SE, 16, 17 Pro, Air, 17 Pro Max) and
// iOS 18.5 (iPhone SE, 16, 16 Pro).
interface GroupedMetrics {
  /** Corner radius of the card (continuous corners). */
  cornerRadius: number;
  /** Height of a one-line row at the default text size. */
  minRowHeight: number;
  /**
   * Space above and below the content of a row that isn't a TextField:
   * the gap that centers UISwitch in a one-line row.
   */
  rowPaddingVertical: number;
  /**
   * The same for a control already 44pt tall, UIKit's touch target
   * (Checkbox, RadioGroup, an embedded SelectionMenu): the rest of the row
   * height.
   */
  touchTargetPaddingVertical: number;
  /** Thickness of the separators between rows. */
  separatorWidth: number;
  /** Separators stop short of the trailing edge by the row inset. */
  separatorTrailingInset: boolean;
  /** Header: font size and weight, Dynamic Type style, capitals. */
  headerFontSize: number;
  headerFontWeight: '400' | '600';
  headerRamp: 'headline' | 'footnote';
  headerUppercase: boolean;
  /** Space between the header and the card, the card and the footer. */
  headerGap: number;
  footerGap: number;
}

// iOS 26: a 26pt card, 52pt rows, 1pt separators inset at both ends, and
// headers in the body size, semibold, in sentence case
const IOS_26: GroupedMetrics = {
  cornerRadius: 26,
  minRowHeight: 52,
  // (52 - 28pt UISwitch) / 2
  rowPaddingVertical: 12,
  touchTargetPaddingVertical: 4,
  separatorWidth: 1,
  separatorTrailingInset: true,
  headerFontSize: 17,
  headerFontWeight: '600',
  headerRamp: 'headline',
  headerUppercase: false,
  headerGap: 6.33,
  footerGap: 7.33,
};

// Before iOS 26: a 10pt card, 44pt rows, hairlines to the trailing edge and
// footnote headers in capitals
const IOS_18: GroupedMetrics = {
  cornerRadius: 10,
  minRowHeight: 44,
  // (44 - 31pt UISwitch) / 2
  rowPaddingVertical: 6.5,
  touchTargetPaddingVertical: 0,
  separatorWidth: StyleSheet.hairlineWidth,
  separatorTrailingInset: false,
  headerFontSize: 13,
  headerFontWeight: '400',
  headerRamp: 'footnote',
  headerUppercase: true,
  headerGap: 7,
  footerGap: 7.33,
};

const FOOTER_FONT_SIZE = 13;

// UIKit's list margins: 20pt on the wider phones and iPad, 16pt otherwise.
// iOS 26 moved the 402pt phones (iPhone 17 Pro) to 16; before, every phone
// wider than 375pt had 20. The margins follow the OS, not the design: an app
// that keeps the iOS 18 design (UIDesignRequiresCompatibility) has 16pt ones
// on a 402pt phone on iOS 26.5 and 27.
function rowInset(windowWidth: number, ios26: boolean): number {
  return windowWidth >= (ios26 ? 410 : 380) ? 20 : 16;
}

function iosMajorVersion(): number {
  return parseInt(String(Platform.Version), 10) || 0;
}

// The gaps around the header and footer grow with the text, a little less
// than the text does: at the largest accessibility size UIKit's are about
// 2.5x
function scaledGap(gap: number, fontScale: number): number {
  return gap * (1 + (fontScale - 1) * 0.6);
}

/**
 * The children as rows: without `null`, `false` and `undefined`, and with a
 * fragment's children in its place.
 */
function rowsOf(children: React.ReactNode): React.ReactNode[] {
  const rows: React.ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (child == null || typeof child === 'boolean') return;
    if (isValidElement(child) && child.type === Fragment) {
      const fragment = child as React.ReactElement<{
        children?: React.ReactNode;
      }>;
      rows.push(...rowsOf(fragment.props.children));
      return;
    }
    rows.push(child);
  });
  return rows;
}

function GroupedRow(props: {
  metrics: GroupedMetrics;
  inset: number;
  labelWidth: number | undefined;
  separator: boolean;
  testID: string | undefined;
  separatorTestID: string | undefined;
  children: React.ReactNode;
}): React.ReactElement {
  const { metrics, inset, labelWidth, separator } = props;
  const separatorEnd = metrics.separatorTrailingInset ? inset : 0;
  // TextFields and the 44pt controls in the row register here: a field
  // takes the row height as its minFieldHeight, so the row adds none; the
  // controls have most of it already
  const [contents, setContents] = useState<
    Record<FormSectionRowContent, number>
  >({ field: 0, touchTarget: 0 });
  const register = useCallback((content: FormSectionRowContent) => {
    const add = (delta: number) =>
      setContents((counts) => ({
        ...counts,
        [content]: counts[content] + delta,
      }));
    add(1);
    return () => add(-1);
  }, []);
  const context = useMemo<FormSectionRowContext>(
    () => ({
      labelWidth,
      minFieldHeight: metrics.minRowHeight,
      register,
    }),
    [labelWidth, metrics.minRowHeight, register]
  );

  return (
    <View
      testID={props.testID}
      style={[
        styles.row,
        { paddingHorizontal: inset },
        contents.field === 0 && {
          minHeight: metrics.minRowHeight,
          paddingVertical:
            contents.touchTarget > 0
              ? metrics.touchTargetPaddingVertical
              : metrics.rowPaddingVertical,
        },
      ]}
    >
      <FormSectionContext.Provider value={context}>
        {props.children}
      </FormSectionContext.Provider>
      {separator ? (
        <View
          testID={props.separatorTestID}
          style={[
            styles.separator,
            {
              height: metrics.separatorWidth,
              start: inset,
              end: separatorEnd,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/**
 * A group of form rows. On iOS, the inset grouped card of Settings and
 * Contacts: the rows on a rounded `secondarySystemGroupedBackground` card
 * with separators between them, under a header and over a footer in
 * Apple's style. A `TextField` in it defaults to the leading label and the
 * borderless field of a list row, sharing the section's `labelWidth`. Put
 * the section on a `systemGroupedBackground` screen.
 *
 * Android and web have no such card: the children render as they are, with
 * the header and footer as plain text, so one screen's code works
 * everywhere.
 */
export function FormSection(props: FormSectionProps): React.ReactElement {
  const {
    header,
    footer,
    labelWidth,
    maxFontSizeMultiplier,
    children,
    style,
    testID,
    ...viewProps
  } = props;
  const { width, fontScale } = useWindowDimensions();
  const part = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);
  const textCap =
    maxFontSizeMultiplier != null && maxFontSizeMultiplier >= 1
      ? maxFontSizeMultiplier
      : undefined;

  if (Platform.OS !== 'ios') {
    return (
      <View testID={testID} style={style} {...viewProps}>
        {header ? (
          <Text
            testID={part('header')}
            accessibilityRole="header"
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            style={[styles.materialHeader, MATERIAL_COLORS.header]}
          >
            {header}
          </Text>
        ) : null}
        {children}
        {footer ? (
          <Text
            testID={part('footer')}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            style={[styles.materialFooter, MATERIAL_COLORS.footer]}
          >
            {footer}
          </Text>
        ) : null}
      </View>
    );
  }

  // The iOS 26 design comes with Liquid Glass: the iOS 26 SDK, iOS 26, and
  // no UIDesignRequiresCompatibility in the app's Info.plist that UIKit
  // honours (iOS 27 ignores it in builds made with the iOS 27 SDK)
  const ios26 = LiquidGlass.isLiquidGlassSupported;
  const metrics = ios26 ? IOS_26 : IOS_18;
  const inset = rowInset(width, ios26 || iosMajorVersion() >= 26);
  const gapScale = textCap != null ? Math.min(fontScale, textCap) : fontScale;
  const rows = rowsOf(children);
  const headerCase = metrics.headerUppercase ? 'uppercase' : 'none';

  return (
    <View testID={testID} style={style} {...viewProps}>
      {header ? (
        <Text
          testID={part('header')}
          accessibilityRole="header"
          dynamicTypeRamp={metrics.headerRamp}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          style={[
            styles.groupedText,
            {
              fontSize: metrics.headerFontSize,
              fontWeight: metrics.headerFontWeight,
              textTransform: headerCase,
              paddingHorizontal: inset,
              paddingBottom: scaledGap(metrics.headerGap, gapScale),
            },
          ]}
        >
          {header}
        </Text>
      ) : null}
      <View
        testID={part('card')}
        style={[styles.card, { borderRadius: metrics.cornerRadius }]}
      >
        {rows.map((row, index) => (
          <GroupedRow
            key={
              isValidElement(row) && row.key != null
                ? `key:${row.key}`
                : `index:${index}`
            }
            metrics={metrics}
            inset={inset}
            labelWidth={labelWidth}
            separator={index < rows.length - 1}
            testID={part(`row-${index}`)}
            separatorTestID={part(`separator-${index}`)}
          >
            {row}
          </GroupedRow>
        ))}
      </View>
      {footer ? (
        <Text
          testID={part('footer')}
          dynamicTypeRamp="footnote"
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          style={[
            styles.groupedText,
            {
              fontSize: FOOTER_FONT_SIZE,
              paddingHorizontal: inset,
              paddingTop: scaledGap(metrics.footerGap, gapScale),
            },
          ]}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

// Android: Material's list subheader (titleSmall in the primary color) and
// supporting text (bodySmall in onSurfaceVariant). Read when rendering on
// Android only: PlatformColor names are per platform.
const MATERIAL_COLORS = {
  get header() {
    return { color: PlatformColor('?attr/colorPrimary') };
  },
  get footer() {
    return { color: PlatformColor('?attr/colorOnSurfaceVariant') };
  },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PlatformColor('secondarySystemGroupedBackground'),
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  row: {
    justifyContent: 'center',
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: PlatformColor('separator'),
  },
  groupedText: {
    color: PlatformColor('secondaryLabel'),
  },
  materialHeader: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
    paddingBottom: 8,
  },
  materialFooter: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    paddingTop: 8,
  },
});
