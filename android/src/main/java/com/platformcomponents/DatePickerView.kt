package com.platformcomponents

import android.app.DatePickerDialog
import android.content.DialogInterface
import android.widget.DatePicker
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Android implementation of the DatePicker view.
 *
 * Mirrors the iOS behavior:
 * - presentation: "modal" | "inline"
 * - visible: "open" | "closed" (only meaningful when presentation == "modal")
 * - Emits onConfirm(timestampMs) for both inline and modal selections
 * - Emits onCancel() when the modal dialog is dismissed without selecting.
 */
class DatePickerView(
    private val reactContext: ThemedReactContext
) : FrameLayout(reactContext), DatePickerDialog.OnDateSetListener {

    // --- Child widgets -------------------------------------------------------

    private var inlinePicker: DatePicker? = null
    private var dialog: DatePickerDialog? = null

    // --- Props ---------------------------------------------------------------

    // "date" | "time" | "dateAndTime" | "countDownTimer"
    // For now only "date" is actually honored on Android.
    private var mode: String = "date"

    // "inline" | "modal"
    private var presentation: String = "modal"

    // "open" | "closed" (for modal presentation)
    private var visible: String = "closed"

    // Controlled date in ms since Unix epoch (JS Date.getTime())
    private var dateMs: Long? = null

    // Min/max bounds in ms since Unix epoch
    private var minDateMs: Long? = null
    private var maxDateMs: Long? = null

    // Locale / time zone from JS (optional)
    private var localeTag: String? = null
    private var timeZoneId: String? = null

    // Android-specific configuration from JS (currently unused)
    private var androidConfig: ReadableMap? = null

    // Last value we emitted to JS
    private var lastEmittedMs: Long? = null

    // --- Derived helpers -----------------------------------------------------

    private val locale: Locale
        get() = localeTag?.let { Locale.forLanguageTag(it) } ?: Locale.getDefault()

    private val timeZone: TimeZone
        get() = timeZoneId?.let { TimeZone.getTimeZone(it) } ?: TimeZone.getDefault()

    // --- Init ----------------------------------------------------------------

    init {
        isClickable = true
        isFocusable = true

        // Reasonable default touch target
        val density = resources.displayMetrics.density
        minimumHeight = (44 * density).toInt()

        // Tap to open modal
        setOnClickListener {
            if (presentation == "modal") {
                if (dialog == null || dialog?.isShowing != true) {
                    showDialog()
                }
            }
        }
    }

    // --- Public setters called from Manager ---------------------------------

    fun setMode(value: String?) {
        val newMode = value ?: "date"
        if (mode == newMode) return
        mode = newMode
        // Hook for future "time"/"dateAndTime" support.
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
                dialog?.dismiss()
                dialog = null
                visible = "closed"
                ensureInlinePicker()
                requestLayout()   // <- important
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
                if (dialog == null || dialog?.isShowing != true) {
                    showDialog()
                }
            } else {
                dialog?.dismiss()
            }
        }
    }

    fun setLocale(value: String?) {
        if (localeTag == value) return
        localeTag = value
        // Mostly affects formatting JS side; kept for symmetry with iOS.
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
        // Reserved for platform-specific tweaks (calendar style, etc.).
    }

    // --- Inline picker management -------------------------------------------

    private fun ensureInlinePicker() {
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

        requestLayout()  // <- force RN to re-measure now that we have a child
    }

    private fun removeInlinePicker() {
        inlinePicker?.let { picker ->
            if (picker.parent === this) {
                removeView(picker)
            }
        }
        inlinePicker = null
    }

    // --- Modal dialog management --------------------------------------------

    private fun showDialog() {
        val cal = buildInitialCalendar()

        val dlg = DatePickerDialog(
            context,
            this,
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        )

        // Bounds
        minDateMs?.let { dlg.datePicker.minDate = it }
        maxDateMs?.let { dlg.datePicker.maxDate = it }

        dlg.setOnDismissListener { _: DialogInterface ->
            visible = "closed"
        }

        dlg.setOnCancelListener {
            visible = "closed"
            sendCancelEvent()
        }

        dialog = dlg
        visible = "open"
        dlg.show()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        dialog?.setOnDismissListener(null)
        dialog?.setOnCancelListener(null)
        dialog?.dismiss()
        dialog = null
    }

    // --- Layout / measurement -----------------------------------------------

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (presentation == "inline") {
            ensureInlinePicker()
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        if (presentation == "inline") {
            ensureInlinePicker()
            val child = inlinePicker

            if (child != null) {
                // If Yoga gives us 0 width, fall back to the screen width.
                val screenWidth = resources.displayMetrics.widthPixels
                var widthSize = MeasureSpec.getSize(widthMeasureSpec)
                if (widthSize == 0) {
                    widthSize = screenWidth
                }

                val childWidthSpec =
                    MeasureSpec.makeMeasureSpec(widthSize, MeasureSpec.EXACTLY)

                // Let the DatePicker tell us how tall it wants to be
                val childHeightSpec =
                    MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)

                child.measure(childWidthSpec, childHeightSpec)

                // If the child still reports 0 height, fall back to a sane default (like iOS wheel)
                val defaultHeightPx = (216 * resources.displayMetrics.density).toInt()
                val measuredHeight = child.measuredHeight
                    .takeIf { it > 0 }
                    ?.coerceAtLeast(minimumHeight)
                    ?: defaultHeightPx

                setMeasuredDimension(widthSize, measuredHeight)
                return
            }
        }

        // Fallback: modal mode -> default behavior
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

    // --- Date helpers --------------------------------------------------------

    private fun buildInitialCalendar(): Calendar {
        val cal = Calendar.getInstance(timeZone, locale)

        val baseMs = when {
            dateMs != null -> dateMs!!
            lastEmittedMs != null -> lastEmittedMs!!
            else -> System.currentTimeMillis()
        }

        cal.timeInMillis = baseMs
        return cal
    }

    private fun applyDateToWidgets() {
        applyDateToInlinePicker()
        applyDateToDialogPicker()
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

    private fun applyDateToDialogPicker() {
        val dlg = dialog ?: return
        val cal = buildInitialCalendar()
        dlg.updateDate(
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        )
    }

    private fun applyConstraints() {
        inlinePicker?.let { applyConstraintsTo(it) }
        dialog?.datePicker?.let { applyConstraintsTo(it) }
    }

    private fun applyConstraintsTo(picker: DatePicker) {
        minDateMs?.let { picker.minDate = it }
        maxDateMs?.let { picker.maxDate = it }
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

    // Called when user taps "OK" in the modal dialog
    override fun onDateSet(view: DatePicker, year: Int, month: Int, dayOfMonth: Int) {
        handleDateChangedFromWidget(year, month, dayOfMonth)
    }

    // --- Event emission ------------------------------------------------------

    private fun sendConfirmEvent(ms: Double) {
        val event = Arguments.createMap()
        // Match iOS / codegen: timestampMs
        event.putDouble("timestampMs", ms)

        // Direct event name for onConfirm => topConfirm
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topConfirm", event)
    }

    private fun sendCancelEvent() {
        val event = Arguments.createMap()

        // Direct event name for onCancel => topCancel
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topCancel", event)
    }

    // --- Enabled state -------------------------------------------------------

    override fun setEnabled(enabled: Boolean) {
        super.setEnabled(enabled)
        alpha = if (enabled) 1.0f else 0.4f
        isClickable = enabled
        isFocusable = enabled
        inlinePicker?.isEnabled = enabled
    }
}