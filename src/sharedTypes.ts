// SharedTypes.ts
import type { BubblingEventHandler } from './codegenTypes';

/** Shared "open/closed" control state. */
export type Visible = 'open' | 'closed';

/** Shared presentation mode for pickers/menus. */
export type Presentation = 'modal' | 'embedded';

/** Shared Material preference (Android): the platform widget or the Material one. */
export type AndroidMaterialMode = 'system' | 'm3';

/**
 * Shared Material style for the Material-only components (Android):
 * Material 3, or Material 3 Expressive (the default).
 */
export type AndroidMaterialStyle = 'm3' | 'expressive';

/** Common event empty payload type. */
export type EmptyEvent = Readonly<{}>;

/** Convenience alias (optional). */
export type Bubbling<T> = BubblingEventHandler<T>;
