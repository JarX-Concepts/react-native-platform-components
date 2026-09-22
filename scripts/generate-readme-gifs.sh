#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"
ARTIFACTS_DIR="$PROJECT_DIR/example/artifacts"

# Output size: 560px wide is crisp at the height the docs show the GIFs on a
# retina display; override for a quick low-resolution pass
GIF_WIDTH="${GIF_WIDTH:-560}"
GIF_FPS="${GIF_FPS:-20}"

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
echo "Step 3: Finding the newest recording of each flow..."

# The newest passing recording of a flow across every artifacts run, so a
# single-flow run (see CONTRIBUTING) refreshes just that component's GIFs
newest_recording() {
    local config_prefix="$1" test_name="$2"
    find "$ARTIFACTS_DIR" -type f -path "*/${config_prefix}.*/✓ Platform Components Example should test ${test_name} functionality/test.mp4" -print0 2>/dev/null \
        | xargs -0 ls -t 2>/dev/null | head -1
}

# Locate the 17 video files (LiquidGlass is iOS-only)
IOS_TEXTFIELD=$(newest_recording ios.sim.release "Text Field")
IOS_DATEPICKER=$(newest_recording ios.sim.release "Date Picker")
IOS_SELECTIONMENU=$(newest_recording ios.sim.release "Selection Menu")
IOS_CONTEXTMENU=$(newest_recording ios.sim.release "Context Menu")
IOS_SEGMENTEDCONTROL=$(newest_recording ios.sim.release "Segmented Control")
IOS_BUTTON=$(newest_recording ios.sim.release "Button")
IOS_FLOATINGTOOLBAR=$(newest_recording ios.sim.release "Floating Toolbar")
IOS_LIQUIDGLASS=$(newest_recording ios.sim.release "Liquid Glass")
IOS_THEME=$(newest_recording ios.sim.release "Theme")
ANDROID_TEXTFIELD=$(newest_recording android.emu.release "Text Field")
ANDROID_DATEPICKER=$(newest_recording android.emu.release "Date Picker")
ANDROID_SELECTIONMENU=$(newest_recording android.emu.release "Selection Menu")
ANDROID_CONTEXTMENU=$(newest_recording android.emu.release "Context Menu")
ANDROID_SEGMENTEDCONTROL=$(newest_recording android.emu.release "Segmented Control")
ANDROID_BUTTON=$(newest_recording android.emu.release "Button")
ANDROID_FLOATINGTOOLBAR=$(newest_recording android.emu.release "Floating Toolbar")
ANDROID_THEME=$(newest_recording android.emu.release "Theme")

