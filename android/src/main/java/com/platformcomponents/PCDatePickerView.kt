package com.platformcomponents

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import android.view.View
import android.widget.FrameLayout
import androidx.fragment.app.FragmentActivity
import com.google.android.material.datepicker.CalendarConstraints
import com.google.android.material.datepicker.CompositeDateValidator
import com.google.android.material.datepicker.DateValidatorPointBackward
import com.google.android.material.datepicker.DateValidatorPointForward
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import java.util.Calendar
import java.util.TimeZone

class PCDatePickerView(context: Context) : FrameLayout(context) {

  // ---- Spec props ----
  var mode: String = "date"
  var presentation: String = "modal" // "modal" | "inline"
  var visible: String = "closed"     // "open" | "closed" (modal only)

  var locale: String? = null
  var timeZoneName: String? = null

  var dateMs: Long? = null
  var minDateMs: Long? = null
  var maxDateMs: Long? = null

  // Android props (spec)
  var firstDayOfWeek: Int? = null
  var material: String? = null       // "auto" | "m2" | "m3"
  var dialogTitle: String? = null
  var positiveButtonTitle: String? = null
  var negativeButtonTitle: String? = null

  // Events (manager wires these)
  var onConfirm: ((Double) -> Unit)? = null
  var onCancel: (() -> Unit)? = null

  private var showing = false

  init {
    visibility = View.VISIBLE
    minimumHeight = 0
    minimumWidth = 0
  }

  // --- Apply methods used by Manager ---

  fun applyMode(value: String?) {
    mode = value ?: "date"
    if (showing) dismissIfNeeded()
  }

  fun applyPresentation(value: String?) {
    presentation = when (value) {
      "modal", "inline" -> value
      else -> "modal"
    }
    requestLayout()
    if (presentation != "modal" && showing) dismissIfNeeded()
  }

  fun applyVisible(value: String?) {
    visible = when (value) {
      "open", "closed" -> value
      else -> "closed"
    }
    if (presentation != "modal") return

    if (visible == "open") presentIfNeeded()
    else dismissIfNeeded()
  }

  fun applyLocale(value: String?) {
    locale = value
  }

  fun applyTimeZoneName(value: String?) {
    timeZoneName = value
  }

  fun applyDateMs(ms: Long?) {
    dateMs = ms
  }

  fun applyMinDateMs(ms: Long?) {
    minDateMs = ms
  }

  fun applyMaxDateMs(ms: Long?) {
    maxDateMs = ms
  }

  fun applyAndroidConfig(
    firstDayOfWeek: Int?,
    material: String?,
    dialogTitle: String?,
    positiveButtonTitle: String?,
    negativeButtonTitle: String?,
  ) {
    this.firstDayOfWeek = firstDayOfWeek
    this.material = material
    this.dialogTitle = dialogTitle
    this.positiveButtonTitle = positiveButtonTitle
    this.negativeButtonTitle = negativeButtonTitle
  }

  // Modal should be headless (0x0)
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (presentation == "modal") {
      setMeasuredDimension(0, 0)
      return
    }
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  private fun presentIfNeeded() {
    if (showing) return
    val act = findFragmentActivity() ?: run {
      onCancel?.invoke()
      return
    }

    showing = true

    val requested = parseMaterialMode(material)
    val resolved = resolveAutoMaterialMode(act, requested)

    when (mode) {
      "time" -> showTime(act, resolved)
      "dateAndTime" -> showDateThenTime(act, resolved)
      "countDownTimer" -> showTime(act, resolved) // Android doesn't have countDown dialog; treat as time
      else -> showDate(act, resolved)
    }
  }

  private fun dismissIfNeeded() {
    // Dialogs dismiss themselves; we just reset state.
    if (!showing) return
    showing = false
  }

  private fun showDateThenTime(act: FragmentActivity, m: PCMaterialMode) {
    showDate(act, m) { pickedDate ->
      // store date part then show time
      dateMs = pickedDate
      showTime(act, m) { pickedDateTime ->
        onConfirm?.invoke(pickedDateTime.toDouble())
        showing = false
      }
    }
  }

  private fun showDate(
    act: FragmentActivity,
    m: PCMaterialMode,
    onPicked: ((Long) -> Unit)? = null
  ) {
    if (m == PCMaterialMode.M3) {
      showMaterial3Date(act, onPicked)
    } else {
      showMaterial2Date(act, onPicked)
    }
  }

  private fun showTime(
    act: FragmentActivity,
    m: PCMaterialMode,
    onPicked: ((Long) -> Unit)? = null
  ) {
    if (m == PCMaterialMode.M3) {
      showMaterial3Time(act, onPicked)
    } else {
      showMaterial2Time(act, onPicked)
    }
  }

  // --------------------------
  // M2 (platform dialogs)
  // --------------------------

