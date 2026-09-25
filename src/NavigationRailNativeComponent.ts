// NavigationRailNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
  Double,
  Int32,
  WithDefault,
} from './codegenTypes';

/**
 * A destination: the fields of a TabBar tab (see tabItems.ts). Icons are
 * pre-resolved on the JS side (see icons.ts), the selected icon under the
 * `selected…` fields; empty strings mean "none".
 */
export type NavigationRailItem = Readonly<{
  label: string;
  value: string;
  disabled: string; // 'enabled' | 'disabled'
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string;
  iconUri: string;
  iconScale: Double;
  iconTinted: string; // 'true' | 'false'
  selectedIconType: string;
  selectedIconName: string;
  selectedIconUri: string;
  selectedIconScale: Double;
  selectedIconTinted: string;
  badge: string; // badge text, '' = no badge, ' ' = a dot
  accessibilityLabel: string; // '' = the label
  testID: string; // '' = none
  role: string; // '' | 'search'
  systemItem: string; // TabBar only; ignored
}>;

/** A press on a destination. `reselected` is 'true' when it was already selected. */
export type NavigationRailSelectEvent = Readonly<{
  index: Int32;
  value: string;
  reselected: string; // 'true' | 'false'
}>;

/** Label font. Empty strings / 0 mean "platform default". */
export type NavigationRailLabelStyleProps = Readonly<{
  fontFamily?: string;
  fontSize?: Double;
  fontWeight?: string;
  fontStyle?: string;
}>;

export interface NavigationRailNativeProps extends ViewProps {
  /** The destinations. */
  items: ReadonlyArray<NavigationRailItem>;

  /** Selected destination by value; '' = none. */
  selectedValue?: WithDefault<string, ''>;

  /** 'auto' | 'labeled' | 'selected' | 'unlabeled' */
  labelVisibility?: string;

  /** 'top' | 'center' | 'bottom' */
  menuGravity?: string;

  /** 'true' | 'false': the expanded rail (Android). */
  expanded?: string;

  /** Icon and label color of the selected destination. */
  activeTintColor?: ColorValue;

  /** Icon and label color of the other destinations. */
  inactiveTintColor?: ColorValue;

  /** Rail background. */
  railColor?: ColorValue;

  /** Badge colors. */
  badgeBackgroundColor?: ColorValue;
  badgeTextColor?: ColorValue;

  /** Label font. */
  labelStyle?: NavigationRailLabelStyleProps;

  /** Largest font scale the labels may reach; 0 = no cap. */
  maxFontSizeMultiplier?: Double;

  /** Android: the active indicator behind the selected icon. */
  androidIndicatorColor?: ColorValue;

  /** Android: ripple shown while pressing a destination. */
  androidRippleColor?: ColorValue;

  /**
   * Haptic played when a destination is pressed: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when a destination is pressed. */
  onItemPress?: BubblingEventHandler<NavigationRailSelectEvent>;
}

export default codegenNativeComponent<NavigationRailNativeProps>(
  'PCNavigationRail'
) as HostComponent<NavigationRailNativeProps>;
