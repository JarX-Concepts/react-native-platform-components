package com.platformcomponents

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.DatePickerManagerDelegate
import com.facebook.react.viewmanagers.DatePickerManagerInterface

class DatePickerViewManager(
  private val reactContext: ReactApplicationContext
) : SimpleViewManager<DatePickerView>(),
    DatePickerManagerInterface<DatePickerView> {

  private val delegate: ViewManagerDelegate<DatePickerView> =
    DatePickerManagerDelegate(this)

  override fun getName(): String = "DatePicker"

  override fun createViewInstance(reactContext: ThemedReactContext): DatePickerView {
    return DatePickerView(reactContext)  // ← KEEP YOUR ORIGINAL CONSTRUCTOR
  }

  override fun getDelegate(): ViewManagerDelegate<DatePickerView> = delegate


  // ---- Props (must match codegen signatures exactly) ----

  override fun setDate(view: DatePickerView, value: Double) {
    view.setDate(value)
  }

  override fun setMinimumDate(view: DatePickerView, value: Double) {
    view.setMinimumDate(value)
  }

  override fun setMaximumDate(view: DatePickerView, value: Double) {
    view.setMaximumDate(value)
  }

  override fun setMode(view: DatePickerView, value: String?) {
    view.setMode(value)
  }

  override fun setLocale(view: DatePickerView, value: String?) {
    view.setLocale(value)
  }

  override fun setTimeZoneName(view: DatePickerView, value: String?) {
    view.setTimeZoneName(value)
  }

  override fun setIos(view: DatePickerView, value: ReadableMap?) {
    // no-op
  }

  override fun setAndroid(view: DatePickerView, value: ReadableMap?) {
    // no-op or custom logic
  }

  override fun setWeb(view: DatePickerView, value: ReadableMap?) {
    // no-op
  }

  override fun setWindows(view: DatePickerView, value: ReadableMap?) {
    // no-op
  }

  override fun setMacos(view: DatePickerView, value: ReadableMap?) {
    // no-op
  }
}
