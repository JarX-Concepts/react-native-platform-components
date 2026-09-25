#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"
ARTIFACTS_DIR="$PROJECT_DIR/example/artifacts"

# Output size: 460px wide is crisp at the height the docs show the GIFs (480px)
# on a retina display; override for a quick low-resolution pass
GIF_WIDTH="${GIF_WIDTH:-460}"
GIF_FPS="${GIF_FPS:-20}"

# The Android flows sit still wherever Detox waits for the emulator to go
# idle, for longer the busier the machine is, which makes their recordings
# two to five times longer than the iOS ones. In the Android GIFs every pause
# (a stretch of identical frames) is cut to at most ANDROID_PAUSE_CAP
# seconds, while everything that moves plays at its own speed (0 turns it
# off). 0.6 s still shows each open menu long enough to read.
ANDROID_PAUSE_CAP="${ANDROID_PAUSE_CAP:-0.6}"
# A slow emulator also reaches the demo later: the seconds between which to
# look for the switch to it (see navigation_trim)
ANDROID_NAV_FROM="${ANDROID_NAV_FROM:-8}"
ANDROID_NAV_WINDOW="${ANDROID_NAV_WINDOW:-30}"

echo "=== README GIF Generator ==="
echo ""

# Steps 1-2: Run e2e tests. Set SKIP_E2E=1 to convert the latest recorded
# artifacts instead (e.g. after running Jest directly with DETOX_CONFIGURATION).
if [ -z "$SKIP_E2E" ]; then
    # A fixed clock, full battery and signal in the recordings' status bars
    export E2E_CLEAN_STATUS_BAR=1

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

# Locate the 23 video files (LiquidGlass is iOS-only)
IOS_TEXTFIELD=$(newest_recording ios.sim.release "Text Field")
IOS_DATEPICKER=$(newest_recording ios.sim.release "Date Picker")
IOS_SELECTIONMENU=$(newest_recording ios.sim.release "Selection Menu")
IOS_CONTEXTMENU=$(newest_recording ios.sim.release "Context Menu")
IOS_SEGMENTEDCONTROL=$(newest_recording ios.sim.release "Segmented Control")
IOS_TABBAR=$(newest_recording ios.sim.release "Tab Bar")
IOS_NAVIGATIONRAIL=$(newest_recording ios.sim.release "Navigation Rail")
IOS_BUTTON=$(newest_recording ios.sim.release "Button")
IOS_FAB=$(newest_recording ios.sim.release "Floating Action Button")
IOS_FLOATINGTOOLBAR=$(newest_recording ios.sim.release "Floating Toolbar")
IOS_LIQUIDGLASS=$(newest_recording ios.sim.release "Liquid Glass")
IOS_THEME=$(newest_recording ios.sim.release "Theme")
ANDROID_TEXTFIELD=$(newest_recording android.emu.release "Text Field")
ANDROID_DATEPICKER=$(newest_recording android.emu.release "Date Picker")
ANDROID_SELECTIONMENU=$(newest_recording android.emu.release "Selection Menu")
ANDROID_CONTEXTMENU=$(newest_recording android.emu.release "Context Menu")
ANDROID_SEGMENTEDCONTROL=$(newest_recording android.emu.release "Segmented Control")
ANDROID_TABBAR=$(newest_recording android.emu.release "Tab Bar")
ANDROID_NAVIGATIONRAIL=$(newest_recording android.emu.release "Navigation Rail")
ANDROID_BUTTON=$(newest_recording android.emu.release "Button")
ANDROID_FAB=$(newest_recording android.emu.release "Floating Action Button")
ANDROID_FLOATINGTOOLBAR=$(newest_recording android.emu.release "Floating Toolbar")
ANDROID_THEME=$(newest_recording android.emu.release "Theme")

