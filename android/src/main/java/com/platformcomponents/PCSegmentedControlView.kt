package com.platformcomponents

import android.content.Context
import android.graphics.drawable.BitmapDrawable
import android.text.TextUtils
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup

class PCSegmentedControlView(context: Context) : FrameLayout(context), ReactScrollViewHelper.HasStateWrapper {

  data class Segment(
    val label: String,
    val value: String,
    val disabled: Boolean,
    /** "", "sfSymbol" (ignored on Android), "drawable" or "image" */
    val iconType: String,
    val iconName: String,
    val iconUri: String,
    val iconScale: Float,
    val iconTinted: Boolean,
    val accessibilityLabel: String
  ) {
    val hasIcon: Boolean get() = iconType == "drawable" || iconType == "image"

    /** What TalkBack announces for the segment. */
    val spokenLabel: String get() = accessibilityLabel.ifEmpty { label }
  }

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
  var labelVisibility: String = "auto" // "auto" | "labeled" | "unlabeled"
  // Matches iOS, where a UISegmentedControl selection cannot be cleared by tapping.
  var selectionRequired: Boolean = true

  // --- Events ---
  /** index -1 with an empty value means the selection was cleared. */
  var onSelect: ((index: Int, value: String) -> Unit)? = null

  // --- UI ---
  private var toggleGroup: MaterialButtonToggleGroup? = null
  private val buttonIdToSegment: MutableMap<Int, Segment> = mutableMapOf()
  private var suppressCallbacks = false

  /** Bumped on every rebuild so late image loads can't touch stale buttons. */
  private var rebuildGeneration = 0

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

  fun applyLabelVisibility(value: String?) {
    val newValue = when (value) {
      "labeled", "unlabeled" -> value
      else -> "auto"
    }
    if (labelVisibility == newValue) return
    labelVisibility = newValue
    rebuildUI()
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
    rebuildGeneration += 1
    val generation = rebuildGeneration

    val group = MaterialButtonToggleGroup(context).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
      isSingleSelection = true
      isSelectionRequired = selectionRequired
    }

    // Calculate if we need compact mode (many segments or long labels)
    val totalLabelLength = segments.sumOf { it.label.length }
    val useCompactMode = segments.size > 3 || totalLabelLength > 20

    for ((index, segment) in segments.withIndex()) {
      // "unlabeled" hides the text of segments that have an icon; segments
      // without one keep their label. "auto" and "labeled" show icon + label.
      val iconOnly = labelVisibility == "unlabeled" && segment.hasIcon

      val button = MaterialButton(context, null, com.google.android.material.R.attr.materialButtonOutlinedStyle).apply {
        id = View.generateViewId()
        text = if (iconOnly) "" else segment.label
        isAllCaps = false  // Preserve original text casing
        // Screen readers (and Detox) always get the label, even when hidden
        contentDescription = segment.spokenLabel
        isEnabled = !segment.disabled && interactivity == "enabled"

        // Enable text truncation with ellipsis when space is limited
        ellipsize = TextUtils.TruncateAt.END
        maxLines = 1

        // Material 3 segmented buttons use 12dp horizontal padding and an 8dp
        // icon gap (the outlined button style defaults to 24dp); tighten
        // further when there are many segments or long labels.
        val density = resources.displayMetrics.density
        val horizontalPadding = ((if (useCompactMode) 8 else 12) * density).toInt()
        setPaddingRelative(horizontalPadding, paddingTop, horizontalPadding, paddingBottom)
        iconPadding = ((if (useCompactMode) 4 else 8) * density).toInt()

        if (iconOnly) {
          // Centre the icon instead of leaving it at the start edge
          iconGravity = MaterialButton.ICON_GRAVITY_TEXT_START
          iconPadding = 0
        }

        applyIcon(this, segment, generation)
      }

      buttonIdToSegment[button.id] = segment
      // Share the width equally (like UISegmentedControl) so trailing segments
      // never overflow the control; long labels ellipsize instead.
      group.addView(button, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
    }

    group.addOnButtonCheckedListener { toggleGroup, checkedId, isChecked ->
      if (suppressCallbacks) return@addOnButtonCheckedListener

      if (!isChecked) {
        // In single-selection mode switching from A to B reports A as unchecked
        // before B is reported as checked; by then the group already knows B is
        // checked. Only a tap that leaves nothing checked is a real deselection.
        if (toggleGroup.checkedButtonId == View.NO_ID) {
          onSelect?.invoke(-1, "")
        }
        return@addOnButtonCheckedListener
      }

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

  /**
   * Resolves a segment's icon. Drawable names and release-bundled assets (which
   * React Native ships as drawable resources) resolve synchronously; other
   * image URIs load in the background and are applied when they arrive.
   */
  private fun applyIcon(button: MaterialButton, segment: Segment, generation: Int) {
    if (!segment.iconTinted) {
      button.iconTint = null
    }

    when (segment.iconType) {
      "drawable" -> {
        button.icon = ResourceDrawableIdHelper.getResourceDrawable(context, segment.iconName)
      }
      "image" -> {
        val uri = segment.iconUri
        val isResourceName = !uri.contains(':')
        if (isResourceName) {
          button.icon = ResourceDrawableIdHelper.getResourceDrawable(context, uri)
        } else {
          PCImageLoader.load(context, uri, segment.iconScale) { bitmap ->
            if (bitmap == null || generation != rebuildGeneration) return@load
            button.icon = BitmapDrawable(resources, bitmap)
            requestLayout()
          }
        }
      }
    }
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
