# Contributing

Contributions are welcome! This library provides native UI components (DatePicker, SelectionMenu) for React Native using Fabric/Codegen architecture.

Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces):

- Library source in the root directory (`src/`, `ios/`, `android/`)
- Example app in `example/`

### Prerequisites

- Node.js (see [`.nvmrc`](./.nvmrc) for version)
- Yarn 4.x (specified in `packageManager`)
- Xcode (for iOS development)
- Android Studio (for Android development)

### Setup

```sh
yarn
```

> This project uses Yarn workspaces. npm is not supported.

### Running the example app

The example app demonstrates the library's components and is used for development testing.

Start the Metro bundler:

```sh
yarn example start
```

Run on iOS:

```sh
yarn example ios
```

Run on Android:

```sh
yarn example android
```

JavaScript changes reflect immediately. Native code changes require a rebuild.

### Editing native code

**iOS (Swift/Objective-C):**

Open `example/ios/PlatformComponentsExample.xcworkspace` in Xcode. Find the library source files at:
- `Pods > Development Pods > react-native-platform-components`

Key files:
- `ios/PCDatePickerView.swift` - DatePicker implementation
- `ios/PCSelectionMenu.swift` - SelectionMenu implementation

**Android (Kotlin):**

Open `example/android` in Android Studio. Find the library source files under `react-native-platform-components`.

Key files:
- `android/src/main/java/com/platformcomponents/PCDatePickerView.kt`
- `android/src/main/java/com/platformcomponents/PCSelectionMenuView.kt`

### Verifying Fabric/New Architecture

The example app runs with React Native's New Architecture. Confirm it's enabled by checking Metro logs for:

```
Running "PlatformComponentsExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn` | Install dependencies |
| `yarn typecheck` | Type-check with TypeScript |
| `yarn lint` | Lint with ESLint |
| `yarn lint --fix` | Fix linting errors |
| `yarn test` | Run unit tests (Jest) |
| `yarn example start` | Start Metro bundler |
| `yarn example ios` | Run example on iOS |
| `yarn example android` | Run example on Android |
| `yarn clean` | Clean build artifacts |
| `yarn release` | Publish a new version |

### E2E testing (Detox)

The example app includes Detox end-to-end tests.

```sh
# iOS
yarn example test:e2e:ios

# Android
yarn example test:e2e:android
```

---

## Commit message convention

We use [conventional commits](https://www.conventionalcommits.org/en):

- `fix`: Bug fixes
- `feat`: New features
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `chore`: Tooling/config changes

Pre-commit hooks (via [lefthook](https://github.com/evilmartians/lefthook)) verify commit message format.

---

## Pull requests

- Keep PRs focused on a single change
- Ensure `yarn typecheck` and `yarn lint` pass
- Add tests when possible
- For API or architectural changes, open an issue first to discuss

> **First time contributing?** See [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

---

## Publishing

Releases are managed with [release-it](https://github.com/release-it/release-it):

```sh
yarn release
```

This handles version bumping, tagging, npm publishing, and GitHub releases.
