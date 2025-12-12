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

    override fun getDelegate(): ViewManagerDelegate<DatePickerView> = delegate

    override fun createViewInstance(reactContext: ThemedReactContext): DatePickerView {
        return DatePickerView(reactContext)
    }

    // --- Props wired from codegen -------------------------------------------

    override fun setMode(view: DatePickerView, value: String?) {
        view.setMode(value)
    }

    override fun setPresentation(view: DatePickerView, value: String?) {
        view.setPresentation(value)
    }

    override fun setVisible(view: DatePickerView, value: String?) {
        view.setVisible(value)
    }

    override fun setLocale(view: DatePickerView, value: String?) {
        view.setLocale(value)
    }

    override fun setTimeZoneName(view: DatePickerView, value: String?) {
        view.setTimeZone(value)
    }

    // Sentinel -1 from JS means "unset" / "no value"
    override fun setDateMs(view: DatePickerView, value: Double) {
        val v: Double? = if (value >= 0.0) value else null
        view.setDateMs(v)
    }

    override fun setMinDateMs(view: DatePickerView, value: Double) {
        val v: Double? = if (value >= 0.0) value else null
        view.setMinDateMs(v)
    }

    override fun setMaxDateMs(view: DatePickerView, value: Double) {
        val v: Double? = if (value >= 0.0) value else null
        view.setMaxDateMs(v)
    }

    override fun setAndroid(view: DatePickerView, value: ReadableMap?) {
        view.setAndroidConfig(value)
    }

    // Unused platform-specific props on Android
    override fun setIos(view: DatePickerView, value: ReadableMap?) { /* no-op */ }
    override fun setWeb(view: DatePickerView, value: ReadableMap?) { /* no-op */ }
    override fun setWindows(view: DatePickerView, value: ReadableMap?) { /* no-op */ }
    override fun setMacos(view: DatePickerView, value: ReadableMap?) { /* no-op */ }
}