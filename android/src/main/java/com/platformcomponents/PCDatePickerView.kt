package com.platformcomponents

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.DialogInterface
import android.os.Build
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.DatePicker
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TimePicker
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.datepicker.CalendarConstraints
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import kotlin.math.max
import kotlin.math.min

class PCDatePickerView(context: Context) : FrameLayout(context), ReactScrollViewHelper.HasStateWrapper {

  companion object {
    private const val TAG = "PCDatePicker"
  }

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Public props (set by manager) ---
  private var mode: String = "date" // "date" | "time" | "dateAndTime"
  private var presentation: String = "modal" // "inline" | "modal" | "popover" | "sheet" | "auto" (we treat non-inline as modal-ish)
  private var visible: String = "closed" // "open" | "closed" (only for non-inline)
  private var locale: Locale? = null
  private var timeZone: TimeZone = TimeZone.getDefault()

  private var dateMs: Long? = null
  private var minDateMs: Long? = null
  private var maxDateMs: Long? = null

  // --- Android config from nested `android` prop ---
  private var androidFirstDayOfWeek: Int? = null
  private var androidMaterialMode: PCMaterialMode = PCMaterialMode.SYSTEM // SYSTEM | M3
  private var androidDialogTitle: String? = null
  private var androidPositiveTitle: String? = null
  private var androidNegativeTitle: String? = null

  // --- Events (wired by manager) ---
  var onConfirm: ((Long) -> Unit)? = null
  var onCancel: (() -> Unit)? = null

  // --- Inline UI ---
  private var inlineContainer: LinearLayout? = null
  private var inlineDatePicker: DatePicker? = null
  private var inlineTimePicker: TimePicker? = null
  private var suppressInlineCallbacks = false

  // --- Modal state ---
  private var showingModal = false

  init {
    rebuildUI()
  }

