package com.platformcomponents

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.util.ReactFindViewUtil
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.platformcomponents.PCNavigationBarSupport.Item
import com.platformcomponents.PCNavigationBarSupport.LabelFont

/**
 * A Material 3 navigation bar (BottomNavigationView): icons over labels, the
 * active indicator pill, badges. Selection is controlled from JS; a press
 * reports the tab and whether it was already selected.
 *
 * The bar is rebuilt for every prop that Material only reads at construction
 * or when the menu is inflated; it keeps no state of its own besides the
 * props, so a rebuild is invisible.
 */
class PCTabBarView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null
  private var lastReportedHeight: Float = -1f

  // --- Props ---
  var tabs: List<Item> = emptyList()
  var selectedValue: String = ""
  var labelVisibility: String = "auto"
  var activeTintColor: Int? = null
  var inactiveTintColor: Int? = null
  var barColor: Int? = null
  var badgeBackgroundColor: Int? = null
  var badgeTextColor: Int? = null
  var indicatorColor: Int? = null
  var rippleColor: Int? = null
  var labelFont: LabelFont = LabelFont()
  var minimizeBehavior: String = "" // "" | "automatic" | "never" | "onScrollDown" | "onScrollUp"
  var scrollViewNativeID: String = ""

  // --- Events ---
  var onTabPress: ((index: Int, value: String, reselected: Boolean) -> Unit)? = null

  // --- UI (declared before init: rebuildUI() runs from it) ---
  private var bar: BottomNavigationView? = null
  private var suppressCallbacks = false

  /** Bumped on every rebuild so late image loads can't touch a stale bar. */
  private var rebuildGeneration = 0

  // --- Native theme ---
  // Widgets read theme colors when they are created, so the bar is rebuilt
  // when the native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  init {
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  fun applyTabs(value: List<Item>) {
    if (tabs == value) return
    tabs = value
    rebuildUI()
  }

  fun applySelectedValue(value: String) {
    if (selectedValue == value) return
    selectedValue = value
    updateSelection()
  }

  fun applyLabelVisibility(value: String?) {
    val next = value ?: "auto"
    if (labelVisibility == next) return
    labelVisibility = next
    bar?.labelVisibilityMode = PCNavigationBarSupport.labelVisibilityMode(labelVisibility)
    requestLayout()
  }

  fun applyColors(active: Int?, inactive: Int?, background: Int?, indicator: Int?, ripple: Int?) {
    if (activeTintColor == active && inactiveTintColor == inactive && barColor == background &&
      indicatorColor == indicator && rippleColor == ripple
    ) return
    activeTintColor = active
    inactiveTintColor = inactive
    barColor = background
    indicatorColor = indicator
    rippleColor = ripple
    // The theme's colors are only known on a fresh bar
    rebuildUI()
  }

  fun applyBadgeColors(background: Int?, text: Int?) {
    if (badgeBackgroundColor == background && badgeTextColor == text) return
    badgeBackgroundColor = background
    badgeTextColor = text
    bar?.let { PCNavigationBarSupport.applyBadges(it, tabs, badgeBackgroundColor, badgeTextColor) }
  }

  fun applyLabelFont(value: LabelFont) {
    if (labelFont == value) return
    labelFont = value
    rebuildUI()
  }

  // ---- Hide on scroll ----
  // Android has no minimized tab bar; the Material behavior is the bar
  // sliding away while the content scrolls (HideBottomViewOnScrollBehavior),
  // with its timings. The host view moves, so React Native's touch targeting
  // follows it and the content underneath takes the touches.

  private var watchedScrollView: View? = null
  private var barHidden = false
  private val scrollViewFinder = object : ReactFindViewUtil.OnViewFoundListener {
    override fun getNativeId(): String = scrollViewNativeID
    override fun onViewFound(view: View) = watch(view)
  }

  fun applyMinimize(behavior: String, nativeID: String) {
    if (minimizeBehavior == behavior && scrollViewNativeID == nativeID) return
    val targetChanged = scrollViewNativeID != nativeID
    minimizeBehavior = behavior
    scrollViewNativeID = nativeID
    if (!hidesOnScroll) setBarHidden(false)
    if (targetChanged || watchedScrollView == null) findScrollView()
  }

  private val hidesOnScroll: Boolean
    get() = minimizeBehavior == "automatic" || minimizeBehavior == "onScrollDown" || minimizeBehavior == "onScrollUp"

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
    view.setOnScrollChangeListener { _, _, scrollY, _, oldScrollY -> onContentScrolled(scrollY, scrollY - oldScrollY) }
  }

  private fun unwatch() {
    watchedScrollView?.setOnScrollChangeListener(null)
    watchedScrollView = null
  }

  private fun onContentScrolled(scrollY: Int, dy: Int) {
    if (!hidesOnScroll || dy == 0) return
    val scrollingDown = dy > 0
    // Back at the top the bar always shows
    val hide = scrollY > 0 && if (minimizeBehavior == "onScrollUp") !scrollingDown else scrollingDown
    setBarHidden(hide)
  }

  private fun setBarHidden(hide: Boolean) {
    if (barHidden == hide) return
    barHidden = hide
    animate().cancel()
    animate()
      .translationY(if (hide) height.toFloat() else 0f)
      .setDuration(if (hide) 175L else 225L)
      .setInterpolator(
        if (hide) android.view.animation.AccelerateInterpolator() else android.view.animation.DecelerateInterpolator()
      )
      .start()
  }

  // ---- Touch ----

  // The tab views carry the menu item ids, which React Native's touch handling
  // would take for React tags. Claim the touch for this view; the tabs still
  // receive it natively.
  override fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean = true

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int = id

  // ---- Lifecycle ----

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (builtThemeVersion != PCNativeTheme.version) nativeThemeListener.onNativeThemeChanged()
    if (hidesOnScroll && watchedScrollView == null) findScrollView()
  }

  override fun onDetachedFromWindow() {
    ReactFindViewUtil.removeViewListener(scrollViewFinder)
    unwatch()
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
    val base = PCThemeSupport.materialContext(context, "TabBar")
    val b = BottomNavigationView(base).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
      labelVisibilityMode = PCNavigationBarSupport.labelVisibilityMode(labelVisibility)
    }
    // The bar pads itself for the system navigation bar when it sits at the
    // bottom of the window; here it is a control inside the app's layout,
    // which handles safe areas itself
    ViewCompat.setOnApplyWindowInsetsListener(b, null)
    b.setPadding(0, 0, 0, 0)

    PCNavigationBarSupport.populateMenu(b, tabs, isCurrent = { generation == rebuildGeneration }) {
      requestLayout()
    }

    PCNavigationBarSupport.applyColors(b, activeTintColor, inactiveTintColor, indicatorColor, rippleColor, barColor)
    // Select or reselect is decided against selectedValue: with no tab
    // selected the widget still counts its last one as selected
    b.setOnItemSelectedListener { item ->
      if (!suppressCallbacks) report(item.itemId - 1)
      // Controlled: the selection follows selectedValue once JS updates it
      post { updateSelection() }
      true
    }
    b.setOnItemReselectedListener { item ->
      if (!suppressCallbacks) report(item.itemId - 1)
    }

    addView(b)
    bar = b
    PCNavigationBarSupport.applyBadges(b, tabs, badgeBackgroundColor, badgeTextColor)
    updateSelection()
    PCNavigationBarSupport.applyTestIDsAndFonts(b, tabs, labelFont)
    requestLayout()
  }

  private fun report(index: Int) {
    if (index !in tabs.indices) return
    val value = tabs[index].value
    onTabPress?.invoke(index, value, value == selectedValue)
  }

  private fun updateSelection() {
    val b = bar ?: return
    val index = tabs.indexOfFirst { it.value == selectedValue }
    suppressCallbacks = true
    val group = b.menu
    if (index in 0 until minOf(tabs.size, b.maxItemCount)) {
      group.setGroupCheckable(android.view.Menu.NONE, true, true)
      val id = PCNavigationBarSupport.itemId(index)
      if (b.selectedItemId != id) b.selectedItemId = id
    } else {
      // No selection: nothing is checked, so no tab shows the indicator
      group.setGroupCheckable(android.view.Menu.NONE, false, true)
    }
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
    if (width == 0 || height == 0) return
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val b = bar
    if (b == null) {
      setMeasuredDimension(0, 0)
      return
    }
    val width = MeasureSpec.getSize(widthMeasureSpec).let {
      if (it > 0) it else (PCConstants.FALLBACK_WIDTH_DP * resources.displayMetrics.density).toInt()
    }
    b.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    // Keep the bar's natural height even before Yoga has caught up
    setMeasuredDimension(width, b.measuredHeight)
    reportHeight(b.measuredHeight)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val b = bar ?: return
    b.layout(0, 0, right - left, b.measuredHeight)
    // Material creates the label views as tabs are added; style any new ones
    PCNavigationBarSupport.applyTestIDsAndFonts(b, tabs, labelFont)
  }

  /** Reports the intrinsic height to Fabric; the width is left to Yoga. */
  fun reportIntrinsicSize() {
    val b = bar ?: return
    val width = if (width > 0) width else (PCConstants.FALLBACK_WIDTH_DP * resources.displayMetrics.density).toInt()
    b.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    reportHeight(b.measuredHeight)
  }

  private fun reportHeight(heightPx: Int) {
    val wrapper = stateWrapper ?: return
    val heightDp = PixelUtil.toDIPFromPixel(heightPx.toFloat())
    if (heightDp == lastReportedHeight) return
    lastReportedHeight = heightDp
    wrapper.updateState(
      WritableNativeMap().apply {
        putDouble("width", 0.0)
        putDouble("height", heightDp.toDouble())
      }
    )
  }
}
