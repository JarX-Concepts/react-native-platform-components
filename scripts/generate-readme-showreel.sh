#!/usr/bin/env bash
# Builds assets/showreel.gif for the README: one clip per component with iOS
# on the left and Android on the right, from the newest Detox recording of each
# flow (any artifacts run, so single-test runs count), ending on a title card.
#
# Run the flows first (see scripts/generate-readme-gifs.sh), then:
#   ./scripts/generate-readme-showreel.sh
# CLIP_SECONDS (default 5) is the length of each component's clip.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"
ARTIFACTS_DIR="$PROJECT_DIR/example/artifacts"
OUT="$ASSETS_DIR/showreel.gif"

CLIP_SECONDS="${CLIP_SECONDS:-5}"
FPS=12
PHONE_HEIGHT=400
PANEL_WIDTH=192   # each phone, padded to a fixed width
GAP=10
BG="#eef1f2"      # the demo's background

# Component caption | Detox test name
COMPONENTS=(
    "DatePicker|Date Picker"
    "SelectionMenu|Selection Menu"
    "ContextMenu|Context Menu"
    "SegmentedControl|Segmented Control"
    "Button|Button"
    "FloatingToolbar|Floating Toolbar"
    "Theme|Theme"
)

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Newest recording of a flow across every artifacts run for a configuration
newest_recording() {
    local config_prefix="$1" test_name="$2"
    find "$ARTIFACTS_DIR" -type f -path "*/${config_prefix}.*/✓ Platform Components Example should test ${test_name} functionality/test.mp4" -print0 2>/dev/null \
        | xargs -0 ls -t 2>/dev/null | head -1
}

# Seconds to the largest scene change in the first 12 seconds (the switch to
# the demo; opening the demo menu is a smaller one), plus a short margin. The
# Date Picker demo is the launch screen.
navigation_trim() {
    local trim
    trim=$(ffmpeg -t 12 -i "$1" -vf "select='gt(scene,0.01)*gte(t,1.5)',metadata=print:key=lavfi.scene_score" -f null - 2>&1 \
        | grep -oE "pts_time:[0-9.]+|lavfi.scene_score=[0-9.]+" | paste - - \
        | awk -F'[:=\t]' '{ if ($4 + 0 > best) { best = $4 + 0; t = $2 } } END { if (t != "") printf "%.2f", t + 0.4 }')
    echo "${trim:-3}"
}

font_file() {
    local candidate
    for candidate in \
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" \
        "/System/Library/Fonts/Supplemental/Arial.ttf" \
        "/System/Library/Fonts/Helvetica.ttc" \
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"; do
        if [ -f "$candidate" ]; then echo "$candidate"; return; fi
    done
}
FONT="$(font_file)"

WIDTH=$((PANEL_WIDTH * 2 + GAP))
FADE_OUT_START=$(awk -v c="$CLIP_SECONDS" 'BEGIN { printf "%.2f", c - 0.4 }')

phone_filter() {
    # Exactly CLIP_SECONDS (the recordings' timestamps make an input -t
    # unreliable), scaled to the panel height and centred in a fixed-width panel
    echo "fps=$FPS,trim=duration=$CLIP_SECONDS,setpts=PTS-STARTPTS,scale=-2:$PHONE_HEIGHT:flags=lanczos,pad=$PANEL_WIDTH:$PHONE_HEIGHT:(ow-iw)/2:0:color=$BG,setsar=1"
}

caption_filter() {
    local text="$1"
    if [ -n "$FONT" ]; then
        echo "drawtext=fontfile='$FONT':text='$text':fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=10:x=(w-text_w)/2:y=16,"
    fi
}

echo "=== README showreel ==="
CLIPS=()
for entry in "${COMPONENTS[@]}"; do
    caption="${entry%%|*}"
    test_name="${entry#*|}"
    ios="$(newest_recording ios.sim.release "$test_name")"
    android="$(newest_recording android.emu.release "$test_name")"
    if [ -z "$ios" ] || [ -z "$android" ]; then
        echo "  $caption: skipped (missing recording: ios='${ios:-none}' android='${android:-none}')"
        continue
    fi

    if [ "$test_name" = "Date Picker" ]; then
        trim_ios=0; trim_android=0
    else
        trim_ios="$(navigation_trim "$ios")"
        trim_android="$(navigation_trim "$android")"
    fi

    clip="$TEMP_DIR/clip_${#CLIPS[@]}.mp4"
    echo "  $caption: iOS from ${trim_ios}s, Android from ${trim_android}s"
    ffmpeg -y \
        -ss "$trim_ios" -i "$ios" \
        -ss "$trim_android" -i "$android" \
        -filter_complex "\
[0:v]$(phone_filter),pad=$((PANEL_WIDTH + GAP)):$PHONE_HEIGHT:0:0:color=$BG[l];\
[1:v]$(phone_filter)[r];\
[l][r]hstack=inputs=2,$(caption_filter "$caption")fade=t=in:st=0:d=0.3,fade=t=out:st=$FADE_OUT_START:d=0.4[v]" \
        -map "[v]" -an -r "$FPS" -pix_fmt yuv420p "$clip" 2>/dev/null
    CLIPS+=("$clip")
done

if [ ${#CLIPS[@]} -eq 0 ]; then
    echo "No recordings found under $ARTIFACTS_DIR"
    exit 1
fi

# Title card
card="$TEMP_DIR/card.mp4"
card_text="react-native-platform-components"
if [ -n "$FONT" ]; then
    ffmpeg -y -f lavfi -i "color=c=$BG:s=${WIDTH}x${PHONE_HEIGHT}:d=2:r=$FPS" \
        -vf "drawtext=fontfile='$FONT':text='$card_text':fontsize=22:fontcolor=#1c1c1e:x=(w-text_w)/2:y=(h-text_h)/2-16,\
drawtext=fontfile='$FONT':text='native on iOS and Android':fontsize=16:fontcolor=#6e6e73:x=(w-text_w)/2:y=(h-text_h)/2+16,\
fade=t=in:st=0:d=0.3,fade=t=out:st=1.6:d=0.4" \
        -pix_fmt yuv420p "$card" 2>/dev/null
    CLIPS+=("$card")
fi

list="$TEMP_DIR/list.txt"
: > "$list"
for clip in "${CLIPS[@]}"; do echo "file '$clip'" >> "$list"; done
ffmpeg -y -f concat -safe 0 -i "$list" -c copy "$TEMP_DIR/all.mp4" 2>/dev/null

echo "  Generating palette..."
ffmpeg -y -i "$TEMP_DIR/all.mp4" -vf "palettegen=stats_mode=diff" "$TEMP_DIR/palette.png" 2>/dev/null
echo "  Creating GIF..."
ffmpeg -y -i "$TEMP_DIR/all.mp4" -i "$TEMP_DIR/palette.png" \
    -filter_complex "[0:v][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
    "$OUT" 2>/dev/null

echo "Done: $OUT ($(du -h "$OUT" | cut -f1), ${#CLIPS[@]} clips)"
