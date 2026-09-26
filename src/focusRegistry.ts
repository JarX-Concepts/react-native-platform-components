/// <reference path="./reactNativeInternals.d.ts" />
// focusRegistry.ts
//
// TextField's link to React Native's focused-input bookkeeping. The core
// TextInput registers its host node with `TextInputState`, and that registry is
// what `Keyboard.dismiss()`, a ScrollView's `keyboardShouldPersistTaps` and
// `keyboardDismissMode`, and `KeyboardAvoidingView` act on. Registering the
// same way makes a TextField behave like a TextInput for all of them.
//
// `TextInputState` is a stable internal (it has kept this shape since 0.63),
// but React Native's Babel preset adds a dev-time warning to every static
// `import` or `require` of a deep path. A dynamic `import()` is resolved by
// Metro the same way and carries no warning; it settles in a microtask at
// startup, so a node registered before then is kept and registered once the
// module arrives. If a future release drops the path, the registry is simply
// absent and the field falls back to the public `TextInput.State` calls for
// focus and blur, keeping `Keyboard.dismiss()` working.
import { TextInput } from 'react-native';

type HostNode = object;

type Registry = {
  currentlyFocusedInput(): HostNode | null | undefined;
  focusInput(input: HostNode | null | undefined): void;
  blurInput(input: HostNode | null | undefined): void;
  registerInput(input: HostNode): void;
  unregisterInput(input: HostNode): void;
  isTextInput(input: HostNode): boolean;
};

let registry: Registry | undefined;
const pendingRegistrations = new Set<HostNode>();

// A stable internal without a public counterpart; see reactNativeInternals.d.ts.

import('react-native/Libraries/Components/TextInput/TextInputState')
  .then((module) => {
    registry = module.default;
    pendingRegistrations.forEach((node) => registry?.registerInput(node));
    pendingRegistrations.clear();
  })
  .catch(() => {
    // Not available: focus and blur still go through TextInput.State below.
  });

export const focusRegistry = {
  /** Called when the field mounts. */
  register(node: HostNode): void {
    if (registry) {
      registry.registerInput(node);
    } else {
      pendingRegistrations.add(node);
    }
  },

  /** Called when the field unmounts; drops the focus if the field held it. */
  unregister(node: HostNode): void {
    pendingRegistrations.delete(node);
    if (registry) {
      registry.unregisterInput(node);
      if (registry.currentlyFocusedInput() === node) {
        registry.blurInput(node);
      }
    } else if (TextInput.State.currentlyFocusedInput() === node) {
      TextInput.State.blurTextInput(node as never);
    }
  },

  /** The field gained focus natively. */
  focused(node: HostNode | null): void {
    if (node == null) return;
    if (registry) {
      registry.focusInput(node);
    } else {
      // Also re-sends the focus command, which the focused field ignores
      TextInput.State.focusTextInput(node as never);
    }
  },

  /** The field lost focus natively. */
  blurred(node: HostNode | null): void {
    if (node == null) return;
    if (registry) {
      registry.blurInput(node);
    } else {
      // Also re-sends the blur command, which the unfocused field ignores
      TextInput.State.blurTextInput(node as never);
    }
  },
};
