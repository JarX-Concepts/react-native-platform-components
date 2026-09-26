import React from 'react';
import type { PlatformComponentsProviderProps } from './webComponents';

export type {
  PlatformComponentsProviderProps,
  WebComponents,
  WebComponentProps,
} from './webComponents';

/** Web registrations do not replace native controls on iOS or Android. */
export function PlatformComponentsProvider({
  children,
}: PlatformComponentsProviderProps): React.ReactElement {
  return <>{children}</>;
}
