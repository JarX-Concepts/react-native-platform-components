// submitBehavior.ts
import type { TextFieldSubmitBehavior } from './TextField';

/**
 * The return key behavior of a field: `submitBehavior` if set, else
 * `'newline'` for multi-line fields and `'blurAndSubmit'` otherwise. A
 * single-line field has no newline to insert, so `'newline'` blurs and
 * submits there, as on `TextInput`.
 */
export function resolveSubmitBehavior(
  submitBehavior: TextFieldSubmitBehavior | undefined,
  multiline: boolean | undefined
): TextFieldSubmitBehavior {
  if (multiline) return submitBehavior ?? 'newline';
  return submitBehavior === 'submit' ? 'submit' : 'blurAndSubmit';
}
