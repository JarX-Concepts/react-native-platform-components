// ButtonNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
  Double,
  Int32,
  WithDefault,
} from './codegenTypes';

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

/**
 * One menu item, the shape of `ContextMenuItem`: the JS action tree is
 * flattened (see `menuItems.ts`) and each item points at its parent submenu
 * or section by index. Every field is set; empty strings mean "none" and
 * flags are 'true' | 'false'.
 */
export type ButtonMenuItem = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  /** Index of the parent submenu or section; -1 at the top level */
  parent: Int32;
  /** 'action' | 'menu' | 'section' */
  kind: string;
  /** '' | 'sfSymbol' | 'drawable' | 'image' */
  iconType: string;
  iconName: string;
  iconUri: string;
  iconScale: Double;
  iconTinted: string;
  imageColor: string;
  destructive: string;
  disabled: string;
  keepsMenuPresented: string;
  /** '' | 'off' | 'on' | 'mixed' */
  state: string;
  /** The action's own haptics; '' = the component's */
  haptics: string;
}>;

/** Event emitted when a toggle button is pressed. */
export type ButtonSelectedChangeEvent = Readonly<{
  /** The selection the press asks for */
  selected: boolean;
}>;

/** Event emitted when a menu item is picked. */
export type ButtonMenuSelectEvent = Readonly<{
  id: string;
  title: string;
}>;

/**
 * iOS-specific configuration.
 */
export type ButtonIOSProps = Readonly<{
  /** '' | 'bounce' | 'pulse' | 'variableColor' | 'wiggle' | 'rotate' | 'breathe' */
  symbolEffect?: string;

  /**
   * '' runs the effect indefinitely; otherwise it plays once each time this
   * value changes.
   */
  symbolEffectTrigger?: string;
}>;

export interface ButtonNativeProps extends ViewProps {
  /** Button text. Empty for an icon-only button. */
  label?: string;

  /** Icon shown next to the label, or alone when there is no label. */
  icon?: ButtonIconProps;

  /** 'leading' | 'trailing' | 'top' | 'bottom' */
  iconPosition?: string;

  /**
   * 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'glass' |
   * 'prominentGlass' | 'clearGlass' | 'prominentClearGlass'
   */
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

  /** '' (not a toggle) | 'true' | 'false': the controlled toggle state. */
  selected?: string;

  /**
   * Bumped by JS after every onSelectedChange, so native applies `selected`
   * again: a toggle the parent didn't accept goes back.
   */
  selectedEventCount?: Int32;

  /** Menu shown when the button is pressed, flattened (see ButtonMenuItem). */
  menu?: ReadonlyArray<ButtonMenuItem>;

  ios?: ButtonIOSProps;

  /**
   * Haptic played when the button is pressed: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when the button is pressed. */
  onButtonPress?: BubblingEventHandler<Readonly<{}>>;

  /** Fired when a toggle button is pressed, with the state it asks for. */
  onSelectedChange?: BubblingEventHandler<ButtonSelectedChangeEvent>;

  /** Fired when a menu item is picked. */
  onMenuSelect?: BubblingEventHandler<ButtonMenuSelectEvent>;

  /** Fired when the menu opens. */
  onMenuOpen?: BubblingEventHandler<Readonly<{}>>;

  /** Fired when the menu closes. */
  onMenuClose?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<ButtonNativeProps>(
  'PCButton'
) as HostComponent<ButtonNativeProps>;
