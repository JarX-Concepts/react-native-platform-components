// codegenTypes.ts
//
// Local mirror of React Native's `CodegenTypes`.
//
// Codegen resolves these names lexically — it matches the identifier used in a
// spec (`Int32`, `WithDefault`, ...) and never follows the import to its
// source. Declaring them here therefore produces exactly the same schema as
// importing them from React Native, while staying parseable by the codegen
// shipped with older releases: the `CodegenTypes.Int32` namespace form is only
// understood by React Native 0.80+, and the pre-0.80 deep import
// (`react-native/Libraries/Types/CodegenTypes`) no longer type-checks on 0.86.
//
// Keep these definitions in sync with
// `react-native/Libraries/Types/CodegenTypesNamespace.d.ts`.
import type { NativeSyntheticEvent } from 'react-native';

// Event types. The `_PaperName` parameter is unused by the New Architecture; it
// is kept so the signatures match React Native's.
export type BubblingEventHandler<
  T,
  _PaperName extends string | never = never,
> = (event: NativeSyntheticEvent<T>) => void | Promise<void>;

export type DirectEventHandler<T, _PaperName extends string | never = never> = (
  event: NativeSyntheticEvent<T>
) => void | Promise<void>;

// Prop types.
export type Double = number;
export type Float = number;
export type Int32 = number;
export type UnsafeObject = object;
export type UnsafeMixed = unknown;

type DefaultTypes = number | boolean | string | ReadonlyArray<string>;

export type WithDefault<
  Type extends DefaultTypes,
  _Value extends Type | string | undefined | null,
> = Type | undefined | null;
