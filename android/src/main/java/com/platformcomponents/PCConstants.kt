package com.platformcomponents

/**
 * Centralized sizing constants for Platform Components Android implementations.
 * These values control touch targets, default dimensions, and fallback sizes.
 */
object PCConstants {
    // MARK: - Touch Targets

    /** Minimum touch target height in dp (Material Design 3 recommends 48dp, we use 56dp for text fields) */
    const val MIN_TOUCH_TARGET_HEIGHT_DP = 56f

    /** Minimum height for M3 TextInputLayout with floating label (needs extra space for hint + text) */
    const val MIN_M3_TEXT_INPUT_HEIGHT_DP = 72f

    // MARK: - Fallback Dimensions

    /** Fallback width in dp when constraint width is unavailable */
    const val FALLBACK_WIDTH_DP = 320f
}
