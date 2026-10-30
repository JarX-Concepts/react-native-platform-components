// GlassDisclosureCore.tsx
//
// GlassDisclosure's behavior, shared by the native and web entry points. It
// imports no native component: each entry point passes the parts it renders
// with.
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { GlassDisclosureProps } from './GlassDisclosure';
import type { LiquidGlassProps } from './LiquidGlass';
import type { LiquidGlassContainerProps } from './LiquidGlassContainer';

export interface GlassDisclosureCloseButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}

export interface GlassDisclosureParts {
  /** Liquid Glass is available: the pill morphs into the panel. */
  glass: boolean;
  LiquidGlass: ComponentType<LiquidGlassProps>;
  LiquidGlassContainer: ComponentType<LiquidGlassContainerProps>;
  CloseButton: ComponentType<GlassDisclosureCloseButtonProps>;
  /** Text colors, and the surface where there is no glass. */
  colors: { surface: ColorValue; title: ColorValue; subtitle: ColorValue };
}

// The glass reshapes over PCLiquidGlassView.morphDuration (0.45 s). The
// panel's content fades in once the glass has started to grow, and out
// before it shrinks.
const CONTENT_IN_DELAY = 120;
const CONTENT_IN = 250;
const CONTENT_OUT = 120;
const PILL_CONTENT_IN_DELAY = 150;
const BACKDROP_FADE = 250;
// The card that stands in for the morph
const CARD_IN = 220;
const CARD_OUT = 180;

// Material 3's extra-large corner; the least the concentric glass gets
const PANEL_RADIUS = 28;

const DEFAULT_BACKDROP = 'rgba(0, 0, 0, 0.2)';

function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => mounted && setReduceMotion(enabled))
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

type ViewInstance = React.ComponentRef<typeof View>;

function focus(ref: React.RefObject<ViewInstance | null>) {
  // Optional: react-native-web has no sendAccessibilityEvent
  if (ref.current) {
    AccessibilityInfo.sendAccessibilityEvent?.(ref.current, 'focus');
  }
}

