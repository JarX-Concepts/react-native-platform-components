// FormSectionContext.ts
//
// What a FormSection's rows tell the components inside them, on iOS only.
// A module of its own so components can read it without importing
// FormSection.

import { createContext, useContext, useLayoutEffect } from 'react';

/**
 * What a component in a row is, for the row's height:
 * - `'field'`: a TextField, which takes the row height as its
 *   `minFieldHeight`; the row adds no height of its own.
 * - `'touchTarget'`: a control at least UIKit's 44pt touch target tall
 *   (Checkbox and RadioGroup rows, an embedded SelectionMenu); the row adds
 *   the rest of its height.
 */
export type FormSectionRowContent = 'field' | 'touchTarget';

export interface FormSectionRowContext {
  /** The section's `labelWidth`, the default for its TextFields. */
  labelWidth?: number;

  /** The native row height, the default `minFieldHeight` of its TextFields. */
  minFieldHeight: number;

  /**
   * Called by a component when it mounts in the row, so the row sizes
   * itself for it. Returns the unregister function.
   */
  register: (content: FormSectionRowContent) => () => void;
}

export const FormSectionContext = createContext<FormSectionRowContext | null>(
  null
);

/**
 * The FormSection row this component is in (iOS), registering it as
 * `content` (`null`: nothing to register); `null` outside a FormSection.
 */
export function useFormSectionRow(
  content: FormSectionRowContent | null
): FormSectionRowContext | null {
  const row = useContext(FormSectionContext);
  const register = row?.register;
  useLayoutEffect(
    () => (register && content ? register(content) : undefined),
    [register, content]
  );
  return row;
}
