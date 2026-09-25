package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.view.View
import android.view.ViewTreeObserver
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import androidx.core.content.res.ResourcesCompat
import com.facebook.react.uimanager.util.ReactFindViewUtil
import com.google.android.material.R as MaterialR
import com.google.android.material.color.MaterialColors
import com.google.android.material.floatingtoolbar.FloatingToolbarLayout
import com.google.android.material.shape.MaterialShapeDrawable

/**
 * A Material 3 floating toolbar. The Material container (shape, elevation,
 * color) hosts React children, which Fabric lays out itself.
 */
class PCFloatingToolbarView(context: Context) :
  FloatingToolbarLayout(
    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    PCThemeSupport.materialContext(context, "FloatingToolbar"),
    null,
    0,
    R.style.PCFloatingToolbar
  ) {

  companion object {
    private const val TAG = "PCFloatingToolbar"
  }

  // --- Props ---
  var variant: String = "standard" // "standard" | "vibrant"
  var color: Int? = null

  /** The button overlay for Buttons inside this toolbar (see PCButtonView). */
  val buttonOverlay: Int
    get() = if (variant == "vibrant") R.style.PCToolbarOverlay_Vibrant else R.style.PCToolbarOverlay

  // --- Native theme ---
  private val nativeThemeListener = PCNativeTheme.Listener {
    ResourcesCompat.clearCachesForTheme(context.theme)
    applyColors()
  }

  // --- Linked scroll view ---
  var scrollViewNativeID: String = ""
  var hideOnScroll: Boolean = false
  private var watchedScrollView: View? = null
  private var watchedObserver: ViewTreeObserver? = null
  private var lastScrollY = 0
  private var scrollHidden = false
  private val scrollViewFinder = object : ReactFindViewUtil.OnViewFoundListener {
    override fun getNativeId(): String = scrollViewNativeID
    override fun onViewFound(view: View) = watch(view)
  }
  // A tree observer rather than the view's own scroll listener, which a
  // TabBar linked to the same ScrollView would replace
  private val scrollListener = ViewTreeObserver.OnScrollChangedListener {
    val view = watchedScrollView ?: return@OnScrollChangedListener
    val scrollY = view.scrollY
    val dy = scrollY - lastScrollY
    lastScrollY = scrollY
    onContentScrolled(scrollY, dy)
  }

  init {
    clipChildren = false
    clipToPadding = false
    applyColors()
  }

  // ---- Public apply* (called by manager) ----

  fun applyVariant(value: String?) {
    val parsed = if (value == "vibrant") "vibrant" else "standard"
    if (variant == parsed) return
    variant = parsed
    applyColors()
    // Buttons inside take the toolbar's button styles
    for (i in 0 until childCount) {
      (getChildAt(i) as? PCButtonView)?.refreshToolbarStyle()
    }
  }

  fun applyColor(value: Int?) {
    if (color == value) return
    color = value
    applyColors()
  }

  /**
   * A `backgroundColor` style would replace the Material shape; route it into
   * the color instead. React Native resets it with transparent.
   */
  override fun setBackgroundColor(color: Int) {
    applyColor(if (color == Color.TRANSPARENT) null else color)
  }

  private fun applyColors() {
    val resolved = color ?: MaterialColors.getColor(
      this,
      if (variant == "vibrant") MaterialR.attr.colorPrimaryContainer else MaterialR.attr.colorSurfaceContainer,
      Color.TRANSPARENT
    )
    val shape = background as? MaterialShapeDrawable
    if (shape != null) {
      shape.fillColor = ColorStateList.valueOf(resolved)
    } else {
      backgroundTintList = ColorStateList.valueOf(resolved)
    }
  }

  // ---- Hide on scroll ----
  // Material's HideViewOnScrollBehavior only works in a CoordinatorLayout,
  // which a React Native screen doesn't have. The toolbar does its motion
  // itself, as TabBar does: it slides past its edge of the linked ScrollView
  // (175 ms out, 225 ms back) while the content scrolls down, and returns as
  // it scrolls up or reaches the top. The host view moves, so React Native's
  // touch targeting follows it and the content underneath takes the touches.

  fun applyScrollViewNativeID(value: String) {
    if (scrollViewNativeID == value) return
    scrollViewNativeID = value
    findScrollView()
  }

  fun applyHideOnScroll(value: Boolean) {
    if (hideOnScroll == value) return
    hideOnScroll = value
    if (!value) setScrollHidden(false)
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
    watchedObserver = view.viewTreeObserver.also { it.addOnScrollChangedListener(scrollListener) }
  }

  private fun unwatch() {
    watchedObserver?.takeIf { it.isAlive }?.removeOnScrollChangedListener(scrollListener)
    watchedObserver = null
    watchedScrollView = null
    if (scrollHidden) {
      scrollHidden = false
      animate().cancel()
      translationX = 0f
      translationY = 0f
    }
  }

  private fun onContentScrolled(scrollY: Int, dy: Int) {
    if (!hideOnScroll || dy == 0) return
    // Back at the top the toolbar always shows
    setScrollHidden(scrollY > 0 && dy > 0)
  }

  private fun setScrollHidden(hide: Boolean) {
    if (scrollHidden == hide) return
    scrollHidden = hide
    val (dx, dy) = if (hide) hiddenTranslation() else 0f to 0f
    animate().cancel()
    animate()
      .translationX(dx)
      .translationY(dy)
      .setDuration(if (hide) 175L else 225L)
      .setInterpolator(if (hide) AccelerateInterpolator() else DecelerateInterpolator())
      .start()
  }

  /**
   * How far to move to get past the linked edge: top or bottom for a
   * horizontal toolbar, left or right for a vertical one, from the toolbar to
   * that edge of the ScrollView plus the elevation shadow, and at least the
   * toolbar's own size.
   */
  private fun hiddenTranslation(): Pair<Float, Float> {
    val scrollView = watchedScrollView ?: return 0f to 0f
    val here = IntArray(2).also { getLocationInWindow(it) }
    val there = IntArray(2).also { scrollView.getLocationInWindow(it) }
    // Where the toolbar sits without the translation it may have
    val left = here[0] - translationX
    val top = here[1] - translationY
    val right = left + width
    val bottom = top + height
    val scrollLeft = there[0].toFloat()
    val scrollTop = there[1].toFloat()
    val scrollRight = scrollLeft + scrollView.width
    val scrollBottom = scrollTop + scrollView.height
    val shadow = elevation
    return if (width >= height) {
      if (top + bottom < scrollTop + scrollBottom) {
        0f to minOf(scrollTop - bottom - shadow, -height.toFloat())
      } else {
        0f to maxOf(scrollBottom - top + shadow, height.toFloat())
      }
    } else {
      if (left + right < scrollLeft + scrollRight) {
        minOf(scrollLeft - right - shadow, -width.toFloat()) to 0f
      } else {
        maxOf(scrollRight - left + shadow, width.toFloat()) to 0f
      }
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (watchedScrollView == null) findScrollView()
  }

  override fun onDetachedFromWindow() {
    ReactFindViewUtil.removeViewListener(scrollViewFinder)
    unwatch()
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  // ---- Layout ----
  // Fabric sizes this view and positions its children; FrameLayout must not
  // re-measure or re-position them against its own padding and gravity.

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(
      MeasureSpec.getSize(widthMeasureSpec),
      MeasureSpec.getSize(heightMeasureSpec)
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // No-op: Fabric lays out the children
  }
}
