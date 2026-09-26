// FloatingActionButtonNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double } from './codegenTypes';

/**
 * Icon fields, pre-resolved on the JS side (see icons.ts).
 */
export type FloatingActionButtonIconProps = Readonly<{
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconRequest: string;
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
}>;

export interface FloatingActionButtonNativeProps extends ViewProps {
  /** The icon. */
  icon?: FloatingActionButtonIconProps;

  /** Label of the extended button; empty for an icon-only button. */
  label?: string;

  /** 'small' | 'regular' | 'medium' | 'large' */
  size?: string;

  /** 'true' | 'false': a button with a label shows it. */
  extended?: string;

  /** Container color. */
  color?: ColorValue;

  /** Icon and label color. */
  foregroundColor?: ColorValue;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Screen-reader label, on the native button; empty = the label. */
  spokenLabel?: string;

  /** nativeID of the ScrollView whose scrolling shrinks and extends the button. */
  scrollViewNativeID?: string;

  /**
   * Haptic played when the button is pressed: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when the button is pressed. */
  onFabPress?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<FloatingActionButtonNativeProps>(
  'PCFloatingActionButton'
) as HostComponent<FloatingActionButtonNativeProps>;
