package com.platformcomponents

import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View

/**
 * The shared `haptics` prop: `View.performHapticFeedback` with the matching
 * `HapticFeedbackConstants`, played when a control reports the user's action.
 * The system touch-feedback setting applies (no ignore flags are passed).
 */
object PCHaptics {
  /**
   * Applies a `haptics` value to [view]: "none" turns off the haptics the view
   * plays itself (such as a long press), anything else turns them back on.
   * Returns the value for the view to keep ("" when unset).
   */
  fun configure(view: View, value: String?): String {
    val kind = value ?: ""
    view.isHapticFeedbackEnabled = kind != "none"
    return kind
  }

  /** Plays [kind] on [view]; "" and "none" play nothing. */
  fun perform(view: View, kind: String) {
    val constant = constantFor(kind) ?: return
    view.performHapticFeedback(constant)
  }

  /** The feedback constant for a `haptics` value, with fallbacks below the API level that added it. */
  fun constantFor(kind: String): Int? = when (kind) {
    "selection" ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) HapticFeedbackConstants.SEGMENT_TICK
      else HapticFeedbackConstants.CLOCK_TICK
    "light" -> HapticFeedbackConstants.CONTEXT_CLICK
    "medium" -> HapticFeedbackConstants.VIRTUAL_KEY
    "heavy" -> HapticFeedbackConstants.LONG_PRESS
    "success" ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM
      else HapticFeedbackConstants.VIRTUAL_KEY
    "warning", "error" ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.REJECT
      else HapticFeedbackConstants.LONG_PRESS
    else -> null
  }
}
