package com.platformcomponents

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.DialogInterface
import android.util.Log
import android.widget.DatePicker
import android.widget.FrameLayout
import android.widget.TimePicker
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.android.material.datepicker.CalendarConstraints
import com.google.android.material.datepicker.CompositeDateValidator
import com.google.android.material.datepicker.DateValidatorPointBackward
import com.google.android.material.datepicker.DateValidatorPointForward
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Android implementation of the DatePicker view.
 *
 * - mode: "date" | "time"
 * - presentation: "modal" | "inline"
 * - android.useMaterial3: try M3 modal pickers if theme supports them,
 *   otherwise silently fall back to platform dialogs.
 * - android.firstDayOfWeek: applied to platform DatePicker / DatePickerDialog.
 *
 * Inline is ALWAYS the platform DatePicker (never M3-only widgets).
 */
class DatePickerView(
    private val reactContext: ThemedReactContext
) : FrameLayout(reactContext),
    DatePickerDialog.OnDateSetListener,
    TimePickerDialog.OnTimeSetListener {

    // ------------------------------------------------------------------------
    // Child widgets / dialogs
    // ------------------------------------------------------------------------

    // Inline (platform) DatePicker
    private var inlinePicker: DatePicker? = null

    // Platform dialogs
    private var dateDialog: DatePickerDialog? = null
    private var timeDialog: TimePickerDialog? = null

    // Material 3 dialogs
    private var materialDatePicker: MaterialDatePicker<Long>? = null
    private var materialTimePicker: MaterialTimePicker? = null

    // ------------------------------------------------------------------------
    // Props
    // ------------------------------------------------------------------------

    private var mode: String = "date"          // "date" | "time"
    private var presentation: String = "modal" // "modal" | "inline"
    private var visible: String = "closed"     // "open" | "closed"

    private var dateMs: Long? = null           // controlled value (nullable)
    private var minDateMs: Long? = null
    private var maxDateMs: Long? = null

    private var localeTag: String? = null
    private var timeZoneId: String? = null

    private var androidConfig: ReadableMap? = null
    private var useMaterial3: Boolean = false
    private var firstDayOfWeek: Int? = null

    private var lastEmittedMs: Long? = null

    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------

    private val locale: Locale
        get() = localeTag?.let { Locale.forLanguageTag(it) } ?: Locale.getDefault()

    private val timeZone: TimeZone
        get() = timeZoneId?.let { TimeZone.getTimeZone(it) } ?: TimeZone.getDefault()

    /**
     * Returns true iff:
     *  - JS requested android.useMaterial3 === true, AND
     *  - The current theme actually defines materialCalendarTheme
     *    (otherwise MaterialDatePicker will crash).
     *
     * If this returns false, we ALWAYS fallback to platform dialogs.
     */
    private fun supportsMaterial3Pickers(): Boolean {
        if (!useMaterial3) return false
        return try {
            val attrs = intArrayOf(com.google.android.material.R.attr.materialCalendarTheme)
            val ta = context.obtainStyledAttributes(attrs)
            val hasValue = ta.hasValue(0)
            ta.recycle()
            if (!hasValue) {
                Log.w(
                    "DatePickerView",
                    "Theme has no materialCalendarTheme; disabling M3 pickers."
                )
            }
            hasValue
        } catch (e: Exception) {
            Log.w(
                "DatePickerView",
                "Error checking materialCalendarTheme; disabling M3 pickers.",
                e
            )
            false
        }
    }

    init {
        isClickable = true
        isFocusable = true

        val density = resources.displayMetrics.density
        minimumHeight = (44 * density).toInt()

        // Only meaningful for modal; inline is just a view.
        setOnClickListener {
            if (presentation == "modal") {
                visible = "open"
                showDialog()
            }
        }
    }

    // ------------------------------------------------------------------------
    // Props from Manager
    // ------------------------------------------------------------------------

    fun setMode(value: String?) {
        val newMode = when (value) {
            "time" -> "time"
            else -> "date"
        }
        if (mode == newMode) return
        mode = newMode

        if (presentation == "inline") {
            // Inline is date-only on Android.
            removeInlinePicker()
            if (mode == "date") {
                ensureInlinePicker()
            }
        } else {
            if (visible == "open") {
                dismissAllDialogs()
                showDialog()
            }
        }
    }

    fun setPresentation(value: String?) {
        val newPresentation = when (value) {
            "inline", "modal" -> value
            else -> "modal"
        } ?: "modal"

        if (presentation == newPresentation) return
        presentation = newPresentation

        when (presentation) {
            "inline" -> {
                visible = "closed"
                dismissAllDialogs()
                if (mode == "date") {
                    ensureInlinePicker()
                    requestLayout()
                } else {
                    removeInlinePicker()
                }
            }
            "modal" -> {
                removeInlinePicker()
            }
        }
    }

    fun setVisible(value: String?) {
        val newVisible = when (value) {
            "open", "closed" -> value
            null -> "closed"
            else -> "closed"
        } ?: "closed"

        if (visible == newVisible) return
        visible = newVisible

        if (presentation == "modal") {
            if (visible == "open") {
                showDialog()
            } else {
                dismissAllDialogs()
            }
        }
    }

    fun setLocale(value: String?) {
        if (localeTag == value) return
        localeTag = value
        applyDateToWidgets()
    }

    fun setTimeZone(value: String?) {
        if (timeZoneId == value) return
        timeZoneId = value
        applyDateToWidgets()
    }

    fun setDateMs(value: Double?) {
        val newValue = value?.toLong()
        if (dateMs == newValue) return
        dateMs = newValue
        applyDateToWidgets()
    }

    fun setMinDateMs(value: Double?) {
        val newValue = value?.toLong()
        if (minDateMs == newValue) return
        minDateMs = newValue
        applyConstraints()
    }

    fun setMaxDateMs(value: Double?) {
        val newValue = value?.toLong()
        if (maxDateMs == newValue) return
        maxDateMs = newValue
        applyConstraints()
    }

    fun setAndroidConfig(map: ReadableMap?) {
        androidConfig = map
        useMaterial3 = map?.getBoolean("useMaterial3") ?: false
        firstDayOfWeek =
            if (map != null && map.hasKey("firstDayOfWeek")) map.getInt("firstDayOfWeek") else null

        applyConstraints()
    }

    // ------------------------------------------------------------------------
    // Inline picker (platform DatePicker only)
    // ------------------------------------------------------------------------

    private fun ensureInlinePicker() {
        if (mode != "date") {
            removeInlinePicker()
            return
        }

        if (inlinePicker != null) {
            applyDateToInlinePicker()
            applyConstraintsTo(inlinePicker!!)
            return
        }

        val picker = DatePicker(context).apply {
            layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT
            )
        }

        val cal = buildInitialCalendar()
        picker.init(
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        ) { _: DatePicker, year: Int, month: Int, dayOfMonth: Int ->
            handleDateChangedFromWidget(year, month, dayOfMonth)
        }

        addView(picker)
        inlinePicker = picker
        applyConstraintsTo(picker)

        requestLayout()
    }

    private fun removeInlinePicker() {
        inlinePicker?.let { picker ->
            if (picker.parent === this) {
                removeView(picker)
            }
        }
        inlinePicker = null
    }

    // ------------------------------------------------------------------------
    // Modal dialogs
    // ------------------------------------------------------------------------

    private fun showDialog() {
        val wantsM3 = supportsMaterial3Pickers()

        if (mode == "time") {
            if (wantsM3) {
                showMaterialTimePicker()
            } else {
                showPlatformTimeDialog()
            }
        } else {
            if (wantsM3) {
                showMaterialDatePicker()
            } else {
                showPlatformDateDialog()
            }
        }
    }

    // -- Platform -------------------------------------------------------------

    private fun showPlatformDateDialog() {
        val cal = buildInitialCalendar()

        val dlg = DatePickerDialog(
            context,
            this,
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        )

        minDateMs?.let { dlg.datePicker.minDate = it }
        maxDateMs?.let { dlg.datePicker.maxDate = it }
        firstDayOfWeek?.let { dlg.datePicker.firstDayOfWeek = it }

        dlg.setOnDismissListener { _: DialogInterface ->
            visible = "closed"
        }

        dlg.setOnCancelListener {
            visible = "closed"
            sendCancelEvent()
        }

        dateDialog = dlg
        visible = "open"
        dlg.show()
    }

    private fun showPlatformTimeDialog() {
        val cal = buildInitialCalendar()
        val is24Hour = android.text.format.DateFormat.is24HourFormat(context)

        val dlg = TimePickerDialog(
            context,
            this,
            cal.get(Calendar.HOUR_OF_DAY),
            cal.get(Calendar.MINUTE),
            is24Hour
        )

        dlg.setOnDismissListener {
            visible = "closed"
        }

        dlg.setOnCancelListener {
            visible = "closed"
            sendCancelEvent()
        }

        timeDialog = dlg
        visible = "open"
        dlg.show()
    }

    // -- Material 3 -----------------------------------------------------------

    private fun buildCalendarConstraints(): CalendarConstraints? {
        if (minDateMs == null && maxDateMs == null) return null

        val builder = CalendarConstraints.Builder()
        val validators = mutableListOf<CalendarConstraints.DateValidator>()

        minDateMs?.let { validators.add(DateValidatorPointForward.from(it)) }
        maxDateMs?.let { validators.add(DateValidatorPointBackward.before(it + 1)) }

        if (validators.isNotEmpty()) {
            builder.setValidator(CompositeDateValidator.allOf(validators))
        }

        firstDayOfWeek?.let { builder.setFirstDayOfWeek(it) }

        return builder.build()
    }

    private fun showMaterialDatePicker() {
        val activity = reactContext.currentActivity
        if (activity !is FragmentActivity || activity.isFinishing) {
            showPlatformDateDialog()
            return
        }

        try {
            val selectionMs = dateMs ?: System.currentTimeMillis()
            val constraints = buildCalendarConstraints()

            val builder = MaterialDatePicker.Builder.datePicker()
                .setSelection(selectionMs)

            constraints?.let { builder.setCalendarConstraints(it) }

            val picker = builder.build()

            picker.addOnPositiveButtonClickListener { sel ->
                val ms = sel ?: return@addOnPositiveButtonClickListener
                dateMs = ms
                lastEmittedMs = ms
                visible = "closed"
                sendConfirmEvent(ms.toDouble())
            }

            picker.addOnNegativeButtonClickListener {
                visible = "closed"
                sendCancelEvent()
            }

            picker.addOnCancelListener {
                visible = "closed"
                sendCancelEvent()
            }

            picker.addOnDismissListener {
                visible = "closed"
            }

            materialDatePicker = picker
            visible = "open"
            picker.show(activity.supportFragmentManager, "MaterialDatePicker")
        } catch (e: IllegalArgumentException) {
            // Theme still not right? Log & fallback.
            Log.w(
                "DatePickerView",
                "MaterialDatePicker crashed; falling back to platform DatePickerDialog",
                e
            )
            showPlatformDateDialog()
        }
    }

    private fun showMaterialTimePicker() {
        val activity = reactContext.currentActivity
        if (activity !is FragmentActivity || activity.isFinishing) {
            showPlatformTimeDialog()
            return
        }

        try {
            val cal = buildInitialCalendar()
            val is24Hour = android.text.format.DateFormat.is24HourFormat(context)
            val timeFormat = if (is24Hour) TimeFormat.CLOCK_24H else TimeFormat.CLOCK_12H

            val builder = MaterialTimePicker.Builder()
                .setTimeFormat(timeFormat)
                .setHour(cal.get(Calendar.HOUR_OF_DAY))
                .setMinute(cal.get(Calendar.MINUTE))

            val picker = builder.build()

            picker.addOnPositiveButtonClickListener {
                val resultCal = buildInitialCalendar()
                resultCal.set(Calendar.HOUR_OF_DAY, picker.hour)
                resultCal.set(Calendar.MINUTE, picker.minute)
                resultCal.set(Calendar.SECOND, 0)
                resultCal.set(Calendar.MILLISECOND, 0)

                val ms = resultCal.timeInMillis
                dateMs = ms
                lastEmittedMs = ms
                visible = "closed"
                sendConfirmEvent(ms.toDouble())
            }

            picker.addOnNegativeButtonClickListener {
                visible = "closed"
                sendCancelEvent()
            }

            picker.addOnCancelListener {
                visible = "closed"
                sendCancelEvent()
            }

            picker.addOnDismissListener {
                visible = "closed"
            }

            materialTimePicker = picker
            visible = "open"
            picker.show(activity.supportFragmentManager, "MaterialTimePicker")
        } catch (e: IllegalArgumentException) {
            Log.w(
                "DatePickerView",
                "MaterialTimePicker crashed; falling back to platform TimePickerDialog",
                e
            )
            showPlatformTimeDialog()
        }
    }

    // ------------------------------------------------------------------------
    // Dialog cleanup / lifecycle
    // ------------------------------------------------------------------------

    private fun dismissAllDialogs() {
        dateDialog?.setOnDismissListener(null)
        dateDialog?.setOnCancelListener(null)
        dateDialog?.dismiss()
        dateDialog = null

        timeDialog?.setOnDismissListener(null)
        timeDialog?.setOnCancelListener(null)
        timeDialog?.dismiss()
        timeDialog = null

        materialDatePicker?.dismissAllowingStateLoss()
        materialDatePicker = null

        materialTimePicker?.dismiss()
        materialTimePicker = null
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        dismissAllDialogs()
    }

    // ------------------------------------------------------------------------
    // Layout / measure
    // ------------------------------------------------------------------------

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (presentation == "inline" && mode == "date") {
            ensureInlinePicker()
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        if (presentation == "inline") {
            ensureInlinePicker()
            val child = inlinePicker

            if (child != null) {
                val screenWidth = resources.displayMetrics.widthPixels
                var widthSize = MeasureSpec.getSize(widthMeasureSpec)
                if (widthSize == 0) {
                    widthSize = screenWidth
                }

                val childWidthSpec =
                    MeasureSpec.makeMeasureSpec(widthSize, MeasureSpec.EXACTLY)
                val childHeightSpec =
                    MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)

                child.measure(childWidthSpec, childHeightSpec)

                var measuredHeight = child.measuredHeight
                if (measuredHeight == 0) {
                    val density = resources.displayMetrics.density
                    measuredHeight = (216 * density).toInt()
                }

                setMeasuredDimension(widthSize, measuredHeight)
                return
            }
        }

        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        inlinePicker?.let { picker ->
            val width = right - left
            val height = bottom - top
            picker.layout(0, 0, width, height)
        }
    }

    // ------------------------------------------------------------------------
    // Date/time helpers
    // ------------------------------------------------------------------------

    private fun buildInitialCalendar(): Calendar {
        val cal = Calendar.getInstance(timeZone, locale)
        val baseMs = dateMs ?: System.currentTimeMillis()
        cal.timeInMillis = baseMs
        return cal
    }

    private fun applyDateToWidgets() {
        applyDateToInlinePicker()
        applyDateToPlatformDialog()
        // M3 dialogs read date when shown; no live update needed.
    }

    private fun applyDateToInlinePicker() {
        val picker = inlinePicker ?: return
        val cal = buildInitialCalendar()
        picker.init(
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        ) { _: DatePicker, year: Int, month: Int, dayOfMonth: Int ->
            handleDateChangedFromWidget(year, month, dayOfMonth)
        }
    }

    private fun applyDateToPlatformDialog() {
        val dlg = dateDialog ?: return
        val cal = buildInitialCalendar()
        dlg.updateDate(
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        )
    }

    private fun applyConstraints() {
        inlinePicker?.let { applyConstraintsTo(it) }
        dateDialog?.datePicker?.let { applyConstraintsTo(it) }
        // M3 date constraints are applied when building picker.
    }

    private fun applyConstraintsTo(picker: DatePicker) {
        minDateMs?.let { picker.minDate = it }
        maxDateMs?.let { picker.maxDate = it }
        firstDayOfWeek?.let { picker.firstDayOfWeek = it }
    }

    private fun handleDateChangedFromWidget(year: Int, month: Int, dayOfMonth: Int) {
        val cal = Calendar.getInstance(timeZone, locale)
        cal.set(Calendar.YEAR, year)
        cal.set(Calendar.MONTH, month)
        cal.set(Calendar.DAY_OF_MONTH, dayOfMonth)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)

        val ms = cal.timeInMillis
        lastEmittedMs = ms
        dateMs = ms
        sendConfirmEvent(ms.toDouble())
    }

    override fun onDateSet(view: DatePicker, year: Int, month: Int, dayOfMonth: Int) {
        handleDateChangedFromWidget(year, month, dayOfMonth)
    }

    override fun onTimeSet(view: TimePicker, hourOfDay: Int, minute: Int) {
        val cal = buildInitialCalendar()
        cal.set(Calendar.HOUR_OF_DAY, hourOfDay)
        cal.set(Calendar.MINUTE, minute)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)

        val ms = cal.timeInMillis
        dateMs = ms
        lastEmittedMs = ms
        sendConfirmEvent(ms.toDouble())
    }

    // ------------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------------

    private fun sendConfirmEvent(ms: Double) {
        val event = Arguments.createMap()
        event.putDouble("timestampMs", ms)
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topConfirm", event)
    }

    private fun sendCancelEvent() {
        val event = Arguments.createMap()
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topCancel", event)
    }

    // ------------------------------------------------------------------------
    // Enabled state
    // ------------------------------------------------------------------------

    override fun setEnabled(enabled: Boolean) {
        super.setEnabled(enabled)
        alpha = if (enabled) 1.0f else 0.4f
        isClickable = enabled
        isFocusable = enabled
        inlinePicker?.isEnabled = enabled
    }
}