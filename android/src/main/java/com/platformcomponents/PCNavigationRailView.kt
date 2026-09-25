package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Rect
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.StateListDrawable
import android.util.TypedValue
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.Menu
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.view.MenuItemCompat
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.facebook.react.views.text.ReactTypefaceUtils
import com.google.android.material.R as MaterialR
import com.google.android.material.navigation.NavigationBarView
import com.google.android.material.navigationrail.NavigationRailView

/**
 * A Material 3 Expressive navigation rail (NavigationRailView): destinations
 * with the active indicator and badges, an optional header (the React
 * `header`, in the rail's header slot), `menuGravity`, and the expanded rail.
 * Selection is controlled from JS; a press reports the destination and
 * whether it was already selected.
 *
 * The rail takes its natural width, which is reported to Fabric (the shadow
 * node turns it into padding, see shared/); the app gives it its height. The
 * rail is rebuilt for every prop Material only reads at construction or when
 * the menu is inflated.
 */
class PCNavigationRailView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  data class Item(
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
  private var lastReportedWidth: Float = -1f

  // --- Props ---
  var items: List<Item> = emptyList()
  var selectedValue: String = ""
  var labelVisibility: String = "auto"
  var menuGravity: String = "top"
  var expanded: Boolean = false
  var activeTintColor: Int? = null
  var inactiveTintColor: Int? = null
  var railColor: Int? = null
  var badgeBackgroundColor: Int? = null
  var badgeTextColor: Int? = null
  var indicatorColor: Int? = null
  var rippleColor: Int? = null
  var labelFontFamily: String = ""
  var labelFontSize: Float = 0f
  var labelFontWeight: String = ""
  var labelFontStyle: String = ""
  var maxFontSizeMultiplier: Float = 0f

  // --- Events ---
  var onItemPress: ((index: Int, value: String, reselected: Boolean) -> Unit)? = null

  // --- UI (declared before init: rebuildUI() runs from it) ---
  private var rail: Rail? = null
  private var suppressCallbacks = false

  /** The React header, laid out by this view inside the rail's header slot. */
  private var headerChild: View? = null
  private val headerContainer = HeaderContainer(context)

  /** Bumped on every rebuild so late image loads can't touch a stale rail. */
  private var rebuildGeneration = 0

  // --- Native theme ---
  // Widgets read theme colors when they are created, so the rail is rebuilt
  // when the native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  /**
   * Lays the rail out again when React resizes the header: Fabric measures
   * the header but leaves its layout to this view.
   */
  private val headerSizeWatcher = ViewTreeObserver.OnPreDrawListener {
    val child = headerChild
    if (child != null && headerContainer.parent != null &&
      (child.measuredWidth != headerContainer.width || child.measuredHeight != headerContainer.height)
    ) {
      // Through the container, so every view up to the rail measures again
      headerContainer.requestLayout()
    }
    true
  }

  init {
    clipChildren = false
    clipToPadding = false
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  fun applyItems(value: List<Item>) {
    if (items == value) return
    val badgesOnly = items.size == value.size &&
      items.zip(value).all { (old, new) -> old.copy(badge = new.badge) == new }
    items = value
    // A new count needs no new rail (nor a TalkBack announcement of its state)
    val r = rail
    if (badgesOnly && r != null) applyBadges(r) else rebuildUI()
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
    rail?.labelVisibilityMode = labelVisibilityMode()
    requestLayout()
  }

  fun applyMenuGravity(value: String?) {
    val next = value ?: "top"
    if (menuGravity == next) return
    menuGravity = next
    rail?.menuGravity = gravity()
    requestLayout()
  }

  fun applyExpanded(value: Boolean) {
    if (expanded == value) return
    expanded = value
    val r = rail ?: return
    // Material animates the change once the rail is laid out
    if (value) r.expand() else r.collapse()
  }

  fun applyColors(active: Int?, inactive: Int?, background: Int?, indicator: Int?, ripple: Int?) {
    if (activeTintColor == active && inactiveTintColor == inactive && railColor == background &&
      indicatorColor == indicator && rippleColor == ripple
    ) return
    activeTintColor = active
    inactiveTintColor = inactive
    railColor = background
    indicatorColor = indicator
    rippleColor = ripple
    // The theme's colors are only known on a fresh rail
    rebuildUI()
  }

  fun applyBadgeColors(background: Int?, text: Int?) {
    if (badgeBackgroundColor == background && badgeTextColor == text) return
    badgeBackgroundColor = background
    badgeTextColor = text
    rail?.let { applyBadges(it) }
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

  // ---- Header ----

  /** The React header view (the NavigationRail's `header`), or null. */
  fun setHeaderChild(child: View?) {
    if (headerChild === child) return
    headerChild?.let { headerContainer.removeView(it) }
    headerChild = child
    if (child != null) headerContainer.addView(child)
    attachHeader(rail)
    headerContainer.requestLayout()
    requestLayout()
  }

  fun headerView(): View? = headerChild

  private fun attachHeader(r: Rail?) {
    val current = r?.headerView
    if (headerChild == null) {
      if (current != null) r?.removeHeaderView()
      return
    }
    if (r == null || current === headerContainer) return
    (headerContainer.parent as? ViewGroup)?.removeView(headerContainer)
    r.addHeaderView(headerContainer)
  }

  /**
   * Holds the React header in the rail's header slot at the size React gave
   * it; the rail places it (centered at the top, above the destinations).
   */
  private class HeaderContainer(context: Context) : FrameLayout(context) {
    init {
      clipChildren = false
      clipToPadding = false
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
      val child = if (childCount > 0) getChildAt(0) else null
      // React measured the header; keep its size
      setMeasuredDimension(child?.measuredWidth ?: 0, child?.measuredHeight ?: 0)
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
      val child = if (childCount > 0) getChildAt(0) else return
      child.layout(0, 0, child.measuredWidth, child.measuredHeight)
    }
  }

  // ---- Touch ----

  // The destinations carry the menu item ids, which React Native's touch
  // handling would take for React tags. Claim the touch for this view, except
  // on the header, whose React views take their own touches; the rail still
  // receives it natively.
  override fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean {
    if (headerChild == null || headerContainer.parent == null) return true
    val bounds = Rect()
    headerContainer.getDrawingRect(bounds)
    offsetDescendantRectToMyCoords(headerContainer, bounds)
    return !bounds.contains(touchX.toInt(), touchY.toInt())
  }

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int = id

  // ---- Lifecycle ----

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    viewTreeObserver.addOnPreDrawListener(headerSizeWatcher)
    if (builtThemeVersion != PCNativeTheme.version) nativeThemeListener.onNativeThemeChanged()
  }

  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnPreDrawListener(headerSizeWatcher)
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  // ---- UI Building ----

  private fun itemId(index: Int) = index + 1

  private fun labelVisibilityMode(): Int = when (labelVisibility) {
    "selected" -> NavigationBarView.LABEL_VISIBILITY_SELECTED
    "unlabeled" -> NavigationBarView.LABEL_VISIBILITY_UNLABELED
    // The rail labels every destination by default
    else -> NavigationBarView.LABEL_VISIBILITY_LABELED
  }

  private fun gravity(): Int = when (menuGravity) {
    "center" -> Gravity.CENTER
    "bottom" -> Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
    else -> Gravity.TOP or Gravity.CENTER_HORIZONTAL
  }

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    rail?.let { old ->
      if (old.headerView != null) old.removeHeaderView()
    }
    removeAllViews()
    rebuildGeneration += 1
    val generation = rebuildGeneration

    // Material widgets need a Material theme; fall back to Material 3 defaults
    // instead of crashing. The overlay picks the Expressive rail style.
    // A rail built expanded starts expanded, without animating or announcing it
    val base = ContextThemeWrapper(
      PCThemeSupport.materialContext(context, "NavigationRail"),
      if (expanded) R.style.PCNavigationRailOverlay_Expanded else R.style.PCNavigationRailOverlay
    )
    val r = Rail(base) { reportWidth(it) }
    r.labelVisibilityMode = labelVisibilityMode()
    r.menuGravity = gravity()
    // The rail pads itself for the system bars when it sits at the window's
    // edge; here it is a control inside the app's layout, which handles safe
    // areas itself
    ViewCompat.setOnApplyWindowInsetsListener(r, null)
    r.setPadding(0, 0, 0, 0)

    val menu = r.menu
    for ((index, item) in items.withIndex()) {
      val menuItem = menu.add(Menu.NONE, itemId(index), index, item.label)
      menuItem.isEnabled = !item.disabled
      MenuItemCompat.setContentDescription(menuItem, item.accessibilityLabel.ifEmpty { null })
      loadItemIcon(item, generation) { drawable -> menuItem.icon = drawable }
    }

    styleRail(r)
    // Select or reselect is decided against selectedValue: with nothing
    // selected the widget still counts its last destination as selected
    r.setOnItemSelectedListener { menuItem ->
      if (!suppressCallbacks) report(menuItem.itemId - 1)
      // Controlled: the selection follows selectedValue once JS updates it
      post { updateSelection() }
      true
    }
    r.setOnItemReselectedListener { menuItem ->
      if (!suppressCallbacks) report(menuItem.itemId - 1)
    }

    addView(r, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT))
    rail = r
    attachHeader(r)
    applyBadges(r)
    updateSelection()
    applyTestIDsAndFonts(r)
    requestLayout()
    reportIntrinsicSize()
  }

  private fun report(index: Int) {
    if (index !in items.indices) return
    val value = items[index].value
    onItemPress?.invoke(index, value, value == selectedValue)
  }

  /** Colors over the theme's, read from the fresh rail for the states left unset. */
  private fun styleRail(r: NavigationRailView) {
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
      r.itemIconTintList = tint(r.itemIconTintList)
      r.itemTextColor = tint(r.itemTextColor)
    }
    indicatorColor?.let { r.itemActiveIndicatorColor = ColorStateList.valueOf(it) }
    rippleColor?.let { r.itemRippleColor = ColorStateList.valueOf(it) }
    railColor?.let { r.setBackgroundColor(it) }
  }

  /** Material badges: a number, text, or a dot. */
  private fun applyBadges(r: NavigationRailView) {
    for ((index, item) in items.withIndex()) {
      val id = itemId(index)
      if (item.badge.isEmpty()) {
        r.removeBadge(id)
        continue
      }
      val badge = r.getOrCreateBadge(id)
      badge.clearNumber()
      badge.clearText()
      val number = item.badge.trim().toIntOrNull()
      when {
        item.badge == " " -> Unit // a dot
        number != null && number >= 0 -> badge.number = number
        else -> badge.text = item.badge
      }
      badgeBackgroundColor?.let { badge.backgroundColor = it }
      badgeTextColor?.let { badge.badgeTextColor = it }
      badge.isVisible = true
    }
  }

  private fun updateSelection() {
    val r = rail ?: return
    val index = items.indexOfFirst { it.value == selectedValue }
    suppressCallbacks = true
    val group = r.menu
    if (index in items.indices) {
      group.setGroupCheckable(Menu.NONE, true, true)
      if (r.selectedItemId != itemId(index)) r.selectedItemId = itemId(index)
    } else {
      // No selection: nothing is checked, so no destination shows the indicator
      group.setGroupCheckable(Menu.NONE, false, true)
    }
    suppressCallbacks = false
  }

  /**
   * testIDs on the destination views (Detox matches the view tag), and the
   * label font and font scale cap on their labels.
   */
  private fun applyTestIDsAndFonts(r: NavigationRailView) {
    // In the menu view only: the header's React views carry React tags as
    // ids, which can equal a destination's id
    val menuView = r.menuView as? ViewGroup ?: return
    for (index in items.indices) {
      val itemView = menuView.findViewById<View>(itemId(index)) ?: continue
      itemView.tag = items[index].testID.ifEmpty { null }
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
   * The destination's icon, and a checked-state drawable with its selected
   * icon when there is one. Drawable names and bundled assets resolve
   * synchronously; other image URIs load in the background.
   */
  private fun loadItemIcon(item: Item, generation: Int, apply: (Drawable?) -> Unit) {
    var normal: Drawable? = null
    var selected: Drawable? = null
    var pending = 1 + (if (item.selectedIcon.isPresent) 1 else 0)
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
    loadIcon(item.icon) { normal = it; done() }
    if (item.selectedIcon.isPresent) loadIcon(item.selectedIcon) { selected = it; done() }
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

  /**
   * The rail at its natural width and the height it is given. Material caps
   * a non-exact width at the spec's size, so the cap is the screen width
   * rather than an unspecified 0.
   */
  private fun measureRail(r: NavigationRailView, heightSpec: Int) {
    val maxWidth = resources.displayMetrics.widthPixels
    r.measure(MeasureSpec.makeMeasureSpec(maxWidth, MeasureSpec.AT_MOST), heightSpec)
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val r = rail
    if (r == null) {
      setMeasuredDimension(0, 0)
      return
    }
    val height = MeasureSpec.getSize(heightMeasureSpec)
    measureRail(
      r,
      if (height > 0) MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
      else MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    val width = MeasureSpec.getSize(widthMeasureSpec).let { if (it > 0) it else r.measuredWidth }
    setMeasuredDimension(width, if (height > 0) height else r.measuredHeight)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val r = rail ?: return
    // The rail keeps its own width, at the start edge; Fabric follows it
    val railWidth = r.measuredWidth
    if (layoutDirection == View.LAYOUT_DIRECTION_RTL) {
      r.layout(right - left - railWidth, 0, right - left, bottom - top)
    } else {
      r.layout(0, 0, railWidth, bottom - top)
    }
    // Material creates the label views as destinations are added; style any new ones
    applyTestIDsAndFonts(r)
  }

  /** Reports the natural width to Fabric; the height is left to the app's layout. */
  fun reportIntrinsicSize() {
    val r = rail ?: return
    measureRail(
      r,
      if (height > 0) MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
      else MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    reportWidth(r.measuredWidth)
  }

  /**
   * Called with the rail's natural width, and with every width it passes
   * through while it expands or collapses, so the content beside it follows.
   */
  private fun reportWidth(widthPx: Int) {
    val wrapper = stateWrapper ?: return
    if (widthPx <= 0) return
    val widthDp = PixelUtil.toDIPFromPixel(widthPx.toFloat())
    if (widthDp == lastReportedWidth) return
    lastReportedWidth = widthDp
    wrapper.updateState(
      WritableNativeMap().apply {
        putDouble("width", widthDp.toDouble())
        putDouble("height", 0.0)
      }
    )
  }

  /** The Material rail, reporting its size as it changes (and animates). */
  private class Rail(context: Context, private val onWidth: (Int) -> Unit) :
    NavigationRailView(context, null, MaterialR.attr.navigationRailStyle) {
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
      super.onSizeChanged(w, h, oldw, oldh)
      if (w != oldw) onWidth(w)
    }
  }
}
