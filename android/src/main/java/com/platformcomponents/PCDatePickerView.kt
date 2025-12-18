package com.platformcomponents.datepicker

import android.app.Activity
import android.content.Context
import android.view.View
import android.widget.FrameLayout
import android.widget.TimePicker
import android.widget.DatePicker
import androidx.appcompat.view.ContextThemeWrapper
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import java.util.Calendar
import java.util.TimeZone

class PCDatePickerView(context: Context) : FrameLayout(context) {

  // ---------- Props ----------

  var mode: String = "date" // "date" | "time" | "dateAndTime" | "countDownTimer"
    set(value) {
      field = value
      updateInline()
    }

  var presentation: String = "modal" // "modal" | "inline"
    set(value) {
      field = value
      updateInline()
      updateFromProps()
    }

  /** modal only: "open" | "closed" */
  var visible: String = "closed"
    set(value) {
      field = value
      updateFromProps()
    }

  /** sentinel -1 */
  var dateMs: Double = -1.0
    set(value) {
      field = value
      updateInline()
    }

  var minDateMs: Double = -1.0
    set(value) { field = value }

  var maxDateMs: Double = -1.0
    set(value) { field = value }

  var locale: String? = null
  var timeZoneName: String? = null

  // Android specific
  var firstDayOfWeek: Int? = null // 1..7
  var dialogTitle: String? = null
  var positiveButtonTitle: String? = null
  var negativeButtonTitle: String? = null

  /** android.material: "auto" | "m2" | "m3" */
  var material: String? = null
    set(value) {
      field = value
      // if dialogs open, rebuild on next open; no live retheme
    }

  // ---------- Events ----------

  var onConfirm: ((timestampMs: Double) -> Unit)? = null
  var onCancel: (() -> Unit)? = null

  // ---------- Inline widgets ----------

  private var inlineDatePicker: DatePicker? = null
  private var inlineTimePicker: TimePicker? = null

  init {
    updateInline()
  }

