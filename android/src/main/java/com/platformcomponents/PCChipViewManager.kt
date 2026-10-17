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
import com.facebook.react.viewmanagers.PCChipManagerDelegate
import com.facebook.react.viewmanagers.PCChipManagerInterface

class PCChipViewManager :
  SimpleViewManager<PCChipView>(),
  PCChipManagerInterface<PCChipView> {

  private val delegate: ViewManagerDelegate<PCChipView> = PCChipManagerDelegate(this)

  override fun getName(): String = "PCChip"

  override fun getDelegate(): ViewManagerDelegate<PCChipView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCChipView {
    return PCChipView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCChipView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCChipView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    fun dispatch(name: String) {
      dispatcher?.dispatchEvent(ChipEvent(UIManagerHelper.getSurfaceId(view), view.id, name))
    }

    view.onPress = {
      PCHaptics.perform(view, view.haptics)
      dispatch("topChipPress")
    }
    view.onClose = {
      PCHaptics.perform(view, view.haptics)
      dispatch("topChipClose")
    }
  }

  /** Rebuilds the chip once every prop of an update is in, and applies `selected`. */
  override fun onAfterUpdateTransaction(view: PCChipView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  override fun setLabel(view: PCChipView, value: String?) {
    view.applyLabel(value ?: "")
  }

  // icon: {iconType, iconName, iconRequest, iconUri, iconScale, iconTinted}
  override fun setIcon(view: PCChipView, value: ReadableMap?) {
    view.applyIcon(PCButtonSupport.parseIcon(value))
  }

  // "assist" | "filter" | "input" | "suggestion"
  override fun setVariant(view: PCChipView, value: String?) {
    view.applyVariant(value)
  }

  // "" (not selectable) | "true" | "false"
  override fun setSelected(view: PCChipView, value: String?) {
    view.applySelected(value ?: "")
  }

  // Bumped by JS after every press of a selectable chip; the update it causes
  // runs onAfterUpdateTransaction, which shows `selected` again
  override fun setPressEventCount(view: PCChipView, value: Int) {}

  override fun setCloseIcon(view: PCChipView, value: String?) {
    view.applyCloseIcon(value == "true", view.closeAccessibilityLabel, view.closeTestID)
  }

  override fun setCloseAccessibilityLabel(view: PCChipView, value: String?) {
    view.applyCloseIcon(view.closeIcon, value ?: "", view.closeTestID)
  }

  override fun setCloseTestID(view: PCChipView, value: String?) {
    view.applyCloseIcon(view.closeIcon, view.closeAccessibilityLabel, value ?: "")
  }

  override fun setInteractivity(view: PCChipView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setMaxFontSizeMultiplier(view: PCChipView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  override fun setSpokenLabel(view: PCChipView, value: String?) {
    view.applySpokenLabel(value ?: "")
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCChipView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  // --- Events ---
  private class ChipEvent(
    surfaceId: Int,
    viewTag: Int,
    private val name: String
  ) : Event<ChipEvent>(surfaceId, viewTag) {
    // Every press counts; two quick presses must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = name

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap()
  }
}
