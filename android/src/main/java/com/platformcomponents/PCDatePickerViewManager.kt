package com.platformcomponents

import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.viewmanagers.PCDatePickerManagerDelegate
import com.facebook.react.viewmanagers.PCDatePickerManagerInterface

class PCDatePickerViewManager :
  SimpleViewManager<PCDatePickerView>(),
  PCDatePickerManagerInterface<PCDatePickerView> {

  private val delegate: ViewManagerDelegate<PCDatePickerView> =
    PCDatePickerManagerDelegate(this)

  override fun getName(): String = "PCDatePicker"

  override fun getDelegate(): ViewManagerDelegate<PCDatePickerView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCDatePickerView {
    return PCDatePickerView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with measured dimensions.
   */
  override fun updateState(
    view: PCDatePickerView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCDatePickerView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    view.onConfirm = { tsMs: Long ->
      dispatcher?.dispatchEvent(ConfirmEvent(view.id, tsMs.toDouble()))

      dispatcher?.dispatchEvent(CancelEvent(view.id))
    }
    view.onCancel = {
      dispatcher?.dispatchEvent(CancelEvent(view.id))
    }
  }

  // --- Common props ---

  override fun setMode(view: PCDatePickerView, value: String?) {
    view.applyMode(value)
  }

  override fun setPresentation(view: PCDatePickerView, value: String?) {
    view.applyPresentation(value)
  }

  override fun setVisible(view: PCDatePickerView, value: String?) {
    view.applyVisible(value)
  }

  override fun setLocale(view: PCDatePickerView, value: String?) {
    view.applyLocale(value)
  }

  override fun setTimeZoneName(view: PCDatePickerView, value: String?) {
    view.applyTimeZoneName(value)
  }

  // Sentinel is MIN_SAFE_INTEGER to allow negative timestamps for pre-1970 dates
  private val noDateSentinel = -9007199254740991.0

  override fun setDateMs(view: PCDatePickerView, value: Double) {
    view.applyDateMs(if (value > noDateSentinel) value.toLong() else null)
  }

  override fun setMinDateMs(view: PCDatePickerView, value: Double) {
    view.applyMinDateMs(if (value > noDateSentinel) value.toLong() else null)
  }

  override fun setMaxDateMs(view: PCDatePickerView, value: Double) {
    view.applyMaxDateMs(if (value > noDateSentinel) value.toLong() else null)
  }

  // --- platform objects ---

  override fun setAndroid(view: PCDatePickerView, value: ReadableMap?) {
    if (value == null) {
      view.applyAndroidConfig(null, null, null, null, null)
      return
    }

    val firstDay =
      if (value.hasKey("firstDayOfWeek") && !value.isNull("firstDayOfWeek"))
        value.getInt("firstDayOfWeek")
      else null

    val materialRaw =
      if (value.hasKey("material") && !value.isNull("material"))
        value.getString("material")
      else null

    // ✅ Only allow "system" or "m3" (anything else -> system)
    val material =
      when (materialRaw) {
        "m3" -> "m3"
        "system", null -> "system"
        else -> "system"
      }

    val title =
      if (value.hasKey("dialogTitle") && !value.isNull("dialogTitle"))
        value.getString("dialogTitle")
      else null

    val pos =
      if (value.hasKey("positiveButtonTitle") && !value.isNull("positiveButtonTitle"))
        value.getString("positiveButtonTitle")
      else null

    val neg =
      if (value.hasKey("negativeButtonTitle") && !value.isNull("negativeButtonTitle"))
        value.getString("negativeButtonTitle")
      else null

    view.applyAndroidConfig(firstDay, material, title, pos, neg)
  }

  override fun setIos(view: PCDatePickerView, value: ReadableMap?) {
    // Android ignores iOS config
  }

  // --- Events (Fabric -> JS) ---

  private class ConfirmEvent(
    surfaceId: Int,
    private val ts: Double
  ) : Event<ConfirmEvent>(surfaceId) {
    override fun getEventName(): String = "topConfirm"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = com.facebook.react.bridge.Arguments.createMap().apply {
        putDouble("timestampMs", ts)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class CancelEvent(surfaceId: Int) : Event<CancelEvent>(surfaceId) {
    override fun getEventName(): String = "topClosed"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      rctEventEmitter.receiveEvent(
        viewTag,
        eventName,
        com.facebook.react.bridge.Arguments.createMap()
      )
    }
  }
}
