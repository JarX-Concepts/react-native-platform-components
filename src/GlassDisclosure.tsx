// GlassDisclosure.tsx
import React from 'react';
import {
  Platform,
  PlatformColor,
  type ColorValue,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { Button } from './Button';
import {
  GlassDisclosureCore,
  type GlassDisclosureCloseButtonProps,
  type GlassDisclosureParts,
} from './GlassDisclosureCore';
import {
  LiquidGlass,
  isLiquidGlassSupported,
  type LiquidGlassColorScheme,
} from './LiquidGlass';
import { LiquidGlassContainer } from './LiquidGlassContainer';

export interface GlassDisclosureProps extends Omit<ViewProps, 'children'> {
  /** Whether the panel is open. Controlled: change it in `onExpandedChange`. */
  expanded: boolean;

  /**
   * Called with `true` when the pill is tapped, and with `false` when the
   * panel is dismissed: the close button, a tap on the backdrop, Android
   * back, or VoiceOver's escape gesture.
   */
  onExpandedChange: (expanded: boolean) => void;

  /** Shown in the pill, and in the panel's header. */
  title: string;

  /** Second line under the title, in the pill and the panel's header. */
  subtitle?: string;

  /**
   * Trailing content of the panel's header, such as a `Button` with an
   * `ellipsis` menu. The close button leads.
   */
  headerRight?: React.ReactNode;

  /**
   * The panel's content, under its header: any React content. For content
   * that can be taller than the screen, give `panelStyle` a `maxHeight` and
   * put the content in a ScrollView.
   */
  children?: React.ReactNode;

  /**
   * The overlay the component fills: by default all of its parent
   * (`StyleSheet.absoluteFill`). The pill sits at its top, centered, and the
   * panel opens down from there across its width, so pad it to place them
   * (the safe area, the screen's margins). Place the component last in a
   * screen-sized parent: the backdrop covers that parent, and React Native
   * views can't take touches outside their parent.
   */
  style?: StyleProp<ViewStyle>;

  /** Style of the expanded panel, such as `maxHeight` or `padding`. */
  panelStyle?: StyleProp<ViewStyle>;

  /** Color of the layer behind the panel. Default: black at 20%. */
  backdropColor?: ColorValue;

  /** Screen-reader label of the close button. Default: `'Close'`. */
  closeAccessibilityLabel?: string;

  /**
   * iOS-specific configuration
   */
  ios?: {
    /** Glass style on iOS 26. Default: `'regular'`. */
    effect?: 'regular' | 'clear';

    /** Tint color of the glass on iOS 26. */
    tintColor?: string;

    /** Forces a light or dark glass. Default: `'system'`. */
    colorScheme?: LiquidGlassColorScheme;
  };

  /**
   * Color of the pill and the panel where there is no Liquid Glass: Android,
   * iOS before 26, and web. Default: the platform's surface, Material 3
   * `colorSurfaceContainerHigh` on Android and
   * `secondarySystemGroupedBackground` on iOS.
   */
  fallbackColor?: ColorValue;

  /**
   * Test identifier. Parts get suffixes: `-pill`, `-panel`, `-close` and
   * `-backdrop`.
   */
  testID?: string;
}

function CloseButton(
  props: GlassDisclosureCloseButtonProps
): React.ReactElement {
  return (
    <Button
      testID={props.testID}
      icon={{ ios: 'xmark', android: 'pc_ic_close' }}
      accessibilityLabel={props.accessibilityLabel}
      variant={Platform.OS === 'ios' ? 'glass' : 'text'}
      shape="round"
      onPress={props.onPress}
    />
  );
}

const NATIVE_PARTS: GlassDisclosureParts = {
  // Read when rendering, not when the module loads
  get glass() {
    return isLiquidGlassSupported;
  },
  LiquidGlass,
  LiquidGlassContainer,
  CloseButton,
  colors: Platform.select({
    ios: {
      surface: PlatformColor('secondarySystemGroupedBackground'),
      title: PlatformColor('label'),
      subtitle: PlatformColor('secondaryLabel'),
    },
    default: {
      surface: PlatformColor('?attr/colorSurfaceContainerHigh'),
      title: PlatformColor('?attr/colorOnSurface'),
      subtitle: PlatformColor('?attr/colorOnSurfaceVariant'),
    },
  }),
};

/**
 * A pill that expands into a panel of React content: on iOS 26 one Liquid
 * Glass shape that grows out of the pill and shrinks back into it, under a
 * dimmed backdrop. Android, older iOS and web show a card that fades and
 * scales in, as does iOS 26 with Reduce Motion on.
 */
export function GlassDisclosure(props: GlassDisclosureProps) {
  return <GlassDisclosureCore {...props} parts={NATIVE_PARTS} />;
}
