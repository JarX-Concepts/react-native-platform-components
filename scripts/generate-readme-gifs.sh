#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"
ARTIFACTS_DIR="$PROJECT_DIR/example/artifacts"

echo "=== README GIF Generator ==="
echo ""

# Step 1: Run e2e tests
echo "Step 1: Running iOS e2e tests..."
yarn test:e2e:ios

echo ""
echo "Step 2: Running Android e2e tests..."
yarn test:e2e:android

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

# Locate the 4 video files
IOS_DATEPICKER="$IOS_ARTIFACTS/✓ Platform Components Example should test Date Picker functionality/test.mp4"
IOS_SELECTIONMENU="$IOS_ARTIFACTS/✓ Platform Components Example should test Selection Menu functionality/test.mp4"
ANDROID_DATEPICKER="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Date Picker functionality/test.mp4"
ANDROID_SELECTIONMENU="$ANDROID_ARTIFACTS/✓ Platform Components Example should test Selection Menu functionality/test.mp4"

# Verify all files exist
for f in "$IOS_DATEPICKER" "$IOS_SELECTIONMENU" "$ANDROID_DATEPICKER" "$ANDROID_SELECTIONMENU"; do
    if [ ! -f "$f" ]; then
        echo "Error: Video file not found: $f"
        exit 1
    fi
done

echo "All 4 videos found!"

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

# Convert all 4 videos to GIFs
# iOS Selection Menu and Android Selection Menu need first 3 seconds trimmed
convert_to_gif "$IOS_DATEPICKER" "$ASSETS_DIR/ios-datepicker.gif" ""
convert_to_gif "$IOS_SELECTIONMENU" "$ASSETS_DIR/ios-selectionmenu.gif" "3"
convert_to_gif "$ANDROID_DATEPICKER" "$ASSETS_DIR/android-datepicker.gif" ""
convert_to_gif "$ANDROID_SELECTIONMENU" "$ASSETS_DIR/android-selectionmenu.gif" "3"

echo ""
echo "=== Complete! ==="
echo ""
echo "Generated GIFs in $ASSETS_DIR:"
ls -lh "$ASSETS_DIR"/*.gif
