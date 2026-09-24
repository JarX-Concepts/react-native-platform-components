package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.PCTabBarManagerDelegate
import com.facebook.react.viewmanagers.PCTabBarManagerInterface
import com.platformcomponents.PCButtonSupport.doubleOr
import com.platformcomponents.PCButtonSupport.stringOr

class PCTabBarViewManager :
  SimpleViewManager<PCTabBarView>(),
  PCTabBarManagerInterface<PCTabBarView> {

  private val delegate: ViewManagerDelegate<PCTabBarView> = PCTabBarManagerDelegate(this)

  override fun getName(): String = "PCTabBar"

  override fun getDelegate(): ViewManagerDelegate<PCTabBarView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCTabBarView =
    PCTabBarView(reactContext)

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural height, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCTabBarView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCTabBarView) {
    // Looked up per press, with the view's surface: a bar mounted inside
    // another native container (a FloatingToolbar) lost its events when the
    // dispatcher was taken at creation
    view.onTabPress = { index, value, reselected ->
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)?.dispatchEvent(
        TabPressEvent(UIManagerHelper.getSurfaceId(view), view.id, index, value, reselected)
      )
    }
  }

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
  override fun setItems(view: PCTabBarView, value: ReadableArray?) {
    val out = ArrayList<PCTabBarView.Tab>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(
          PCTabBarView.Tab(
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
    view.applyTabs(out)
  }

  override fun setSelectedValue(view: PCTabBarView, value: String?) {
    view.applySelectedValue(value ?: "")
  }

  override fun setLabelVisibility(view: PCTabBarView, value: String?) {
    view.applyLabelVisibility(value)
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setActiveTintColor(view: PCTabBarView, value: Int?) {
    view.applyColors(value, view.inactiveTintColor, view.barColor, view.indicatorColor, view.rippleColor)
  }

  override fun setInactiveTintColor(view: PCTabBarView, value: Int?) {
    view.applyColors(view.activeTintColor, value, view.barColor, view.indicatorColor, view.rippleColor)
  }

  override fun setBarColor(view: PCTabBarView, value: Int?) {
    view.applyColors(view.activeTintColor, view.inactiveTintColor, value, view.indicatorColor, view.rippleColor)
  }

  override fun setAndroidIndicatorColor(view: PCTabBarView, value: Int?) {
    view.applyColors(view.activeTintColor, view.inactiveTintColor, view.barColor, value, view.rippleColor)
  }

  override fun setAndroidRippleColor(view: PCTabBarView, value: Int?) {
    view.applyColors(view.activeTintColor, view.inactiveTintColor, view.barColor, view.indicatorColor, value)
  }

  override fun setBadgeBackgroundColor(view: PCTabBarView, value: Int?) {
    view.applyBadgeColors(value, view.badgeTextColor)
  }

  override fun setBadgeTextColor(view: PCTabBarView, value: Int?) {
    view.applyBadgeColors(view.badgeBackgroundColor, value)
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}; empty / 0 = default
  override fun setLabelStyle(view: PCTabBarView, value: ReadableMap?) {
    view.applyLabelStyle(
      fontFamily = value?.stringOr("fontFamily", "") ?: "",
      fontSize = value?.doubleOr("fontSize", 0.0)?.toFloat() ?: 0f,
      fontWeight = value?.stringOr("fontWeight", "") ?: "",
      fontStyle = value?.stringOr("fontStyle", "") ?: ""
    )
  }

  override fun setMaxFontSizeMultiplier(view: PCTabBarView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  // --- Events ---

  private class TabPressEvent(
    surfaceId: Int,
    viewTag: Int,
    private val index: Int,
    private val value: String,
    private val reselected: Boolean
  ) : Event<TabPressEvent>(surfaceId, viewTag) {
    // Every press counts; two quick presses must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topTabPress"

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply {
      putInt("index", index)
      putString("value", value)
      putString("reselected", if (reselected) "true" else "false")
    }
  }
}
