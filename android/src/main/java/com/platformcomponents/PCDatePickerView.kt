package com.platformcomponents

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.os.Build
import android.util.Log
import android.view.ContextThemeWrapper
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
import com.google.android.material.datepicker.CompositeDateValidator
import com.google.android.material.datepicker.DateValidatorPointBackward
import com.google.android.material.datepicker.DateValidatorPointForward
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import kotlin.math.max
import kotlin.math.min

class PCDatePickerView(context: Context) : FrameLayout(context), ReactScrollViewHelper.HasStateWrapper {

  companion object {
    private const val TAG = "PCDatePicker"
    private val UTC: TimeZone = TimeZone.getTimeZone("UTC")
  }

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Public props (set by manager) ---
  private var mode: String = "date" // "date" | "time" | "dateAndTime" | "dateRange"
  private var presentation: String = "modal" // "inline" | "modal" | "popover" | "sheet" | "auto" (we treat non-inline as modal-ish)
  private var visible: String = "closed" // "open" | "closed" (only for non-inline)
  private var locale: Locale? = null
  private var timeZone: TimeZone = TimeZone.getDefault()

  private var dateMs: Long? = null
  private var endDateMs: Long? = null // dateRange: the last day
  private var minDateMs: Long? = null
  private var maxDateMs: Long? = null
  private var hourFormat: String = "" // "" (device setting) | "12" | "24"

  // --- Android config from nested `android` prop ---
  private var androidFirstDayOfWeek: Int? = null
  private var androidMaterialMode: PCMaterialMode = PCMaterialMode.SYSTEM // SYSTEM | M3
  private var androidDialogTitle: String? = null
  private var androidPositiveTitle: String? = null
  private var androidNegativeTitle: String? = null
  private var androidInputMode: String = "" // "" | "calendar" | "text"

  // --- Events (wired by manager) ---
  var onConfirm: ((Long) -> Unit)? = null
  /** dateRange: the first and last day. */
  var onConfirmRange: ((Long, Long) -> Unit)? = null
  var onCancel: (() -> Unit)? = null

  // --- Inline UI ---
  private var inlineContainer: LinearLayout? = null
  private var inlineDatePicker: DatePicker? = null
  private var inlineTimePicker: TimePicker? = null
  private var suppressInlineCallbacks = false

  // --- Modal state ---
  private var showingModal = false

  // --- Native theme ---
  // Widgets read theme colors when they are created, so they are rebuilt when the
  // native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener { rebuildForNativeTheme() }

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
      "date", "time", "dateAndTime", "dateRange" -> value
      // UIDatePicker's month and year wheels have no Android counterpart
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
    val previous = locale
    locale =
      try {
        if (value.isNullOrBlank()) null else Locale.forLanguageTag(value)
      } catch (_: Throwable) {
        null
      }
    // The embedded pickers are built from a locale-wrapped context.
    if (isInline() && locale != previous) rebuildUI()
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

  fun applyEndDateMs(value: Long?) {
    endDateMs = value
  }

  fun applyHourFormat(value: String?) {
    val next = if (value == "12" || value == "24") value else ""
    if (hourFormat == next) return
    hourFormat = next
    inlineTimePicker?.setIs24HourView(is24Hour(context))
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
    negativeButtonTitle: String?,
    inputMode: String?
  ) {
    androidFirstDayOfWeek = firstDayOfWeek
    androidInputMode = if (inputMode == "calendar" || inputMode == "text") inputMode else ""

    androidMaterialMode = when (material) {
      "m3" -> PCMaterialMode.M3
      "system", null -> PCMaterialMode.SYSTEM
      else -> PCMaterialMode.SYSTEM
    }

    androidDialogTitle = dialogTitle
    androidPositiveTitle = positiveButtonTitle
    androidNegativeTitle = negativeButtonTitle

    inlineDatePicker?.let { applyFirstDayOfWeek(it) }
    syncInlineFromState()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (builtThemeVersion != PCNativeTheme.version) rebuildForNativeTheme()
  }

