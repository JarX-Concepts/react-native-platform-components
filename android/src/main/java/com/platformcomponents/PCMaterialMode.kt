package com.platformcomponents

/**
 * Android rendering strategy for components that optionally use Material Components.
 *
 * - SYSTEM: Use platform/AppCompat widgets & dialogs (no Material-only UI assumptions).
 * - M3:     Use Material 3 components where applicable.
 */
internal enum class PCMaterialMode { SYSTEM, M3 }

internal fun parseMaterialMode(value: String?): PCMaterialMode =
  when (value) {
    "m3" -> PCMaterialMode.M3
    "system" -> PCMaterialMode.SYSTEM
    else -> PCMaterialMode.SYSTEM
  }