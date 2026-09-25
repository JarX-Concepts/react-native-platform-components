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

  override fun setItems(view: PCTabBarView, value: ReadableArray?) {
    view.applyTabs(PCNavigationBarSupport.parseItems(value))
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
    view.applyLabelFont(
      view.labelFont.copy(
        family = value?.stringOr("fontFamily", "") ?: "",
        size = value?.doubleOr("fontSize", 0.0)?.toFloat() ?: 0f,
        weight = value?.stringOr("fontWeight", "") ?: "",
        style = value?.stringOr("fontStyle", "") ?: ""
      )
    )
  }

  // Active indicator: 'true' | 'false' ('' = shown), shape, size in dp
  override fun setAndroidIndicator(view: PCTabBarView, value: String?) {
    view.applyIndicator(view.indicator.copy(enabled = value != "false"))
  }

  override fun setAndroidIndicatorShape(view: PCTabBarView, value: String?) {
    view.applyIndicator(view.indicator.copy(shape = value ?: ""))
  }

  override fun setAndroidIndicatorCornerRadius(view: PCTabBarView, value: Double) {
    view.applyIndicator(view.indicator.copy(cornerRadius = value.toFloat()))
  }

  override fun setAndroidIndicatorWidth(view: PCTabBarView, value: Double) {
    view.applyIndicator(view.indicator.copy(width = value.toFloat()))
  }

  override fun setAndroidIndicatorHeight(view: PCTabBarView, value: Double) {
    view.applyIndicator(view.indicator.copy(height = value.toFloat()))
  }

  // '' | 'vertical' | 'horizontal' | 'auto'
  override fun setAndroidItemLayout(view: PCTabBarView, value: String?) {
    view.applyItemLayout(value ?: "")
  }

  override fun setMinimizeBehavior(view: PCTabBarView, value: String?) {
    view.applyMinimize(value ?: "", view.scrollViewNativeID)
  }

  override fun setScrollViewNativeID(view: PCTabBarView, value: String?) {
    view.applyMinimize(view.minimizeBehavior, value ?: "")
  }

  override fun setMaxFontSizeMultiplier(view: PCTabBarView, value: Double) {
    view.applyLabelFont(view.labelFont.copy(maxFontSizeMultiplier = value.toFloat()))
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
