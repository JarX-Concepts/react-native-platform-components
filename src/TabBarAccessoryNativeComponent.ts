// TabBarAccessoryNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * The content of a TabBar's bottom accessory on iOS 26. Its children are
 * mounted into the view UIKit shows as the tab bar's accessory, found by the
 * bar through `accessoryID`; this view itself stays empty in the layout.
 */
export interface TabBarAccessoryNativeProps extends ViewProps {
  /** The id the TabBar links to; '' = not linked. */
  accessoryID: string;
}

export default codegenNativeComponent<TabBarAccessoryNativeProps>(
  'PCTabBarAccessory',
  // Only iOS 26 hosts the accessory; Android renders a plain view
  { excludedPlatforms: ['android'] }
) as HostComponent<TabBarAccessoryNativeProps>;
