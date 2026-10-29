package com.platformcomponents

import android.content.Context
import android.widget.FrameLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.chip.Chip

/**
 * A Material 3 chip (Chip). Hosts a Material `Chip`, rebuilt whenever a prop
 * the widget reads at construction changes, plus a view over its close icon
 * that carries the close icon's testID (see PCChipSupport.CloseTarget). It
 * reports its intrinsic size to Fabric so the React view wraps its content.
 *
 * A selectable chip is a checkable `Chip` controlled by `selected`: a press
 * toggles it natively, and the manager applies `selected` again once JS has
 * answered (pressEventCount), so a toggle the parent didn't take goes back.
 */
class PCChipView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Props ---
  var label: String = ""
  var icon: PCButtonSupport.Icon = PCButtonSupport.NO_ICON
  var variant: String = "assist"
  var selectable: Boolean = false // `selected` is set
  var controlledSelected: Boolean = false // the `selected` prop
  var closeIcon: Boolean = false
  var closeAccessibilityLabel: String = ""
  var closeTestID: String = ""
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var spokenLabel: String = ""
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap
  var sizing = PCChipSupport.Sizing()

  /** The `haptics` prop: the manager plays it on a press or a close. */
  var haptics: String = ""

  // --- Events ---
  var onPress: (() -> Unit)? = null
  var onClose: (() -> Unit)? = null

  // --- UI ---
  private var chip: Chip? = null
  private var closeTarget: PCChipSupport.CloseTarget? = null

  /** Bumped on every rebuild so late image loads can't touch a stale chip. */
  private var rebuildGeneration = 0

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
  // Props that the widget reads at construction mark it for a rebuild, which
  // commit() runs once every prop of an update is in.

  /** Set by the apply* calls that need a new chip. */
  private var needsRebuild = false

  /** Rebuilds the chip if a prop needs it, then applies `selected`. */
  fun commit() {
    if (needsRebuild) {
      needsRebuild = false
      rebuildUI()
    }
    syncChecked()
  }


  fun applyLabel(value: String) {
    if (label == value) return
    label = value
    needsRebuild = true
  }

  fun applyIcon(value: PCButtonSupport.Icon) {
    if (icon == value) return
    icon = value
    needsRebuild = true
  }

  fun applyVariant(value: String?) {
    val parsed = PCChipSupport.parseVariant(value)
    if (variant == parsed) return
    variant = parsed
    needsRebuild = true
  }

  /** "" (not selectable) | "true" | "false". */
  fun applySelected(value: String?) {
    val nextSelectable = value == "true" || value == "false"
    controlledSelected = value == "true"
    if (selectable != nextSelectable) {
      selectable = nextSelectable
      needsRebuild = true
    } else {
      syncChecked()
    }
  }

  /** Applies `selected` again, after JS answered a press. */
  fun syncChecked() {
    val c = chip ?: return
    if (c.isCheckable && c.isChecked != controlledSelected) c.isChecked = controlledSelected
  }

  fun applyCloseIcon(value: Boolean, accessibilityLabel: String, testID: String) {
    if (closeIcon == value && closeAccessibilityLabel == accessibilityLabel && closeTestID == testID) return
    closeIcon = value
    closeAccessibilityLabel = accessibilityLabel
    closeTestID = testID
    needsRebuild = true
  }

  fun applyInteractivity(value: String?) {
    val newValue = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == newValue) return
    interactivity = newValue
    needsRebuild = true
  }

  fun applySpokenLabel(value: String) {
    if (spokenLabel == value) return
    spokenLabel = value
    chip?.contentDescription = value.ifEmpty { null }
  }

  fun applyMaxFontSizeMultiplier(value: Float) {
    if (maxFontSizeMultiplier == value) return
    maxFontSizeMultiplier = value
    needsRebuild = true
  }

  fun applyMinHeight(value: Float) {
    if (sizing.minHeight == value) return
    sizing = sizing.copy(minHeight = value)
    needsRebuild = true
  }

  fun applyPaddingHorizontal(value: Float) {
    if (sizing.paddingHorizontal == value) return
    sizing = sizing.copy(paddingHorizontal = value)
    needsRebuild = true
  }

  // The chip has a generated view id, which React Native's touch handling would
  // take for a React tag. Claim the touch for this view instead; the chip still
  // receives it natively.
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

  // ---- UI Building ----

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    removeAllViews()
    rebuildGeneration += 1
    val generation = rebuildGeneration

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "Chip")
    val enabled = interactivity == "enabled"
    val item = PCChipSupport.Item(
      label = label,
      value = "",
      disabled = !enabled,
      icon = icon,
      closeIcon = closeIcon,
      testID = "",
      closeTestID = closeTestID,
      accessibilityLabel = spokenLabel,
      closeAccessibilityLabel = closeAccessibilityLabel
    )
    val c = PCChipSupport.createChip(
      base, variant, item, selectable, enabled, maxFontSizeMultiplier, sizing,
      { generation == rebuildGeneration }
    ) { requestLayout() }
    c.isChecked = selectable && controlledSelected
    c.setOnClickListener { onPress?.invoke() }
    if (closeIcon) {
      c.setOnCloseIconClickListener { if (c.isEnabled) onClose?.invoke() }
    }
    addView(c, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
    chip = c

    closeTarget = if (closeIcon) {
      PCChipSupport.CloseTarget(context, c).also {
        it.tag = closeTestID.ifEmpty { null }
        addView(it)
      }
    } else {
      null
    }

    requestLayout()
  }

  // ---- Layout ----

  private var manualLayoutPending = false

  /**
   * React Native's root view ignores requestLayout after the initial pass, so
   * a native view that changes its own subtree later has to measure and lay
   * itself out. Coalesced to one pass per frame.
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

  private val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val child = chip
    if (child == null) {
      setMeasuredDimension(0, 0)
      return
    }

    // The chip's natural size; Yoga normally hands us exactly that (see
    // updateFrameSizeState), or a narrower width when the row is full.
    child.measure(unspecified, unspecified)
    val width = resolveDimension(widthMeasureSpec, child.measuredWidth)
    val height = resolveDimension(heightMeasureSpec, child.measuredHeight)

    child.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    closeTarget?.measure(unspecified, unspecified)
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
    chip?.layout(0, 0, right - left, bottom - top)
    closeTarget?.let { PCChipSupport.layoutCloseTarget(it, 0, 0) }
    updateFrameSizeState()
  }

  /** Reports the intrinsic size to Fabric; called as soon as the state wrapper is available. */
  fun reportIntrinsicSize() = updateFrameSizeState()

  /**
   * Update Fabric state with the chip's natural size, so the shadow node
   * wraps its content in Yoga layout.
   */
  private fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return
    val child = chip ?: return

    child.measure(unspecified, unspecified)
    val widthDp = PixelUtil.toDIPFromPixel(child.measuredWidth.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(child.measuredHeight.toFloat())

    // Measuring re-ellipsizes the label; restore the laid-out size so it is
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