# Verify all files exist (LiquidGlass is iOS-only, no Android video)
for f in "$IOS_TEXTFIELD" "$IOS_DATEPICKER" "$IOS_SELECTIONMENU" "$IOS_CONTEXTMENU" "$IOS_SEGMENTEDCONTROL" "$IOS_TABBAR" "$IOS_NAVIGATIONRAIL" "$IOS_BUTTON" "$IOS_FAB" "$IOS_FLOATINGTOOLBAR" "$IOS_LIQUIDGLASS" "$IOS_THEME" "$ANDROID_TEXTFIELD" "$ANDROID_DATEPICKER" "$ANDROID_SELECTIONMENU" "$ANDROID_CONTEXTMENU" "$ANDROID_SEGMENTEDCONTROL" "$ANDROID_TABBAR" "$ANDROID_NAVIGATIONRAIL" "$ANDROID_BUTTON" "$ANDROID_FAB" "$ANDROID_FLOATINGTOOLBAR" "$ANDROID_THEME"; do
    if [ -z "$f" ] || [ ! -f "$f" ]; then
        echo "Error: No recording found for one of the flows (run its Detox test first)"
        exit 1
    fi
done

echo "All 23 videos found!"

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
    local pause_cap="${5:-0}"

    local trimmed_input="$input"

    # Drop the frames that repeat the one before, then close each gap that
    # leaves to at most pause_cap seconds (see ANDROID_PAUSE_CAP); fps fills
    # the shortened pauses back in
    local pauses=""
    if [ "$pause_cap" != "0" ]; then
        pauses="mpdecimate,setpts='if(eq(N,0),0,PREV_OUTPTS+min(PTS-PREV_INPTS,$pause_cap/TB))',"
    fi

    # If we need to trim, create a trimmed version first
    if [ -n "$trim_start" ]; then
        trimmed_input="$TEMP_DIR/trimmed_$(basename "$output" .gif).mp4"
        echo "  Trimming first ${trim_start}s from $(basename "$input")..."
        ffmpeg -y -ss "$trim_start" -i "$input" -c copy "$trimmed_input" 2>/dev/null
    fi

    # The palette (128 colors, which UI needs no more than) is built from the
    # differences between frames and applied with an ordered dither: it keeps
    # text edges clean, and unlike error diffusion it leaves unchanged pixels
    # unchanged from frame to frame, so the long flows that scroll stay a
    # reasonable size.
    echo "  Generating palette for $(basename "$output")..."
    ffmpeg -y -i "$trimmed_input" -vf "${pauses}fps=$fps,scale=$GIF_WIDTH:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff" "$TEMP_DIR/palette.png" 2>/dev/null

    echo "  Creating GIF: $(basename "$output")..."
    ffmpeg -y -i "$trimmed_input" -i "$TEMP_DIR/palette.png" \
        -filter_complex "${pauses}fps=$fps,scale=$GIF_WIDTH:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
        "$output" 2>/dev/null

    local size=$(du -h "$output" | cut -f1)
    echo "  Done: $output ($size)"
}

