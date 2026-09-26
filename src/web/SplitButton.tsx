// web/SplitButton.tsx
import React from 'react';

import type { SplitButtonProps } from '../SplitButton';
import { Button } from './Button';
import { warnOnce } from './shared';
import { useWebComponent } from './PlatformComponentsProvider';

/**
 * The main button alone: browsers have no native menu to attach, so the
 * menu button is left out. Provide a web menu with a `.web.tsx` file in your
 * app.
 */
export function SplitButton(props: SplitButtonProps): React.ReactElement {
  const MainButton = useWebComponent('Button') ?? Button;
  const {
    menu,
    menuAccessibilityLabel,
    onMenuSelect,
    onMenuOpen,
    onMenuClose,
    ...buttonProps
  } = props;

  warnOnce(
    'SplitButton',
    'SplitButton has no web menu; only its main button renders. ' +
      'See https://jarx-concepts.github.io/react-native-platform-components/guides/web'
  );

  return <MainButton {...buttonProps} />;
}
