// SharedTypes.ts
import type { CodegenTypes } from 'react-native';

/** Shared “open/closed” control state. */
export type Visible = 'open' | 'closed';

/** Shared Material preference (Android). */
export type AndroidMaterialMode = 'system' | 'm3';

/** Common event empty payload type. */
export type EmptyEvent = Readonly<{}>;

/** Convenience alias (optional). */
export type Bubbling<T> = CodegenTypes.BubblingEventHandler<T>;
