// TabBarNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
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
  iconUri: string;
  iconScale: Double;
  iconTinted: string; // 'true' | 'false'
  selectedIconType: string;
  selectedIconName: string;
  selectedIconUri: string;
  selectedIconScale: Double;
  selectedIconTinted: string;
  badge: string; // badge text, '' = no badge
  accessibilityLabel: string; // '' = the label
  testID: string; // '' = none
}>;

/** A press on a tab. `reselected` is 'true' when the tab was already selected. */
export type TabBarSelectEvent = Readonly<{
  index: Int32;
  value: string;
  reselected: string; // 'true' | 'false'
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

  /** Android: the active indicator pill behind the selected icon. */
  androidIndicatorColor?: ColorValue;

  /** Android: ripple shown while pressing a tab. */
  androidRippleColor?: ColorValue;

  /** Fired when a tab is pressed. */
  onTabPress?: BubblingEventHandler<TabBarSelectEvent>;
}

export default codegenNativeComponent<TabBarNativeProps>(
  'PCTabBar'
) as HostComponent<TabBarNativeProps>;