# Seconds to trim from a test that navigates from the Date Picker demo: up to
# the switch to the demo, plus a short margin. That is the largest scene
# change between 1.5 and 12 seconds in, or a nearly as large one in the three
# seconds after it: opening the demo menu is usually the smaller change, but
# not always. The second and third arguments move the window, for Android:
# the switch time varies between runs there, and the app's reload at the
# start of each flow can take a few seconds.
navigation_trim() {
    local trim
    trim=$(ffmpeg -t "${2:-12}" -i "$1" -vf "select='gt(scene,0.01)*gte(t,${3:-1.5})',metadata=print:key=lavfi.scene_score" -f null - 2>&1 \
        | grep -oE "pts_time:[0-9.]+|lavfi.scene_score=[0-9.]+" | paste - - \
        | awk -F'[:=\t]' '
            { t[NR] = $2 + 0; s[NR] = $4 + 0; if (s[NR] > best) { best = s[NR]; at = t[NR] } }
            END {
                if (at == "") exit
                pick = at
                for (i = 1; i <= NR; i++) if (t[i] > at && t[i] <= at + 3 && s[i] >= 0.7 * best) pick = t[i]
                printf "%.2f", pick + 0.4
            }')
    echo "${trim:-3}"
}

# Convert all 23 videos to GIFs (LiquidGlass is iOS-only)
convert_to_gif "$IOS_TEXTFIELD" "$ASSETS_DIR/ios-textfield.gif" "$(navigation_trim "$IOS_TEXTFIELD")"
convert_to_gif "$ANDROID_TEXTFIELD" "$ASSETS_DIR/android-textfield.gif" "$(navigation_trim "$ANDROID_TEXTFIELD" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$IOS_DATEPICKER" "$ASSETS_DIR/ios-datepicker.gif" ""
convert_to_gif "$IOS_SELECTIONMENU" "$ASSETS_DIR/ios-selectionmenu.gif" "$(navigation_trim "$IOS_SELECTIONMENU")"
convert_to_gif "$IOS_CONTEXTMENU" "$ASSETS_DIR/ios-contextmenu.gif" "$(navigation_trim "$IOS_CONTEXTMENU")"
convert_to_gif "$IOS_SEGMENTEDCONTROL" "$ASSETS_DIR/ios-segmentedcontrol.gif" "$(navigation_trim "$IOS_SEGMENTEDCONTROL")"
convert_to_gif "$IOS_TABBAR" "$ASSETS_DIR/ios-tabbar.gif" "$(navigation_trim "$IOS_TABBAR")"
convert_to_gif "$IOS_NAVIGATIONRAIL" "$ASSETS_DIR/ios-navigationrail.gif" "$(navigation_trim "$IOS_NAVIGATIONRAIL")"
convert_to_gif "$IOS_BUTTON" "$ASSETS_DIR/ios-button.gif" "$(navigation_trim "$IOS_BUTTON")"
convert_to_gif "$IOS_FAB" "$ASSETS_DIR/ios-floatingactionbutton.gif" "$(navigation_trim "$IOS_FAB")"
convert_to_gif "$IOS_FLOATINGTOOLBAR" "$ASSETS_DIR/ios-floatingtoolbar.gif" "$(navigation_trim "$IOS_FLOATINGTOOLBAR")"
convert_to_gif "$IOS_LIQUIDGLASS" "$ASSETS_DIR/ios-liquidglass.gif" "$(navigation_trim "$IOS_LIQUIDGLASS")" 15
convert_to_gif "$IOS_THEME" "$ASSETS_DIR/ios-theme.gif" "$(navigation_trim "$IOS_THEME")"
# The Android flows start on the app reloading, a few seconds on a slow emulator
convert_to_gif "$ANDROID_DATEPICKER" "$ASSETS_DIR/android-datepicker.gif" "$(navigation_trim "$ANDROID_DATEPICKER" 8)" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_SELECTIONMENU" "$ASSETS_DIR/android-selectionmenu.gif" "$(navigation_trim "$ANDROID_SELECTIONMENU" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_CONTEXTMENU" "$ASSETS_DIR/android-contextmenu.gif" "$(navigation_trim "$ANDROID_CONTEXTMENU" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_SEGMENTEDCONTROL" "$ASSETS_DIR/android-segmentedcontrol.gif" "$(navigation_trim "$ANDROID_SEGMENTEDCONTROL" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_TABBAR" "$ASSETS_DIR/android-tabbar.gif" "$(navigation_trim "$ANDROID_TABBAR" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_NAVIGATIONRAIL" "$ASSETS_DIR/android-navigationrail.gif" "$(navigation_trim "$ANDROID_NAVIGATIONRAIL" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_BUTTON" "$ASSETS_DIR/android-button.gif" "$(navigation_trim "$ANDROID_BUTTON" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_FAB" "$ASSETS_DIR/android-floatingactionbutton.gif" "$(navigation_trim "$ANDROID_FAB" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_FLOATINGTOOLBAR" "$ASSETS_DIR/android-floatingtoolbar.gif" "$(navigation_trim "$ANDROID_FLOATINGTOOLBAR" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"
convert_to_gif "$ANDROID_THEME" "$ASSETS_DIR/android-theme.gif" "$(navigation_trim "$ANDROID_THEME" "$ANDROID_NAV_WINDOW" "$ANDROID_NAV_FROM")" "" "$ANDROID_PAUSE_CAP"

echo ""
echo "Step 5: README hero, social card and showreel..."
node "$SCRIPT_DIR/visuals/stills.mjs"
node "$SCRIPT_DIR/visuals/showreel.mjs"

echo ""
echo "=== Complete! ==="
echo ""
echo "Generated GIFs in $ASSETS_DIR:"
ls -lh "$ASSETS_DIR"/*.gif
