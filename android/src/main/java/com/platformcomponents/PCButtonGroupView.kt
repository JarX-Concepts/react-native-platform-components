package com.platformcomponents

import android.content.Context
import android.text.TextUtils
import android.view.ContextThemeWrapper
import android.view.View
import android.view.ViewGroup.MarginLayoutParams
import android.widget.FrameLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonGroup
import com.google.android.material.button.MaterialButtonToggleGroup

/**
 * A Material 3 Expressive button group: MaterialButtonGroup for plain actions,
 * MaterialButtonToggleGroup for single / multiple selection. Rebuilt whenever
 * a prop the widgets read at construction changes.
 */
class PCButtonGroupView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  data class Item(
    val label: String,
    val value: String,
    val disabled: Boolean,
    val icon: PCButtonSupport.Icon,
    val accessibilityLabel: String
  ) {
    /** What TalkBack announces for the button. */
    val spokenLabel: String get() = accessibilityLabel.ifEmpty { label }
  }

  companion object {
    private const val TAG = "PCButtonGroup"
  }

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Props ---
  var items: List<Item> = emptyList()
  var variant: PCExpressive.Variant = PCExpressive.Variant.OUTLINED
  var size: String = "small"
  var shape: String = "round"
  var connected: Boolean = false
  var spacing: Float = -1f // dp; negative = style default
  var selection: String = "none" // "none" | "single" | "multiple"
  var selectedValues: List<String> = emptyList()
  var selectionRequired: Boolean = false
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var overflow: String = "none" // "none" | "menu" | "wrap"

  // --- Styling (null / empty = Material theme default) ---
  var containerColor: Int? = null
  var foregroundColor: Int? = null
  var rippleColor: Int? = null
  var strokeColor: Int? = null
  var labelFontFamily: String = ""
  var labelFontSize: Float = 0f
  var labelFontWeight: String = ""
  var labelFontStyle: String = ""

  // --- Events ---
  var onPress: ((index: Int, value: String) -> Unit)? = null
  var onSelectionChange: ((values: List<String>) -> Unit)? = null

  // --- UI ---
  private var group: MaterialButtonGroup? = null
  private val buttonIdToIndex: MutableMap<Int, Int> = mutableMapOf()
  private var suppressCallbacks = false
  private var selectionEmitPending = false

  /** Bumped on every rebuild so late image loads can't touch stale buttons. */
  private var rebuildGeneration = 0

  // --- Native theme ---
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

  fun applyItems(value: List<Item>) {
    if (items == value) return
    items = value
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

  fun applyConnected(value: Boolean) {
    if (connected == value) return
    connected = value
    rebuildUI()
  }

  fun applySpacing(value: Float) {
    if (spacing == value) return
    spacing = value
    rebuildUI()
  }

  fun applySelection(value: String?) {
    val parsed = when (value) {
      "single", "multiple" -> value
      else -> "none"
    }
    if (selection == parsed) return
    selection = parsed
    rebuildUI()
  }

  fun applySelectedValues(value: List<String>) {
    if (selectedValues == value) return
    selectedValues = value
    updateSelection()
  }

  fun applySelectionRequired(value: Boolean) {
    if (selectionRequired == value) return
    selectionRequired = value
    (group as? MaterialButtonToggleGroup)?.isSelectionRequired = value
  }

  fun applyInteractivity(value: String?) {
    val newValue = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == newValue) return
    interactivity = newValue
    updateEnabled()
  }

  fun applyOverflow(value: String?) {
    val parsed = when (value) {
      "menu", "wrap" -> value
      else -> "none"
    }
    if (overflow == parsed) return
    overflow = parsed
    rebuildUI()
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

  // The buttons have generated view ids, which React Native's touch handling would
  // take for React tags and dispatch JS touch events to unrelated views. Claim the
  // touch for this view instead; the buttons still receive it natively.
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
    buttonIdToIndex.clear()
    rebuildGeneration += 1
    val generation = rebuildGeneration

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "ButtonGroup")
    val toggle = selection != "none"

    // The Expressive group styles: a standard group (spacing, press size
    // morph) or a connected one (shared outline, small inner corners).
    val overlay = when {
      toggle && !connected -> R.style.PCExpressiveOverlay_StandardToggleGroup
      !toggle && connected -> R.style.PCExpressiveOverlay_ConnectedGroup
      else -> R.style.PCExpressiveOverlay
    }
    val groupContext = ContextThemeWrapper(base, overlay)

    val g: MaterialButtonGroup =
      if (toggle) {
        MaterialButtonToggleGroup(groupContext).apply {
          isSingleSelection = selection == "single"
          isSelectionRequired = selectionRequired
        }
      } else {
        MaterialButtonGroup(groupContext)
      }
    g.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
    g.clipChildren = false
    g.clipToPadding = false
    if (spacing >= 0) {
      g.spacing = (spacing * resources.displayMetrics.density).toInt()
    }
    g.overflowMode = when (overflow) {
      "menu" -> MaterialButtonGroup.OVERFLOW_MODE_MENU
      "wrap" -> MaterialButtonGroup.OVERFLOW_MODE_WRAP
      else -> MaterialButtonGroup.OVERFLOW_MODE_NONE
    }

    for ((index, item) in items.withIndex()) {
      val iconOnly = item.label.isEmpty() && item.icon.isPresent

      val button = PCExpressive.createButton(base, variant, size, shape, iconOnly, 0).apply {
        id = View.generateViewId()
        text = item.label
        isAllCaps = false // Preserve original text casing
        ellipsize = TextUtils.TruncateAt.END
        maxLines = 1
        contentDescription = item.spokenLabel.ifEmpty { null }
        isEnabled = !item.disabled && interactivity == "enabled"
        if (iconOnly) {
          // Centre the icon instead of leaving it at the start edge
          iconGravity = MaterialButton.ICON_GRAVITY_TEXT_START
        }
        setOnClickListener { onPress?.invoke(index, item.value) }
      }

      PCButtonSupport.applyIcon(button, item.icon, { generation == rebuildGeneration }) { requestLayout() }
      PCButtonSupport.applyFont(button, labelFontFamily, labelFontSize, labelFontWeight, labelFontStyle)
      PCButtonSupport.applyColors(button, containerColor, foregroundColor, rippleColor, strokeColor, item.icon.tinted)

      buttonIdToIndex[button.id] = index
      // Buttons size to their content. Connected buttons also share any extra
      // width when the group is stretched (and any shortfall when it is
      // squeezed) equally; standard buttons keep their own width.
      val params = MaterialButtonGroup.LayoutParams(
        LayoutParams.WRAP_CONTENT,
        LayoutParams.WRAP_CONTENT,
        if (connected) 1f else 0f
      )
      params.overflowText = item.spokenLabel
      g.addView(button, params)
    }

    if (g is MaterialButtonToggleGroup) {
      g.addOnButtonCheckedListener { _, _, _ ->
        if (suppressCallbacks) return@addOnButtonCheckedListener
        // A single-selection switch reports the old button unchecked and the
        // new one checked in turn; report the final selection once.
        scheduleSelectionEmit()
      }
    }

    addView(g)
    group = g

    updateSelection()
    updateEnabled()
    requestLayout()
  }

  private fun scheduleSelectionEmit() {
    if (selectionEmitPending) return
    selectionEmitPending = true
    post {
      selectionEmitPending = false
      emitSelection()
    }
  }

  private fun emitSelection() {
    val g = group as? MaterialButtonToggleGroup ?: return
    val values = g.checkedButtonIds
      .mapNotNull { buttonIdToIndex[it] }
      .sorted()
      .map { items[it].value }
    onSelectionChange?.invoke(values)
  }

  private fun updateSelection() {
    val g = group as? MaterialButtonToggleGroup ?: return
    suppressCallbacks = true
    for ((id, index) in buttonIdToIndex) {
      val checked = selectedValues.contains(items[index].value)
      if (checked) g.check(id) else g.uncheck(id)
    }
    suppressCallbacks = false
  }

  private fun updateEnabled() {
    val enabled = interactivity == "enabled"
    alpha = if (enabled) 1f else 0.5f

    val g = group ?: return
    for (i in 0 until g.childCount) {
      val button = g.getChildAt(i) as? MaterialButton ?: continue
      val index = buttonIdToIndex[button.id] ?: continue
      button.isEnabled = enabled && !items[index].disabled
    }
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

  /**
   * The group's natural width: every button on one row. MaterialButtonGroup
   * answers that itself, except in the "wrap" overflow mode, which refuses an
   * AT_MOST width and lays every button on its own row for UNSPECIFIED; there
   * the buttons are summed instead.
   */
  private fun naturalWidth(child: MaterialButtonGroup): Int {
    if (overflow != "wrap") {
      child.measure(unspecified, unspecified)
      return child.measuredWidth
    }
    var total = child.paddingLeft + child.paddingRight
    var visible = 0
    for (i in 0 until child.childCount) {
      val button = child.getChildAt(i)
      if (button.visibility == View.GONE) continue
      button.measure(unspecified, unspecified)
      val params = button.layoutParams as? MarginLayoutParams
      total += button.measuredWidth + (params?.leftMargin ?: 0) + (params?.rightMargin ?: 0)
      visible++
    }
    if (visible > 1) total += child.spacing * (visible - 1)
    return total
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val child = group
    if (child == null) {
      setMeasuredDimension(0, 0)
      return
    }

    val natural = naturalWidth(child)
    val width = resolveDimension(widthMeasureSpec, natural)
    child.measure(MeasureSpec.makeMeasureSpec(minOf(width, natural), MeasureSpec.EXACTLY), unspecified)
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
   * Update Fabric state with the group's natural size, so the shadow node
   * wraps its content in Yoga layout.
   */
  private fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return
    val child = group ?: return

    // The natural width, and the height at the width we actually have when
    // that is narrower (an overflow "wrap" group grows taller then).
    val naturalWidth = naturalWidth(child)
    val fittedWidth = if (width in 1 until naturalWidth) width else naturalWidth
    child.measure(MeasureSpec.makeMeasureSpec(fittedWidth, MeasureSpec.EXACTLY), unspecified)
    val widthDp = PixelUtil.toDIPFromPixel(naturalWidth.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(child.measuredHeight.toFloat())

    // Measuring re-wraps the labels; restore the laid-out size so they are
    // ellipsized to the bounds they are drawn in.
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
