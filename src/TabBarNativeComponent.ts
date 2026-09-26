// TabBarNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
} from './codegenTypes';

/**
 * A single tab. Icons are pre-resolved on the JS side (see icons.ts), the
 * selected icon under the `selected…` fields; empty strings mean "none".
 */
export type TabBarItem = Readonly<{
  label: string;
  value: string;
  disabled: string; // 'enabled' | 'disabled'
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string;
  iconRequest: string;
  iconUri: string;
  iconScale: Double;
  iconTinted: string; // 'true' | 'false'
  selectedIconType: string;
  selectedIconName: string;
  selectedIconRequest: string;
  selectedIconUri: string;
  selectedIconScale: Double;
  selectedIconTinted: string;
  badge: string; // badge text, '' = no badge
  accessibilityLabel: string; // '' = the label
  testID: string; // '' = none
  role: string; // '' | 'search'
  systemItem: string; // '' | a UITabBarItem.SystemItem name ('favorites', …)
}>;

/** A press on a tab. `reselected` is 'true' when the tab was already selected. */
export type TabBarSelectEvent = Readonly<{
  index: Int32;
  value: string;
  reselected: string; // 'true' | 'false'
}>;

/**
 * iOS 26: where the hosted bottom accessory sits, in the bar's coordinates,
 * and its environment.
 */
export type TabBarAccessoryLayoutEvent = Readonly<{
  x: Double;
  y: Double;
  width: Double;
  height: Double;
  environment: string; // 'regular' | 'inline'
}>;

/** Label font. Empty strings / 0 mean "platform default". */
export type TabBarLabelStyleProps = Readonly<{
  fontFamily?: string;
  fontSize?: Double;
  fontWeight?: string;
  fontStyle?: string;
}>;

export interface TabBarNativeProps extends ViewProps {
  /** The tabs. */
  items: ReadonlyArray<TabBarItem>;

  /** Selected tab by value; '' = none. */
  selectedValue?: WithDefault<string, ''>;

  /** 'auto' | 'labeled' | 'selected' | 'unlabeled' */
  labelVisibility?: string;

  /** Icon and label color of the selected tab. */
  activeTintColor?: ColorValue;

  /** Icon and label color of the other tabs. */
  inactiveTintColor?: ColorValue;

  /** Bar background; transparent to show what is behind. */
  barColor?: ColorValue;

  /** Badge colors. */
  badgeBackgroundColor?: ColorValue;
  badgeTextColor?: ColorValue;

  /** Label font. */
  labelStyle?: TabBarLabelStyleProps;

  /** Largest font scale the labels may reach; 0 = no cap. */
  maxFontSizeMultiplier?: Double;

  /** '' | 'automatic' | 'never' | 'onScrollDown' | 'onScrollUp' */
  minimizeBehavior?: string;

  /** nativeID of the ScrollView whose scrolling minimizes the bar. */
  scrollViewNativeID?: string;

  /** Android: the active indicator pill behind the selected icon. */
  androidIndicatorColor?: ColorValue;

  /** Android: ripple shown while pressing a tab. */
  androidRippleColor?: ColorValue;

  /** Android: 'true' | 'false' ('' = shown), the active indicator. */
  androidIndicator?: string;

  /** Android: '' (pill) | 'pill' | 'circle' | 'rounded' (androidIndicatorCornerRadius). */
  androidIndicatorShape?: string;

  /** Android: corner radius of a 'rounded' indicator, in dp. */
  androidIndicatorCornerRadius?: Double;

  /** Android: indicator size in dp; 0 = the Material default. */
  androidIndicatorWidth?: Double;
  androidIndicatorHeight?: Double;

  /** Android: '' | 'vertical' | 'horizontal' | 'auto', icon above or beside the label. */
  androidItemLayout?: string;

  /**
   * Links the bar to its accessory view (PCTabBarAccessory with the same
   * id): iOS 26 hosts it as the tab bar's bottom accessory; Android slides
   * it away with the bar. '' = none.
   */
  accessoryID?: string;

  /**
   * Haptic played when a tab is pressed: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when a tab is pressed. */
  onTabPress?: BubblingEventHandler<TabBarSelectEvent>;

  /** iOS 26: the hosted accessory moved, resized or changed environment. */
  onAccessoryLayout?: DirectEventHandler<TabBarAccessoryLayoutEvent>;
}

export default codegenNativeComponent<TabBarNativeProps>(
  'PCTabBar'
) as HostComponent<TabBarNativeProps>;
