package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.StateListDrawable
import android.util.TypedValue
import android.view.Menu
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.view.MenuItemCompat
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.util.ReactFindViewUtil
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.facebook.react.views.text.ReactTypefaceUtils
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.navigation.NavigationBarView

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

  data class Tab(
    val label: String,
    val value: String,
    val disabled: Boolean,
    val icon: PCButtonSupport.Icon,
    val selectedIcon: PCButtonSupport.Icon,
    /** "" = no badge, " " = a dot, anything else is the badge text */
    val badge: String,
    val accessibilityLabel: String,
    val testID: String
  )

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null
  private var lastReportedHeight: Float = -1f

  // --- Props ---
  var tabs: List<Tab> = emptyList()
  var selectedValue: String = ""
  var labelVisibility: String = "auto"
  var activeTintColor: Int? = null
  var inactiveTintColor: Int? = null
  var barColor: Int? = null
  var badgeBackgroundColor: Int? = null
  var badgeTextColor: Int? = null
  var indicatorColor: Int? = null
  var rippleColor: Int? = null
  var labelFontFamily: String = ""
  var labelFontSize: Float = 0f
  var labelFontWeight: String = ""
  var labelFontStyle: String = ""
  var maxFontSizeMultiplier: Float = 0f
  var minimizeBehavior: String = "" // "" | "automatic" | "never" | "onScrollDown" | "onScrollUp"
  var scrollViewNativeID: String = ""

  /** The `haptics` prop; the manager plays it with the user's action (see PCHaptics). */
  var haptics: String = ""

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

  fun applyTabs(value: List<Tab>) {
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
    bar?.labelVisibilityMode = labelVisibilityMode()
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
    bar?.let { applyBadges(it) }
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

  fun applyMaxFontSizeMultiplier(value: Float) {
    if (maxFontSizeMultiplier == value) return
    maxFontSizeMultiplier = value
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

  private fun itemId(index: Int) = index + 1

  private fun labelVisibilityMode(): Int = when (labelVisibility) {
    "labeled" -> NavigationBarView.LABEL_VISIBILITY_LABELED
    "selected" -> NavigationBarView.LABEL_VISIBILITY_SELECTED
    "unlabeled" -> NavigationBarView.LABEL_VISIBILITY_UNLABELED
    else -> NavigationBarView.LABEL_VISIBILITY_AUTO
  }

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    removeAllViews()
    rebuildGeneration += 1
    val generation = rebuildGeneration

    // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
    val base = PCThemeSupport.materialContext(context, "TabBar")
    val b = BottomNavigationView(base).apply {
      layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
      labelVisibilityMode = labelVisibilityMode()
    }
    // The bar pads itself for the system navigation bar when it sits at the
    // bottom of the window; here it is a control inside the app's layout,
    // which handles safe areas itself
    ViewCompat.setOnApplyWindowInsetsListener(b, null)
    b.setPadding(0, 0, 0, 0)

    val menu = b.menu
    val count = minOf(tabs.size, b.maxItemCount)
    for (index in 0 until count) {
      val tab = tabs[index]
      val item = menu.add(Menu.NONE, itemId(index), index, tab.label)
      item.isEnabled = !tab.disabled
      MenuItemCompat.setContentDescription(item, tab.accessibilityLabel.ifEmpty { null })
      loadTabIcon(tab, generation) { drawable -> item.icon = drawable }
    }

    styleBar(b)
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
    applyBadges(b)
    updateSelection()
    applyTestIDsAndFonts(b)
    requestLayout()
  }

  private fun report(index: Int) {
    if (index !in tabs.indices) return
    val value = tabs[index].value
    onTabPress?.invoke(index, value, value == selectedValue)
  }

  /** Colors over the theme's, read from the fresh bar for the states left unset. */
  private fun styleBar(b: BottomNavigationView) {
    val checked = intArrayOf(android.R.attr.state_checked)
    val disabled = intArrayOf(-android.R.attr.state_enabled)
    if (activeTintColor != null || inactiveTintColor != null) {
      fun tint(theme: ColorStateList?): ColorStateList {
        val base = theme ?: ColorStateList.valueOf(0xFF49454F.toInt())
        return ColorStateList(
          arrayOf(disabled, checked, intArrayOf()),
          intArrayOf(
            base.getColorForState(disabled, base.defaultColor),
            activeTintColor ?: base.getColorForState(checked, base.defaultColor),
            inactiveTintColor ?: base.defaultColor
          )
        )
      }
      b.itemIconTintList = tint(b.itemIconTintList)
      b.itemTextColor = tint(b.itemTextColor)
    }
    indicatorColor?.let { b.itemActiveIndicatorColor = ColorStateList.valueOf(it) }
    rippleColor?.let { b.itemRippleColor = ColorStateList.valueOf(it) }
    barColor?.let { b.setBackgroundColor(it) }
  }

  /** Material badges: a number, text, or a dot. */
  private fun applyBadges(b: BottomNavigationView) {
    val count = minOf(tabs.size, b.maxItemCount)
    for (index in 0 until count) {
      val tab = tabs[index]
      val id = itemId(index)
      if (tab.badge.isEmpty()) {
        b.removeBadge(id)
        continue
      }
      val badge = b.getOrCreateBadge(id)
      badge.clearNumber()
      badge.clearText()
      val number = tab.badge.trim().toIntOrNull()
      when {
        tab.badge == " " -> Unit // a dot
        number != null && number >= 0 -> badge.number = number
        else -> badge.text = tab.badge
      }
      badgeBackgroundColor?.let { badge.backgroundColor = it }
      badgeTextColor?.let { badge.badgeTextColor = it }
      badge.isVisible = true
    }
  }

  private fun updateSelection() {
    val b = bar ?: return
    val index = tabs.indexOfFirst { it.value == selectedValue }
    suppressCallbacks = true
    val group = b.menu
    if (index in 0 until minOf(tabs.size, b.maxItemCount)) {
      group.setGroupCheckable(Menu.NONE, true, true)
      if (b.selectedItemId != itemId(index)) b.selectedItemId = itemId(index)
    } else {
      // No selection: nothing is checked, so no tab shows the indicator
      group.setGroupCheckable(Menu.NONE, false, true)
    }
    suppressCallbacks = false
  }

  /**
   * testIDs on the tab views (Detox matches the view tag), and the label font
   * and font scale cap on their labels.
   */
  private fun applyTestIDsAndFonts(b: BottomNavigationView) {
    val count = minOf(tabs.size, b.maxItemCount)
    for (index in 0 until count) {
      val itemView = b.findViewById<View>(itemId(index)) ?: continue
      itemView.tag = tabs[index].testID.ifEmpty { null }
      styleLabels(itemView)
    }
  }

  private fun styleLabels(view: View) {
    if (view is TextView) {
      if (labelFontSize > 0) view.setTextSize(TypedValue.COMPLEX_UNIT_SP, labelFontSize)
      if (labelFontFamily.isNotEmpty() || labelFontWeight.isNotEmpty() || labelFontStyle.isNotEmpty()) {
        view.typeface = ReactTypefaceUtils.applyStyles(
          view.typeface,
          ReactTypefaceUtils.parseFontStyle(labelFontStyle.ifEmpty { null }),
          ReactTypefaceUtils.parseFontWeight(labelFontWeight.ifEmpty { null }),
          labelFontFamily.ifEmpty { null },
          context.assets
        )
      }
      PCThemeSupport.capTextSize(view, maxFontSizeMultiplier)
    } else if (view is ViewGroup) {
      for (i in 0 until view.childCount) styleLabels(view.getChildAt(i))
    }
  }

  /**
   * The tab's icon, and a checked-state drawable with its selected icon when
   * there is one. Drawable names and bundled assets resolve synchronously;
   * other image URIs load in the background.
   */
  private fun loadTabIcon(tab: Tab, generation: Int, apply: (Drawable?) -> Unit) {
    var normal: Drawable? = null
    var selected: Drawable? = null
    var pending = 1 + (if (tab.selectedIcon.isPresent) 1 else 0)
    fun done() {
      pending -= 1
      if (pending > 0 || generation != rebuildGeneration) return
      val sel = selected
      apply(
        if (sel == null) normal
        else StateListDrawable().apply {
          addState(intArrayOf(android.R.attr.state_checked), sel)
          normal?.let { addState(intArrayOf(), it) }
        }
      )
      requestLayout()
    }
    loadIcon(tab.icon) { normal = it; done() }
    if (tab.selectedIcon.isPresent) loadIcon(tab.selectedIcon) { selected = it; done() }
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
    applyTestIDsAndFonts(b)
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
