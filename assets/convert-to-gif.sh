#!/usr/bin/env bash

ffmpeg -i ./assets/android-datepicker.mp4 -vf "fps=15,scale=480:-1:flags=lanczos,palettegen" ./assets/palette.png
ffmpeg -i ./assets/android-datepicker.mp4 -i ./assets/palette.png -filter_complex "fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse" ./assets/android-datepicker.gif