  // Headless layout when not inline
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (!isInline()) {
      setMeasuredDimension(0, 0)
      return
    }
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (isInline()) {
      updateFrameSizeState()
    }
  }

  /**
   * Update Fabric state with the measured frame size.
   * This allows the shadow node to use actual measured dimensions for Yoga layout.
   */
  private fun updateFrameSizeState() {
    val wrapper = stateWrapper ?: return

    // Measure the inline container's preferred height
    inlineContainer?.let { container ->
      container.measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
      )

      val widthDp = PixelUtil.toDIPFromPixel(width.toFloat())
      val heightDp = PixelUtil.toDIPFromPixel(container.measuredHeight.toFloat())

      // Only update state if the size actually changed (avoid infinite loops)
      if (widthDp != lastReportedWidth || heightDp != lastReportedHeight) {
        lastReportedWidth = widthDp
        lastReportedHeight = heightDp

        Log.d(TAG, "updateFrameSizeState: width=$widthDp, height=$heightDp")

        val stateData = WritableNativeMap().apply {
          putDouble("width", widthDp.toDouble())
          putDouble("height", heightDp.toDouble())
        }
        wrapper.updateState(stateData)
      }
    }
  }

  // -----------------------------
  // Manager-facing apply* methods
  // -----------------------------

  fun applyMode(value: String?) {
    mode = when (value) {
      "date", "time", "dateAndTime" -> value
      else -> "date"
    }
    Log.d(TAG, "applyMode mode=$mode")
    rebuildUI()
  }

  fun applyPresentation(value: String?) {
    presentation = value ?: "modal"
    rebuildUI()
    // If we were showing and presentation changed, we’ll let JS drive visible again.
  }

  fun applyVisible(value: String?) {
    visible = when (value) {
      "open", "closed" -> value
      else -> "closed"
    }
    Log.d(TAG, "applyVisible visible=$visible isInline=${isInline()}")
    if (isInline()) return

    if (visible == "open") presentIfNeeded() else dismissIfNeeded()
  }

  fun applyLocale(value: String?) {
    locale =
      try {
        if (value.isNullOrBlank()) null else Locale.forLanguageTag(value)
      } catch (_: Throwable) {
        null
      }
    // Inline pickers don’t render strings; no-op other than storing.
  }

  fun applyTimeZoneName(value: String?) {
    timeZone =
      try {
        if (value.isNullOrBlank()) TimeZone.getDefault() else TimeZone.getTimeZone(value)
      } catch (_: Throwable) {
        TimeZone.getDefault()
      }
    // Update inline display
    syncInlineFromState()
  }

  fun applyDateMs(value: Long?) {
    dateMs = value
    syncInlineFromState()
  }

  fun applyMinDateMs(value: Long?) {
    minDateMs = value
    // clamp if needed
    dateMs = clamp(dateMs ?: System.currentTimeMillis())
    // Rebuild inline picker to apply new min date (avoids CalendarView bugs)
    if (isInline()) rebuildUI() else syncInlineFromState()
  }

  fun applyMaxDateMs(value: Long?) {
    maxDateMs = value
    // clamp if needed
    dateMs = clamp(dateMs ?: System.currentTimeMillis())
    // Rebuild inline picker to apply new max date (avoids CalendarView bugs)
    if (isInline()) rebuildUI() else syncInlineFromState()
  }

  /**
   * REQUIRED by your manager (nested `android` object).
   * Only supports material: "system" | "m3"
   */
  fun applyAndroidConfig(
    firstDayOfWeek: Int?,
    material: String?,
    dialogTitle: String?,
    positiveButtonTitle: String?,
    negativeButtonTitle: String?
  ) {
    androidFirstDayOfWeek = firstDayOfWeek

    androidMaterialMode = when (material) {
      "m3" -> PCMaterialMode.M3
      "system", null -> PCMaterialMode.SYSTEM
      else -> PCMaterialMode.SYSTEM
    }

    androidDialogTitle = dialogTitle
    androidPositiveTitle = positiveButtonTitle
    androidNegativeTitle = negativeButtonTitle

    // Inline date picker can use firstDayOfWeek in its internal Calendar calculations
    syncInlineFromState()
  }

  // -----------------------------
  // UI construction
  // -----------------------------

  private fun isInline(): Boolean = presentation == "inline" || presentation == "embedded"

  private fun rebuildUI() {
    removeAllViews()
    inlineContainer = null
    inlineDatePicker = null
    inlineTimePicker = null

    if (!isInline()) {
      requestLayout()
      return
    }

    val container = LinearLayout(context).apply {
      layoutParams = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
      )
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
    }

    // date and/or time
    if (mode == "date" || mode == "dateAndTime") {
      val dp = DatePicker(context).apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.WRAP_CONTENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
        // Use spinner mode to avoid CalendarView rendering bugs when scrolling months
        calendarViewShown = false
        spinnersShown = true
        // Defer min/max date setting to avoid CalendarView initialization race condition
        // where SimpleMonthView may not be fully detached yet during layout
        post {
          minDateMs?.let { minDate = it }
          maxDateMs?.let { maxDate = it }
        }
      }
      container.addView(dp)
      inlineDatePicker = dp

      dp.setOnDateChangedListener { _, year, month, day ->
        if (suppressInlineCallbacks) return@setOnDateChangedListener
        onInlineDateChanged(year, month, day)
      }
    }

    if (mode == "time" || mode == "dateAndTime") {
      val tp = TimePicker(context).apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.WRAP_CONTENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
        val is24 = android.text.format.DateFormat.is24HourFormat(context)
        setIs24HourView(is24)
      }
      container.addView(tp)
      inlineTimePicker = tp

      tp.setOnTimeChangedListener { _, hour, minute ->
        if (suppressInlineCallbacks) return@setOnTimeChangedListener
        onInlineTimeChanged(hour, minute)
      }
    }

    addView(container)
    inlineContainer = container

    syncInlineFromState()

    // Force layout refresh - post to ensure React Native's layout system picks it up
    post {
      requestLayout()
      invalidate()
      // Also request layout from parent to notify React Native
      (parent as? ViewGroup)?.requestLayout()
    }
  }

  private fun syncInlineFromState() {
    if (!isInline()) return

    val ts = clamp(dateMs ?: System.currentTimeMillis())
    dateMs = ts

    val cal = calendarFor(ts)

    suppressInlineCallbacks = true
    try {
      inlineDatePicker?.let { dp ->
        // Note: min/max dates are set during picker creation in rebuildUI()
        // to avoid CalendarView rendering bugs from repeated updates
        val y = cal.get(Calendar.YEAR)
        val m = cal.get(Calendar.MONTH)
        val d = cal.get(Calendar.DAY_OF_MONTH)
        dp.updateDate(y, m, d)
      }

      inlineTimePicker?.let { tp ->
        val hour = cal.get(Calendar.HOUR_OF_DAY)
        val minute = cal.get(Calendar.MINUTE)
        if (Build.VERSION.SDK_INT >= 23) {
          if (tp.hour != hour) tp.hour = hour
          if (tp.minute != minute) tp.minute = minute
        } else {
          @Suppress("DEPRECATION")
          if (tp.currentHour != hour) tp.currentHour = hour
          @Suppress("DEPRECATION")
          if (tp.currentMinute != minute) tp.currentMinute = minute
        }
      }
    } finally {
      suppressInlineCallbacks = false
    }
  }

  // -----------------------------
  // Inline change handlers
  // -----------------------------

  private fun onInlineDateChanged(year: Int, month: Int, day: Int) {
    val base = clamp(dateMs ?: System.currentTimeMillis())
    val cal = calendarFor(base)

    cal.set(Calendar.YEAR, year)
    cal.set(Calendar.MONTH, month)
    cal.set(Calendar.DAY_OF_MONTH, day)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)

    dateMs = clamp(cal.timeInMillis)
    // Inline = no confirm/cancel; treat as immediate confirm (same as your old behavior)
    onConfirm?.invoke(dateMs!!)
  }

  private fun onInlineTimeChanged(hour: Int, minute: Int) {
    val base = clamp(dateMs ?: System.currentTimeMillis())
    val cal = calendarFor(base)

    cal.set(Calendar.HOUR_OF_DAY, hour)
    cal.set(Calendar.MINUTE, minute)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)

    dateMs = clamp(cal.timeInMillis)
    onConfirm?.invoke(dateMs!!)
  }

  // -----------------------------
  // Headless modal presentation
  // -----------------------------

  private fun presentIfNeeded() {
    if (showingModal) return
    showingModal = true

    // Defer presentation to the next frame to ensure all props from the current
    // React Native batch are applied first. This guarantees dateMs reflects the
    // latest value from React Native before we create the dialog.
    post {
      if (!showingModal) return@post

      val act = findFragmentActivity() ?: run {
        Log.w(TAG, "presentIfNeeded: no FragmentActivity found")
        onCancel?.invoke()
        showingModal = false
        return@post
      }

      Log.d(TAG, "presentIfNeeded mode=$mode material=$androidMaterialMode")

      when (mode) {
        "time" -> presentTime(act)
        "dateAndTime" -> presentDateThenTime(act)
        else -> presentDate(act)
      }
    }
  }

  private fun dismissIfNeeded() {
    // We don’t retain dialog instances here; JS will close by dismissing itself or user action.
    // This keeps parity with Fabric headless patterns.
    showingModal = false
  }

  private fun presentDate(act: FragmentActivity) {
    if (androidMaterialMode == PCMaterialMode.M3) presentM3Date(act) else presentSystemDate(act)
  }

  private fun presentTime(act: FragmentActivity) {
    if (androidMaterialMode == PCMaterialMode.M3) presentM3Time(act) else presentSystemTime(act)
  }

  private fun presentDateThenTime(act: FragmentActivity) {
    if (androidMaterialMode == PCMaterialMode.M3) {
      presentM3DateThenTime(act)
    } else {
      presentSystemDateThenTime(act)
    }
  }

  // -----------------------------
  // SYSTEM dialogs (AlertDialog host for full control)
  // -----------------------------

  private fun presentSystemDate(act: FragmentActivity) {
    val ts = clamp(dateMs ?: System.currentTimeMillis())
    val cal = calendarFor(ts)

    val picker = DatePicker(act).apply {
      calendarViewShown = true
      spinnersShown = false
      // Set the date first, before min/max constraints
      updateDate(
        cal.get(Calendar.YEAR),
        cal.get(Calendar.MONTH),
        cal.get(Calendar.DAY_OF_MONTH)
      )
      // Defer min/max date setting to avoid CalendarView initialization race condition
      // where SimpleMonthView may not be created yet during layout
      post {
        minDateMs?.let { minDate = it }
        maxDateMs?.let { maxDate = it }
      }
    }

    // Wrap picker in a container with horizontal padding to prevent CalendarView
    // from clipping against the dialog edges
    val container = FrameLayout(act).apply {
      val horizontalPadding = (8 * resources.displayMetrics.density).toInt()
      setPadding(horizontalPadding, 0, horizontalPadding, 0)
      addView(picker)
    }

    val dlg = AlertDialog.Builder(act)
      .setTitle(androidDialogTitle ?: "")
      .setView(container)
      .setPositiveButton(androidPositiveTitle ?: "OK") { _, _ ->
        val c = calendarFor(ts)
        c.set(Calendar.YEAR, picker.year)
        c.set(Calendar.MONTH, picker.month)
        c.set(Calendar.DAY_OF_MONTH, picker.dayOfMonth)
        c.set(Calendar.SECOND, 0)
        c.set(Calendar.MILLISECOND, 0)

        dateMs = clamp(c.timeInMillis)
        onConfirm?.invoke(dateMs!!)
        onCancelOrClose()
      }
      .setNegativeButton(androidNegativeTitle ?: "Cancel") { _, _ ->
        onCancel?.invoke()
        onCancelOrClose()
      }
      .setOnCancelListener {
        onCancel?.invoke()
        onCancelOrClose()
      }
      .create()

    dlg.show()
  }

  private fun presentSystemTime(act: FragmentActivity) {
    val ts = clamp(dateMs ?: System.currentTimeMillis())
    val cal = calendarFor(ts)

    val picker = TimePicker(act).apply {
      val is24 = android.text.format.DateFormat.is24HourFormat(act)
      setIs24HourView(is24)

      val hour = cal.get(Calendar.HOUR_OF_DAY)
      val minute = cal.get(Calendar.MINUTE)

      if (Build.VERSION.SDK_INT >= 23) {
        this.hour = hour
        this.minute = minute
      } else {
        @Suppress("DEPRECATION") this.currentHour = hour
        @Suppress("DEPRECATION") this.currentMinute = minute
      }
    }

    val dlg = AlertDialog.Builder(act)
      .setTitle(androidDialogTitle ?: "")
      .setView(picker)
      .setPositiveButton(androidPositiveTitle ?: "OK") { _, _ ->
        val h: Int
        val m: Int
        if (Build.VERSION.SDK_INT >= 23) {
          h = picker.hour
          m = picker.minute
        } else {
          @Suppress("DEPRECATION") h = picker.currentHour
          @Suppress("DEPRECATION") m = picker.currentMinute
        }

        val c = calendarFor(ts)
        c.set(Calendar.HOUR_OF_DAY, h)
        c.set(Calendar.MINUTE, m)
        c.set(Calendar.SECOND, 0)
        c.set(Calendar.MILLISECOND, 0)

        dateMs = clamp(c.timeInMillis)
        onConfirm?.invoke(dateMs!!)
        onCancelOrClose()
      }
      .setNegativeButton(androidNegativeTitle ?: "Cancel") { _, _ ->
        onCancel?.invoke()
        onCancelOrClose()
      }
      .setOnCancelListener {
        onCancel?.invoke()
        onCancelOrClose()
      }
      .create()

    dlg.show()
  }

  private fun presentSystemDateThenTime(act: FragmentActivity) {
    // date first
    val ts = clamp(dateMs ?: System.currentTimeMillis())
    val cal = calendarFor(ts)

    val picker = DatePicker(act).apply {
      calendarViewShown = true
      spinnersShown = false
      // Set the date first, before min/max constraints
      updateDate(
        cal.get(Calendar.YEAR),
        cal.get(Calendar.MONTH),
        cal.get(Calendar.DAY_OF_MONTH)
      )
      // Defer min/max date setting to avoid CalendarView initialization race condition
      // where SimpleMonthView may not be created yet during layout
      post {
        minDateMs?.let { minDate = it }
        maxDateMs?.let { maxDate = it }
      }
    }

    // Wrap picker in a container with horizontal padding to prevent CalendarView
    // from clipping against the dialog edges
    val container = FrameLayout(act).apply {
      val horizontalPadding = (8 * resources.displayMetrics.density).toInt()
      setPadding(horizontalPadding, 0, horizontalPadding, 0)
      addView(picker)
    }

    val dlg = AlertDialog.Builder(act)
      .setTitle(androidDialogTitle ?: "")
      .setView(container)
      .setPositiveButton(androidPositiveTitle ?: "Next") { _, _ ->
        val c = calendarFor(ts)
        c.set(Calendar.YEAR, picker.year)
        c.set(Calendar.MONTH, picker.month)
        c.set(Calendar.DAY_OF_MONTH, picker.dayOfMonth)
        c.set(Calendar.SECOND, 0)
        c.set(Calendar.MILLISECOND, 0)

        dateMs = clamp(c.timeInMillis)
        // then time dialog (same mode)
        presentSystemTime(act)
      }
      .setNegativeButton(androidNegativeTitle ?: "Cancel") { _, _ ->
        onCancel?.invoke()
        onCancelOrClose()
      }
      .setOnCancelListener {
        onCancel?.invoke()
        onCancelOrClose()
      }
      .create()

    dlg.show()
  }

  // -----------------------------
  // M3 dialogs
  // -----------------------------

  private fun presentM3Date(act: FragmentActivity) {
    val ts = clamp(dateMs ?: System.currentTimeMillis())

    val builder = MaterialDatePicker.Builder.datePicker()
      .setSelection(ts)

    androidDialogTitle?.let { builder.setTitleText(it) }
    androidPositiveTitle?.let { builder.setPositiveButtonText(it) }
    androidNegativeTitle?.let { builder.setNegativeButtonText(it) }

    val constraints = buildM3CalendarConstraints()
    if (constraints != null) builder.setCalendarConstraints(constraints)

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener { selection ->
      val sel = (selection ?: ts)
      // Selection is date-based; merge with existing time-of-day
      val base = calendarFor(ts)
      val selUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { timeInMillis = sel }
      base.set(Calendar.YEAR, selUtc.get(Calendar.YEAR))
      base.set(Calendar.MONTH, selUtc.get(Calendar.MONTH))
      base.set(Calendar.DAY_OF_MONTH, selUtc.get(Calendar.DAY_OF_MONTH))
      base.set(Calendar.SECOND, 0)
      base.set(Calendar.MILLISECOND, 0)

      dateMs = clamp(base.timeInMillis)
      onConfirm?.invoke(dateMs!!)
      onCancelOrClose()
    }

    picker.addOnDismissListener {
      // If dismissed without confirm, treat as cancel
      if (showingModal) {
        onCancel?.invoke()
        onCancelOrClose()
      }
    }

    picker.show(act.supportFragmentManager, "PCDatePicker_M3_DATE")
  }

  private fun presentM3Time(act: FragmentActivity) {
    val ts = clamp(dateMs ?: System.currentTimeMillis())
    val cal = calendarFor(ts)

    val is24 = android.text.format.DateFormat.is24HourFormat(act)
    val builder = MaterialTimePicker.Builder()
      .setTimeFormat(if (is24) TimeFormat.CLOCK_24H else TimeFormat.CLOCK_12H)
      .setHour(cal.get(Calendar.HOUR_OF_DAY))
      .setMinute(cal.get(Calendar.MINUTE))

    androidDialogTitle?.let { builder.setTitleText(it) }
    // These exist in recent Material; if you’re on an older one, you’ll get compile errors.
    androidPositiveTitle?.let { builder.setPositiveButtonText(it) }
    androidNegativeTitle?.let { builder.setNegativeButtonText(it) }

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener {
      val c = calendarFor(ts)
      c.set(Calendar.HOUR_OF_DAY, picker.hour)
      c.set(Calendar.MINUTE, picker.minute)
      c.set(Calendar.SECOND, 0)
      c.set(Calendar.MILLISECOND, 0)

      dateMs = clamp(c.timeInMillis)
      onConfirm?.invoke(dateMs!!)
      onCancelOrClose()
    }

    picker.addOnDismissListener {
      if (showingModal) {
        onCancel?.invoke()
        onCancelOrClose()
      }
    }

    picker.show(act.supportFragmentManager, "PCDatePicker_M3_TIME")
  }

  private fun presentM3DateThenTime(act: FragmentActivity) {
    val ts = clamp(dateMs ?: System.currentTimeMillis())

    val builder = MaterialDatePicker.Builder.datePicker()
      .setSelection(ts)

    androidDialogTitle?.let { builder.setTitleText(it) }
    androidPositiveTitle?.let { builder.setPositiveButtonText(it) }
    androidNegativeTitle?.let { builder.setNegativeButtonText(it) }

    val constraints = buildM3CalendarConstraints()
    if (constraints != null) builder.setCalendarConstraints(constraints)

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener { selection ->
      val sel = (selection ?: ts)
      val base = calendarFor(ts)
      val selUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { timeInMillis = sel }
      base.set(Calendar.YEAR, selUtc.get(Calendar.YEAR))
      base.set(Calendar.MONTH, selUtc.get(Calendar.MONTH))
      base.set(Calendar.DAY_OF_MONTH, selUtc.get(Calendar.DAY_OF_MONTH))
      base.set(Calendar.SECOND, 0)
      base.set(Calendar.MILLISECOND, 0)

      dateMs = clamp(base.timeInMillis)
      // then time
      presentM3Time(act)
    }

    picker.addOnDismissListener {
      if (showingModal) {
        onCancel?.invoke()
        onCancelOrClose()
      }
    }

    picker.show(act.supportFragmentManager, "PCDatePicker_M3_DATE_THEN_TIME")
  }

  private fun buildM3CalendarConstraints(): CalendarConstraints? {
    val min = minDateMs
    val max = maxDateMs
    if (min == null && max == null) return null

    val b = CalendarConstraints.Builder()
    min?.let { b.setStart(it) }
    max?.let { b.setEnd(it) }
    return b.build()
  }

  // -----------------------------
  // Utility
  // -----------------------------

  private fun onCancelOrClose() {
    Log.d(TAG, "onCancelOrClose")
    showingModal = false
  }

  private fun clamp(valueMs: Long): Long {
    var v = valueMs
    minDateMs?.let { v = max(v, it) }
    maxDateMs?.let { v = min(v, it) }
    return v
  }

  private fun calendarFor(ts: Long): Calendar {
    val cal = Calendar.getInstance(timeZone, locale ?: Locale.getDefault())
    androidFirstDayOfWeek?.let { cal.firstDayOfWeek = it }
    cal.timeInMillis = ts
    return cal
  }

  private fun findFragmentActivity(): FragmentActivity? {
    val trc = context as? ThemedReactContext
    val a1 = trc?.currentActivity
    if (a1 is FragmentActivity) return a1

    var c: Context? = context
    while (c is ContextWrapper) {
      if (c is FragmentActivity) return c
      val base = (c as ContextWrapper).baseContext
      if (base == c) break
      c = base
    }

    val a2 = (context as? Activity)
    return a2 as? FragmentActivity
  }

  // Minimal enum for material mode
  private enum class PCMaterialMode { SYSTEM, M3 }
}
