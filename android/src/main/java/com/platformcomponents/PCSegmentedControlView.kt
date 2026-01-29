package com.platformcomponents

import android.content.Context
import android.text.TextUtils
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup

class PCSegmentedControlView(context: Context) : FrameLayout(context), ReactScrollViewHelper.HasStateWrapper {

  data class Segment(
    val label: String,
    val value: String,
    val disabled: Boolean,
    val icon: String
  )

  companion object {
    private const val TAG = "PCSegmentedControl"
  }

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Props ---
  var segments: List<Segment> = emptyList()
  var selectedValue: String = "" // sentinel for none
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var selectionRequired: Boolean = false

  // --- Events ---
  var onSelect: ((index: Int, value: String) -> Unit)? = null

  // --- UI ---
  private var toggleGroup: MaterialButtonToggleGroup? = null
  private val buttonIdToSegment: MutableMap<Int, Segment> = mutableMapOf()
  private var suppressCallbacks = false

  init {
    minimumHeight = (PCConstants.MIN_TOUCH_TARGET_HEIGHT_DP * resources.displayMetrics.density).toInt()
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  fun applySegments(newSegments: List<Segment>) {
    if (segments == newSegments) return
    segments = newSegments
    rebuildUI()
  }

  fun applySelectedValue(value: String) {
    if (selectedValue == value) return
    selectedValue = value
    updateSelection()
  }

  fun applyInteractivity(value: String?) {
    val newValue = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == newValue) return
    interactivity = newValue
    updateEnabled()
  }

  fun applyAndroidProps(required: Boolean) {
    if (selectionRequired != required) {
      selectionRequired = required
      rebuildUI()
    }
  }

  // ---- UI Building ----

  private fun rebuildUI() {
    removeAllViews()
    buttonIdToSegment.clear()

    val group = MaterialButtonToggleGroup(context).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
      isSingleSelection = true
      isSelectionRequired = selectionRequired
    }

    // Calculate if we need compact mode (many segments or long labels)
    val totalLabelLength = segments.sumOf { it.label.length }
    val useCompactMode = segments.size > 3 || totalLabelLength > 20

    for ((index, segment) in segments.withIndex()) {
      val button = MaterialButton(context, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
        id = View.generateViewId()
        text = segment.label
        isAllCaps = false  // Preserve original text casing
        contentDescription = segment.label  // For accessibility and Detox matching
        isEnabled = !segment.disabled && interactivity == "enabled"

        // Enable text truncation with ellipsis when space is limited
        ellipsize = TextUtils.TruncateAt.END
        maxLines = 1

        // Reduce horizontal padding in compact mode to fit more content
        if (useCompactMode) {
          val compactPadding = (8 * resources.displayMetrics.density).toInt()
          setPaddingRelative(compactPadding, paddingTop, compactPadding, paddingBottom)
          iconPadding = (4 * resources.displayMetrics.density).toInt()
        }

        // Set icon if available
        if (segment.icon.isNotEmpty()) {
          val resId = context.resources.getIdentifier(
            segment.icon, "drawable", context.packageName
          )
          if (resId != 0) {
            setIconResource(resId)
          }
        }

        // Handle click to trigger selection (needed for Detox taps)
        setOnClickListener {
          if (!suppressCallbacks && isEnabled) {
            group.check(id)
          }
        }
      }

      buttonIdToSegment[button.id] = segment
      group.addView(button)
    }

    group.addOnButtonCheckedListener { _, checkedId, isChecked ->
      if (suppressCallbacks) return@addOnButtonCheckedListener
      if (!isChecked) return@addOnButtonCheckedListener

      val segment = buttonIdToSegment[checkedId] ?: return@addOnButtonCheckedListener
      val index = segments.indexOf(segment)
      if (index >= 0) {
        onSelect?.invoke(index, segment.value)
      }
    }

    addView(group)
    toggleGroup = group

    updateSelection()
    updateEnabled()
    requestLayout()
  }

  private fun updateSelection() {
    suppressCallbacks = true
    val group = toggleGroup ?: return

    if (selectedValue.isEmpty()) {
      group.clearChecked()
    } else {
      for ((id, segment) in buttonIdToSegment) {
        if (segment.value == selectedValue) {
          group.check(id)
          break
        }
      }
    }
    suppressCallbacks = false
  }

  private fun updateEnabled() {
    val enabled = interactivity == "enabled"
    alpha = if (enabled) 1f else 0.5f

    val group = toggleGroup ?: return
    for (i in 0 until group.childCount) {
      val button = group.getChildAt(i) as? MaterialButton ?: continue
      val segment = buttonIdToSegment[button.id] ?: continue
      button.isEnabled = enabled && !segment.disabled
    }
  }

  // ---- Measurement ----

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // Measure children with UNSPECIFIED height to get intrinsic size
    val unconstrainedHeightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    super.onMeasure(widthMeasureSpec, unconstrainedHeightSpec)

    // Get the intrinsic height from children
    val childHeight = if (toggleGroup != null) {
      toggleGroup!!.measuredHeight
    } else {
      0
    }

    // Use the maximum of child height and minimum touch target
    val intrinsicHeight = childHeight.coerceAtLeast(minimumHeight)

    // IMPORTANT: Always use intrinsic height regardless of Yoga constraints.
    // Fabric may give us 0 height initially before state is updated.
    // The state update from onLayout will trigger proper re-layout.
    setMeasuredDimension(measuredWidth, intrinsicHeight)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    updateFrameSizeState()
  }

  /**
   * Update Fabric state with the measured frame size.
   * This allows the shadow node to use actual measured dimensions for Yoga layout.
   */
  private fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return
    val group = toggleGroup ?: return

    // Measure the toggle group with exact width and unspecified height
    val widthSpec = MeasureSpec.makeMeasureSpec(width.coerceAtLeast(1), MeasureSpec.EXACTLY)
    val heightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    group.measure(widthSpec, heightSpec)

    val widthDp = PixelUtil.toDIPFromPixel(width.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(group.measuredHeight.toFloat())

    // Only update if changed
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
