package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.PCFloatingActionButtonManagerDelegate
import com.facebook.react.viewmanagers.PCFloatingActionButtonManagerInterface

class PCFloatingActionButtonViewManager :
  SimpleViewManager<PCFloatingActionButtonView>(),
  PCFloatingActionButtonManagerInterface<PCFloatingActionButtonView> {

  private val delegate: ViewManagerDelegate<PCFloatingActionButtonView> =
    PCFloatingActionButtonManagerDelegate(this)

  override fun getName(): String = "PCFloatingActionButton"

  override fun getDelegate(): ViewManagerDelegate<PCFloatingActionButtonView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCFloatingActionButtonView =
    PCFloatingActionButtonView(reactContext)

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCFloatingActionButtonView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCFloatingActionButtonView) {
    view.onPress = {
      PCHaptics.perform(view, view.haptics)
      UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)?.dispatchEvent(
        PressEvent(UIManagerHelper.getSurfaceId(view), view.id)
      )
    }
  }

  // icon: {iconType, iconName, iconUri, iconScale, iconTinted}
  override fun setIcon(view: PCFloatingActionButtonView, value: ReadableMap?) {
    view.applyIcon(PCButtonSupport.parseIcon(value))
  }

  override fun setLabel(view: PCFloatingActionButtonView, value: String?) {
    view.applyLabel(value ?: "")
  }

  // "small" | "regular" | "medium" | "large"
  override fun setSize(view: PCFloatingActionButtonView, value: String?) {
    view.applySize(value)
  }

  // "true" | "false"
  override fun setExtended(view: PCFloatingActionButtonView, value: String?) {
    view.applyExtended(value != "false")
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setColor(view: PCFloatingActionButtonView, value: Int?) {
    view.applyColors(value, view.foregroundColor)
  }

  override fun setForegroundColor(view: PCFloatingActionButtonView, value: Int?) {
    view.applyColors(view.containerColor, value)
  }

  override fun setInteractivity(view: PCFloatingActionButtonView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setSpokenLabel(view: PCFloatingActionButtonView, value: String?) {
    view.applySpokenLabel(value ?: "")
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCFloatingActionButtonView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  override fun setScrollViewNativeID(view: PCFloatingActionButtonView, value: String?) {
    view.applyScrollViewNativeID(value ?: "")
  }

  // --- Events ---

  private class PressEvent(surfaceId: Int, viewTag: Int) : Event<PressEvent>(surfaceId, viewTag) {
    // Every press counts; two quick presses must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topFabPress"

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap()
  }
}
