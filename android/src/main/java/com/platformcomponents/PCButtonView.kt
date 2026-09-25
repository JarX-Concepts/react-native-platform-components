package com.platformcomponents

import android.content.Context
import android.text.TextUtils
import android.view.View
import android.view.ViewParent
import android.widget.FrameLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.R as MaterialR
import com.google.android.material.button.MaterialButton
import com.google.android.material.progressindicator.CircularProgressIndicatorSpec
import com.google.android.material.progressindicator.IndeterminateDrawable

/**
 * A Material 3 Expressive button. Hosts a MaterialButton, rebuilt whenever a
 * prop that the widget reads at construction changes, and reports its
 * intrinsic size to Fabric so the React view wraps its content.
 */
class PCButtonView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  companion object {
    private const val TAG = "PCButton"
  }

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Props ---
  var label: String = ""
  var icon: PCButtonSupport.Icon = PCButtonSupport.NO_ICON
  var variant: PCExpressive.Variant = PCExpressive.Variant.FILLED
  var size: String = "small"
  var shape: String = "round"
  var iconPosition: String = "leading" // "leading" | "trailing"
  var cornerRadius: Float = -1f // dp; negative = use shape
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var loading: Boolean = false
  var spokenLabel: String = ""
  var expressive: Boolean = true // android.material: "expressive" | "m3"

  // --- Styling (null / empty = Material theme default) ---
  var containerColor: Int? = null
  var foregroundColor: Int? = null
  var rippleColor: Int? = null
  var strokeColor: Int? = null
  var disabledContainerColor: Int? = null
  var disabledForegroundColor: Int? = null
  var labelFontFamily: String = ""
  var labelFontSize: Float = 0f
  var labelFontWeight: String = ""
  var labelFontStyle: String = ""
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap

  /** The `haptics` prop; the manager plays it with the user's action (see PCHaptics). */
  var haptics: String = ""

  // --- Events ---
  var onPress: (() -> Unit)? = null

  // --- UI ---
  private var button: MaterialButton? = null

  /** Bumped on every rebuild so late image loads can't touch a stale button. */
  private var rebuildGeneration = 0

  /** The FloatingToolbar button overlay the widget was built with (0 = none). */
  private var builtToolbarOverlay = 0

  // --- Native theme ---
  // Widgets read theme colors when they are created, so they are rebuilt when the
  // native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  init {
    clipChildren = false
    clipToPadding = false
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  fun applyLabel(value: String) {
    if (label == value) return
    label = value
    rebuildUI()
  }

  fun applyIcon(value: PCButtonSupport.Icon) {
    if (icon == value) return
    icon = value
    rebuildUI()
  }

  fun applyVariant(value: String?) {
    val parsed = PCExpressive.parseVariant(value)
    if (variant == parsed) return
    variant = parsed
    rebuildUI()
  }

  fun applySize(value: String?) {
    val parsed = PCExpressive.parseSize(value)
    if (size == parsed) return
    size = parsed
    rebuildUI()
  }

  fun applyShape(value: String?) {
    val parsed = PCExpressive.parseShape(value)
    if (shape == parsed) return
    shape = parsed
    rebuildUI()
  }

  fun applyIconPosition(value: String?) {
    val newValue = if (value == "trailing") "trailing" else "leading"
    if (iconPosition == newValue) return
    iconPosition = newValue
    rebuildUI()
  }

  fun applyCornerRadius(value: Float) {
    if (cornerRadius == value) return
    cornerRadius = value
    rebuildUI()
  }

  fun applyInteractivity(value: String?) {
    val newValue = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == newValue) return
    interactivity = newValue
    button?.isEnabled = newValue == "enabled"
  }

  fun applyLoading(value: Boolean) {
    if (loading == value) return
    loading = value
    rebuildUI()
  }

  fun applyMaterial(value: String?) {
    val parsed = PCExpressive.parseExpressive(value)
    if (expressive == parsed) return
    expressive = parsed
    rebuildUI()
  }

  fun applySpokenLabel(value: String) {
    if (spokenLabel == value) return
    spokenLabel = value
    button?.contentDescription = spokenLabel.ifEmpty { null }
  }

  fun applyColors(container: Int?, foreground: Int?, ripple: Int?, stroke: Int?) {
    if (containerColor == container && foregroundColor == foreground &&
      rippleColor == ripple && strokeColor == stroke
    ) return
    containerColor = container
    foregroundColor = foreground
    rippleColor = ripple
    strokeColor = stroke
    rebuildUI()
  }

  fun applyDisabledColors(container: Int?, foreground: Int?) {
    if (disabledContainerColor == container && disabledForegroundColor == foreground) return
    disabledContainerColor = container
    disabledForegroundColor = foreground
    rebuildUI()
  }

  fun applyLabelStyle(fontFamily: String, fontSize: Float, fontWeight: String, fontStyle: String) {
    if (labelFontFamily == fontFamily && labelFontSize == fontSize &&
      labelFontWeight == fontWeight && labelFontStyle == fontStyle
    ) return
    labelFontFamily = fontFamily
    labelFontSize = fontSize
    labelFontWeight = fontWeight
    labelFontStyle = fontStyle
    rebuildUI()
  }

  fun applyMaxFontSizeMultiplier(value: Float) {
    if (maxFontSizeMultiplier == value) return
    maxFontSizeMultiplier = value
    rebuildUI()
  }

  /** Called by the enclosing FloatingToolbar when its variant changes. */
  fun refreshToolbarStyle() {
    if (toolbarOverlay() != builtToolbarOverlay) rebuildUI()
  }

  // The button has a generated view id, which React Native's touch handling would
  // take for a React tag and dispatch JS touch events to an unrelated view. Claim
  // the touch for this view instead; the button still receives it natively.
  override fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean = true

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int = id

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (builtThemeVersion != PCNativeTheme.version) {
      nativeThemeListener.onNativeThemeChanged()
    } else {
      // Inside a FloatingToolbar the toolbar's button styles apply; the parent
      // chain is only complete once attached.
      refreshToolbarStyle()
    }
  }

  override fun onDetachedFromWindow() {
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  private fun toolbarOverlay(): Int {
    var p: ViewParent? = parent
    while (p != null) {
      if (p is PCFloatingToolbarView) return p.buttonOverlay
      p = p.parent
    }
    return 0
  }

  // ---- UI Building ----

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    builtToolbarOverlay = toolbarOverlay()
    removeAllViews()
    rebuildGeneration += 1
    val generation = rebuildGeneration

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "Button")
    val iconOnly = label.isEmpty() && icon.isPresent

    val b = PCExpressive.createButton(
      base, variant, size, shape, iconOnly, builtToolbarOverlay, expressive
    ).apply {
      id = View.generateViewId()
      text = label
      isAllCaps = false // Preserve original text casing
      ellipsize = TextUtils.TruncateAt.END
      maxLines = 1
      contentDescription = spokenLabel.ifEmpty { null }
      isEnabled = interactivity == "enabled"
      if (iconOnly) {
        // Centre the icon instead of leaving it at the start edge
        iconGravity = MaterialButton.ICON_GRAVITY_TEXT_START
      } else if (iconPosition == "trailing") {
        iconGravity = MaterialButton.ICON_GRAVITY_TEXT_END
      }
      val radius = this@PCButtonView.cornerRadius // MaterialButton has its own cornerRadius
      if (radius >= 0) {
        // A numeric radius overrides the shape (and its press morph)
        shapeAppearanceModel = shapeAppearanceModel.withCornerSize(PixelUtil.toPixelFromDIP(radius))
      }
      setOnClickListener { if (!loading) onPress?.invoke() }
    }

    // While loading the spinner replaces the icon, so a late image load is dropped
    val showsSpinner = loading
    PCButtonSupport.applyIcon(b, icon, { generation == rebuildGeneration && !showsSpinner }) { requestLayout() }
    PCButtonSupport.applyFont(b, labelFontFamily, labelFontSize, labelFontWeight, labelFontStyle)
    PCButtonSupport.applyMaxFontSizeMultiplier(b, maxFontSizeMultiplier)
    PCButtonSupport.applyColors(
      b, containerColor, foregroundColor, rippleColor, strokeColor, icon.tinted,
      disabledContainerColor, disabledForegroundColor
    )
    // Added before the spinner goes in: once measured, a TextView reads its
    // layout params when its text changes
    addView(b, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
    if (showsSpinner) showSpinner(b)
    button = b
    requestLayout()
  }

  /**
   * Swaps the label and icon for an indeterminate circular progress indicator
   * at the icon size, keeping the button at its idle size, and ignores presses
   * without the disabled look.
   */
  private fun showSpinner(b: MaterialButton) {
    val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    b.measure(unspecified, unspecified)
    val idleWidth = b.measuredWidth
    val idleHeight = b.measuredHeight

    val spec = CircularProgressIndicatorSpec(
      b.context, null, 0, MaterialR.style.Widget_Material3_CircularProgressIndicator_ExtraSmall
    )
    if (b.iconSize > 0) spec.indicatorSize = b.iconSize
    spec.indicatorInset = 0
    spec.indicatorColors = intArrayOf(b.currentTextColor)

    b.contentDescription = spokenLabel.ifEmpty { label }.ifEmpty { null }
    b.text = ""
    b.iconTint = null
    b.icon = IndeterminateDrawable.createCircularDrawable(b.context, spec)
    b.iconGravity = MaterialButton.ICON_GRAVITY_TEXT_START
    b.iconPadding = 0
    b.minWidth = idleWidth
    b.minimumWidth = idleWidth
    b.minHeight = idleHeight
    b.minimumHeight = idleHeight
    b.isClickable = false
  }

  // ---- Layout ----

  private var manualLayoutPending = false

  /**
   * React Native's root view ignores requestLayout after the initial pass, so
   * a native view that changes its own subtree later (rebuilding for a prop
   * change, an icon finishing loading) has to measure and lay itself out.
   * Coalesced to one pass per frame.
   */
  override fun requestLayout() {
    super.requestLayout()
    if (!manualLayoutPending) {
      manualLayoutPending = true
      post { runManualLayout() }
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

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val child = button
    if (child == null) {
      setMeasuredDimension(0, 0)
      return
    }

    // The button's natural size; Yoga normally hands us exactly that (see
    // updateFrameSizeState), or a narrower width when the row is full.
    val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    child.measure(unspecified, unspecified)
    val width = resolveDimension(widthMeasureSpec, child.measuredWidth)
    val height = resolveDimension(heightMeasureSpec, child.measuredHeight)

    child.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
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
    super.onLayout(changed, left, top, right, bottom)
    updateFrameSizeState()
  }

  /** Reports the intrinsic size to Fabric; called as soon as the state wrapper is available. */
  fun reportIntrinsicSize() = updateFrameSizeState()

  /**
   * Update Fabric state with the button's natural size, so the shadow node
   * wraps its content in Yoga layout.
   */
  private fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return
    val child = button ?: return

    // The natural width, and the height at the width we actually have when
    // that is narrower.
    val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    child.measure(unspecified, unspecified)
    val naturalWidth = child.measuredWidth
    val fittedWidth = if (width in 1 until naturalWidth) width else naturalWidth
    child.measure(MeasureSpec.makeMeasureSpec(fittedWidth, MeasureSpec.EXACTLY), unspecified)
    val widthDp = PixelUtil.toDIPFromPixel(naturalWidth.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(child.measuredHeight.toFloat())

    // Measuring re-wraps the text; restore the laid-out size so the label is
    // ellipsized to the bounds it is drawn in.
    if (child.width > 0 && child.height > 0) {
      child.measure(
        MeasureSpec.makeMeasureSpec(child.width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(child.height, MeasureSpec.EXACTLY)
      )
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
}
