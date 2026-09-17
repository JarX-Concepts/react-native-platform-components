#!/usr/bin/env bash
#
# Creates a throwaway app on the *minimum* supported versions and installs the
# packed library into it, so CI proves the compatibility table instead of
# trusting it. Expo SDK 52 pins React Native 0.76 and React 18, which is the
# floor the library claims.
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

echo "==> Installing dependencies plus the packed library"
npm install --no-audit --no-fund
npm install --no-audit --no-fund "$TARBALL"

# Current npm nests expo-asset inside expo on this SDK, where Metro's bundling
# step cannot resolve it. A stock app of this vintage hits the same thing, so
# this is about the age of the template rather than about the library.
npx expo install expo-asset

echo "==> Prebuilding for $PLATFORM"
npx expo prebuild --platform "$PLATFORM" --clean

echo "==> Floor app ready at $APP_DIR"
