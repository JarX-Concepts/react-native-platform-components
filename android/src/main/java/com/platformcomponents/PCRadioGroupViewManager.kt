package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.PCRadioGroupManagerDelegate
import com.facebook.react.viewmanagers.PCRadioGroupManagerInterface
import com.platformcomponents.PCButtonSupport.stringOr

class PCRadioGroupViewManager :
  SimpleViewManager<PCRadioGroupView>(),
  PCRadioGroupManagerInterface<PCRadioGroupView> {

  private val delegate: ViewManagerDelegate<PCRadioGroupView> = PCRadioGroupManagerDelegate(this)

  override fun getName(): String = "PCRadioGroup"

  override fun getDelegate(): ViewManagerDelegate<PCRadioGroupView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCRadioGroupView {
    return PCRadioGroupView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCRadioGroupView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCRadioGroupView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    view.onChange = { index, value ->
      PCHaptics.perform(view, view.haptics)
      dispatcher?.dispatchEvent(
        RadioGroupEvent(UIManagerHelper.getSurfaceId(view), view.id) {
          putInt("index", index)
          putString("value", value)
        }
      )
    }
  }

  /** Rebuilds the radio buttons once every prop of an update is in, and applies `value`. */
  override fun onAfterUpdateTransaction(view: PCRadioGroupView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  // options: array of {value, label, description, disabled, testID, accessibilityLabel}
  override fun setOptions(view: PCRadioGroupView, value: ReadableArray?) {
    val out = ArrayList<PCRadioGroupView.Option>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(
          PCRadioGroupView.Option(
            value = m.stringOr("value", ""),
            label = m.stringOr("label", ""),
            description = m.stringOr("description", ""),
            disabled = m.stringOr("disabled", "enabled") == "disabled",
            testID = m.stringOr("testID", ""),
            accessibilityLabel = m.stringOr("accessibilityLabel", "")
          )
        )
      }
    }
    view.applyOptions(out)
  }

  override fun setValue(view: PCRadioGroupView, value: String?) {
    view.applyValue(value ?: "")
  }

  // Bumped by JS after every pick; the update it causes runs
  // onAfterUpdateTransaction, which applies `value` again
  override fun setValueEventCount(view: PCRadioGroupView, value: Int) {}

  // "none" | "error"
  override fun setErrorState(view: PCRadioGroupView, value: String?) {
    view.applyError(value, view.errorText)
  }

  override fun setErrorText(view: PCRadioGroupView, value: String?) {
    view.applyError(view.errorState, value ?: "")
  }

  override fun setInteractivity(view: PCRadioGroupView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setMaxFontSizeMultiplier(view: PCRadioGroupView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  override fun setGroupLabel(view: PCRadioGroupView, value: String?) {
    view.applyGroupLabel(value ?: "")
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCRadioGroupView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  // --- Events ---
  private class RadioGroupEvent(
    surfaceId: Int,
    viewTag: Int,
    private val fill: WritableMap.() -> Unit
  ) : Event<RadioGroupEvent>(surfaceId, viewTag) {
    // Every pick counts; two quick taps must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topRadioGroupChange"

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply(fill)
  }
}
