#!/usr/bin/env bash
#
# Creates a throwaway app on an old Expo SDK and installs the packed library
# into it, so CI proves the compatibility table instead of trusting it.
#
# SDK 54 (React Native 0.81) is the declared floor and is built for both
# platforms. SDK 52 (React Native 0.76) is built for Android only, to keep the
# native code portable below the declared floor: iOS cannot go lower, because
# LiquidGlass needs Xcode 26 and React Native's bundled fmt does not compile
# under it before 0.81. That job sets FLOOR_IGNORE_PEERS=1, since it installs
# deliberately outside the declared peer range.
#
# Usage: scripts/setup-floor-app.sh <ios|android> [app-dir]
#
# Leaves a prebuilt app in <app-dir> (default: $RUNNER_TEMP/floor-app) ready for
# `gradlew assembleRelease` or `xcodebuild`.
set -euo pipefail

PLATFORM="${1:?usage: setup-floor-app.sh <ios|android> [app-dir]}"
APP_DIR="${2:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/floor-app}"
EXPO_SDK="${FLOOR_EXPO_SDK:-52}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Packing the library from $ROOT"
# lib/ is expected to be built already (`yarn prepare`), so skip lifecycle
# scripts: npm would otherwise try to run this repo's yarn-based prepare.
PACK_DIR="$(dirname "$APP_DIR")/floor-pack"
rm -rf "$PACK_DIR" && mkdir -p "$PACK_DIR"
TARBALL="$PACK_DIR/$(cd "$ROOT" && npm pack --ignore-scripts --silent --pack-destination "$PACK_DIR" | tail -1)"
echo "    $TARBALL"

echo "==> Creating an Expo SDK $EXPO_SDK app in $APP_DIR"
rm -rf "$APP_DIR"
mkdir -p "$(dirname "$APP_DIR")"
npx --yes create-expo-app@latest "$APP_DIR" \
  --template "blank@sdk-$EXPO_SDK" \
  --no-install

cd "$APP_DIR"

echo "==> Recording the versions under test"
node -e '
const p = require("./package.json");
console.log("expo", p.dependencies.expo, "| react-native", p.dependencies["react-native"], "| react", p.dependencies.react);
'

echo "==> Enabling the New Architecture and the config plugin"
node -e '
const fs = require("fs");
const app = JSON.parse(fs.readFileSync("app.json", "utf8"));
app.expo.newArchEnabled = true;
// The documented reference (see docs/installation). Expo only resolves a
// bare package name to app.plugin.cjs from SDK 54 on; the explicit
// subpath works on every supported version.
app.expo.plugins = [...(app.expo.plugins ?? []), "react-native-platform-components/app.plugin"];
app.expo.android = {...(app.expo.android ?? {}), package: "com.platformcomponents.floorapp"};
app.expo.ios = {...(app.expo.ios ?? {}), bundleIdentifier: "com.platformcomponents.floorapp"};
fs.writeFileSync("app.json", JSON.stringify(app, null, 2) + "\n");
'

echo "==> Rendering every component so Metro and codegen see them all"
cat > App.js <<'APP'
import { StyleSheet, View } from 'react-native';
import {
  ContextMenu,
  DatePicker,
  LiquidGlass,
  SegmentedControl,
  SelectionMenu,
} from 'react-native-platform-components';

export default function App() {
  return (
    <View style={styles.container}>
      <SegmentedControl
        segments={[
          { label: 'One', value: 'one' },
          { label: 'Two', value: 'two' },
        ]}
        selectedValue="one"
      />
      <SelectionMenu options={[{ label: 'One', data: 'one' }]} selected="one" />
      <DatePicker date={null} />
      <ContextMenu title="Actions" actions={[{ id: 'copy', title: 'Copy' }]} />
      <LiquidGlass cornerRadius={12} style={styles.glass} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, justifyContent: 'center', padding: 16 },
  glass: { height: 80 },
});
APP

echo "==> Installing dependencies"
# npm refuses to install outside a declared peer range, which is exactly what
# the below-the-floor Android job is for.
PEER_FLAG=""
if [ "${FLOOR_IGNORE_PEERS:-0}" = "1" ]; then
  PEER_FLAG="--legacy-peer-deps"
fi
npm install --no-audit --no-fund $PEER_FLAG

# Current npm nests expo-asset inside expo on the older SDKs, where Metro's
# bundling step cannot resolve it. A stock app of that vintage hits the same
# thing, so this is about the age of the template rather than the library.
# Run it before installing the library, while the tree still satisfies peers.
npx expo install expo-asset

echo "==> Installing the packed library"
npm install --no-audit --no-fund $PEER_FLAG "$TARBALL"

echo "==> Prebuilding for $PLATFORM"
npx expo prebuild --platform "$PLATFORM" --clean

if [ "$PLATFORM" = "android" ]; then
  echo "==> Raising the Gradle heap"
  # The template ships a 2 GB heap, which a release build exhausts on a CI
  # runner (:app:collectReleaseDependencies dies with "Java heap space").
  # The last definition of a key in a properties file wins.
  printf '\norg.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1g\n' >> android/gradle.properties
fi

echo "==> Floor app ready at $APP_DIR"
