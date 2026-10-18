package com.platformcomponents

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.chip.ChipGroup

/**
 * A Material 3 ChipGroup (ChipGroup): Material `Chip`s in a `ChipGroup`,
 * which wraps them onto rows, or keeps them on one line (`isSingleLine`)
 * inside a `HorizontalScrollView`. Single / multiple selection uses the
 * group's own rules (`isSingleSelection`, `isSelectionRequired`) and stays
 * controlled: a press toggles the chips natively and reports the selection,
 * and the manager applies `selectedValues` again once JS has answered
 * (selectionEventCount), so a change the parent didn't take goes back.
 *
 * Each chip's close icon gets a view laid over it that carries its testID
 * (see PCChipSupport.CloseTarget).
 */
class PCChipGroupView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Props ---
  var items: List<PCChipSupport.Item> = emptyList()
  var variant: String = "assist"
  var selection: String = "none" // "none" | "single" | "multiple"
  var selectedValues: List<String> = emptyList()
  var selectionRequired: Boolean = false
  var wrap: Boolean = true
  var spacing: Float = -1f // dp; negative = style default
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap

  /** The `haptics` prop: the manager plays it on a press or a close. */
  var haptics: String = ""

  // --- Events ---
  var onPress: ((index: Int, value: String) -> Unit)? = null
  var onClose: ((index: Int, value: String) -> Unit)? = null
  var onSelectionChange: ((values: List<String>) -> Unit)? = null

  // --- UI ---
  private var group: ChipGroup? = null
  private var host: PCChipSupport.Host? = null
  private var scroll: HorizontalScrollView? = null
  private val chipIdToIndex: MutableMap<Int, Int> = mutableMapOf()
  private var suppressCallbacks = false
  private var selectionEmitPending = false

  /** Bumped on every rebuild so late image loads can't touch stale chips. */
  private var rebuildGeneration = 0

  /** Set by the apply* calls that need new chips; see commit(). */
  private var needsRebuild = false

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
  // Props that the widgets read at construction mark them for a rebuild,
  // which commit() runs once every prop of an update is in.

  fun applyItems(value: List<PCChipSupport.Item>) {
    if (items == value) return
    items = value
    needsRebuild = true
  }

  fun applyVariant(value: String?) {
    val parsed = PCChipSupport.parseVariant(value)
    if (variant == parsed) return
    variant = parsed
    needsRebuild = true
  }

  fun applySelection(value: String?) {
    val parsed = when (value) {
      "single", "multiple" -> value
      else -> "none"
    }
    if (selection == parsed) return
    selection = parsed
    needsRebuild = true
  }

  fun applySelectedValues(value: List<String>) {
    selectedValues = value
  }

  fun applySelectionRequired(value: Boolean) {
    if (selectionRequired == value) return
    selectionRequired = value
    group?.isSelectionRequired = value
  }

  fun applyWrap(value: Boolean) {
    if (wrap == value) return
    wrap = value
    needsRebuild = true
  }

  fun applySpacing(value: Float) {
    if (spacing == value) return
    spacing = value
    needsRebuild = true
  }

  fun applyInteractivity(value: String?) {
    val newValue = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == newValue) return
    interactivity = newValue
    needsRebuild = true
  }

  fun applyMaxFontSizeMultiplier(value: Float) {
    if (maxFontSizeMultiplier == value) return
    maxFontSizeMultiplier = value
    needsRebuild = true
  }

  /** Rebuilds the chips if a prop needs it, then applies `selectedValues`. */
  fun commit() {
    if (needsRebuild) {
      needsRebuild = false
      rebuildUI()
    } else {
      updateSelection()
    }
  }

  // The chips have generated view ids (ChipGroup needs them), which React
  // Native's touch handling would take for React tags and dispatch JS touch
  // events to unrelated views. Claim the touch for this view instead; the chips
  // still receive it natively.
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
    chipIdToIndex.clear()
    rebuildGeneration += 1
    val generation = rebuildGeneration

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "ChipGroup")
    val selectable = selection != "none"
    val groupEnabled = interactivity == "enabled"

    val g = ChipGroup(base).apply {
      isSingleLine = !wrap
      isSingleSelection = selection == "single"
      isSelectionRequired = selectionRequired
      clipChildren = false
      clipToPadding = false
      if (spacing >= 0) setChipSpacing((spacing * resources.displayMetrics.density).toInt())
    }
    val h = PCChipSupport.Host(context)
    h.addView(g, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))

    for ((index, item) in items.withIndex()) {
      val chip = PCChipSupport.createChip(
        base, variant, item, selectable, groupEnabled && !item.disabled, maxFontSizeMultiplier,
        { generation == rebuildGeneration }
      ) { requestLayout() }
      chip.id = View.generateViewId()
      chip.setOnClickListener { onPress?.invoke(index, item.value) }
      if (item.closeIcon) {
        chip.setOnCloseIconClickListener { if (chip.isEnabled) onClose?.invoke(index, item.value) }
      }
      chipIdToIndex[chip.id] = index
      g.addView(chip, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
      if (item.closeIcon) {
        // After the group, so it is drawn and touched above the chips
        h.addTarget(PCChipSupport.CloseTarget(context, chip).apply { tag = item.closeTestID.ifEmpty { null } })
      }
    }

    g.setOnCheckedStateChangeListener { _, _ ->
      if (suppressCallbacks) return@setOnCheckedStateChangeListener
      // A single-selection switch reports the old chip unchecked and the new
      // one checked in turn; report the final selection once.
      scheduleSelectionEmit()
    }

    if (wrap) {
      scroll = null
      addView(h)
    } else {
      val s = HorizontalScrollView(context).apply {
        isHorizontalScrollBarEnabled = false
        clipChildren = false
        clipToPadding = false
        addView(h, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
      }
      scroll = s
      addView(s)
    }
    group = g
    host = h

    updateSelection()
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
    val g = group ?: return
    val values = g.checkedChipIds
      .mapNotNull { chipIdToIndex[it] }
      .sorted()
      .map { items[it].value }
    onSelectionChange?.invoke(values)
  }

  /** Checks the chips `selectedValues` names, and only those. */
  private fun updateSelection() {
    val g = group ?: return
    if (selection == "none") return
    val wanted = chipIdToIndex.filterValues { selectedValues.contains(items[it].value) }.keys
    if (g.checkedChipIds.toSet() == wanted) return
    suppressCallbacks = true
    // clearCheck also permits a controlled empty selection when
    // selectionRequired keeps the user from unchecking the last chip.
    g.clearCheck()
    wanted.forEach { g.check(it) }
    suppressCallbacks = false
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

  /** Every chip on one row (ChipGroup doesn't wrap without a width). */
  private fun naturalWidth(g: ChipGroup): Int {
    g.measure(unspecified, unspecified)
    return g.measuredWidth
  }

  /** The content's height at [width]: the wrapped rows, or the one row. */
  private fun contentHeight(g: ChipGroup, width: Int): Int {
    val h = host ?: return 0
    if (!wrap) {
      h.measure(unspecified, unspecified)
      return h.measuredHeight
    }
    h.measure(MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY), unspecified)
    return h.measuredHeight
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val g = group
    val content: View? = scroll ?: host
    if (g == null || content == null) {
      setMeasuredDimension(0, 0)
      return
    }

    val natural = naturalWidth(g)
    val width = resolveDimension(widthMeasureSpec, natural)
    val height = resolveDimension(heightMeasureSpec, contentHeight(g, width))

    content.measure(
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
   * Update Fabric state with the group's one-row width and its height at the
   * width it was laid out at, so the shadow node wraps its content in Yoga
   * layout and a wrapping group grows taller when it is narrower.
   */
  private fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return
    val g = group ?: return
    val content: View = scroll ?: host ?: return

    val natural = naturalWidth(g)
    val fitted = if (width in 1 until natural) width else natural
    val widthDp = PixelUtil.toDIPFromPixel(natural.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(contentHeight(g, fitted).toFloat())

    // Measuring re-wraps the chips; restore the laid-out size so they are
    // placed and ellipsized for the bounds they are drawn in.
    if (content.width > 0 && content.height > 0) {
      content.measure(
        MeasureSpec.makeMeasureSpec(content.width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(content.height, MeasureSpec.EXACTLY)
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
