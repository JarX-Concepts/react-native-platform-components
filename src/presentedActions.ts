// presentedActions.ts
import { useCallback, useEffect, useRef } from 'react';

const DOCS = 'https://jarx-concepts.github.io/react-native-platform-components';

/**
 * Warns in development, once per presentation, when the actions of a
 * presented Dialog or ActionSheet change in a way the one on screen can't
 * show: `UIAlertController` can't change its actions once presented, so on
 * both platforms the change waits for the next presentation.
 *
 * `structure` is a key of the action fields that only apply at presentation
 * (ids, order, titles, roles…); the fields that apply live stay out of it.
 * Returns a function to call once the user has closed it (a pick or a
 * cancel): later changes, while `visible` catches up, aren't reported.
 */
export function useActionStructureWarning(
  component: 'ActionSheet' | 'Dialog',
  visible: boolean,
  structure: string
): () => void {
  // The structure when `visible` turned true; null while not presented
  const presented = useRef<{ structure: string; done: boolean } | null>(null);

  useEffect(() => {
    if (!__DEV__) return;
    if (!visible) {
      presented.current = null;
      return;
    }
    const current = presented.current;
    if (!current) {
      presented.current = { structure, done: false };
      return;
    }
    if (current.done || current.structure === structure) return;
    current.done = true;
    const noun = component === 'Dialog' ? 'dialog' : 'sheet';
    console.warn(
      `react-native-platform-components: the actions of a presented ${component} changed ` +
        `(added, removed, reordered or retitled, or ${
          component === 'Dialog'
            ? 'a role or preferred changed'
            : 'destructive, an icon or cancelTitle changed'
        }). The ${noun} on screen keeps the actions it was presented with; the change ` +
        `applies the next time it is presented. While it is up, only title, message and ` +
        `each action's disabled, testID and haptics change. See ` +
        `${DOCS}/components/${component.toLowerCase()}#updates-while-presented`
    );
  }, [component, visible, structure]);

  return useCallback(() => {
    if (presented.current) presented.current.done = true;
  }, []);
}
