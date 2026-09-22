#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"
ARTIFACTS_DIR="$PROJECT_DIR/example/artifacts"

echo "=== README GIF Generator ==="
echo ""

# Steps 1-2: Run e2e tests. Set SKIP_E2E=1 to convert the latest recorded
# artifacts instead (e.g. after running Jest directly with DETOX_CONFIGURATION).
if [ -z "$SKIP_E2E" ]; then
    echo "Step 1: Running iOS e2e tests..."
    yarn test:e2e:ios

    echo ""
    echo "Step 2: Running Android e2e tests..."
    yarn test:e2e:android
else
    echo "Steps 1-2: Skipped (SKIP_E2E is set)"
fi

echo ""
echo "Step 3: Finding latest videos..."

# Find the latest iOS artifacts folder (sort by name since timestamps are ISO-formatted)
IOS_ARTIFACTS=$(ls -d "$ARTIFACTS_DIR"/ios.sim.release.* 2>/dev/null | sort -r | head -1)
if [ -z "$IOS_ARTIFACTS" ]; then
    echo "Error: No iOS artifacts found"
    exit 1
fi

# Find the latest Android artifacts folder (sort by name since timestamps are ISO-formatted)
ANDROID_ARTIFACTS=$(ls -d "$ARTIFACTS_DIR"/android.emu.release.* 2>/dev/null | sort -r | head -1)
if [ -z "$ANDROID_ARTIFACTS" ]; then
    echo "Error: No Android artifacts found"
    exit 1
fi

echo "iOS artifacts: $IOS_ARTIFACTS"
echo "Android artifacts: $ANDROID_ARTIFACTS"

# Locate the 17 video files (LiquidGlass is iOS-only)
IOS_DATEPICKER="$IOS_ARTIFACTS/✓ Platform Components Example should test Date Picker functionality/test.mp4"
IOS_SELECTIONMENU="$IOS_ARTIFACTS/✓ Platform Components Example should test Selection Menu functionality/test.mp4"
IOS_CONTEXTMENU="$IOS_ARTIFACTS/✓ Platform Components Example should test Context Menu functionality/test.mp4"
IOS_SEGMENTEDCONTROL="$IOS_ARTIFACTS/✓ Platform Components Example should test Segmented Control functionality/test.mp4"
IOS_BUTTON="$IOS_ARTIFACTS/✓ Platform Components Example should test Button functionality/test.mp4"
IOS_FLOATINGTOOLBAR="$IOS_ARTIFACTS/✓ Platform Components Example should test Floating Toolbar functionality/test.mp4"
IOS_LIQUIDGLASS="$IOS_ARTIFACTS/✓ Platform Components Example should test Liquid Glass functionality/test.mp4"
IOS_THEME="$IOS_ARTIFACTS/✓ Platform Components Example should test Theme functionality/test.mp4"
IOS_TEXTFIELD="$IOS_ARTIFACTS/✓ Platform Components Example should test Text Field functionality/test.mp4"
ANDROID_DATEPICKER="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Date Picker functionality/test.mp4"
ANDROID_SELECTIONMENU="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Selection Menu functionality/test.mp4"
ANDROID_CONTEXTMENU="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Context Menu functionality/test.mp4"
ANDROID_SEGMENTEDCONTROL="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Segmented Control functionality/test.mp4"
ANDROID_BUTTON="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Button functionality/test.mp4"
ANDROID_FLOATINGTOOLBAR="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Floating Toolbar functionality/test.mp4"
ANDROID_THEME="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Theme functionality/test.mp4"
ANDROID_TEXTFIELD="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Text Field functionality/test.mp4"

# Verify all files exist (LiquidGlass is iOS-only, no Android video)
for f in "$IOS_DATEPICKER" "$IOS_SELECTIONMENU" "$IOS_CONTEXTMENU" "$IOS_SEGMENTEDCONTROL" "$IOS_BUTTON" "$IOS_FLOATINGTOOLBAR" "$IOS_LIQUIDGLASS" "$IOS_THEME" "$IOS_TEXTFIELD" "$ANDROID_DATEPICKER" "$ANDROID_SELECTIONMENU" "$ANDROID_CONTEXTMENU" "$ANDROID_SEGMENTEDCONTROL" "$ANDROID_BUTTON" "$ANDROID_FLOATINGTOOLBAR" "$ANDROID_THEME" "$ANDROID_TEXTFIELD"; do
    if [ ! -f "$f" ]; then
        echo "Error: Video file not found: $f"
        exit 1
    fi
done

echo "All 17 videos found!"

# Create temp directory for processing
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo ""
echo "Step 4: Processing videos..."

