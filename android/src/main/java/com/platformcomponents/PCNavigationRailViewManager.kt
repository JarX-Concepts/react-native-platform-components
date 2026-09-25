package com.platformcomponents

import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.PCNavigationRailManagerDelegate
import com.facebook.react.viewmanagers.PCNavigationRailManagerInterface
import com.platformcomponents.PCButtonSupport.doubleOr
import com.platformcomponents.PCButtonSupport.stringOr

/**
 * Android ViewManager for NavigationRail. A ViewGroupManager: its one React
 * child, the header, goes into the rail's header slot, where the view lays
 * it out.
 */
class PCNavigationRailViewManager :
  ViewGroupManager<PCNavigationRailView>(),
  PCNavigationRailManagerInterface<PCNavigationRailView> {

  private val delegate: ViewManagerDelegate<PCNavigationRailView> =
    PCNavigationRailManagerDelegate(this)

  override fun getName(): String = "PCNavigationRail"

  override fun getDelegate(): ViewManagerDelegate<PCNavigationRailView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCNavigationRailView =
    PCNavigationRailView(reactContext)

  /**
   * Pass the StateWrapper to the view so it can report its natural width,
   * and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCNavigationRailView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCNavigationRailView) {
    view.onItemPress = { index, value, reselected ->
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)?.dispatchEvent(
        ItemPressEvent(UIManagerHelper.getSurfaceId(view), view.id, index, value, reselected)
      )
    }
  }

  // --- Header (the one React child) ---

  override fun addView(parent: PCNavigationRailView, child: View, index: Int) {
    parent.setHeaderChild(child)
  }

  override fun removeViewAt(parent: PCNavigationRailView, index: Int) {
    parent.setHeaderChild(null)
  }

  override fun getChildCount(parent: PCNavigationRailView): Int =
    if (parent.headerView() != null) 1 else 0

  override fun getChildAt(parent: PCNavigationRailView, index: Int): View? = parent.headerView()

  // The rail places the header; Fabric only sizes it
  override fun needsCustomLayoutForChildren(): Boolean = true

  // --- Props ---

  private fun ReadableMap.icon(prefix: String): PCButtonSupport.Icon {
    fun key(name: String) = if (prefix.isEmpty()) name else prefix + name.replaceFirstChar { it.uppercase() }
    val scale = doubleOr(key("iconScale"), 1.0)
    return PCButtonSupport.Icon(
      type = stringOr(key("iconType"), ""),
      name = stringOr(key("iconName"), ""),
      uri = stringOr(key("iconUri"), ""),
      scale = if (scale > 0) scale.toFloat() else 1f,
      tinted = stringOr(key("iconTinted"), "true") != "false"
    )
  }

  // items: [{label, value, disabled, icon…, selectedIcon…, badge, accessibilityLabel, testID}]
  override fun setItems(view: PCNavigationRailView, value: ReadableArray?) {
    val out = ArrayList<PCNavigationRailView.Item>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(
          PCNavigationRailView.Item(
            label = m.stringOr("label", ""),
            value = m.stringOr("value", ""),
            disabled = m.stringOr("disabled", "enabled") == "disabled",
            icon = m.icon(""),
            selectedIcon = m.icon("selected"),
            badge = m.stringOr("badge", ""),
            accessibilityLabel = m.stringOr("accessibilityLabel", ""),
            testID = m.stringOr("testID", "")
          )
        )
      }
    }
    view.applyItems(out)
  }

  override fun setSelectedValue(view: PCNavigationRailView, value: String?) {
    view.applySelectedValue(value ?: "")
  }

  override fun setLabelVisibility(view: PCNavigationRailView, value: String?) {
    view.applyLabelVisibility(value)
  }

  // "top" | "center" | "bottom"
  override fun setMenuGravity(view: PCNavigationRailView, value: String?) {
    view.applyMenuGravity(value)
  }

  // "true" | "false"
  override fun setExpanded(view: PCNavigationRailView, value: String?) {
    view.applyExpanded(value == "true")
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setActiveTintColor(view: PCNavigationRailView, value: Int?) {
    view.applyColors(value, view.inactiveTintColor, view.railColor, view.indicatorColor, view.rippleColor)
  }

  override fun setInactiveTintColor(view: PCNavigationRailView, value: Int?) {
    view.applyColors(view.activeTintColor, value, view.railColor, view.indicatorColor, view.rippleColor)
  }

  override fun setRailColor(view: PCNavigationRailView, value: Int?) {
    view.applyColors(view.activeTintColor, view.inactiveTintColor, value, view.indicatorColor, view.rippleColor)
  }

  override fun setAndroidIndicatorColor(view: PCNavigationRailView, value: Int?) {
    view.applyColors(view.activeTintColor, view.inactiveTintColor, view.railColor, value, view.rippleColor)
  }

  override fun setAndroidRippleColor(view: PCNavigationRailView, value: Int?) {
    view.applyColors(view.activeTintColor, view.inactiveTintColor, view.railColor, view.indicatorColor, value)
  }

  override fun setBadgeBackgroundColor(view: PCNavigationRailView, value: Int?) {
    view.applyBadgeColors(value, view.badgeTextColor)
  }

  override fun setBadgeTextColor(view: PCNavigationRailView, value: Int?) {
    view.applyBadgeColors(view.badgeBackgroundColor, value)
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}; empty / 0 = default
  override fun setLabelStyle(view: PCNavigationRailView, value: ReadableMap?) {
    view.applyLabelStyle(
      fontFamily = value?.stringOr("fontFamily", "") ?: "",
      fontSize = value?.doubleOr("fontSize", 0.0)?.toFloat() ?: 0f,
      fontWeight = value?.stringOr("fontWeight", "") ?: "",
      fontStyle = value?.stringOr("fontStyle", "") ?: ""
    )
  }

  override fun setMaxFontSizeMultiplier(view: PCNavigationRailView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  // --- Events ---

  private class ItemPressEvent(
    surfaceId: Int,
    viewTag: Int,
    private val index: Int,
    private val value: String,
    private val reselected: Boolean
  ) : Event<ItemPressEvent>(surfaceId, viewTag) {
    // Every press counts; two quick presses must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topItemPress"

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply {
      putInt("index", index)
      putString("value", value)
      putString("reselected", if (reselected) "true" else "false")
    }
  }
}
