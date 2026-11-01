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
import com.facebook.react.viewmanagers.PCSwitchManagerDelegate
import com.facebook.react.viewmanagers.PCSwitchManagerInterface

class PCSwitchViewManager :
  SimpleViewManager<PCSwitchView>(),
  PCSwitchManagerInterface<PCSwitchView> {

  private val delegate: ViewManagerDelegate<PCSwitchView> = PCSwitchManagerDelegate(this)

  override fun getName(): String = "PCSwitch"

  override fun getDelegate(): ViewManagerDelegate<PCSwitchView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCSwitchView {
    return PCSwitchView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCSwitchView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  // The style's padding: the row keeps its touches and ripple there
  override fun setPadding(view: PCSwitchView, left: Int, top: Int, right: Int, bottom: Int) {
    view.setPadding(left, top, right, bottom)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCSwitchView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    view.onValueChange = { value ->
      PCHaptics.perform(view, view.haptics)
      dispatcher?.dispatchEvent(SwitchChangeEvent(UIManagerHelper.getSurfaceId(view), view.id, value))
    }
  }

  /** Rebuilds the widgets once every prop of an update is in, and shows `value`. */
  override fun onAfterUpdateTransaction(view: PCSwitchView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  override fun setValue(view: PCSwitchView, value: Boolean) {
    view.value = value
  }

  // Bumped by JS after every toggle; the update it causes runs
  // onAfterUpdateTransaction, which shows `value` again
  override fun setValueEventCount(view: PCSwitchView, value: Int) {}

  override fun setLabel(view: PCSwitchView, value: String?) {
    view.applyLabel(value ?: "")
  }

  override fun setInteractivity(view: PCSwitchView, value: String?) {
    view.applyInteractivity(value)
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setColor(view: PCSwitchView, value: Int?) {
    view.applyColors(value, view.offTrackColor, view.thumbColor)
  }

  override fun setTrackColor(view: PCSwitchView, value: Int?) {
    view.applyColors(view.onColor, value, view.thumbColor)
  }

  override fun setThumbColor(view: PCSwitchView, value: Int?) {
    view.applyColors(view.onColor, view.offTrackColor, value)
  }

  // thumbIcon: {iconType ('' | 'check' | 'drawable' | 'image'), iconName, ...}
  override fun setThumbIcon(view: PCSwitchView, value: ReadableMap?) {
    view.applyThumbIcon(PCButtonSupport.parseIcon(value))
  }

  override fun setMaxFontSizeMultiplier(view: PCSwitchView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  override fun setSpokenLabel(view: PCSwitchView, value: String?) {
    view.applySpokenLabel(value ?: "")
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCSwitchView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  // --- Events ---
  private class SwitchChangeEvent(
    surfaceId: Int,
    viewTag: Int,
    private val value: Boolean
  ) : Event<SwitchChangeEvent>(surfaceId, viewTag) {
    // Every toggle counts; two quick toggles must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topSwitchChange"

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply {
      putBoolean("value", value)
    }
  }
}
