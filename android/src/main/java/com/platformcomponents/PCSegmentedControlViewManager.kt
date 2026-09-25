package com.platformcomponents

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.viewmanagers.PCSegmentedControlManagerDelegate
import com.facebook.react.viewmanagers.PCSegmentedControlManagerInterface

class PCSegmentedControlViewManager :
  SimpleViewManager<PCSegmentedControlView>(),
  PCSegmentedControlManagerInterface<PCSegmentedControlView> {

  companion object {
    private const val TAG = "PCSegmentedControl"
  }

  private val delegate: ViewManagerDelegate<PCSegmentedControlView> =
    PCSegmentedControlManagerDelegate(this)

  override fun getName(): String = "PCSegmentedControl"

  override fun getDelegate(): ViewManagerDelegate<PCSegmentedControlView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCSegmentedControlView {
    return PCSegmentedControlView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with measured dimensions.
   */
  override fun updateState(
    view: PCSegmentedControlView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCSegmentedControlView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    view.onSelect = { index, value ->
      PCHaptics.perform(view, view.haptics)
      dispatcher?.dispatchEvent(SelectEvent(view.id, index, value))
    }
  }

  private fun ReadableMap.stringOr(key: String, fallback: String): String =
    if (hasKey(key) && !isNull(key)) getString(key) ?: fallback else fallback

  private fun ReadableMap.doubleOr(key: String, fallback: Double): Double =
    if (hasKey(key) && !isNull(key)) getDouble(key) else fallback

  // segments: array of {label, value, disabled, iconType, iconName, iconUri,
  //                     iconScale, iconTinted, accessibilityLabel, testID}
  override fun setSegments(view: PCSegmentedControlView, value: ReadableArray?) {
    val out = ArrayList<PCSegmentedControlView.Segment>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        val scale = m.doubleOr("iconScale", 1.0)
        out.add(
          PCSegmentedControlView.Segment(
            label = m.stringOr("label", ""),
            value = m.stringOr("value", ""),
            disabled = m.stringOr("disabled", "enabled") == "disabled",
            iconType = m.stringOr("iconType", ""),
            iconName = m.stringOr("iconName", ""),
            iconUri = m.stringOr("iconUri", ""),
            iconScale = if (scale > 0) scale.toFloat() else 1f,
            iconTinted = m.stringOr("iconTinted", "true") != "false",
            badge = m.stringOr("badge", ""),
            accessibilityLabel = m.stringOr("accessibilityLabel", ""),
            testID = m.stringOr("testID", "")
          )
        )
      }
    }
    view.applySegments(out)
  }

  override fun setLabelVisibility(view: PCSegmentedControlView, value: String?) {
    view.applyLabelVisibility(value)
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setSelectedSegmentColor(view: PCSegmentedControlView, value: Int?) {
    view.applySelectedSegmentColor(value)
  }

  override fun setActiveTintColor(view: PCSegmentedControlView, value: Int?) {
    view.applyActiveTintColor(value)
  }

  override fun setInactiveTintColor(view: PCSegmentedControlView, value: Int?) {
    view.applyInactiveTintColor(value)
  }

  override fun setAndroidRippleColor(view: PCSegmentedControlView, value: Int?) {
    view.applyRippleColor(value)
  }

  override fun setAndroidStrokeColor(view: PCSegmentedControlView, value: Int?) {
    view.applyStrokeColor(value)
  }

  override fun setBadgeBackgroundColor(view: PCSegmentedControlView, value: Int?) {
    view.applyBadgeColors(value, view.badgeTextColor)
  }

  override fun setBadgeTextColor(view: PCSegmentedControlView, value: Int?) {
    view.applyBadgeColors(view.badgeBackgroundColor, value)
  }

  override fun setMaxFontSizeMultiplier(view: PCSegmentedControlView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}; empty / 0 = default
  override fun setLabelStyle(view: PCSegmentedControlView, value: ReadableMap?) {
    view.applyLabelStyle(
      fontFamily = value?.stringOr("fontFamily", "") ?: "",
      fontSize = value?.doubleOr("fontSize", 0.0)?.toFloat() ?: 0f,
      fontWeight = value?.stringOr("fontWeight", "") ?: "",
      fontStyle = value?.stringOr("fontStyle", "") ?: ""
    )
  }

  override fun setSelectedValue(view: PCSegmentedControlView, value: String?) {
    // Spec sentinel: empty string means "no selection"
    view.applySelectedValue(value ?: "")
  }

  override fun setInteractivity(view: PCSegmentedControlView, value: String?) {
    view.applyInteractivity(value)
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCSegmentedControlView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  override fun setAndroid(view: PCSegmentedControlView, value: ReadableMap?) {
    // Spec sentinel: "true" | "false"; missing means the default (required).
    val selectionRequired = if (
      value != null && value.hasKey("selectionRequired") && !value.isNull("selectionRequired")
    ) {
      value.getString("selectionRequired") != "false"
    } else {
      true
    }
    // Spec sentinel: "expressive" (default) | "m3"
    val expressive = !(
      value != null && value.hasKey("material") && !value.isNull("material") &&
        value.getString("material") == "m3"
      )
    view.applyAndroidProps(selectionRequired, expressive)
  }

  override fun setIos(view: PCSegmentedControlView, value: ReadableMap?) {
    // Android ignores iOS config
  }

  // --- Events ---
  private class SelectEvent(
    surfaceId: Int,
    private val index: Int,
    private val value: String
  ) : Event<SelectEvent>(surfaceId) {
    override fun getEventName(): String = "topSelect"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = com.facebook.react.bridge.Arguments.createMap().apply {
        putInt("index", index)
        putString("value", value)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }
}
