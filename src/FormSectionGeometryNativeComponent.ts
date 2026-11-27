// FormSectionGeometryNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { DirectEventHandler, Float } from './codegenTypes';

/**
 * Where a FormSection's card is in its window, in points. The row inset of
 * an inset grouped list depends on the list's width and on whether it runs
 * under the window's safe area, neither of which JavaScript can read.
 */
export type FormSectionGeometryEvent = Readonly<{
  /** Width of the view. */
  width: Float;
  /** Distance from the window's left edge to the view's. */
  windowLeft: Float;
  /** Distance from the view's right edge to the window's. */
  windowRight: Float;
  /** The window's safe area insets on the left and right. */
  safeAreaLeft: Float;
  safeAreaRight: Float;
}>;

/**
 * An empty view laid over a FormSection's card on iOS. It reports its
 * geometry when it is laid out, moves to a window, or the safe area
 * changes (rotation), and when the values change.
 */
export interface FormSectionGeometryNativeProps extends ViewProps {
  onGeometryChange?: DirectEventHandler<FormSectionGeometryEvent>;
}

export default codegenNativeComponent<FormSectionGeometryNativeProps>(
  'PCFormSectionGeometry',
  // FormSection has no card on Android
  { excludedPlatforms: ['android'] }
) as HostComponent<FormSectionGeometryNativeProps>;
