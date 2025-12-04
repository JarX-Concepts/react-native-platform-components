package com.platformcomponents

import android.app.DatePickerDialog
import android.widget.FrameLayout
import android.widget.DatePicker
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class DatePickerView(
    private val reactContext: ThemedReactContext
) : FrameLayout(reactContext), DatePickerDialog.OnDateSetListener {

    private var selectedMs: Long? = null
    private var minMs: Long? = null
    private var maxMs: Long? = null
    private var locale: Locale? = null
    private var timeZone: TimeZone? = null
    private var mode: String? = null // for parity, but Android dialog is date-only

    init {
        // Make the whole view tappable; JS will decide its visible styling.
        isClickable = true
        isFocusable = true

        setOnClickListener {
            showDialog()
        }
    }

    // ----- Props from manager (must match codegen interface) -----

    fun setDate(ms: Double) {
        selectedMs = ms.toLong()
    }

    fun setMinimumDate(ms: Double) {
        minMs = ms.toLong()
    }

    fun setMaximumDate(ms: Double) {
        maxMs = ms.toLong()
    }

    fun setMode(value: String?) {
        // DatePickerDialog is date-only; keep for parity with iOS
        mode = value
    }

    fun setLocale(value: String?) {
        locale = value?.let { Locale.forLanguageTag(it) }
    }

    fun setTimeZoneName(value: String?) {
        timeZone = value?.let { TimeZone.getTimeZone(it) }
    }

    // ----- Show native dialog -----

    private fun showDialog() {
        val activity = reactContext.currentActivity ?: return

        val tz = timeZone ?: TimeZone.getDefault()
        val loc = locale ?: Locale.getDefault()

        val cal = Calendar.getInstance(tz, loc)

        if (selectedMs != null) {
            cal.timeInMillis = selectedMs!!
        }

        val year = cal.get(Calendar.YEAR)
        val month = cal.get(Calendar.MONTH)
        val day = cal.get(Calendar.DAY_OF_MONTH)

        val dialog = DatePickerDialog(activity, this, year, month, day)

        // Apply min/max if set
        val datePicker: DatePicker = dialog.datePicker
        minMs?.let { datePicker.minDate = it }
        maxMs?.let { datePicker.maxDate = it }

        dialog.show()
    }

    // ----- DatePickerDialog.OnDateSetListener -----

    override fun onDateSet(view: DatePicker, year: Int, monthOfYear: Int, dayOfMonth: Int) {
        val tz = timeZone ?: TimeZone.getDefault()
        val loc = locale ?: Locale.getDefault()

        val cal = Calendar.getInstance(tz, loc)
        cal.set(year, monthOfYear, dayOfMonth, 0, 0, 0)
        cal.set(Calendar.MILLISECOND, 0)

        val ms = cal.timeInMillis.toDouble()
        selectedMs = ms.toLong()

        sendChangeEvent(ms)
    }

    private fun sendChangeEvent(ms: Double) {
        val event = Arguments.createMap()
        event.putDouble("timestamp", ms)

        // For a DirectEvent onChange, the native event name is "topChange"
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topChange", event)
    }
}