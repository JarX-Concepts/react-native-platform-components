package com.platformcomponents

import android.content.Context
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import com.google.android.material.checkbox.MaterialCheckBox

/**
 * A Material 3 checkbox (Checkbox): a `MaterialCheckBox` with its label as
 * the widget's own text (it wraps, and the box and label are one touch
 * target with Material's ripple), in the app's Material theme. Its checked,
 * unchecked and indeterminate states are `checkedState`, and `error` is
 * Material's error state (`isErrorShown`). An error message goes under the
 * label in the theme's error color; TalkBack reads it with the checkbox
 * (`errorAccessibilityLabel`).
 *
 * Controlled: a tap toggles the box natively and reports the new state, and
 * the manager applies `checked` again once JS has answered
 * (checkedEventCount), so a toggle the parent didn't take goes back.
 */
class PCCheckboxView(context: Context) : PCSelectionHostView(context) {

  // --- Props ---
  var checked: String = "false" // "true" | "false" | "indeterminate"
  var label: String = ""
  var errorState: String = "none" // "none" | "error"
  var errorText: String = ""
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var spokenLabel: String = ""
  var testID: String = ""
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap

  /** The `haptics` prop: the manager plays it on a toggle. */
  var haptics: String = ""

  // --- Events ---
  var onToggle: ((checked: Boolean) -> Unit)? = null

  // --- UI ---
  private var checkbox: MaterialCheckBox? = null
  private var errorView: TextView? = null
  private var suppressCallbacks = false

  /** The style's errorAccessibilityLabel (Material's localized "Error: invalid"). */
  private var defaultErrorAccessibilityLabel: CharSequence? = null

  // --- Native theme ---
  // Widgets read theme colors when they are created, so they are rebuilt when the
  // native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  init {
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  fun applyChecked(value: String?) {
    checked = when (value) {
      "true", "indeterminate" -> value
      else -> "false"
    }
    syncChecked()
  }

  fun applyLabel(value: String) {
    if (label == value) return
    label = value
    checkbox?.text = value
    applyAccessibility()
  }

  fun applyError(state: String?, text: String) {
    val nextState = if (state == "error") "error" else "none"
    if (errorState == nextState && errorText == text) return
    errorState = nextState
    errorText = text
    applyErrorState()
  }

  fun applyInteractivity(value: String?) {
    val next = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == next) return
    interactivity = next
    checkbox?.isEnabled = next == "enabled"
    errorView?.isEnabled = next == "enabled"
  }

  fun applySpokenLabel(value: String) {
    if (spokenLabel == value) return
    spokenLabel = value
    applyAccessibility()
  }

  /** The testID goes on the MaterialCheckBox, the view with the label and the touches. */
  fun applyTestID(value: String) {
    if (testID == value) return
    testID = value
    checkbox?.tag = value.ifEmpty { null }
  }

  fun applyMaxFontSizeMultiplier(value: Float) {
    if (maxFontSizeMultiplier == value) return
    maxFontSizeMultiplier = value
    rebuildUI()
  }

  /** Applies `checked` again, after JS answered a toggle. */
  fun syncChecked() {
    val c = checkbox ?: return
    val wanted = when (checked) {
      "true" -> MaterialCheckBox.STATE_CHECKED
      "indeterminate" -> MaterialCheckBox.STATE_INDETERMINATE
      else -> MaterialCheckBox.STATE_UNCHECKED
    }
    if (c.checkedState == wanted) return
    suppressCallbacks = true
    c.checkedState = wanted
    suppressCallbacks = false
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (builtThemeVersion != PCNativeTheme.version) nativeThemeListener.onNativeThemeChanged()
  }

  override fun onDetachedFromWindow() {
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  // ---- UI Building ----

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "Checkbox")
    val c = newColumn()

    val box = MaterialCheckBox(base).apply {
      text = label
      isEnabled = interactivity == "enabled"
      tag = testID.ifEmpty { null }
      PCThemeSupport.capTextSize(this, maxFontSizeMultiplier)
      addOnCheckedStateChangedListener { _, state ->
        if (suppressCallbacks) return@addOnCheckedStateChangedListener
        onToggle?.invoke(state == MaterialCheckBox.STATE_CHECKED)
      }
    }
    c.addView(box, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    checkbox = box
    defaultErrorAccessibilityLabel = box.errorAccessibilityLabel

    val error = PCSelectionSupport.createErrorText(base).apply {
      PCThemeSupport.capTextSize(this, maxFontSizeMultiplier)
      // Read with the checkbox (errorAccessibilityLabel), not on its own
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }
    c.addView(error, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    errorView = error

    syncChecked()
    applyErrorState()
    applyAccessibility()
    requestLayout()
  }

  private fun applyErrorState() {
    val box = checkbox ?: return
    val shows = errorState == "error"
    box.isErrorShown = shows
    // What TalkBack adds to the checkbox in the error state; Material's
    // default ("Error: invalid", localized) without a message
    box.errorAccessibilityLabel = errorText.ifEmpty { defaultErrorAccessibilityLabel }
    errorView?.let {
      it.text = errorText
      it.visibility = if (shows && errorText.isNotEmpty()) View.VISIBLE else View.GONE
    }
    requestLayout()
  }

  private fun applyAccessibility() {
    checkbox?.contentDescription = spokenLabel.ifEmpty { null }
  }

  /** The message starts where the label does, past the box. */
  override fun alignContent() {
    val box = checkbox ?: return
    val error = errorView ?: return
    val start = box.compoundPaddingStart
    val end = box.compoundPaddingEnd
    if (error.paddingStart != start || error.paddingEnd != end) {
      error.setPaddingRelative(start, 0, end, error.paddingBottom)
    }
  }
}