  private fun updateInline() {
    removeAllViews()

    if (presentation != "inline") {
      inlineDatePicker = null
      inlineTimePicker = null
      return
    }

    when (mode) {
      "time" -> {
        val tp = TimePicker(context)
        tp.setIs24HourView(false)
        inlineTimePicker = tp
        addView(tp, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        // set from dateMs if available
        if (dateMs >= 0) {
          val cal = calForMs(dateMs)
          tp.hour = cal.get(Calendar.HOUR_OF_DAY)
          tp.minute = cal.get(Calendar.MINUTE)
        }
        tp.setOnTimeChangedListener { _, h, m ->
          val cal = calForMs(dateMs.takeIf { it >= 0 } ?: System.currentTimeMillis().toDouble())
          cal.set(Calendar.HOUR_OF_DAY, h)
          cal.set(Calendar.MINUTE, m)
          cal.set(Calendar.SECOND, 0)
          cal.set(Calendar.MILLISECOND, 0)
          onConfirm?.invoke(cal.timeInMillis.toDouble())
        }
      }

      else -> {
        // "date" or "dateAndTime" or unsupported -> date inline
        val dp = DatePicker(context)
        inlineDatePicker = dp
        addView(dp, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        if (dateMs >= 0) {
          val cal = calForMs(dateMs)
          dp.updateDate(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH))
        }

        dp.setOnDateChangedListener { _, y, mo, d ->
          val cal = calForMs(dateMs.takeIf { it >= 0 } ?: System.currentTimeMillis().toDouble())
          cal.set(Calendar.YEAR, y)
          cal.set(Calendar.MONTH, mo)
          cal.set(Calendar.DAY_OF_MONTH, d)
          cal.set(Calendar.SECOND, 0)
          cal.set(Calendar.MILLISECOND, 0)
          onConfirm?.invoke(cal.timeInMillis.toDouble())
        }
      }
    }
  }

  private fun updateFromProps() {
    if (presentation != "modal") return

    if (visible == "open") {
      presentIfNeeded()
    } else {
      // We don’t hold references to Material dialogs here (they’re Fragment-based),
      // so "closed" is best-effort: no-op if already dismissed.
    }
  }

  private fun presentIfNeeded() {
    val activity = findActivity() ?: return
    if (mode == "time") {
      presentTime(activity)
    } else if (mode == "dateAndTime") {
      presentDateThenTime(activity)
    } else {
      // default "date"
      presentDate(activity)
    }
  }

  private fun themedContext(mode: String): Context {
    val themeRes = when (mode) {
      "m3" -> resolveMaterial3Theme()
      "m2" -> resolveMaterial2Theme()
      else -> 0
    }
    return if (themeRes != 0) ContextThemeWrapper(context, themeRes) else context
  }

  private fun resolveMaterial2Theme(): Int {
    // Use MaterialComponents overlays (works for both date/time pickers)
    return try {
      com.google.android.material.R.style.ThemeOverlay_MaterialComponents_MaterialAlertDialog
    } catch (_: Throwable) {
      0
    }
  }

  private fun resolveMaterial3Theme(): Int {
    return try {
      com.google.android.material.R.style.ThemeOverlay_Material3_MaterialAlertDialog
    } catch (_: Throwable) {
      resolveMaterial2Theme()
    }
  }

  private fun presentDate(activity: Activity) {
    val mode = material ?: "auto"
    val ctx = themedContext(mode)

    val builder = MaterialDatePicker.Builder.datePicker()

    // title
    dialogTitle?.let { builder.setTitleText(it) }

    // selection
    val sel = if (dateMs >= 0) dateMs.toLong() else MaterialDatePicker.todayInUtcMilliseconds()
    builder.setSelection(sel)

    // constraints (min/max)
    val constraints = DateConstraints.build(minDateMs, maxDateMs, firstDayOfWeek)
    if (constraints != null) builder.setCalendarConstraints(constraints)

    // theme
    // MaterialDatePicker uses theme set via builder.setTheme()
    val themeRes = (ctx as? ContextThemeWrapper)?.themeResId ?: 0
    if (themeRes != 0) builder.setTheme(themeRes)

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener { millis ->
      onConfirm?.invoke(millis.toDouble())
    }
    picker.addOnNegativeButtonClickListener {
      onCancel?.invoke()
    }
    picker.addOnCancelListener {
      onCancel?.invoke()
    }
    picker.addOnDismissListener {
      // Headless JS should set visible to closed via onCancel/onConfirm. We still emit cancel if nothing else fired.
    }

    picker.show(activity.fragmentManager, "PCDatePicker_date")
  }

  private fun presentTime(activity: Activity) {
    val mode = material ?: "auto"
    val ctx = themedContext(mode)

    val cal = calForMs(dateMs.takeIf { it >= 0 } ?: System.currentTimeMillis().toDouble())
    val hour = cal.get(Calendar.HOUR_OF_DAY)
    val minute = cal.get(Calendar.MINUTE)

    val builder = MaterialTimePicker.Builder()
      .setTimeFormat(TimeFormat.CLOCK_12H)
      .setHour(hour)
      .setMinute(minute)

    dialogTitle?.let { builder.setTitleText(it) }

    val themeRes = (ctx as? ContextThemeWrapper)?.themeResId ?: 0
    if (themeRes != 0) builder.setTheme(themeRes)

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener {
      val c = calForMs(dateMs.takeIf { it >= 0 } ?: System.currentTimeMillis().toDouble())
      c.set(Calendar.HOUR_OF_DAY, picker.hour)
      c.set(Calendar.MINUTE, picker.minute)
      c.set(Calendar.SECOND, 0)
      c.set(Calendar.MILLISECOND, 0)
      onConfirm?.invoke(c.timeInMillis.toDouble())
    }

    picker.addOnNegativeButtonClickListener { onCancel?.invoke() }
    picker.addOnCancelListener { onCancel?.invoke() }

    picker.show(activity.fragmentManager, "PCDatePicker_time")
  }

  private fun presentDateThenTime(activity: Activity) {
    // Date picker first; on confirm, time picker.
    val mode = material ?: "auto"
    val ctx = themedContext(mode)

    val builder = MaterialDatePicker.Builder.datePicker()
    dialogTitle?.let { builder.setTitleText(it) }

    val sel = if (dateMs >= 0) dateMs.toLong() else MaterialDatePicker.todayInUtcMilliseconds()
    builder.setSelection(sel)

    val constraints = DateConstraints.build(minDateMs, maxDateMs, firstDayOfWeek)
    if (constraints != null) builder.setCalendarConstraints(constraints)

    val themeRes = (ctx as? ContextThemeWrapper)?.themeResId ?: 0
    if (themeRes != 0) builder.setTheme(themeRes)

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener { millis ->
      // store date, then show time
      val base = calForMs(millis.toDouble())
      val existing = calForMs(dateMs.takeIf { it >= 0 } ?: System.currentTimeMillis().toDouble())
      base.set(Calendar.HOUR_OF_DAY, existing.get(Calendar.HOUR_OF_DAY))
      base.set(Calendar.MINUTE, existing.get(Calendar.MINUTE))
      base.set(Calendar.SECOND, 0)
      base.set(Calendar.MILLISECOND, 0)

      // now show time picker with base date
      dateMs = base.timeInMillis.toDouble()
      presentTime(activity)
    }

    picker.addOnNegativeButtonClickListener { onCancel?.invoke() }
    picker.addOnCancelListener { onCancel?.invoke() }

    picker.show(activity.fragmentManager, "PCDatePicker_dateThenTime")
  }

  private fun calForMs(ms: Double): Calendar {
    val tz = timeZoneName?.let { TimeZone.getTimeZone(it) } ?: TimeZone.getDefault()
    return Calendar.getInstance(tz).apply { timeInMillis = ms.toLong() }
  }

  private fun findActivity(): Activity? {
    var ctx: Context? = context
    while (ctx is ContextWrapper) {
      if (ctx is Activity) return ctx
      ctx = ctx.baseContext
    }
    return null
  }
}