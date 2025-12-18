package com.platformcomponents

import android.content.Context
import android.util.TypedValue

internal enum class PCMaterialMode { AUTO, M2, M3 }

internal fun parseMaterialMode(value: String?): PCMaterialMode =
  when (value) {
    "m2" -> PCMaterialMode.M2
    "m3" -> PCMaterialMode.M3
    else -> PCMaterialMode.AUTO
  }

/**
 * Best-effort heuristic:
 * - if the app theme defines the M3 'colorSurface' attribute, assume Material3-ish
 * - otherwise treat as M2-ish.
 *
 * This is not perfect, but it's good enough for AUTO.
 */
internal fun resolveAutoMaterialMode(context: Context, requested: PCMaterialMode): PCMaterialMode {
  if (requested != PCMaterialMode.AUTO) return requested

  // M3 attribute: com.google.android.material.R.attr.colorSurface (exists in both, but
  // in practice this is defined for Material themes; still ok as heuristic).
  val tv = TypedValue()
  val hasColorSurface = context.theme.resolveAttribute(
    com.google.android.material.R.attr.colorSurface,
    tv,
    true
  )
  return if (hasColorSurface) PCMaterialMode.M3 else PCMaterialMode.M2
}
