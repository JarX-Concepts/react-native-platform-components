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
import com.facebook.react.viewmanagers.PCChipGroupManagerDelegate
import com.facebook.react.viewmanagers.PCChipGroupManagerInterface
import com.platformcomponents.PCButtonSupport.stringOr

class PCChipGroupViewManager :
  SimpleViewManager<PCChipGroupView>(),
  PCChipGroupManagerInterface<PCChipGroupView> {

  private val delegate: ViewManagerDelegate<PCChipGroupView> =
    PCChipGroupManagerDelegate(this)

  override fun getName(): String = "PCChipGroup"

  override fun getDelegate(): ViewManagerDelegate<PCChipGroupView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCChipGroupView {
    return PCChipGroupView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCChipGroupView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCChipGroupView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)
    fun dispatch(name: String, fill: WritableMap.() -> Unit) {
      dispatcher?.dispatchEvent(ChipGroupEvent(UIManagerHelper.getSurfaceId(view), view.id, name, fill))
    }

    view.onPress = { index, value ->
      PCHaptics.perform(view, view.haptics)
      dispatch("topChipPress") {
        putInt("index", index)
        putString("value", value)
      }
    }
    view.onClose = { index, value ->
      PCHaptics.perform(view, view.haptics)
      dispatch("topChipClose") {
        putInt("index", index)
        putString("value", value)
      }
    }
    view.onSelectionChange = { values ->
      dispatch("topGroupSelectionChange") {
        val array = Arguments.createArray()
        values.forEach { array.pushString(it) }
        putArray("values", array)
      }
    }
  }

  /** Rebuilds the chips once every prop of an update is in, and applies the selection. */
  override fun onAfterUpdateTransaction(view: PCChipGroupView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  // chips: array of {label, value, disabled, iconType, iconName, iconRequest,
  //                  iconUri, iconScale, iconTinted, closeIcon, testID,
  //                  closeTestID, accessibilityLabel, closeAccessibilityLabel}
  override fun setChips(view: PCChipGroupView, value: ReadableArray?) {
    val out = ArrayList<PCChipSupport.Item>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(
          PCChipSupport.Item(
            label = m.stringOr("label", ""),
            value = m.stringOr("value", ""),
            disabled = m.stringOr("disabled", "enabled") == "disabled",
            icon = PCButtonSupport.parseIcon(m),
            closeIcon = m.stringOr("closeIcon", "false") == "true",
            testID = m.stringOr("testID", ""),
            closeTestID = m.stringOr("closeTestID", ""),
            accessibilityLabel = m.stringOr("accessibilityLabel", ""),
            closeAccessibilityLabel = m.stringOr("closeAccessibilityLabel", "")
          )
        )
      }
    }
    view.applyItems(out)
  }

  // "assist" | "filter" | "input" | "suggestion"
  override fun setVariant(view: PCChipGroupView, value: String?) {
    view.applyVariant(value)
  }

  override fun setSelection(view: PCChipGroupView, value: String?) {
    view.applySelection(value)
  }

  override fun setSelectedValues(view: PCChipGroupView, value: ReadableArray?) {
    val out = ArrayList<String>()
    if (value != null) {
      for (i in 0 until value.size()) {
        value.getString(i)?.let { out.add(it) }
      }
    }
    view.applySelectedValues(out)
  }

  override fun setSelectionRequired(view: PCChipGroupView, value: String?) {
    view.applySelectionRequired(value == "true")
  }

  // Bumped by JS after every selection change; the update it causes runs
  // onAfterUpdateTransaction, which applies `selectedValues` again
  override fun setSelectionEventCount(view: PCChipGroupView, value: Int) {}

  // "true" (rows wrap) | "false" (one scrolling row)
  override fun setWrap(view: PCChipGroupView, value: String?) {
    view.applyWrap(value != "false")
  }

  // Negative means the style's default spacing
  override fun setSpacing(view: PCChipGroupView, value: Double) {
    view.applySpacing(value.toFloat())
  }

  override fun setInteractivity(view: PCChipGroupView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setMaxFontSizeMultiplier(view: PCChipGroupView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  // Negative means the platform's own size
  override fun setChipMinHeight(view: PCChipGroupView, value: Double) {
    view.applyChipMinHeight(value.toFloat())
  }

  override fun setChipPaddingHorizontal(view: PCChipGroupView, value: Double) {
    view.applyChipPaddingHorizontal(value.toFloat())
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCChipGroupView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  // --- Events ---
  private class ChipGroupEvent(
    surfaceId: Int,
    viewTag: Int,
    private val name: String,
    private val fill: WritableMap.() -> Unit
  ) : Event<ChipGroupEvent>(surfaceId, viewTag) {
    // Every press counts; two quick presses must not merge into one
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = name

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply(fill)
  }
}
