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
      dispatcher?.dispatchEvent(SelectEvent(view.id, index, value))
    }
  }

  // segments: array of {label, value, disabled, icon}
  override fun setSegments(view: PCSegmentedControlView, value: ReadableArray?) {
    val out = ArrayList<PCSegmentedControlView.Segment>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        val label = if (m.hasKey("label") && !m.isNull("label")) m.getString("label") ?: "" else ""
        val segValue = if (m.hasKey("value") && !m.isNull("value")) m.getString("value") ?: "" else ""
        val disabled = m.hasKey("disabled") && !m.isNull("disabled") && m.getString("disabled") == "disabled"
        val icon = if (m.hasKey("icon") && !m.isNull("icon")) m.getString("icon") ?: "" else ""
        out.add(PCSegmentedControlView.Segment(label = label, value = segValue, disabled = disabled, icon = icon))
      }
    }
    view.applySegments(out)
  }

  override fun setSelectedValue(view: PCSegmentedControlView, value: String?) {
    // Spec sentinel: empty string means "no selection"
    view.applySelectedValue(value ?: "")
  }

  override fun setInteractivity(view: PCSegmentedControlView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setAndroid(view: PCSegmentedControlView, value: ReadableMap?) {
    val selectionRequired = value != null && value.hasKey("selectionRequired") &&
      !value.isNull("selectionRequired") && value.getString("selectionRequired") == "true"
    view.applyAndroidProps(selectionRequired)
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
