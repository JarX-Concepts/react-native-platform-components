// web/FormSection.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FormSectionProps } from '../FormSection';

/**
 * The children as they are, as on Android, with the header above them (a
 * heading) and the footer below in the page's text colors. `labelWidth`
 * only applies to iOS fields.
 */
export function FormSection(props: FormSectionProps): React.ReactElement {
  const {
    header,
    footer,
    labelWidth: _labelWidth,
    // Browsers scale text with page zoom, which has no cap
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    children,
    testID,
    ...viewProps
  } = props;
  const part = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);
  return (
    <View testID={testID} {...viewProps}>
      {header ? (
        <Text testID={part('header')} role="heading" style={styles.header}>
          {header}
        </Text>
      ) : null}
      {children}
      {footer ? (
        <Text testID={part('footer')} style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

// CSS system colors follow the page's color scheme
const styles = StyleSheet.create({
  header: {
    color: 'CanvasText',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    paddingBottom: 8,
  },
  footer: {
    color: 'GrayText',
    fontSize: 12,
    lineHeight: 16,
    paddingTop: 8,
  },
});
