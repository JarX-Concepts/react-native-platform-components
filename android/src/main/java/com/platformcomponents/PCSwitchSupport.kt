package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import com.google.android.material.materialswitch.MaterialSwitch
import com.google.android.material.R as MaterialR

/** Color handling for Switch, and its MaterialSwitch. */
internal object PCSwitchSupport {
  private val DISABLED_CHECKED = intArrayOf(-android.R.attr.state_enabled, android.R.attr.state_checked)
  private val DISABLED = intArrayOf(-android.R.attr.state_enabled)
  private val CHECKED = intArrayOf(android.R.attr.state_checked)
  private val DEFAULT = intArrayOf()

  /**
   * [base] (the theme's tint) with the enabled on and off colors replaced by
   * [checked] and [unchecked] where they are set. The disabled colors stay the
   * theme's. Returns [base] when neither is set.
   */
  fun withColors(base: ColorStateList?, checked: Int?, unchecked: Int?): ColorStateList? {
    if (checked == null && unchecked == null) return base
    val fallback = base?.defaultColor ?: Color.GRAY
    fun theme(vararg state: Int): Int = base?.getColorForState(state, fallback) ?: fallback
    return ColorStateList(
      arrayOf(DISABLED_CHECKED, DISABLED, CHECKED, DEFAULT),
      intArrayOf(
        theme(android.R.attr.state_checked),
        theme(),
        checked ?: theme(android.R.attr.state_enabled, android.R.attr.state_checked),
        unchecked ?: theme(android.R.attr.state_enabled)
      )
    )
  }
}

/**
 * A MaterialSwitch that can show its thumb icon only while on. Material adds
 * `state_with_icon` whenever there is a thumb icon, which grows the off thumb
 * to the icon's size even when the icon is empty in that state; without it the
 * off thumb keeps Material's plain (smaller) size.
 */
internal class PCMaterialSwitch(context: Context) : MaterialSwitch(context) {
  var iconOnlyWhenChecked: Boolean = false
    set(value) {
      if (field == value) return
      field = value
      refreshDrawableState()
    }

  override fun onCreateDrawableState(extraSpace: Int): IntArray {
    val state = super.onCreateDrawableState(extraSpace)
    if (!iconOnlyWhenChecked || isChecked) return state
    val withIcon = MaterialR.attr.state_with_icon
    val index = state.indexOf(withIcon)
    if (index < 0) return state
    // Drop it and close the gap; the array ends at its first 0
    for (i in index until state.size - 1) state[i] = state[i + 1]
    state[state.size - 1] = 0
    return state
  }
}
