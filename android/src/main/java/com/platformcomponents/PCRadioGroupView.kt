package com.platformcomponents

import android.content.Context
import android.os.Build
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.AbsoluteSizeSpan
import android.text.style.ForegroundColorSpan
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.LinearLayout
import android.widget.RadioGroup
import android.widget.TextView
import androidx.core.graphics.ColorUtils
import com.google.android.material.R as MaterialR
import com.google.android.material.color.MaterialColors
import com.google.android.material.radiobutton.MaterialRadioButton

/**
 * A Material 3 single choice (RadioGroup): `MaterialRadioButton`s in an
 * Android `RadioGroup`, which keeps one checked and tells TalkBack it is a
 * radio group, in the app's Material theme. Each option is one radio button
 * whose text is the label and, under it, the description (Body Small in
 * `colorOnSurfaceVariant`), so the whole option is one touch target with
 * Material's ripple. The validation message goes under the group in the
 * theme's error color, announced when it appears (a polite live region).
 *
 * Controlled: a tap checks the option natively and reports it, and the
 * manager applies `value` again once JS has answered (valueEventCount), so a
 * pick the parent didn't take goes back.
 */
class PCRadioGroupView(context: Context) : PCSelectionHostView(context) {

  data class Option(
    val value: String,
    val label: String,
    val description: String,
    val disabled: Boolean,
    val testID: String,
    val accessibilityLabel: String
  )

  // --- Props ---
  var options: List<Option> = emptyList()
  var value: String = "" // empty = none chosen
  var errorState: String = "none" // "none" | "error"
  var errorText: String = ""
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var groupLabel: String = ""
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap

  /** The `haptics` prop: the manager plays it on a pick. */
  var haptics: String = ""

  // --- Events ---
  var onChange: ((index: Int, value: String) -> Unit)? = null

  // --- UI ---
  private var group: GroupView? = null
  private var errorView: TextView? = null
  private val radioIdToIndex: MutableMap<Int, Int> = mutableMapOf()
  private var suppressCallbacks = false

  /** Set by the apply* calls that need new radio buttons; see commit(). */
  private var needsRebuild = false

  // --- Native theme ---
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  init {
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  fun applyOptions(value: List<Option>) {
    if (options == value) return
    options = value
    needsRebuild = true
  }

  fun applyValue(value: String) {
    this.value = value
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
    needsRebuild = true
  }

  fun applyGroupLabel(value: String) {
    if (groupLabel == value) return
    groupLabel = value
    group?.containerTitle = value
  }

  fun applyMaxFontSizeMultiplier(value: Float) {
    if (maxFontSizeMultiplier == value) return
    maxFontSizeMultiplier = value
    needsRebuild = true
  }

  /** Rebuilds the radio buttons if a prop needs it, then applies `value`. */
  fun commit() {
    if (needsRebuild) {
      needsRebuild = false
      rebuildUI()
    } else {
      syncValue()
    }
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
    radioIdToIndex.clear()
    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "RadioGroup")
    val c = newColumn()
    val groupEnabled = interactivity == "enabled"

    val g = GroupView(base).apply {
      orientation = LinearLayout.VERTICAL
      containerTitle = groupLabel
    }
    for ((index, option) in options.withIndex()) {
      val radio = OptionButton(base).apply {
        id = View.generateViewId()
        isEnabled = groupEnabled && !option.disabled
        PCTestID.apply(this, option.testID)
        PCThemeSupport.capTextSize(this, maxFontSizeMultiplier)
        text = optionText(this, option)
        description = option.description
        // TalkBack reads the label, then the description as the hint, so
        // the label alone is the option's accessibility label
        contentDescription = when {
          option.accessibilityLabel.isNotEmpty() -> option.accessibilityLabel
          option.description.isNotEmpty() -> option.label
          else -> null
        }
      }
      radioIdToIndex[radio.id] = index
      g.addView(radio, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }
    g.setOnCheckedChangeListener { _, checkedId ->
      if (suppressCallbacks || checkedId == View.NO_ID) return@setOnCheckedChangeListener
      val index = radioIdToIndex[checkedId] ?: return@setOnCheckedChangeListener
      onChange?.invoke(index, options[index].value)
    }
    c.addView(g, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    group = g

    val error = PCSelectionSupport.createErrorText(base).apply {
      PCThemeSupport.capTextSize(this, maxFontSizeMultiplier)
      // Announced when it appears, as a form's validation message
      accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE
    }
    c.addView(error, LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    errorView = error

    syncValue()
    applyErrorState()
    requestLayout()
  }

  /** The label, and the description under it in the secondary text style. */
  private fun optionText(radio: TextView, option: Option): CharSequence {
    if (option.description.isEmpty()) return option.label
    val probe = TextView(radio.context)
    PCSelectionSupport.applyTextAppearance(probe, MaterialR.attr.textAppearanceBodySmall)
    PCThemeSupport.capTextSize(probe, maxFontSizeMultiplier)
    var color = MaterialColors.getColor(radio, MaterialR.attr.colorOnSurfaceVariant)
    if (!radio.isEnabled) {
      // Material's disabled content opacity
      color = ColorUtils.setAlphaComponent(color, (0.38f * 255).toInt())
    }
    return SpannableStringBuilder(option.label).apply {
      append('\n')
      val start = length
      append(option.description)
      setSpan(AbsoluteSizeSpan(probe.textSize.toInt()), start, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      setSpan(ForegroundColorSpan(color), start, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
  }

  private fun applyErrorState() {
    errorView?.let {
      val shows = errorState == "error" && errorText.isNotEmpty()
      it.text = if (shows) errorText else ""
      it.visibility = if (shows) View.VISIBLE else View.GONE
    }
    requestLayout()
  }

  /** Checks the option `value` names, or none. */
  private fun syncValue() {
    val g = group ?: return
    val wanted = radioIdToIndex.entries.firstOrNull { options[it.value].value == value && value.isNotEmpty() }?.key
    val current = g.checkedRadioButtonId.takeIf { it != View.NO_ID }
    if (current == wanted) return
    suppressCallbacks = true
    if (wanted == null) g.clearCheck() else g.check(wanted)
    suppressCallbacks = false
  }

  /** The message starts where the labels do, past the radio buttons. */
  override fun alignContent() {
    val error = errorView ?: return
    val first = group?.getChildAt(0) as? TextView
    val start = first?.compoundPaddingStart ?: 0
    val end = first?.compoundPaddingEnd ?: 0
    if (error.paddingStart != start || error.paddingEnd != end) {
      error.setPaddingRelative(start, 0, end, error.paddingBottom)
    }
  }

  /**
   * The Android RadioGroup, which reports itself to TalkBack as a radio
   * group; `containerTitle` names it on Android 14+ (like a fieldset's
   * legend).
   */
  private class GroupView(context: Context) : RadioGroup(context) {
    var containerTitle: String = ""

    override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
      super.onInitializeAccessibilityNodeInfo(info)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE && containerTitle.isNotEmpty()) {
        info.containerTitle = containerTitle
      }
    }
  }

  /** A MaterialRadioButton whose description TalkBack reads as its hint. */
  private class OptionButton(context: Context) : MaterialRadioButton(context) {
    var description: String = ""

    override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
      super.onInitializeAccessibilityNodeInfo(info)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && description.isNotEmpty()) {
        info.hintText = description
      }
    }
  }
}
