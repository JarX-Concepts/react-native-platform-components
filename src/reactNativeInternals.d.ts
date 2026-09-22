// reactNativeInternals.d.ts
//
// React Native's focus registry for text inputs. `Keyboard.dismiss()`, a
// ScrollView's `keyboardShouldPersistTaps` and `KeyboardAvoidingView` all act
// on the input registered here, so TextField registers itself like the core
// TextInput does. The module is a stable internal (it has kept this shape
// since 0.63), but it is not part of the strict API's type exports, hence this
// declaration.
declare module 'react-native/Libraries/Components/TextInput/TextInputState' {
  type HostInput = object;

  const TextInputState: {
    currentlyFocusedInput(): HostInput | null | undefined;
    focusInput(input: HostInput | null | undefined): void;
    blurInput(input: HostInput | null | undefined): void;
    registerInput(input: HostInput): void;
    unregisterInput(input: HostInput): void;
    isTextInput(input: HostInput): boolean;
  };

  export default TextInputState;
}
