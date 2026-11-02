package com.platformcomponents

import android.content.Context
import android.util.TypedValue
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.widget.TextViewCompat
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import androidx.appcompat.R as AppCompatR
import com.google.android.material.R as MaterialR
import com.google.android.material.color.MaterialColors

/** Shared by Checkbox and RadioGroup: the error message and text styling. */
internal object PCSelectionSupport {
  // Material 3 baseline error color, used when the theme has no colorError.
  private const val FALLBACK_ERROR_COLOR = 0xFFB3261E.toInt()

  /** Applies the theme's text appearance behind [attr], if it has one. */
  fun applyTextAppearance(view: TextView, attr: Int) {
    val value = TypedValue()
    if (view.context.theme.resolveAttribute(attr, value, true) && value.resourceId != 0) {
      TextViewCompat.setTextAppearance(view, value.resourceId)
    }
  }

  fun errorColor(view: View): Int =
    MaterialColors.getColor(view.context, AppCompatR.attr.colorError, FALLBACK_ERROR_COLOR)

  /**
   * The message under a control in the error state, in the theme's error
   * color and Material's supporting-text style (Body Small), as under a
   * Material text field.
   */
  fun createErrorText(context: Context): TextView =
    TextView(context).apply {
      applyTextAppearance(this, MaterialR.attr.textAppearanceBodySmall)
      setTextColor(errorColor(this))
      visibility = View.GONE
    }
}

/**
 * Base of the Checkbox and RadioGroup host views: a vertical column of
 * Material widgets that React Native lays out at the width Yoga gives it.
 * It reports its one-line width and its height at the laid-out width to
 * Fabric (the labels wrap), lays itself out when its subtree changes, and
 * claims touches for itself, since its widgets may carry generated view ids
 * that React Native's touch handling would take for React tags.
 */
abstract class PCSelectionHostView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  /** The content, rebuilt by subclasses; null before the first build. */
  protected var column: LinearLayout? = null

  /** Lines up the error message with the labels before each measure. */
  protected open fun alignContent() {}

  override fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean = true

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int = id

  /** A fresh column replacing the old one. */
  protected fun newColumn(): LinearLayout {
    removeAllViews()
    val c = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
    addView(c, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    column = c
    return c
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
    // onLayout reports the height a new label or message gives this width
    layout(left, top, right, bottom)
  }

  // ---- Measurement ----

  private val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)

  /** The content with every label on one line. */
  private fun naturalWidth(c: View): Int {
    alignContent()
    c.measure(unspecified, unspecified)
    return c.measuredWidth
  }

  /** The content's height at [width], the labels wrapping as they need. */
  private fun contentHeight(c: View, width: Int): Int {
    alignContent()
    c.measure(MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY), unspecified)
    return c.measuredHeight
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val c = column
    if (c == null) {
      setMeasuredDimension(0, 0)
      return
    }
    val width = resolveDimension(widthMeasureSpec, naturalWidth(c))
    val height = resolveDimension(heightMeasureSpec, contentHeight(c, width))
    c.measure(
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
   * Update Fabric state with the content's one-line width and its height at
   * the width it was laid out at, so the shadow node wraps its content in
   * Yoga layout and grows taller when the labels wrap.
   */
  protected fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return
    val c = column ?: return

    val natural = naturalWidth(c)
    val fitted = if (width in 1 until natural) width else natural
    val widthDp = PixelUtil.toDIPFromPixel(natural.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(contentHeight(c, fitted).toFloat())

    // Measuring re-wraps the labels; restore the laid-out size so they are
    // placed for the bounds they are drawn in.
    if (c.width > 0 && c.height > 0) {
      c.measure(
        MeasureSpec.makeMeasureSpec(c.width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(c.height, MeasureSpec.EXACTLY)
      )
      c.layout(0, 0, c.width, c.height)
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
