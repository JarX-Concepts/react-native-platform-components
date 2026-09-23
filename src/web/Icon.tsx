// web/Icon.tsx
import React from 'react';
import { Image } from 'react-native';

import type { PlatformIcon } from '../icons';
import { webIcon } from './shared';

/**
 * Draws an icon on web, tinted with `color` unless the source opts out.
 * Renders nothing for SF Symbols and Android drawables.
 */
export function Icon({
  icon,
  color,
  size = 20,
}: {
  icon: PlatformIcon | undefined;
  color: string | undefined;
  size?: number;
}): React.ReactElement | null {
  const resolved = webIcon(icon);
  if (!resolved) return null;
  return (
    <Image
      source={resolved.source}
      style={{
        width: size,
        height: size,
        tintColor: resolved.tinted ? color : undefined,
      }}
    />
  );
}