# Function to convert video to optimized paletted GIF
convert_to_gif() {
    local input="$1"
    local output="$2"
    local trim_start="$3"

    local trimmed_input="$input"

    # If we need to trim, create a trimmed version first
    if [ -n "$trim_start" ]; then
        trimmed_input="$TEMP_DIR/trimmed_$(basename "$output" .gif).mp4"
        echo "  Trimming first ${trim_start}s from $(basename "$input")..."
        ffmpeg -y -ss "$trim_start" -i "$input" -c copy "$trimmed_input" 2>/dev/null
    fi

    echo "  Generating palette for $(basename "$output")..."
    ffmpeg -y -i "$trimmed_input" -vf "fps=15,scale=480:-1:flags=lanczos,palettegen" "$TEMP_DIR/palette.png" 2>/dev/null

    echo "  Creating GIF: $(basename "$output")..."
    ffmpeg -y -i "$trimmed_input" -i "$TEMP_DIR/palette.png" \
        -filter_complex "fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse" \
        "$output" 2>/dev/null

    local size=$(du -h "$output" | cut -f1)
    echo "  Done: $output ($size)"
}

# Seconds to trim from a test that navigates from the Date Picker demo: up to
# the largest scene change in the first 12 seconds (the switch to the demo;
# opening the demo menu is a smaller one), plus a short margin. The switch time
# varies between runs, especially on Android.
navigation_trim() {
    local trim
    trim=$(ffmpeg -t 12 -i "$1" -vf "select='gt(scene,0.01)*gte(t,1.5)',metadata=print:key=lavfi.scene_score" -f null - 2>&1 \
        | grep -oE "pts_time:[0-9.]+|lavfi.scene_score=[0-9.]+" | paste - - \
        | awk -F'[:=\t]' '{ if ($4 + 0 > best) { best = $4 + 0; t = $2 } } END { if (t != "") printf "%.2f", t + 0.4 }')
    echo "${trim:-3}"
}

# Convert all 17 videos to GIFs (LiquidGlass is iOS-only)
convert_to_gif "$IOS_DATEPICKER" "$ASSETS_DIR/ios-datepicker.gif" ""
convert_to_gif "$IOS_SELECTIONMENU" "$ASSETS_DIR/ios-selectionmenu.gif" "$(navigation_trim "$IOS_SELECTIONMENU")"
convert_to_gif "$IOS_CONTEXTMENU" "$ASSETS_DIR/ios-contextmenu.gif" "$(navigation_trim "$IOS_CONTEXTMENU")"
convert_to_gif "$IOS_SEGMENTEDCONTROL" "$ASSETS_DIR/ios-segmentedcontrol.gif" "$(navigation_trim "$IOS_SEGMENTEDCONTROL")"
convert_to_gif "$IOS_BUTTON" "$ASSETS_DIR/ios-button.gif" "$(navigation_trim "$IOS_BUTTON")"
convert_to_gif "$IOS_FLOATINGTOOLBAR" "$ASSETS_DIR/ios-floatingtoolbar.gif" "$(navigation_trim "$IOS_FLOATINGTOOLBAR")"
convert_to_gif "$IOS_LIQUIDGLASS" "$ASSETS_DIR/ios-liquidglass.gif" "$(navigation_trim "$IOS_LIQUIDGLASS")"
convert_to_gif "$IOS_THEME" "$ASSETS_DIR/ios-theme.gif" "$(navigation_trim "$IOS_THEME")"
convert_to_gif "$IOS_TEXTFIELD" "$ASSETS_DIR/ios-textfield.gif" "$(navigation_trim "$IOS_TEXTFIELD")"
convert_to_gif "$ANDROID_DATEPICKER" "$ASSETS_DIR/android-datepicker.gif" ""
convert_to_gif "$ANDROID_SELECTIONMENU" "$ASSETS_DIR/android-selectionmenu.gif" "$(navigation_trim "$ANDROID_SELECTIONMENU")"
convert_to_gif "$ANDROID_CONTEXTMENU" "$ASSETS_DIR/android-contextmenu.gif" "$(navigation_trim "$ANDROID_CONTEXTMENU")"
convert_to_gif "$ANDROID_SEGMENTEDCONTROL" "$ASSETS_DIR/android-segmentedcontrol.gif" "$(navigation_trim "$ANDROID_SEGMENTEDCONTROL")"
convert_to_gif "$ANDROID_BUTTON" "$ASSETS_DIR/android-button.gif" "$(navigation_trim "$ANDROID_BUTTON")"
convert_to_gif "$ANDROID_FLOATINGTOOLBAR" "$ASSETS_DIR/android-floatingtoolbar.gif" "$(navigation_trim "$ANDROID_FLOATINGTOOLBAR")"
convert_to_gif "$ANDROID_THEME" "$ASSETS_DIR/android-theme.gif" "$(navigation_trim "$ANDROID_THEME")"
convert_to_gif "$ANDROID_TEXTFIELD" "$ASSETS_DIR/android-textfield.gif" "$(navigation_trim "$ANDROID_TEXTFIELD")"

echo ""
echo "Step 5: README showreel..."
"$SCRIPT_DIR/generate-readme-showreel.sh"

echo ""
echo "=== Complete! ==="
echo ""
echo "Generated GIFs in $ASSETS_DIR:"
ls -lh "$ASSETS_DIR"/*.gif