  private fun showMaterial2Date(act: FragmentActivity, onPicked: ((Long) -> Unit)?) {
    val cal = calendarFor(dateMs ?: System.currentTimeMillis())

    val dlg = DatePickerDialog(
      act,
      { _, year, month, day ->
        val pickedCal = calendarFor(dateMs ?: System.currentTimeMillis())
        pickedCal.set(Calendar.YEAR, year)
        pickedCal.set(Calendar.MONTH, month)
        pickedCal.set(Calendar.DAY_OF_MONTH, day)
        pickedCal.set(Calendar.HOUR_OF_DAY, 0)
        pickedCal.set(Calendar.MINUTE, 0)
        pickedCal.set(Calendar.SECOND, 0)
        pickedCal.set(Calendar.MILLISECOND, 0)

        val picked = pickedCal.timeInMillis
        if (onPicked != null) onPicked(picked)
        else {
          onConfirm?.invoke(picked.toDouble())
          showing = false
        }
      },
      cal.get(Calendar.YEAR),
      cal.get(Calendar.MONTH),
      cal.get(Calendar.DAY_OF_MONTH)
    )

    // constraints
    minDateMs?.let { dlg.datePicker.minDate = it }
    maxDateMs?.let { dlg.datePicker.maxDate = it }

    dlg.setOnCancelListener {
      onCancel?.invoke()
      showing = false
    }

    dlg.setOnDismissListener {
      // if user dismissed by back/outside
      if (visible == "open") onCancel?.invoke()
      showing = false
    }

    dlg.show()
  }

  private fun showMaterial2Time(act: FragmentActivity, onPicked: ((Long) -> Unit)?) {
    val base = dateMs ?: System.currentTimeMillis()
    val cal = calendarFor(base)

    val dlg = TimePickerDialog(
      act,
      { _, hour, minute ->
        val out = calendarFor(base)
        out.set(Calendar.HOUR_OF_DAY, hour)
        out.set(Calendar.MINUTE, minute)
        out.set(Calendar.SECOND, 0)
        out.set(Calendar.MILLISECOND, 0)
        val picked = out.timeInMillis
        if (onPicked != null) onPicked(picked)
        else {
          onConfirm?.invoke(picked.toDouble())
          showing = false
        }
      },
      cal.get(Calendar.HOUR_OF_DAY),
      cal.get(Calendar.MINUTE),
      true
    )

    dlg.setOnCancelListener {
      onCancel?.invoke()
      showing = false
    }

    dlg.setOnDismissListener {
      if (visible == "open") onCancel?.invoke()
      showing = false
    }

    dlg.show()
  }

  // --------------------------
  // M3 (Material Components)
  // --------------------------

  private fun showMaterial3Date(act: FragmentActivity, onPicked: ((Long) -> Unit)?) {
    val builder = MaterialDatePicker.Builder.datePicker()

    dialogTitle?.let { builder.setTitleText(it) }
    positiveButtonTitle?.let { builder.setPositiveButtonText(it) }
    negativeButtonTitle?.let { builder.setNegativeButtonText(it) }

    dateMs?.let { if (it >= 0) builder.setSelection(it) }

    buildDateConstraints(minDateMs, maxDateMs)?.let { builder.setCalendarConstraints(it) }

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener { utcMillis ->
      val picked = utcMillis
      if (onPicked != null) onPicked(picked)
      else {
        onConfirm?.invoke(picked.toDouble())
        showing = false
      }
    }

    picker.addOnNegativeButtonClickListener {
      onCancel?.invoke()
      showing = false
    }
    picker.addOnCancelListener {
      onCancel?.invoke()
      showing = false
    }
    picker.addOnDismissListener {
      if (visible == "open") onCancel?.invoke()
      showing = false
    }

    picker.show(act.supportFragmentManager, "PCDatePicker_date_m3")
  }

  private fun showMaterial3Time(act: FragmentActivity, onPicked: ((Long) -> Unit)?) {
    val base = dateMs ?: System.currentTimeMillis()
    val cal = calendarFor(base)

    val picker = MaterialTimePicker.Builder()
      .setTimeFormat(TimeFormat.CLOCK_24H)
      .setHour(cal.get(Calendar.HOUR_OF_DAY))
      .setMinute(cal.get(Calendar.MINUTE))
      .apply { dialogTitle?.let { setTitleText(it) } }
      .build()

    picker.addOnPositiveButtonClickListener {
      val out = calendarFor(base)
      out.set(Calendar.HOUR_OF_DAY, picker.hour)
      out.set(Calendar.MINUTE, picker.minute)
      out.set(Calendar.SECOND, 0)
      out.set(Calendar.MILLISECOND, 0)
      val picked = out.timeInMillis
      if (onPicked != null) onPicked(picked)
      else {
        onConfirm?.invoke(picked.toDouble())
        showing = false
      }
    }

    picker.addOnNegativeButtonClickListener {
      onCancel?.invoke()
      showing = false
    }
    picker.addOnCancelListener {
      onCancel?.invoke()
      showing = false
    }
    picker.addOnDismissListener {
      if (visible == "open") onCancel?.invoke()
      showing = false
    }

    picker.show(act.supportFragmentManager, "PCDatePicker_time_m3")
  }

  private fun buildDateConstraints(minMs: Long?, maxMs: Long?): CalendarConstraints? {
    val validators = ArrayList<CalendarConstraints.DateValidator>(2)
    if (minMs != null) validators.add(DateValidatorPointForward.from(minMs))
    if (maxMs != null) validators.add(DateValidatorPointBackward.before(maxMs + 1))
    if (validators.isEmpty()) return null
    val v = if (validators.size == 1) validators[0] else CompositeDateValidator.allOf(validators)
    return CalendarConstraints.Builder().setValidator(v).build()
  }

  private fun calendarFor(ms: Long): Calendar {
    val tz = timeZoneName?.let { TimeZone.getTimeZone(it) } ?: TimeZone.getDefault()
    return Calendar.getInstance(tz).apply { timeInMillis = ms }
  }

  private fun findFragmentActivity(): FragmentActivity? =
    context as? FragmentActivity
}
