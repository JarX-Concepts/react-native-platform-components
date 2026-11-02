package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.viewmanagers.PCCheckboxManagerDelegate
import com.facebook.react.viewmanagers.PCCheckboxManagerInterface

class PCCheckboxViewManager :
  SimpleViewManager<PCCheckboxView>(),
  PCCheckboxManagerInterface<PCCheckboxView> {

  private val delegate: ViewManagerDelegate<PCCheckboxView> = PCCheckboxManagerDelegate(this)

  override fun getName(): String = "PCCheckbox"

  override fun getDelegate(): ViewManagerDelegate<PCCheckboxView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCCheckboxView {
    return PCCheckboxView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCCheckboxView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCCheckboxView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    view.onToggle = { checked ->
      PCHaptics.perform(view, view.haptics)
      dispatcher?.dispatchEvent(
        CheckboxEvent(UIManagerHelper.getSurfaceId(view), view.id) {
          putBoolean("checked", checked)
        }
      )
    }
  }

  /** Applies `checked` again once JS has answered a toggle (checkedEventCount). */
  override fun onAfterUpdateTransaction(view: PCCheckboxView) {
    super.onAfterUpdateTransaction(view)
    view.syncChecked()
  }

  // "true" | "false" | "indeterminate"
  override fun setChecked(view: PCCheckboxView, value: String?) {
    view.applyChecked(value)
  }

  // Bumped by JS after every toggle; the update it causes runs
  // onAfterUpdateTransaction, which applies `checked` again
  override fun setCheckedEventCount(view: PCCheckboxView, value: Int) {}

  override fun setLabel(view: PCCheckboxView, value: String?) {
    view.applyLabel(value ?: "")
  }

  // "none" | "error"
  override fun setErrorState(view: PCCheckboxView, value: String?) {
    view.applyError(value, view.errorText)
  }

  override fun setErrorText(view: PCCheckboxView, value: String?) {
    view.applyError(view.errorState, value ?: "")
  }

  override fun setInteractivity(view: PCCheckboxView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setMaxFontSizeMultiplier(view: PCCheckboxView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  override fun setSpokenLabel(view: PCCheckboxView, value: String?) {
    view.applySpokenLabel(value ?: "")
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCCheckboxView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  /**
   * testID goes on the MaterialCheckBox, which carries the label, the
   * checked state and the touches, as its view tag and resource-id (see
   * PCTestID). The host keeps neither, not even React Native's test-id key
   * (its resource-id), so one id never matches two views.
   */
  override fun setTestId(view: PCCheckboxView, testId: String?) {
    view.applyTestID(testId ?: "")
  }

  // --- Events ---
  private class CheckboxEvent(
    surfaceId: Int,
    viewTag: Int,
    private val fill: WritableMap.() -> Unit
  ) : Event<CheckboxEvent>(surfaceId, viewTag) {
    // Every toggle counts; two quick taps must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = "topCheckboxToggle"

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply(fill)
  }
}
