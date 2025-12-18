package com.platformcomponents.datepicker

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class PCDatePickerViewManager : SimpleViewManager<PCDatePickerView>() {

  override fun getName(): String = "PCDatePicker"

  override fun createViewInstance(reactContext: ThemedReactContext): PCDatePickerView {
    val view = PCDatePickerView(reactContext)

    view.onConfirm = { ms ->
      val event = Arguments.createMap().apply { putDouble("timestampMs", ms) }
      reactContext.getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(view.id, "onConfirm", event)
    }

    view.onCancel = {
      val event = Arguments.createMap()
      reactContext.getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(view.id, "onCancel", event)
    }

    return view
  }

  override fun getExportedCustomBubblingEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.builder<String, Any>()
      .put(
        "onConfirm",
        MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onConfirm"))
      )
      .put(
        "onCancel",
        MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onCancel"))
      )
      .build()
  }

  @ReactProp(name = "mode")
  fun setMode(view: PCDatePickerView, mode: String?) {
    view.mode = mode ?: "date"
  }

  @ReactProp(name = "presentation")
  fun setPresentation(view: PCDatePickerView, presentation: String?) {
    view.presentation = presentation ?: "modal"
  }

  @ReactProp(name = "visible")
  fun setVisible(view: PCDatePickerView, visible: String?) {
    view.visible = visible ?: "closed"
  }

  @ReactProp(name = "dateMs")
  fun setDateMs(view: PCDatePickerView, dateMs: Double) {
    view.dateMs = dateMs
  }

  @ReactProp(name = "minDateMs")
  fun setMinDateMs(view: PCDatePickerView, minDateMs: Double) {
    view.minDateMs = minDateMs
  }

  @ReactProp(name = "maxDateMs")
  fun setMaxDateMs(view: PCDatePickerView, maxDateMs: Double) {
    view.maxDateMs = maxDateMs
  }

  @ReactProp(name = "locale")
  fun setLocale(view: PCDatePickerView, locale: String?) {
    view.locale = locale
  }

  @ReactProp(name = "timeZoneName")
  fun setTimeZoneName(view: PCDatePickerView, tz: String?) {
    view.timeZoneName = tz
  }

  @ReactProp(name = "android")
  fun setAndroid(view: PCDatePickerView, android: ReadableMap?) {
    view.firstDayOfWeek = android?.getInt("firstDayOfWeek")
    view.dialogTitle = android?.getString("dialogTitle")
    view.positiveButtonTitle = android?.getString("positiveButtonTitle")
    view.negativeButtonTitle = android?.getString("negativeButtonTitle")
    view.material = android?.getString("material") // "auto" | "m2" | "m3"
  }
}