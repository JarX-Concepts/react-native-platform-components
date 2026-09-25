package com.platformcomponents

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.view.Gravity
import android.view.View
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.util.ReactFindViewUtil
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.R as MaterialR
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.floatingactionbutton.FloatingActionButton

/**
 * A Material floating action button: a FloatingActionButton for an icon, an
 * ExtendedFloatingActionButton with a label, which shrinks to its icon and
 * extends again with Material's own animation (`shrink()` / `extend()`),
 * driven by the `extended` prop or by a linked ScrollView.
 *
 * The widget sits at the end edge of this view, where Material places a FAB,
 * so it shrinks toward that edge. The view reports the widget's size to
 * Fabric: while the button shrinks it keeps the extended size, and it takes
 * the extended size before the button extends, so an end-anchored button
 * doesn't jump.
 */
class PCFloatingActionButtonView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null
  private var lastReportedWidth: Float = -1f
  private var lastReportedHeight: Float = -1f

  // --- Props ---
  var icon: PCButtonSupport.Icon = PCButtonSupport.NO_ICON
  var label: String = ""
  var size: String = "regular" // "small" | "regular" | "medium" | "large"
  var extended: Boolean = true
  var containerColor: Int? = null
  var foregroundColor: Int? = null
  var interactivity: String = "enabled"
  var spokenLabel: String = ""
  var scrollViewNativeID: String = ""

  /** The `haptics` prop; the manager plays it with the user's action (see PCHaptics). */
  var haptics: String = ""

  // --- Events ---
  var onPress: (() -> Unit)? = null

  // --- UI (declared before init: rebuildUI() runs from it) ---
  private var fab: FloatingActionButton? = null
  private var extendedFab: ExtendedFloatingActionButton? = null

  /** The extended button's size with its label, measured when it is built. */
  private var extendedWidth = 0
  private var extendedHeight = 0

  /** Shrunk by scrolling down the linked ScrollView. */
  private var scrollShrunk = false

  /** A shrink or extend animation is running. */
  private var resizing = false

  /** Bumped on every rebuild so late image loads can't touch a stale button. */
  private var rebuildGeneration = 0

  private val resizeListener = object : AnimatorListenerAdapter() {
    override fun onAnimationStart(animation: Animator) {
      resizing = true
    }

    // Also called after a cancel, when the opposite animation takes over
    override fun onAnimationEnd(animation: Animator) {
      resizing = false
      reportSize()
    }
  }

  // --- Native theme ---
  // Widgets read theme colors when they are created, so the button is rebuilt
  // when the native theme changes (brand color, light/dark switch).
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

  fun applyIcon(value: PCButtonSupport.Icon) {
    if (icon == value) return
    icon = value
    rebuildUI()
  }

  fun applyLabel(value: String) {
    if (label == value) return
    label = value
    rebuildUI()
  }

  fun applySize(value: String?) {
    val next = when (value) {
      "small", "medium", "large" -> value
      else -> "regular"
    }
    if (size == next) return
    size = next
    rebuildUI()
  }

  fun applyExtended(value: Boolean) {
    if (extended == value) return
    extended = value
    syncExtended(animate = true)
  }

  fun applyColors(container: Int?, foreground: Int?) {
    if (containerColor == container && foregroundColor == foreground) return
    containerColor = container
    foregroundColor = foreground
    rebuildUI()
  }

  fun applyInteractivity(value: String?) {
    val next = if (value == "disabled") "disabled" else "enabled"
    if (interactivity == next) return
    interactivity = next
    fab?.isEnabled = next == "enabled"
    extendedFab?.isEnabled = next == "enabled"
  }

  fun applySpokenLabel(value: String) {
    if (spokenLabel == value) return
    spokenLabel = value
    fab?.contentDescription = spokenLabel.ifEmpty { null }
    extendedFab?.contentDescription = spokenLabel.ifEmpty { null }
  }

  // ---- Shrink and extend ----

  private val targetExtended: Boolean
    get() = extended && !scrollShrunk

  /**
   * Brings the extended button to its target state. Material skips the change
   * while the button has no icon yet; the icon load calls this again.
   */
  private fun syncExtended(animate: Boolean) {
    val b = extendedFab ?: return
    val target = targetExtended
    if (b.isExtended == target) return
    if (animate && b.isLaidOut && isAttachedToWindow) {
      if (target) b.extend() else b.shrink()
    } else {
      b.isExtended = target
    }
    reportSize()
  }

  // ---- Scroll link ----
  // A ViewTreeObserver listener rather than the ScrollView's own scroll
  // listener, which has room for one: a TabBar may follow the same content.

  private var watchedScrollView: View? = null
  private var lastScrollY = 0
  private val scrollViewFinder = object : ReactFindViewUtil.OnViewFoundListener {
    override fun getNativeId(): String = scrollViewNativeID
    override fun onViewFound(view: View) = watch(view)
  }
  private val scrollListener = ViewTreeObserver.OnScrollChangedListener {
    val view = watchedScrollView ?: return@OnScrollChangedListener
    val scrollY = view.scrollY
    val dy = scrollY - lastScrollY
    lastScrollY = scrollY
    if (dy != 0) onContentScrolled(scrollY, dy)
  }
  private var observedTree: ViewTreeObserver? = null

  fun applyScrollViewNativeID(value: String) {
    if (scrollViewNativeID == value) return
    scrollViewNativeID = value
    findScrollView()
  }

  /** The ScrollView with scrollViewNativeID, now or once it mounts. */
  private fun findScrollView() {
    unwatch()
    ReactFindViewUtil.removeViewListener(scrollViewFinder)
    if (scrollViewNativeID.isEmpty() || !isAttachedToWindow) return
    val found = ReactFindViewUtil.findView(rootView, scrollViewNativeID)
    if (found != null) watch(found) else ReactFindViewUtil.addViewListener(scrollViewFinder)
  }

  private fun watch(view: View) {
    ReactFindViewUtil.removeViewListener(scrollViewFinder)
    unwatch()
    watchedScrollView = view
    lastScrollY = view.scrollY
    observedTree = viewTreeObserver.also { it.addOnScrollChangedListener(scrollListener) }
  }

  /** Stops following the ScrollView; a button it shrank extends again. */
  private fun unwatch(animate: Boolean = true) {
    observedTree?.takeIf { it.isAlive }?.removeOnScrollChangedListener(scrollListener)
    observedTree = null
    watchedScrollView = null
    if (scrollShrunk) {
      scrollShrunk = false
      syncExtended(animate)
    }
  }

  private fun onContentScrolled(scrollY: Int, dy: Int) {
    // Shrink scrolling down; extend scrolling up, and always at the top
    val shrink = scrollY > 0 && dy > 0
    if (scrollShrunk == shrink) return
    scrollShrunk = shrink
    syncExtended(animate = true)
  }

  // ---- Touch ----

  // Claim the touch for this view in React Native's touch handling; the
  // button still receives it natively.
  override fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean = true

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int = id

  // ---- Lifecycle ----

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (builtThemeVersion != PCNativeTheme.version) nativeThemeListener.onNativeThemeChanged()
    if (watchedScrollView == null) findScrollView()
  }

  override fun onDetachedFromWindow() {
    ReactFindViewUtil.removeViewListener(scrollViewFinder)
    unwatch(animate = false)
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  // ---- UI Building ----

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    removeAllViews()
    fab = null
    extendedFab = null
    resizing = false
    rebuildGeneration += 1
    val generation = rebuildGeneration

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "FloatingActionButton")
    if (label.isEmpty()) buildFab(base, generation) else buildExtendedFab(base, generation)
    requestLayout()
    reportSize()
  }

  private fun endLayoutParams() =
    LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.END or Gravity.CENTER_VERTICAL)

  /** The theme's FAB style for the size: Material 3 small, regular and large, the Expressive medium. */
  private fun fabStyleAttr(): Int = when (size) {
    "small" -> MaterialR.attr.floatingActionButtonSmallStyle
    "medium" -> MaterialR.attr.floatingActionButtonMediumStyle
    "large" -> MaterialR.attr.floatingActionButtonLargeStyle
    else -> MaterialR.attr.floatingActionButtonStyle
  }

  /** Extended FABs come in three sizes; `small` and `regular` share the 56dp one. */
  private fun extendedStyleAttr(): Int = when (size) {
    "medium" -> MaterialR.attr.extendedFloatingActionButtonMediumStyle
    "large" -> MaterialR.attr.extendedFloatingActionButtonLargeStyle
    else -> MaterialR.attr.extendedFloatingActionButtonSmallStyle
  }

  private fun buildFab(base: Context, generation: Int) {
    val f = FloatingActionButton(base, null, fabStyleAttr()).apply {
      contentDescription = spokenLabel.ifEmpty { null }
      isEnabled = interactivity == "enabled"
      setOnClickListener { onPress?.invoke() }
    }
    containerColor?.let { f.backgroundTintList = keepDisabled(it, f.backgroundTintList) }
    if (!icon.tinted) {
      f.setSupportImageTintList(null)
    } else {
      foregroundColor?.let { f.setSupportImageTintList(keepDisabled(it, f.supportImageTintList)) }
    }
    loadIcon(icon) { drawable ->
      if (generation != rebuildGeneration) return@loadIcon
      f.setImageDrawable(drawable)
    }
    addView(f, endLayoutParams())
    fab = f
  }

  private fun buildExtendedFab(base: Context, generation: Int) {
    val b = ExtendedFloatingActionButton(base, null, extendedStyleAttr()).apply {
      text = label
      isAllCaps = false
      maxLines = 1
      contentDescription = spokenLabel.ifEmpty { null }
      isEnabled = interactivity == "enabled"
      setOnClickListener { onPress?.invoke() }
    }
    PCButtonSupport.applyIcon(b, icon, { generation == rebuildGeneration }) {
      // A late icon: measure the label again, and shrink if that was waiting
      if (b.isExtended && !resizing) measureExtended(b)
      syncExtended(animate = false)
      requestLayout()
      reportSize()
    }
    PCButtonSupport.applyColors(b, containerColor, foregroundColor, null, null, icon.tinted)
    // In its parent before Material changes the layout params to shrink it
    addView(b, endLayoutParams())
    measureExtended(b)
    b.addOnShrinkAnimationListener(resizeListener)
    b.addOnExtendAnimationListener(resizeListener)
    extendedFab = b
    // The built button is extended; shrink it now when it shouldn't be
    if (!targetExtended) b.isExtended = false
  }

  /**
   * The extended button's natural size. A detached TextView can't resolve an
   * inherited layout direction, and then leaves its relative (start) icon out
   * of the measured width, so it is measured with an explicit direction.
   */
  private fun measureExtended(b: ExtendedFloatingActionButton) {
    val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    val direction = b.layoutDirection
    if (!b.isAttachedToWindow) b.layoutDirection = View.LAYOUT_DIRECTION_LOCALE
    b.measure(unspecified, unspecified)
    extendedWidth = b.measuredWidth
    extendedHeight = b.measuredHeight
    b.layoutDirection = direction
  }

  /** A color for the enabled state, keeping the style's disabled color. */
  private fun keepDisabled(color: Int, theme: ColorStateList?): ColorStateList {
    val disabled = intArrayOf(-android.R.attr.state_enabled)
    return ColorStateList(
      arrayOf(disabled, intArrayOf()),
      intArrayOf(theme?.getColorForState(disabled, color) ?: color, color)
    )
  }

  private fun loadIcon(icon: PCButtonSupport.Icon, onLoaded: (Drawable?) -> Unit) {
    when (icon.type) {
      "drawable" -> onLoaded(ResourceDrawableIdHelper.instance.getResourceDrawable(context, icon.name))
      "image" -> {
        val uri = icon.uri
        if (!uri.contains(':')) {
          onLoaded(ResourceDrawableIdHelper.instance.getResourceDrawable(context, uri))
        } else {
          PCImageLoader.load(context, uri, icon.scale) { bitmap ->
            onLoaded(bitmap?.let { BitmapDrawable(resources, it) })
          }
        }
      }
      else -> onLoaded(null)
    }
  }

  // ---- Layout ----

  private var manualLayoutPending = false

  /**
   * React Native's root view ignores requestLayout after the initial pass, so
   * a native view that changes its own subtree later (a rebuild, the extended
   * button animating its width) has to measure and lay itself out. Coalesced
   * to one pass per frame.
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

  /**
   * The size the view takes: the button's own, except that while it shrinks
   * the view keeps the extended size.
   */
  private fun naturalSize(): Pair<Int, Int> {
    fab?.let { f ->
      val unspecified = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      f.measure(unspecified, unspecified)
      return f.measuredWidth to f.measuredHeight
    }
    val b = extendedFab ?: return 0 to 0
    if (b.isExtended || resizing) return extendedWidth to extendedHeight
    return b.collapsedSize to b.collapsedSize
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val child = fab ?: extendedFab
    if (child == null) {
      setMeasuredDimension(0, 0)
      return
    }
    val (naturalWidth, naturalHeight) = naturalSize()
    val width = resolveDimension(widthMeasureSpec, naturalWidth)
    val height = resolveDimension(heightMeasureSpec, naturalHeight)
    // The button by its own layout params, which Material animates
    measureChild(
      child,
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
    reportSize()
  }

  /** Reports the size to Fabric; called as soon as the state wrapper is available. */
  fun reportIntrinsicSize() = reportSize()

  private fun reportSize() {
    val wrapper = stateWrapper ?: return
    if (fab == null && extendedFab == null) return
    val (widthPx, heightPx) = naturalSize()
    val widthDp = PixelUtil.toDIPFromPixel(widthPx.toFloat())
    val heightDp = PixelUtil.toDIPFromPixel(heightPx.toFloat())
    if (widthDp == lastReportedWidth && heightDp == lastReportedHeight) return
    lastReportedWidth = widthDp
    lastReportedHeight = heightDp
    wrapper.updateState(
      WritableNativeMap().apply {
        putDouble("width", widthDp.toDouble())
        putDouble("height", heightDp.toDouble())
      }
    )
  }
}