  override fun onDetachedFromWindow() {
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  /**
   * A theme change isn't a React commit, so nothing measures the rebuilt inline
   * pickers; lay them out in the frame Yoga already gave this view.
   */
  private fun rebuildForNativeTheme() {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
    if (!isInline() || width == 0 || height == 0) return
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  // -----------------------------
  // UI construction
  // -----------------------------

  private fun isInline(): Boolean = presentation == "inline" || presentation == "embedded"

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    removeAllViews()
    inlineContainer = null
    inlineDatePicker = null
    inlineTimePicker = null

    if (!isInline()) {
      requestLayout()
      return
    }

    val pickerContext = localizedContext(context)
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
      val dp = DatePicker(pickerContext).apply {
        applyFirstDayOfWeek(this)
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
      val tp = TimePicker(pickerContext).apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.WRAP_CONTENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
        setIs24HourView(is24Hour(context))
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
        // Only Material has a range picker
        "dateRange" -> presentM3DateRange(act)
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

    val dialogContext = localizedContext(PCThemeSupport.appCompatDialogContext(act, "DatePicker"))
    val picker = DatePicker(dialogContext).apply {
      applyFirstDayOfWeek(this)
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
    val container = FrameLayout(dialogContext).apply {
      val horizontalPadding = (8 * resources.displayMetrics.density).toInt()
      setPadding(horizontalPadding, 0, horizontalPadding, 0)
      addView(picker)
    }

    val dlg = AlertDialog.Builder(dialogContext)
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

    val dialogContext = localizedContext(PCThemeSupport.appCompatDialogContext(act, "DatePicker"))
    val picker = TimePicker(dialogContext).apply {
      setIs24HourView(is24Hour(act))

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

    val dlg = AlertDialog.Builder(dialogContext)
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

    val dialogContext = localizedContext(PCThemeSupport.appCompatDialogContext(act, "DatePicker"))
    val picker = DatePicker(dialogContext).apply {
      applyFirstDayOfWeek(this)
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
    val container = FrameLayout(dialogContext).apply {
      val horizontalPadding = (8 * resources.displayMetrics.density).toInt()
      setPadding(horizontalPadding, 0, horizontalPadding, 0)
      addView(picker)
    }

    val dlg = AlertDialog.Builder(dialogContext)
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

    val picker = buildM3DatePicker(act, ts)

    picker.addOnPositiveButtonClickListener { selection ->
      val sel = (selection ?: ts)
      // Selection is date-based; merge with existing time-of-day
      val base = calendarFor(ts)
      val selUtc = Calendar.getInstance(UTC).apply { timeInMillis = sel }
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

    val builder = MaterialTimePicker.Builder()
      .setTheme(m3TimePickerTheme(act))
      .setTimeFormat(if (is24Hour(act)) TimeFormat.CLOCK_24H else TimeFormat.CLOCK_12H)
      .setHour(cal.get(Calendar.HOUR_OF_DAY))
      .setMinute(cal.get(Calendar.MINUTE))
    when (androidInputMode) {
      "text" -> builder.setInputMode(MaterialTimePicker.INPUT_MODE_KEYBOARD)
      "calendar" -> builder.setInputMode(MaterialTimePicker.INPUT_MODE_CLOCK)
    }

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

    val picker = buildM3DatePicker(act, ts)

    picker.addOnPositiveButtonClickListener { selection ->
      val sel = (selection ?: ts)
      val base = calendarFor(ts)
      val selUtc = Calendar.getInstance(UTC).apply { timeInMillis = sel }
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

  /**
   * The Material range picker (full screen). The selection is two UTC-midnight
   * days, reported as the start of each day in this picker's time zone.
   */
  private fun presentM3DateRange(act: FragmentActivity) {
    val builder = MaterialDatePicker.Builder.dateRangePicker()
      .setTheme(m3CalendarTheme(act))
      .setCalendarConstraints(buildM3CalendarConstraints())
    val start = dateMs?.let { utcDayFor(clamp(it)) }
    val end = endDateMs?.let { utcDayFor(clamp(it)) }
    if (start != null && end != null && end >= start) {
      builder.setSelection(androidx.core.util.Pair(start, end))
    }
    androidDialogTitle?.let { builder.setTitleText(it) }
    androidPositiveTitle?.let { builder.setPositiveButtonText(it) }
    androidNegativeTitle?.let { builder.setNegativeButtonText(it) }
    m3InputMode()?.let { builder.setInputMode(it) }
    locale?.let { l -> m3TextInputFormat(l)?.let { builder.setTextInputFormat(it) } }

    val picker = builder.build()

    picker.addOnPositiveButtonClickListener { selection ->
      val first = selection?.first
      val second = selection?.second
      if (first != null && second != null) {
        val startMs = clamp(localDayStartFor(first))
        val endMs = clamp(localDayStartFor(second))
        dateMs = startMs
        endDateMs = endMs
        onConfirmRange?.invoke(startMs, endMs)
      } else {
        onCancel?.invoke()
      }
      onCancelOrClose()
    }

    picker.addOnDismissListener {
      if (showingModal) {
        onCancel?.invoke()
        onCancelOrClose()
      }
    }

    picker.show(act.supportFragmentManager, "PCDatePicker_M3_RANGE")
  }

  /**
   * Material pickers resolve their theme from the activity. When the app theme is
   * not a Material theme they would throw, so hand them a full Material 3 dialog
   * theme instead (0 = use the activity theme).
   */
  private fun m3CalendarTheme(act: FragmentActivity): Int =
    PCThemeSupport.materialDialogThemeOverride(
      act,
      "DatePicker",
      R.style.PCMaterial3CalendarDialogTheme,
      R.style.PCMaterial3CalendarDialogTheme_NativeTheme
    )

  private fun m3TimePickerTheme(act: FragmentActivity): Int =
    PCThemeSupport.materialDialogThemeOverride(
      act,
      "DatePicker",
      R.style.PCMaterial3TimePickerDialogTheme,
      R.style.PCMaterial3TimePickerDialogTheme_NativeTheme
    )

  private fun buildM3DatePicker(act: FragmentActivity, ts: Long): MaterialDatePicker<Long> {
    val builder = MaterialDatePicker.Builder.datePicker()
      // MaterialDatePicker works in UTC days: its selection is the UTC midnight
      // of the chosen day, so hand it this picker's calendar day in those terms.
      .setSelection(utcDayFor(ts))
      .setTheme(m3CalendarTheme(act))
      .setCalendarConstraints(buildM3CalendarConstraints())

    androidDialogTitle?.let { builder.setTitleText(it) }
    androidPositiveTitle?.let { builder.setPositiveButtonText(it) }
    androidNegativeTitle?.let { builder.setNegativeButtonText(it) }
    m3InputMode()?.let { builder.setInputMode(it) }
    // MaterialDatePicker formats with the process default locale and cannot be
    // given a context, so `locale` only reaches its text-input date format.
    locale?.let { l -> m3TextInputFormat(l)?.let { builder.setTextInputFormat(it) } }

    return builder.build()
  }

  private fun buildM3CalendarConstraints(): CalendarConstraints {
    val b = CalendarConstraints.Builder()
    androidFirstDayOfWeek?.takeIf { it in Calendar.SUNDAY..Calendar.SATURDAY }?.let {
      b.setFirstDayOfWeek(it)
    }

    val minDay = minDateMs?.let { utcDayFor(it) }
    val maxDay = maxDateMs?.let { utcDayFor(it) }
    minDay?.let { b.setStart(it) }
    maxDay?.let { b.setEnd(it) }

    // setStart/setEnd only limit month paging; the validator greys out the days
    // before min in the first month and after max in the last one. Both points
    // are UTC midnights, like the days the picker validates, and both bounds are
    // inclusive (forward: day >= min, backward: day <= max).
    val validators = listOfNotNull<CalendarConstraints.DateValidator>(
      minDay?.let { DateValidatorPointForward.from(it) },
      maxDay?.let { DateValidatorPointBackward.before(it) }
    )
    if (validators.isNotEmpty()) b.setValidator(CompositeDateValidator.allOf(validators))
    return b.build()
  }

  /** MaterialDatePicker's input mode for `android.inputMode`; null keeps its default. */
  private fun m3InputMode(): Int? = when (androidInputMode) {
    "text" -> MaterialDatePicker.INPUT_MODE_TEXT
    "calendar" -> MaterialDatePicker.INPUT_MODE_CALENDAR
    else -> null
  }

  /** `is24Hour`, else the device's 12/24-hour setting. */
  private fun is24Hour(ctx: Context): Boolean = when (hourFormat) {
    "24" -> true
    "12" -> false
    else -> android.text.format.DateFormat.is24HourFormat(ctx)
  }

  /** The start of the day [utcDay] (a UTC midnight) names, in this picker's time zone. */
  private fun localDayStartFor(utcDay: Long): Long {
    val day = Calendar.getInstance(UTC).apply { timeInMillis = utcDay }
    return Calendar.getInstance(timeZone).apply {
      clear()
      set(day.get(Calendar.YEAR), day.get(Calendar.MONTH), day.get(Calendar.DAY_OF_MONTH))
    }.timeInMillis
  }

  /** The UTC midnight of [ts]'s calendar day in this picker's time zone. */
  private fun utcDayFor(ts: Long): Long {
    val local = calendarFor(ts)
    return Calendar.getInstance(UTC).apply {
      clear()
      set(
        local.get(Calendar.YEAR),
        local.get(Calendar.MONTH),
        local.get(Calendar.DAY_OF_MONTH)
      )
    }.timeInMillis
  }

  /**
   * The locale's short date pattern as a fixed-width input format (dd, MM,
   * yyyy), the way MaterialDatePicker derives its default one.
   */
  private fun m3TextInputFormat(l: Locale): SimpleDateFormat? {
    val pattern = (DateFormat.getDateInstance(DateFormat.SHORT, l) as? SimpleDateFormat)
      ?.toPattern() ?: return null
    val input = pattern
      .replace(Regex("[^dMy/\\-.]"), "")
      .replace(Regex("d{1,2}"), "dd")
      .replace(Regex("M{1,2}"), "MM")
      .replace(Regex("y{1,4}"), "yyyy")
      .replace(Regex("\\.$"), "")
    return try {
      SimpleDateFormat(input, l).apply {
        timeZone = UTC
        isLenient = false
      }
    } catch (_: IllegalArgumentException) {
      null
    }
  }

  private fun applyFirstDayOfWeek(picker: DatePicker) {
    androidFirstDayOfWeek?.takeIf { it in Calendar.SUNDAY..Calendar.SATURDAY }?.let {
      picker.firstDayOfWeek = it
    }
  }

  /**
   * [base] with the `locale` prop as its configuration locale, so the system
   * pickers built from it draw month and weekday names in that locale.
   */
  private fun localizedContext(base: Context): Context {
    val l = locale ?: return base
    val config = Configuration(base.resources.configuration).apply { setLocale(l) }
    return LocaleContext(base, base.createConfigurationContext(config).resources)
  }

  /**
   * Swaps only the Resources. `applyOverrideConfiguration` would copy the base
   * theme into a theme of the new Resources (Theme.setTo), which drops
   * attributes (runtime native-theme colors among them), so the base theme
   * object is used as is. Being a ContextThemeWrapper, its LayoutInflater is
   * bound to this context, so inflated views see the localized Resources.
   */
  private class LocaleContext(
    base: Context,
    private val localized: android.content.res.Resources
  ) : ContextThemeWrapper(base, 0) {
    override fun getResources(): android.content.res.Resources = localized
    override fun getTheme(): android.content.res.Resources.Theme = baseContext.theme
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
