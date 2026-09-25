// menuItems.ts
//
// The menu item shape of the library. ContextMenu takes a tree of these
// actions; native receives them flattened into one list in which each item
// points at its parent, so menus nest to any depth without a recursive codegen
// type. Components that show a native menu share this shape and
// `flattenMenuActions`.
import { resolveIcon, type PlatformIcon } from './icons';

/**
 * Attributes for a menu action.
 */
export interface ContextMenuActionAttributes {
  /** Whether the action is destructive (red styling) */
  destructive?: boolean;
  /** Whether the action is disabled (grayed out) */
  disabled?: boolean;
  /** Whether the action is hidden */
  hidden?: boolean;
  /**
   * Keeps the menu open after the action is pressed, for steppers and toggles
   * that update in place (change the action's `title` or `state` in
   * `onPressAction` and the open menu updates).
   *
   * iOS 16+: `UIMenuElement.Attributes.keepsMenuPresented`. Ignored on older
   * iOS and on Android, where the popup closes on every press.
   */
  keepsMenuPresented?: boolean;
}

/**
 * A single action in a menu. An action with `subactions` is a submenu, or an
 * inline section with `displayInline`.
 */
export interface ContextMenuAction {
  /** Unique identifier returned in callbacks */
  id: string;
  /** Display title. For an inline section: its header (iOS only; may be empty). */
  title: string;
  /** Secondary text (iOS only) */
  subtitle?: string;
  /**
   * Icon. A string is an SF Symbol or asset catalog name on iOS and a
   * drawable resource name on Android. See {@link PlatformIcon} for image
   * sources (`require(...)`, `{ uri }`) and per-platform icons.
   */
  image?: PlatformIcon;
  /** Tint color for the icon (hex string, e.g. `'#FF3B30'`) */
  imageColor?: string;
  /** Action attributes */
  attributes?: ContextMenuActionAttributes;
  /** Checkmark state */
  state?: 'off' | 'on' | 'mixed';
  /** Nested actions: a submenu, or an inline section with `displayInline` */
  subactions?: readonly ContextMenuAction[];
  /**
   * Shows `subactions` inline, as a section set off by separators, instead of
   * as a submenu.
   *
   * - iOS: `UIMenu(options: .displayInline)`; a non-empty `title` is the
   *   section header.
   * - Android: a menu group with group dividers; the title is not shown.
   */
  displayInline?: boolean;
}

/**
 * One menu item as native receives it. Every field is set; empty strings
 * mean "none" and flags are `'true' | 'false'`. Components declare the same
 * shape in their codegen spec.
 */
export type NativeMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  /** Index of the parent submenu or section in the list; -1 at the top level */
  parent: number;
  /** 'action' | 'menu' | 'section' */
  kind: string;
  /** '' | 'sfSymbol' | 'drawable' | 'image' */
  iconType: string;
  iconName: string;
  iconUri: string;
  iconScale: number;
  iconTinted: string;
  imageColor: string;
  destructive: string;
  disabled: string;
  keepsMenuPresented: string;
  /** '' | 'off' | 'on' | 'mixed' */
  state: string;
};

const flag = (value: boolean | undefined) => (value ? 'true' : 'false');

/**
 * Flattens an action tree into the list native expects, depth first: a
 * submenu or section comes before its children, which point back at it
 * through `parent`. Hidden actions (and their children) are dropped here, so
 * native never sees them.
 */
export function flattenMenuActions(
  actions: readonly ContextMenuAction[]
): NativeMenuItem[] {
  const items: NativeMenuItem[] = [];

  const visit = (list: readonly ContextMenuAction[], parent: number) => {
    for (const action of list) {
      const attributes = action.attributes;
      if (attributes?.hidden) continue;

      const children = action.subactions ?? [];
      const kind =
        children.length === 0
          ? 'action'
          : action.displayInline
            ? 'section'
            : 'menu';

      const index = items.length;
      items.push({
        id: action.id,
        title: action.title,
        subtitle: action.subtitle ?? '',
        parent,
        kind,
        ...resolveIcon(action.image),
        imageColor: action.imageColor ?? '',
        destructive: flag(attributes?.destructive),
        disabled: flag(attributes?.disabled),
        keepsMenuPresented: flag(attributes?.keepsMenuPresented),
        state: action.state ?? '',
      });

      if (kind !== 'action') visit(children, index);
    }
  };

  visit(actions, -1);
  return items;
}
