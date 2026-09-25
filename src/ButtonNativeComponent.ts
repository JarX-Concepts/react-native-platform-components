// ButtonNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, WithDefault } from './codegenTypes';

/**
 * Icon fields, pre-resolved on the JS side (see icons.ts).
 */
export type ButtonIconProps = Readonly<{
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
}>;

/**
 * Label font. Empty strings / 0 mean "platform default".
 */
export type ButtonLabelStyleProps = Readonly<{
  fontFamily?: string;
  fontSize?: Double;
  fontWeight?: string; // 'normal' | 'bold' | '100'..'900'
  fontStyle?: string; // 'normal' | 'italic'
}>;

export interface ButtonNativeProps extends ViewProps {
  /** Button text. Empty for an icon-only button. */
  label?: string;

  /** Icon shown next to the label, or alone when there is no label. */
  icon?: ButtonIconProps;

  /** 'leading' | 'trailing' */
  iconPosition?: string;

  /** 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'glass' | 'prominentGlass' */
  variant?: string;

  /** 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' */
  size?: string;

  /** '' (platform default) | 'round' | 'square' */
  shape?: string;

  /** Corner radius in points; negative = use `shape`. */
  cornerRadius?: WithDefault<Double, -1>;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** 'true' | 'false': spinner in place of the label and icon, presses ignored. */
  loading?: string;

  /** Container (background) color. */
  color?: ColorValue;

  /** Label and icon color. */
  foregroundColor?: ColorValue;

  /** Container color while disabled; unset = platform disabled look. */
  disabledColor?: ColorValue;

  /** Label and icon color while disabled; unset = platform disabled look. */
  disabledForegroundColor?: ColorValue;

  /** Android: ripple color shown while pressing. */
  androidRippleColor?: ColorValue;

  /** Android: outline color (outlined variant). */
  androidStrokeColor?: ColorValue;

  /** Android: Material style, 'm3' | 'expressive' */
  androidMaterial?: string;

  /** Label font. */
  labelStyle?: ButtonLabelStyleProps;

  /** Cap on the label's font scaling; 0 (or below 1) = no cap. */
  maxFontSizeMultiplier?: Double;

  /**
   * Screen-reader label, applied to the native button rather than the host
   * view. Empty means "use the label".
   */
  spokenLabel?: string;

  /**
   * Haptic played when the button is pressed: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when the button is pressed. */
  onButtonPress?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<ButtonNativeProps>(
  'PCButton'
) as HostComponent<ButtonNativeProps>;
