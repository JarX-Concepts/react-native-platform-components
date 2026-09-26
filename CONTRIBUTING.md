# Contributing

Contributions are welcome. This library provides native UI components for React Native (TextField, DatePicker, ContextMenu, SelectionMenu, SegmentedControl, TabBar, NavigationRail, Button, ButtonGroup, FloatingActionButton, FloatingToolbar, LiquidGlass, LiquidGlassContainer) built on Fabric and Codegen, with the real platform widget on both iOS and Android.

Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

Looking for something to pick up? Issues labeled [good first issue](https://github.com/JarX-Concepts/react-native-platform-components/labels/good%20first%20issue) are scoped for a first contribution.

## Development workflow

This project is a monorepo managed with [Yarn workspaces](https://yarnpkg.com/features/workspaces):

- Library source in the root directory (`src/`, `ios/`, `android/`, `shared/`, `plugin/`)
- Bare React Native example app in `example/` (also hosts the Detox tests)
- Expo example app in `example-expo/` (exercises the config plugin)
- Documentation site in `docs/` (`yarn docs start` to preview)

### Prerequisites

- Node.js (see [`.nvmrc`](./.nvmrc) for the version)
- Yarn 4.x (specified in `packageManager`)
- Xcode (for iOS development)
- Android Studio with an emulator (for Android development)

### Setup

```sh
yarn
```

> This project uses Yarn workspaces. npm is not supported.

### Running the bare example app

```sh
yarn example start     # Metro
yarn example ios
yarn example android
```

JavaScript changes reflect immediately. Native code changes require a rebuild.

### Running the Expo example app

The library does not run in Expo Go, so the Expo example uses a dev client:

```sh
yarn build:plugin              # compile the config plugin used by prebuild
yarn example-expo prebuild
yarn example-expo ios
yarn example-expo android
```

Re-run `prebuild` after changing the config plugin or `example-expo/app.json`.

## Project layout

| Path                                                                       | What lives there                                                                                                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/<Component>.tsx`                                                      | Public TypeScript component and its props                                                                                                     |
| `src/<Component>NativeComponent.ts`                                        | Codegen spec for the Fabric view                                                                                                              |
| `src/index.tsx`, `src/index.web.tsx`                                       | Public exports for native and web                                                                                                             |
| `ios/PC<Component>.swift`                                                  | iOS implementation (UIKit)                                                                                                                    |
| `ios/PC<Component>.h`, `ios/PC<Component>.mm`                              | Fabric component view bridging into the Swift implementation                                                                                  |
| `android/src/main/java/com/platformcomponents/PC<Component>View.kt`        | Android implementation                                                                                                                        |
| `android/src/main/java/com/platformcomponents/PC<Component>ViewManager.kt` | Android view manager (props, events, Fabric state)                                                                                            |
| `android/src/main/java/com/platformcomponents/PCThemeSupport.kt`           | Theme guards: build Material widgets through `PCThemeSupport.materialContext(...)` so an AppCompat app theme falls back instead of crashing   |
| `android/src/main/res/values/styles.xml`                                   | Bundled Material 3 dialog themes used by that fallback                                                                                        |
| `shared/`                                                                  | Custom C++ shadow nodes and component descriptors for components that measure themselves natively                                             |
| `plugin/src/index.ts`                                                      | Expo config plugin (compiled to `plugin/build` by `yarn build:plugin`)                                                                        |
| `docs/docs/`                                                               | Documentation site content (Docusaurus). The README stays short and links here; document props and behavior on the component pages            |
| `example/e2e/`                                                             | Detox flows for all components                                                                                                                |
| `scripts/generate-readme-gifs.sh`                                          | Regenerates the README GIFs from Detox recordings                                                                                             |
| `scripts/visuals/`                                                         | Builds the README hero grid, social card and showreel from those recordings (ffmpeg + headless Chrome); `yarn generate:visuals` runs it alone |

### Editing native code

**iOS (Swift / Objective-C++):** open `example/ios/PlatformComponentsExample.xcworkspace` in Xcode. The library sources are under `Pods > Development Pods > react-native-platform-components`.

**Android (Kotlin):** open `example/android` in Android Studio. The library module is `react-native-platform-components`.

Both example apps run with the New Architecture. Confirm it in Metro's logs:

```
Running "PlatformComponentsExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

### Adding a component

1. Codegen spec in `src/<Name>NativeComponent.ts`, public wrapper in `src/<Name>.tsx`, and export from `src/index.tsx`. Add its web fallback to `src/web/<Name>.tsx`, its public props to `WebComponentProps` in `src/webComponents.ts`, and its typed wrapper to `src/web/components.tsx` and `src/index.web.tsx`. Document web limitations and preserve consumer overrides (see the [web guide](./docs/docs/guides/web.md)).
2. iOS: `ios/PC<Name>.swift` plus the `.h`/`.mm` Fabric view, and an entry in `codegenConfig.ios.componentProvider` in `package.json`.
3. Android: `PC<Name>View.kt` and `PC<Name>ViewManager.kt`, registered in `PlatformComponentsPackage.kt`. Build Material widgets from `PCThemeSupport.materialContext(...)`.
4. Demo in `example/src/<Name>Demo.tsx` and `example-expo/src/App.tsx`, a Detox flow in `example/e2e/component.test.ts`, unit tests for the native wrapper and web implementation, component documentation in `docs/docs/components/`, and visuals.

## Scripts

| Command                   | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `yarn`                    | Install dependencies                                                         |
| `yarn typecheck`          | Type-check with TypeScript                                                   |
| `yarn lint`               | Lint with ESLint (`yarn lint --fix` to auto-fix)                             |
| `yarn test`               | Unit tests (Jest), including the config plugin tests                         |
| `yarn build:plugin`       | Compile the Expo config plugin                                               |
| `yarn example <cmd>`      | Run a script in the bare example app                                         |
| `yarn example-expo <cmd>` | Run a script in the Expo example app                                         |
| `yarn generate:gifs`      | Regenerate the README GIFs (runs the full Detox suite on both platforms)     |
| `yarn generate:visuals`   | Rebuild the README hero, social card and showreel from the newest recordings |
| `yarn clean`              | Clean build artifacts                                                        |

### E2E testing (Detox)

Full suites:

```sh
yarn example test:e2e:ios
yarn example test:e2e:android
```

To run a single flow, build once and call Jest directly (Yarn 4 rejects the argument forwarding that `detox test` relies on):

```sh
cd example
yarn detox build --configuration android.emu.release
DETOX_CONFIGURATION=android.emu.release yarn jest:e2e -t "Segmented Control"
```

Use `ios.sim.release` for iOS. Recordings land in `example/artifacts/<configuration>.<timestamp>/`.

`example/e2e/native-regressions.test.ts` covers controlled selections, date
dialog lifecycle, disabled menu options and TextField accessory/focus behavior.
Image cases start a local HTTP server on port 18763, verify the native requests
and assert rendered image colors, including cache isolation and iOS menu reloads.
The **Native Regressions** demo exposes the same cases for manual inspection;
network image cases require that test server.

Android also has native widget tests for dialog ownership, filtered text,
icon colors, placeholders and touch events. With an emulator running:

```sh
cd example/android
./gradlew :app:connectedReleaseAndroidTest -DtestBuildType=release \
  -Pandroid.testInstrumentationRunnerArguments.class=platformcomponents.example.NativeRegressionTest
```

Run `yarn tsc -p example/tsconfig.json` from the repository root to check the
example and Detox tests. Root `yarn typecheck` checks the library. Build the
documentation with `yarn docs build` to catch broken links and invalid pages.

After `yarn prepare`, run `node scripts/check-web-consumer-types.js` to validate
the published browser declarations under bundler and NodeNext resolution. This
checks accepted and rejected props, adapters and field refs through the package
exports, independently of the source aliases used by the examples. CI runs this
check after building the package.

Jest's React Native mocks cannot verify native rendering or browser semantics.
For UI changes, inspect the affected native demo and the real web controls in
a browser, including keyboard operation and narrow layouts.

## Commit message convention

We use [conventional commits](https://www.conventionalcommits.org/en). The type decides the next version:

- `fix`: bug fixes (patch)
- `feat`: new features (minor)
- `refactor`, `docs`, `test`, `chore`, `ci`: no release on their own

Pre-commit hooks (via [lefthook](https://github.com/evilmartians/lefthook)) lint staged files and verify the commit message format.

## Pull requests

- Keep PRs focused on a single change
- Ensure `yarn typecheck`, `yarn lint` and `yarn test` pass
- Add tests when possible; run the relevant Detox flow for native changes
- For API or architectural changes, open an issue first to discuss

> **First time contributing?** See [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

## Releases

Releases are cut from `main` by the maintainer through the **Release** GitHub Action (Actions → Release → Run workflow). [release-it](https://github.com/release-it/release-it) computes the version from the conventional commits since the last tag, updates `CHANGELOG.md`, publishes to npm, and creates the GitHub release. Contributors do not bump versions.
