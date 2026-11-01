package com.platformcomponents

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import com.google.android.material.loadingindicator.LoadingIndicator
import com.google.android.material.progressindicator.BaseProgressIndicator
import com.google.android.material.progressindicator.CircularProgressIndicator
import com.google.android.material.progressindicator.LinearProgressIndicator
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * A Material 3 progress indicator:
 *
 * - `linear`: `LinearProgressIndicator`, or one per segment in a row.
 * - `circular`: `CircularProgressIndicator`.
 * - `loading`: the Material 3 Expressive `LoadingIndicator`.
 *
 * `wavy` gives the linear and circular indicators the Expressive wave, with
 * the amplitude and wavelengths of the Material 3 Expressive wavy styles.
 *
 * This view carries the testID, accessibility label and value (React
 * Native's props), and the Material widgets inside are hidden from
 * accessibility. The widgets are rebuilt when a prop they read at
 * construction changes; progress updates go to the existing widgets, so
 * they animate.
 */
class PCProgressIndicatorView(context: Context) : FrameLayout(context) {

  // --- Props (declared above init, which builds the first widgets) ---
  var variant: String = "linear" // "linear" | "circular" | "loading"
  var progress: Double = -1.0 // 0..1; negative = indeterminate
  var indicatorColor: Int? = null
  var trackColor: Int? = null
  var size: String = "" // "small" | "large" | "" (large)
  var segments: Int = 0
  var wavy: Boolean = false

  // --- UI ---
  private var bars: List<LinearProgressIndicator> = emptyList()
  private var circular: CircularProgressIndicator? = null
  private var loading: LoadingIndicator? = null

  /** What the current widgets were built for; a change rebuilds them. */
  private var builtKey: String? = null

  // --- Native theme ---
  // Widgets read theme colors when they are created, so they are rebuilt when the
  // native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    builtKey = null
    commit()
  }

  private var manualLayoutPending = false

  init {
    clipChildren = false
    clipToPadding = false
    commit()
  }

  private val indeterminate: Boolean
    get() = progress < 0 || variant == "loading"

  private fun dp(value: Float): Int = (value * resources.displayMetrics.density).roundToInt()

  /** Applies the props set since the last commit. */
  fun commit() {
    val key = buildKey()
    val rebuilt = key != builtKey
    if (rebuilt) {
      rebuild()
      builtKey = key
    }
    // A value change animates, except right after the widgets were built
    applyProgress(animated = !rebuilt && isAttachedToWindow)
  }

  private fun buildKey(): String =
    when (variant) {
      "loading" -> "loading|$indicatorColor|$trackColor"
      "circular" -> "circular|$size|$wavy|$indicatorColor|$trackColor"
      else -> {
        val count = if (indeterminate) 1 else segments.coerceAtLeast(1)
        "linear|$count|$wavy|$indicatorColor|$trackColor"
      }
    }

  private fun rebuild() {
    builtThemeVersion = PCNativeTheme.version
    removeAllViews()
    bars = emptyList()
    circular = null
    loading = null

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "ProgressIndicator")
    when (variant) {
      "loading" -> {
        val view = LoadingIndicator(base)
        indicatorColor?.let { view.setIndicatorColor(it) }
        trackColor?.let { view.containerColor = it }
        add(view)
        loading = view
      }
      "circular" -> {
        val view = CircularProgressIndicator(base)
        configure(view)
        if (size == "small") {
          // Material's ExtraSmall circular indicator
          view.trackThickness = dp(2.5f)
          view.indicatorInset = dp(2f)
          view.indicatorTrackGapSize = dp(2f)
        }
        if (wavy) {
          view.waveAmplitude = dp(1.6f)
          view.setWavelength(dp(15f))
          // The Expressive style's indeterminate animation
          view.indeterminateAnimationType = CircularProgressIndicator.INDETERMINATE_ANIMATION_TYPE_RETREAT
          // The wavy style fills the whole 48dp, with no inset
          if (size != "small") view.indicatorInset = 0
        }
        add(view)
        circular = view
      }
      else -> {
        val count = if (indeterminate) 1 else segments.coerceAtLeast(1)
        bars = List(count) {
          LinearProgressIndicator(base).also { bar ->
            configure(bar)
            bar.indicatorDirection = LinearProgressIndicator.INDICATOR_DIRECTION_START_TO_END
            if (wavy) {
              bar.waveAmplitude = dp(3f)
              bar.wavelengthDeterminate = dp(40f)
              bar.wavelengthIndeterminate = dp(20f)
            }
            add(bar)
          }
        }
      }
    }
    requestLayout()
  }

  private fun configure(view: BaseProgressIndicator<*>) {
    view.max = MAX
    view.isIndeterminate = indeterminate
    indicatorColor?.let { view.setIndicatorColor(it) }
    trackColor?.let { view.trackColor = it }
  }

  private fun add(view: View) {
    view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
    addView(view, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
  }

  private fun applyProgress(animated: Boolean) {
    val indicators: List<BaseProgressIndicator<*>> = bars.ifEmpty { listOfNotNull(circular) }
    if (indicators.isEmpty()) return
    if (indeterminate) {
      indicators.forEach { if (!it.isIndeterminate) it.isIndeterminate = true }
      return
    }
    val value = progress.coerceIn(0.0, 1.0)
    val count = indicators.size
    indicators.forEachIndexed { index, indicator ->
      // Segment i covers i/count ..< (i+1)/count
      val fill = (value * count - index).coerceIn(0.0, 1.0)
      val target = (fill * MAX).roundToInt()
      // On an indeterminate indicator this finishes the current cycle and
      // then switches to determinate (Material's own transition)
      if (indicator.isIndeterminate || indicator.progress != target) {
        indicator.setProgressCompat(target, animated)
      }
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

  // ---- Layout ----
  // Fabric sizes this view; the widgets are placed inside it here.

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
    if (width == 0 || height == 0) return
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  private val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)

  private fun exactly(px: Int) = MeasureSpec.makeMeasureSpec(px.coerceAtLeast(0), MeasureSpec.EXACTLY)

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val width = MeasureSpec.getSize(widthMeasureSpec)
    val height = MeasureSpec.getSize(heightMeasureSpec)
    setMeasuredDimension(width, height)

    if (bars.isNotEmpty()) {
      val barWidth = segmentWidth(width)
      bars.forEach { bar ->
        bar.measure(exactly(barWidth), unspecified)
      }
    }
    circular?.let { view ->
      // The ring fills the view: a style size other than the named size's
      // resizes it, keeping the size's track thickness
      val side = min(width, height)
      val ring = side - 2 * view.indicatorInset
      if (ring > 0 && view.indicatorSize != ring) view.indicatorSize = ring
      view.measure(exactly(side), exactly(side))
    }
    loading?.let { view ->
      // Material's 48dp container holds a 34dp shape (the default style);
      // a style size scales both
      val side = min(width, height)
      if (side > 0 && view.containerWidth != side) {
        view.containerWidth = side
        view.containerHeight = side
        view.indicatorSize = (side * INDICATOR_TO_CONTAINER).roundToInt()
      }
      view.measure(exactly(side), exactly(side))
    }
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val width = right - left
    val height = bottom - top
    if (bars.isNotEmpty()) {
      val barWidth = segmentWidth(width)
      val gap = if (bars.size > 1) dp(SEGMENT_GAP_DP) else 0
      val rtl = layoutDirection == View.LAYOUT_DIRECTION_RTL
      bars.forEachIndexed { index, bar ->
        val offset = index * (barWidth + gap)
        val x = if (rtl) width - offset - barWidth else offset
        val y = (height - bar.measuredHeight) / 2
        bar.layout(x, y, x + barWidth, y + bar.measuredHeight)
      }
    }
    listOfNotNull<View>(circular, loading).forEach { view ->
      val x = (width - view.measuredWidth) / 2
      val y = (height - view.measuredHeight) / 2
      view.layout(x, y, x + view.measuredWidth, y + view.measuredHeight)
    }
  }

  private fun segmentWidth(width: Int): Int {
    val count = bars.size
    val gap = if (count > 1) dp(SEGMENT_GAP_DP) else 0
    return ((width - gap * (count - 1)) / count).coerceAtLeast(0)
  }

  companion object {
    /** Progress resolution: the widgets' max. */
    private const val MAX = 1000

    /** Gap between the segments of a segmented bar. */
    private const val SEGMENT_GAP_DP = 4f

    /** Widget.Material3.LoadingIndicator: a 34dp indicator in a 48dp container. */
    private const val INDICATOR_TO_CONTAINER = 34f / 48f
  }
}
