#!/usr/bin/env bash
# Builds assets/showreel.gif and docs/static/video/showreel.mp4 from the
# newest Detox recording of each flow. The work happens in
# scripts/visuals/showreel.mjs; see that file for the options.
#
# Run the flows first (see scripts/generate-readme-gifs.sh), then:
#   ./scripts/generate-readme-showreel.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/visuals/showreel.mjs" "$@"