export function GlassDisclosureCore(
  props: GlassDisclosureProps & { parts: GlassDisclosureParts }
): React.ReactElement {
  const {
    expanded,
    onExpandedChange,
    title,
    subtitle,
    headerRight,
    children,
    style,
    panelStyle,
    backdropColor,
    closeAccessibilityLabel,
    ios,
    fallbackColor,
    testID,
    parts,
    ...viewProps
  } = props;
  const { LiquidGlass, LiquidGlassContainer, CloseButton, colors } = parts;

  const reduceMotion = useReduceMotion();
  // With Reduce Motion the glass doesn't morph: the card crossfades instead
  const morphs = parts.glass && !reduceMotion;

  // Whether the panel is laid out; it outlives `expanded` while it closes
  const [open, setOpen] = useState(expanded);
  // A card of glass (iOS 26 with Reduce Motion) can't fade with an opacity:
  // glass under a translucent view stops rendering. Its glass materializes
  // once the panel is laid out and dematerializes as it closes, and only
  // the content fades.
  const [panelGlass, setPanelGlass] = useState(expanded);
  useEffect(() => setPanelGlass(open && expanded), [open, expanded]);
  const openRef = useRef(open);
  openRef.current = open;

  // Morph: the opacity of what the glass holds. Card: how far the panel is in
  const content = useRef(new Animated.Value(1)).current;
  const card = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const backdrop = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const pillRef = useRef<ViewInstance>(null);
  const headerRef = useRef<ViewInstance>(null);

  const onExpandedChangeRef = useRef(onExpandedChange);
  onExpandedChangeRef.current = onExpandedChange;
  const close = useCallback(() => onExpandedChangeRef.current(false), []);
  const expand = useCallback(() => onExpandedChangeRef.current(true), []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timing = (
      value: Animated.Value,
      toValue: number,
      duration: number,
      delay = 0
    ) =>
      Animated.timing(value, {
        toValue,
        duration,
        delay,
        useNativeDriver: true,
      });

    content.stopAnimation();
    card.stopAnimation();
    backdrop.stopAnimation();

    if (expanded) {
      timing(backdrop, 1, BACKDROP_FADE).start();
      if (morphs) {
        // Closing part way, the panel is still laid out: fade back from there
        const reopening = openRef.current;
        if (!reopening) content.setValue(0);
        setOpen(true);
        timing(content, 1, CONTENT_IN, reopening ? 0 : CONTENT_IN_DELAY).start(
          ({ finished }) => finished && focus(headerRef)
        );
      } else {
        setOpen(true);
        timing(card, 1, CARD_IN).start(
          ({ finished }) => finished && focus(headerRef)
        );
      }
      return;
    }

    timing(backdrop, 0, BACKDROP_FADE).start();
    if (morphs) {
      timing(content, 0, CONTENT_OUT).start(({ finished }) => {
        if (!finished) return;
        // The glass shrinks back into the pill, whose title fades in
        setOpen(false);
        timing(content, 1, CONTENT_IN, PILL_CONTENT_IN_DELAY).start(
          ({ finished: shown }) => shown && focus(pillRef)
        );
      });
    } else {
      timing(card, 0, CARD_OUT).start(({ finished }) => {
        if (!finished) return;
        setOpen(false);
        focus(pillRef);
      });
    }
    // Only a change of `expanded` starts a transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Android back closes the panel
  useEffect(() => {
    if (!expanded) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        close();
        return true;
      }
    );
    return () => subscription.remove();
  }, [expanded, close]);

  const glassIos = ios
    ? {
        effect: ios.effect,
        tintColor: ios.tintColor,
        colorScheme: ios.colorScheme,
      }
    : undefined;
  const surfaceColor = fallbackColor ?? colors.surface;
  const partID = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const pillContent = (
    <Pressable
      ref={pillRef}
      testID={partID('pill')}
      accessibilityRole="button"
      accessibilityState={{ expanded: false }}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={expand}
      style={styles.pillContent}
    >
      <Text
        numberOfLines={1}
        style={[styles.pillTitle, { color: colors.title }]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          numberOfLines={1}
          style={[styles.pillSubtitle, { color: colors.subtitle }]}
        >
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );

  const panelContent = (
    <View
      testID={partID('panel')}
      onAccessibilityEscape={close}
      style={styles.panelContent}
    >
      <View style={styles.header}>
        <View style={[styles.headerSide, styles.headerLeading]}>
          <CloseButton
            testID={partID('close')}
            accessibilityLabel={closeAccessibilityLabel ?? 'Close'}
            onPress={close}
          />
        </View>
        <View
          ref={headerRef}
          accessible
          accessibilityRole="header"
          accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
          style={styles.headerTitle}
        >
          <Text
            numberOfLines={1}
            style={[styles.panelTitle, { color: colors.title }]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={[styles.panelSubtitle, { color: colors.subtitle }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.headerSide, styles.headerTrailing]}>
          {headerRight}
        </View>
      </View>
      {children}
    </View>
  );

  // A pill or panel surface: glass where there is Liquid Glass, else the
  // platform's surface color
  const surface = (
    shape: 'pill' | 'panel',
    surfaceStyle: StyleProp<ViewStyle>,
    body: React.ReactNode,
    materialized: boolean
  ) =>
    parts.glass ? (
      <LiquidGlass
        style={surfaceStyle}
        cornerStyle={shape === 'pill' ? 'capsule' : 'concentric'}
        cornerRadius={PANEL_RADIUS}
        ios={{
          ...glassIos,
          effect: materialized ? (ios?.effect ?? 'regular') : 'none',
        }}
      >
        {body}
      </LiquidGlass>
    ) : (
      <View
        style={[
          shape === 'pill' ? styles.pillSurface : styles.panelSurface,
          { backgroundColor: surfaceColor },
          surfaceStyle,
        ]}
      >
        {body}
      </View>
    );

  let disclosure: React.ReactNode;
  if (morphs) {
    // One glass that changes frame: inside a container on screen, iOS 26
    // morphs it between the pill and the panel
    const scale = content.interpolate({
      inputRange: [0, 1],
      outputRange: [0.96, 1],
    });
    disclosure = (
      <LiquidGlassContainer style={styles.anchor} pointerEvents="box-none">
        <LiquidGlass
          style={[open ? [styles.panel, panelStyle] : styles.pill, styles.clip]}
          cornerStyle={open ? 'concentric' : 'capsule'}
          cornerRadius={PANEL_RADIUS}
          ios={glassIos}
        >
          <Animated.View
            collapsable={false}
            style={[
              styles.morphContent,
              { opacity: content, transform: [{ scale }] },
            ]}
          >
            {open ? panelContent : pillContent}
          </Animated.View>
        </LiquidGlass>
      </LiquidGlassContainer>
    );
  } else {
    const pillOpacity = card.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });
    const scale = card.interpolate({
      inputRange: [0, 1],
      outputRange: [reduceMotion ? 1 : 0.92, 1],
    });
    // Glass fades by materializing, so only its content takes the opacity
    const fades = (
      opacity: Animated.AnimatedInterpolation<number> | Animated.Value
    ) => (parts.glass ? null : { opacity });
    const contentFades = (
      opacity: Animated.AnimatedInterpolation<number> | Animated.Value,
      body: React.ReactNode
    ) =>
      parts.glass ? (
        <Animated.View collapsable={false} style={{ opacity }}>
          {body}
        </Animated.View>
      ) : (
        body
      );
    disclosure = (
      // Left flattenable: as a view of its own, only as tall as the pill, it
      // would cut the card that opens over it out of its bounds on Android,
      // where the card's visible area and touches stop at its parent's edge
      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View
          collapsable={false}
          style={[styles.pill, fades(pillOpacity)]}
          pointerEvents={open ? 'none' : 'auto'}
          accessibilityElementsHidden={open}
          importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
        >
          {surface(
            'pill',
            null,
            contentFades(pillOpacity, pillContent),
            !expanded
          )}
        </Animated.View>
        {open ? (
          <Animated.View
            collapsable={false}
            style={[
              styles.card,
              fades(card),
              parts.glass ? null : { transform: [{ scale }] },
            ]}
          >
            {surface(
              'panel',
              [styles.panel, panelStyle],
              contentFades(card, panelContent),
              panelGlass
            )}
          </Animated.View>
        ) : null}
      </View>
    );
  }

  // Glass laid out while it is detached from its container jumps to its new
  // frame instead of morphing, so nothing may make Fabric move or reparent
  // it: the backdrop stays mounted (a view inserted ahead of the container
  // moves it), and the views whose props change on opening are never
  // flattened (`collapsable={false}`). Fabric mounts the children of a view
  // that isn't a stacking context into its parent, so the overlay turning
  // modal, or a wrapper's pointerEvents changing, would reparent them.
  return (
    <View
      testID={testID}
      {...viewProps}
      collapsable={false}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="box-none"
      accessibilityViewIsModal={expanded}
    >
      <Animated.View
        collapsable={false}
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: backdropColor ?? DEFAULT_BACKDROP,
            opacity: backdrop,
          },
        ]}
      >
        <Pressable
          testID={partID('backdrop')}
          accessible={false}
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
      </Animated.View>
      {disclosure}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: 'stretch' },
  pill: { alignSelf: 'center' },
  panel: { alignSelf: 'stretch' },
  // The content shows only as far as the glass has grown
  clip: { overflow: 'hidden' },
  // The card opens over the pill, from its top edge
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    transformOrigin: 'top',
  },
  morphContent: { transformOrigin: 'top' },
  pillSurface: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  panelSurface: {
    borderRadius: PANEL_RADIUS,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pillContent: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  pillTitle: { fontSize: 15, fontWeight: '600' },
  pillSubtitle: { fontSize: 12 },
  panelContent: { padding: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Equal sides keep the title centered whatever the buttons' widths
  headerSide: { flex: 1, flexDirection: 'row', minWidth: 44 },
  headerLeading: { justifyContent: 'flex-start' },
  headerTrailing: { justifyContent: 'flex-end' },
  headerTitle: { flexShrink: 1, alignItems: 'center', paddingHorizontal: 8 },
  panelTitle: { fontSize: 17, fontWeight: '600' },
  panelSubtitle: { fontSize: 13 },
});