# Verify all files exist (LiquidGlass is iOS-only, no Android video)
for f in "$IOS_TEXTFIELD" "$IOS_DATEPICKER" "$IOS_SELECTIONMENU" "$IOS_CONTEXTMENU" "$IOS_SEGMENTEDCONTROL" "$IOS_BUTTON" "$IOS_FLOATINGTOOLBAR" "$IOS_LIQUIDGLASS" "$IOS_THEME" "$ANDROID_TEXTFIELD" "$ANDROID_DATEPICKER" "$ANDROID_SELECTIONMENU" "$ANDROID_CONTEXTMENU" "$ANDROID_SEGMENTEDCONTROL" "$ANDROID_BUTTON" "$ANDROID_FLOATINGTOOLBAR" "$ANDROID_THEME"; do
    if [ -z "$f" ] || [ ! -f "$f" ]; then
        echo "Error: No recording found for one of the flows (run its Detox test first)"
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
    local fps="${4:-$GIF_FPS}"

    local trimmed_input="$input"

    # If we need to trim, create a trimmed version first
    if [ -n "$trim_start" ]; then
        trimmed_input="$TEMP_DIR/trimmed_$(basename "$output" .gif).mp4"
        echo "  Trimming first ${trim_start}s from $(basename "$input")..."
        ffmpeg -y -ss "$trim_start" -i "$input" -c copy "$trimmed_input" 2>/dev/null
    fi

    # The palette is built from the differences between frames and applied
    # with error diffusion, which keeps text edges clean.
    echo "  Generating palette for $(basename "$output")..."
    ffmpeg -y -i "$trimmed_input" -vf "fps=$fps,scale=$GIF_WIDTH:-1:flags=lanczos,palettegen=stats_mode=diff" "$TEMP_DIR/palette.png" 2>/dev/null

    echo "  Creating GIF: $(basename "$output")..."
    ffmpeg -y -i "$trimmed_input" -i "$TEMP_DIR/palette.png" \
        -filter_complex "fps=$fps,scale=$GIF_WIDTH:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
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
convert_to_gif "$IOS_TEXTFIELD" "$ASSETS_DIR/ios-textfield.gif" "$(navigation_trim "$IOS_TEXTFIELD")"
convert_to_gif "$ANDROID_TEXTFIELD" "$ASSETS_DIR/android-textfield.gif" "$(navigation_trim "$ANDROID_TEXTFIELD")"
convert_to_gif "$IOS_DATEPICKER" "$ASSETS_DIR/ios-datepicker.gif" ""
convert_to_gif "$IOS_SELECTIONMENU" "$ASSETS_DIR/ios-selectionmenu.gif" "$(navigation_trim "$IOS_SELECTIONMENU")"
convert_to_gif "$IOS_CONTEXTMENU" "$ASSETS_DIR/ios-contextmenu.gif" "$(navigation_trim "$IOS_CONTEXTMENU")"
convert_to_gif "$IOS_SEGMENTEDCONTROL" "$ASSETS_DIR/ios-segmentedcontrol.gif" "$(navigation_trim "$IOS_SEGMENTEDCONTROL")"
convert_to_gif "$IOS_BUTTON" "$ASSETS_DIR/ios-button.gif" "$(navigation_trim "$IOS_BUTTON")"
convert_to_gif "$IOS_FLOATINGTOOLBAR" "$ASSETS_DIR/ios-floatingtoolbar.gif" "$(navigation_trim "$IOS_FLOATINGTOOLBAR")"
convert_to_gif "$IOS_LIQUIDGLASS" "$ASSETS_DIR/ios-liquidglass.gif" "$(navigation_trim "$IOS_LIQUIDGLASS")" 15
convert_to_gif "$IOS_THEME" "$ASSETS_DIR/ios-theme.gif" "$(navigation_trim "$IOS_THEME")"
convert_to_gif "$ANDROID_DATEPICKER" "$ASSETS_DIR/android-datepicker.gif" ""
convert_to_gif "$ANDROID_SELECTIONMENU" "$ASSETS_DIR/android-selectionmenu.gif" "$(navigation_trim "$ANDROID_SELECTIONMENU")"
convert_to_gif "$ANDROID_CONTEXTMENU" "$ASSETS_DIR/android-contextmenu.gif" "$(navigation_trim "$ANDROID_CONTEXTMENU")"
convert_to_gif "$ANDROID_SEGMENTEDCONTROL" "$ASSETS_DIR/android-segmentedcontrol.gif" "$(navigation_trim "$ANDROID_SEGMENTEDCONTROL")"
convert_to_gif "$ANDROID_BUTTON" "$ASSETS_DIR/android-button.gif" "$(navigation_trim "$ANDROID_BUTTON")"
convert_to_gif "$ANDROID_FLOATINGTOOLBAR" "$ASSETS_DIR/android-floatingtoolbar.gif" "$(navigation_trim "$ANDROID_FLOATINGTOOLBAR")"
convert_to_gif "$ANDROID_THEME" "$ASSETS_DIR/android-theme.gif" "$(navigation_trim "$ANDROID_THEME")"

echo ""
echo "Step 5: README showreel..."
"$SCRIPT_DIR/generate-readme-showreel.sh"

echo ""
echo "=== Complete! ==="
echo ""
echo "Generated GIFs in $ASSETS_DIR:"
ls -lh "$ASSETS_DIR"/*.gif
