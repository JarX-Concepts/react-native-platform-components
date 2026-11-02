package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.StateListDrawable
import android.util.TypedValue
import android.view.MotionEvent
import android.view.View
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Checkable
import android.widget.FrameLayout
import android.widget.TextView
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.widget.TextViewCompat
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.color.MaterialColors
import com.google.android.material.materialswitch.MaterialSwitch
import com.google.android.material.R as MaterialR

/**
 * A Material 3 switch (Switch): a `MaterialSwitch`, on its own or at the end
 * of a settings row with its label at the start, where a tap anywhere on the
 * row toggles it.
 *
 * This view is the one accessibility element and carries the testID: it has
 * the label (contentDescription), the switch role and the checked state
 * (Checkable, so Espresso's isChecked and Detox's toHaveToggleValue read it),
 * and takes the row's touches. The MaterialSwitch inside still takes touches
 * on itself (taps and drags) and is hidden from accessibility services.
 *
 * The value is controlled: the switch shows `value`, a toggle reports the new
 * value, and the manager applies `value` again once JS has answered
 * (valueEventCount), so a toggle the parent didn't take goes back.
 */
class PCSwitchView(context: Context) :
  FrameLayout(context),
  Checkable,
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Props ---
  /** The controlled value. */
  var value: Boolean = false
  var label: String = ""
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var onColor: Int? = null
  var offTrackColor: Int? = null
  var thumbColor: Int? = null
  var thumbIcon: PCButtonSupport.Icon = PCButtonSupport.NO_ICON
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap
  var spokenLabel: String = ""

  /** The `haptics` prop: the manager plays it on a toggle. */
  var haptics: String = ""

  // --- Events ---
  var onValueChange: ((Boolean) -> Unit)? = null

  // --- UI ---
  private var switchView: PCMaterialSwitch? = null
  private var labelView: TextView? = null

  /** The theme's tints, captured when the switch is built, under the color props. */
  private var themeTrackTint: ColorStateList? = null
  private var themeThumbTint: ColorStateList? = null

  /** True while the view sets the switch itself, so the change isn't reported. */
  private var syncing = false

  /** Bumped on every rebuild so late image loads can't touch a stale switch. */
  private var rebuildGeneration = 0

  private val labelSpacing: Int
    get() = PixelUtil.toPixelFromDIP(LABEL_SPACING_DP).toInt()

  private val isEnabledProp: Boolean get() = interactivity != "disabled"
  private val hasLabel: Boolean get() = label.isNotEmpty()

  // --- Native theme ---
  // Widgets read theme colors when they are created, so they are rebuilt when the
  // native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  /** Set by the apply* calls that need a new widget. */
  private var needsRebuild = false

  private var manualLayoutPending = false

  private val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)

  init {
    clipChildren = false
    clipToPadding = false
    // The row's own click: a tap on the label (or TalkBack's double tap)
    setOnClickListener { toggleFromUser() }
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  /** Rebuilds the widgets if a prop needs it, then shows `value`. */
  fun commit() {
    if (needsRebuild) {
      needsRebuild = false
      rebuildUI()
    }
    syncChecked()
  }

  /** Shows `value`: after a prop change, and after JS answered a toggle. */
  fun syncChecked() {
    val sw = switchView ?: return
    if (sw.isChecked == value) return
    syncing = true
    sw.isChecked = value
    syncing = false
  }

  fun applyLabel(value: String) {
    if (label == value) return
    label = value
    needsRebuild = true
  }

  fun applyInteractivity(value: String?) {
    val next = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == next) return
    interactivity = next
    applyEnabled()
  }

  fun applyColors(on: Int?, offTrack: Int?, thumb: Int?) {
    if (onColor == on && offTrackColor == offTrack && thumbColor == thumb) return
    onColor = on
    offTrackColor = offTrack
    thumbColor = thumb
    switchView?.let { applyTints(it) }
  }

  fun applyThumbIcon(value: PCButtonSupport.Icon) {
    if (thumbIcon == value) return
    thumbIcon = value
    switchView?.let { applyThumbIcon(it) }
  }

  fun applyMaxFontSizeMultiplier(value: Float) {
    if (maxFontSizeMultiplier == value) return
    maxFontSizeMultiplier = value
    needsRebuild = true
  }

  fun applySpokenLabel(value: String) {
    if (spokenLabel == value) return
    spokenLabel = value
    applyContentDescription()
  }

  // The switch would otherwise be found by its view id as a React tag; claim
  // the touch for this view. The switch still receives it natively.
  override fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean = true

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int = id

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

  // ---- Toggling ----

  private fun toggleFromUser() {
    val sw = switchView ?: return
    if (!isEnabledProp) return
    // The switch's change listener reports it
    sw.toggle()
  }

  private fun reportChange(checked: Boolean) {
    onValueChange?.invoke(checked)
  }

  // Without a label only the switch takes touches: a layout that makes the
  // view wider than the switch leaves the rest inert. TalkBack's click still
  // goes through performClick.
  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (!hasLabel) return false
    return super.onTouchEvent(event)
  }

  // ---- Checkable (the switch's state, for accessibility and tests) ----

  override fun isChecked(): Boolean = switchView?.isChecked ?: value

  override fun setChecked(checked: Boolean) {
    // Controlled: only `value` sets the switch
  }

  override fun toggle() = toggleFromUser()

  // ---- Accessibility: one element with the switch role ----

  override fun getAccessibilityClassName(): CharSequence = SWITCH_CLASS_NAME

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    info.className = SWITCH_CLASS_NAME
    info.isCheckable = true
    info.isChecked = isChecked()
  }

  override fun onInitializeAccessibilityEvent(event: AccessibilityEvent) {
    super.onInitializeAccessibilityEvent(event)
    event.className = SWITCH_CLASS_NAME
    event.isChecked = isChecked()
  }

  private fun applyContentDescription() {
    contentDescription = spokenLabel.ifEmpty { label }.ifEmpty { null }
  }

  private fun applyEnabled() {
    val enabled = isEnabledProp
    isEnabled = enabled
    switchView?.isEnabled = enabled
    labelView?.alpha = if (enabled) 1f else DISABLED_ALPHA
  }

  // ---- UI Building ----

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    removeAllViews()
    rebuildGeneration += 1

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "Switch")

    val sw = PCMaterialSwitch(base)
    sw.isSaveEnabled = false
    sw.isChecked = value
    sw.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    sw.setOnCheckedChangeListener { _, checked ->
      if (!syncing) reportChange(checked)
    }
    themeTrackTint = sw.trackTintList
    themeThumbTint = sw.thumbTintList
    applyTints(sw)
    applyThumbIcon(sw)
    sw.jumpDrawablesToCurrentState()
    switchView = sw

    labelView = if (hasLabel) {
      TextView(base).also { tv ->
        applyTextAppearance(tv, MaterialR.attr.textAppearanceBodyLarge)
        tv.setTextColor(MaterialColors.getColor(tv, MaterialR.attr.colorOnSurface))
        tv.text = label
        tv.textAlignment = View.TEXT_ALIGNMENT_VIEW_START
        tv.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        PCThemeSupport.capTextSize(tv, maxFontSizeMultiplier)
        addView(tv, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
      }
    } else {
      null
    }
    addView(sw, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))

    // A settings row ripples as a whole, as Material list items do
    background = if (hasLabel) themeDrawable(base, android.R.attr.selectableItemBackground) else null

    applyEnabled()
    applyContentDescription()
    requestLayout()
  }

  private fun applyTints(sw: MaterialSwitch) {
    sw.trackTintList = PCSwitchSupport.withColors(themeTrackTint, onColor, offTrackColor)
    sw.thumbTintList = PCSwitchSupport.withColors(themeThumbTint, thumbColor, thumbColor)
  }

  private fun applyThumbIcon(sw: PCMaterialSwitch) {
    val icon = thumbIcon
    val generation = rebuildGeneration
    sw.iconOnlyWhenChecked = false
    when (icon.type) {
      "check" -> {
        // Material's check mark while on, and the plain (smaller) thumb while off
        val check = AppCompatResources.getDrawable(sw.context, MaterialR.drawable.m3_ic_check_24px)
        sw.iconOnlyWhenChecked = true
        sw.thumbIconDrawable = StateListDrawable().apply {
          addState(intArrayOf(android.R.attr.state_checked), check)
          addState(intArrayOf(), ColorDrawable(Color.TRANSPARENT))
        }
      }
      "drawable" -> {
        sw.thumbIconDrawable = ResourceDrawableIdHelper.instance.getResourceDrawable(sw.context, icon.name)
      }
      "image" -> {
        val uri = icon.uri
        if (!uri.contains(':')) {
          sw.thumbIconDrawable = ResourceDrawableIdHelper.instance.getResourceDrawable(sw.context, uri)
        } else {
          sw.thumbIconDrawable = null
          PCImageLoader.load(sw.context, uri, icon.scale, icon.request) { bitmap ->
            if (bitmap == null || generation != rebuildGeneration || thumbIcon != icon) return@load
            sw.thumbIconDrawable = BitmapDrawable(sw.context.resources, bitmap)
          }
        }
      }
      else -> sw.thumbIconDrawable = null
    }
    // An image drawn as-is keeps its colors; everything else takes the theme's icon tint
    if (!icon.tinted && icon.type == "image") sw.thumbIconTintList = null
  }

  private fun applyTextAppearance(view: TextView, attr: Int) {
    val value = TypedValue()
    if (view.context.theme.resolveAttribute(attr, value, true) && value.resourceId != 0) {
      TextViewCompat.setTextAppearance(view, value.resourceId)
    }
  }

  private fun themeDrawable(ctx: Context, attr: Int): Drawable? {
    val value = TypedValue()
    if (!ctx.theme.resolveAttribute(attr, value, true) || value.resourceId == 0) return null
    return AppCompatResources.getDrawable(ctx, value.resourceId)
  }

  // ---- Layout ----

  /**
   * React Native's root view ignores requestLayout after the initial pass, so
   * a native view that changes its own subtree later has to measure and lay
   * itself out. Coalesced to one pass per frame.
   */
  override fun requestLayout() {
    super.requestLayout()
    if (!manualLayoutPending) {
      manualLayoutPending = true
      PCManualLayout.beforeNextDraw(this) { if (manualLayoutPending) runManualLayout() }
    }
  }

  private fun runManualLayout() {
    manualLayoutPending = false
    // Nothing to do until Yoga has placed us; the regular pass covers that.
    if (width == 0 || height == 0) return
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  // ---- Measurement ----

  private fun measureSwitch(sw: View) {
    sw.measure(unspecified, unspecified)
  }

  /** The content's width with the label on one line (padding excluded). */
  private fun naturalContentWidth(): Int {
    val sw = switchView ?: return 0
    measureSwitch(sw)
    val tv = labelView ?: return sw.measuredWidth
    tv.measure(unspecified, unspecified)
    return tv.measuredWidth + labelSpacing + sw.measuredWidth
  }

  /** The label's width when the content is [contentWidth] wide. */
  private fun labelWidth(contentWidth: Int): Int {
    val sw = switchView ?: return 0
    return maxOf(0, contentWidth - labelSpacing - sw.measuredWidth)
  }

  /** The content's height at [contentWidth]: the switch, or the wrapped label if taller. */
  private fun contentHeight(contentWidth: Int): Int {
    val sw = switchView ?: return 0
    measureSwitch(sw)
    val tv = labelView ?: return sw.measuredHeight
    tv.measure(MeasureSpec.makeMeasureSpec(labelWidth(contentWidth), MeasureSpec.AT_MOST), unspecified)
    return maxOf(sw.measuredHeight, tv.measuredHeight)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val sw = switchView
    if (sw == null) {
      setMeasuredDimension(0, 0)
      return
    }
    val paddingH = paddingLeft + paddingRight
    val paddingV = paddingTop + paddingBottom

    val width = resolveDimension(widthMeasureSpec, naturalContentWidth() + paddingH)
    val contentWidth = maxOf(0, width - paddingH)
    val height = resolveDimension(heightMeasureSpec, contentHeight(contentWidth) + paddingV)

    sw.measure(
      MeasureSpec.makeMeasureSpec(sw.measuredWidth, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(sw.measuredHeight, MeasureSpec.EXACTLY)
    )
    // The label takes the width of its text (up to the room there is) and
    // onLayout puts it at the start. A one-line label widened past its text
    // keeps its text at the left even right to left (TextView only widens
    // the BoringLayout it measured at the text's width)
    labelView?.let { tv ->
      tv.measure(MeasureSpec.makeMeasureSpec(labelWidth(contentWidth), MeasureSpec.AT_MOST), unspecified)
      tv.measure(
        MeasureSpec.makeMeasureSpec(tv.measuredWidth, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(minOf(tv.measuredHeight, maxOf(0, height - paddingV)), MeasureSpec.EXACTLY)
      )
    }
    setMeasuredDimension(width, height)
  }

  private fun resolveDimension(spec: Int, desired: Int): Int {
    val size = MeasureSpec.getSize(spec)
    return when (MeasureSpec.getMode(spec)) {
      // Fabric may give us 0 before the state is applied; keep the natural size then.
      MeasureSpec.EXACTLY -> if (size > 0) size else desired
      MeasureSpec.AT_MOST -> minOf(desired, size)
      else -> desired
    }
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val sw = switchView ?: return
    val w = right - left
    val h = bottom - top
    val contentLeft = paddingLeft
    val contentRight = w - paddingRight
    val centerY = paddingTop + (h - paddingTop - paddingBottom) / 2
    val rtl = layoutDirection == View.LAYOUT_DIRECTION_RTL
    val swW = sw.measuredWidth
    val swH = sw.measuredHeight

    val tv = labelView
    if (tv == null) {
      // Alone, the switch sits at the start
      val x = if (rtl) contentRight - swW else contentLeft
      sw.layout(x, centerY - swH / 2, x + swW, centerY - swH / 2 + swH)
    } else {
      // A row: the switch at the end, the label at the start
      val swX = if (rtl) contentLeft else contentRight - swW
      sw.layout(swX, centerY - swH / 2, swX + swW, centerY - swH / 2 + swH)
      val tvW = tv.measuredWidth
      val tvH = tv.measuredHeight
      val tvX = if (rtl) contentRight - tvW else contentLeft
      tv.layout(tvX, centerY - tvH / 2, tvX + tvW, centerY - tvH / 2 + tvH)
    }
    updateFrameSizeState()
  }

  /** Reports the intrinsic size to Fabric; called as soon as the state wrapper is available. */
  fun reportIntrinsicSize() = updateFrameSizeState()

  /**
   * Update Fabric state with the content's one-line width and its height at
   * the width it was laid out at, so the shadow node wraps its content in
   * Yoga layout and a row whose label wraps grows taller when it is narrower.
   */
  private fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return
    val sw = switchView ?: return

    val natural = naturalContentWidth()
    val laidOut = width - paddingLeft - paddingRight
    val fitted = if (laidOut in 1 until natural) laidOut else natural
    val widthDp = PixelUtil.toDIPFromPixel(natural.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(contentHeight(fitted).toFloat())

    // Measuring re-wraps the label; restore the laid-out sizes
    if (sw.width > 0 && sw.height > 0) {
      sw.measure(
        MeasureSpec.makeMeasureSpec(sw.width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(sw.height, MeasureSpec.EXACTLY)
      )
    }
    labelView?.let { tv ->
      if (tv.width > 0 && tv.height > 0) {
        tv.measure(
          MeasureSpec.makeMeasureSpec(tv.width, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(tv.height, MeasureSpec.EXACTLY)
        )
      }
    }

    if (widthDp != lastReportedWidth || heightDp != lastReportedHeight) {
      lastReportedWidth = widthDp
      lastReportedHeight = heightDp

      val stateData = WritableNativeMap().apply {
        putDouble("width", widthDp.toDouble())
        putDouble("height", heightDp.toDouble())
      }
      wrapper.updateState(stateData)
    }
  }

  companion object {
    /** Space between the label and the switch, in dp. */
    const val LABEL_SPACING_DP = 16f

    /** Material 3's disabled content opacity. */
    const val DISABLED_ALPHA = 0.38f

    /** What accessibility services see: a switch. */
    const val SWITCH_CLASS_NAME = "android.widget.Switch"
  }
}
