// web/GlassDisclosure.tsx
import React, { useEffect, useRef } from 'react';
import { Pressable, Text } from 'react-native';

import type { GlassDisclosureProps } from '../GlassDisclosure';
import {
  GlassDisclosureCore,
  type GlassDisclosureCloseButtonProps,
  type GlassDisclosureParts,
} from '../GlassDisclosureCore';
import { LiquidGlass, LiquidGlassContainer } from './containers';

function CloseButton(
  props: GlassDisclosureCloseButtonProps
): React.ReactElement {
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      onPress={props.onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(128, 128, 128, 0.16)',
      }}
    >
      <Text aria-hidden style={{ fontSize: 16, color: 'CanvasText' }}>
        ✕
      </Text>
    </Pressable>
  );
}

// The library builds without the DOM types
type KeyTarget = {
  addEventListener(
    type: 'keydown',
    listener: (event: { key: string }) => void
  ): void;
  removeEventListener(
    type: 'keydown',
    listener: (event: { key: string }) => void
  ): void;
};

const WEB_PARTS: GlassDisclosureParts = {
  glass: false,
  LiquidGlass,
  LiquidGlassContainer,
  CloseButton,
  // CSS system colors follow the page's color scheme
  colors: { surface: 'Canvas', title: 'CanvasText', subtitle: 'GrayText' },
};

/**
 * A pill that opens a card of React content, as on Android: there is no
 * Liquid Glass on web. Escape closes it too.
 */
export function GlassDisclosure(
  props: GlassDisclosureProps
): React.ReactElement {
  const { expanded } = props;
  const onExpandedChange = useRef(props.onExpandedChange);
  onExpandedChange.current = props.onExpandedChange;

  useEffect(() => {
    const doc = (globalThis as { document?: KeyTarget }).document;
    if (!expanded || !doc) return;
    const onKeyDown = (event: { key: string }) => {
      if (event.key === 'Escape') onExpandedChange.current(false);
    };
    doc.addEventListener('keydown', onKeyDown);
    return () => doc.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  return <GlassDisclosureCore {...props} parts={WEB_PARTS} />;
}
