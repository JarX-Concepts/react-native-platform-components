package com.platformcomponents

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.text.InputType
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.Spinner
import android.content.DialogInterface
import androidx.fragment.app.FragmentActivity
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputLayout

class PCSelectionMenuView(context: Context) : FrameLayout(context) {

  data class Option(val label: String, val data: String)

  // --- Props ---
  var options: List<Option> = emptyList()
  var selectedData: String = "" // sentinel for none

  var interactivity: String = "enabled" // "enabled" | "disabled"
  var placeholder: String? = null

  var anchorMode: String = "headless" // "inline" | "headless"
  var visible: String = "closed"      // "open" | "closed" (headless only)

  // Kept for backward compatibility with your interface; headless uses Spinner regardless.
  var presentation: String = "auto"   // "auto" | "popover" | "sheet"

  // Only used to choose inline rendering style.
  var androidMaterial: String? = "system" // "system" | "m3"

  // --- Events ---
  var onSelect: ((index: Int, label: String, data: String) -> Unit)? = null
  var onRequestClose: (() -> Unit)? = null

  // --- Inline UI ---
  private var inlineLayout: TextInputLayout? = null
  private var inlineText: MaterialAutoCompleteTextView? = null
  private var inlineSpinner: Spinner? = null

  // --- Headless UI (true picker) ---
  private var headlessSpinner: Spinner? = null
  private var headlessDismissHooked: Boolean = false

  private var suppressSpinnerSelection = false

  init {
    minimumHeight = 0
    minimumWidth = 0
    rebuildUI()
  }

  private val minInlineHeightPx: Int by lazy {
    (56f * resources.displayMetrics.density).toInt() // M3 default touch target
  }

  // Headless needs a non-zero anchor rect for dropdown
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (anchorMode == "headless") {
      val w = MeasureSpec.getSize(widthMeasureSpec)
      setMeasuredDimension(if (w > 0) w else 1, 1)
      return
    }

    // Inline: measure children, but never allow a collapsed height
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)

    val measuredH = measuredHeight
    if (measuredH < minInlineHeightPx) {
      setMeasuredDimension(measuredWidth, minInlineHeightPx)
    }
  }

  // ---- Public apply* (called by manager) ----

  fun applyOptions(newOptions: List<Option>) {
    options = newOptions
    refreshAdapters()
    refreshSelections()
  }

  fun applySelectedData(data: String?) {
    selectedData = data ?: ""
    refreshSelections()
  }

  fun applyInteractivity(value: String?) {
    interactivity = if (value == "disabled") "disabled" else "enabled"
    updateEnabledState()

    // If disabled while open, request close.
    if (interactivity != "enabled" && visible == "open") {
      onRequestClose?.invoke()
    }
  }

  fun applyPlaceholder(value: String?) {
    if (placeholder == value) return
    placeholder = value
    inlineLayout?.hint = placeholder
  }

  fun applyAnchorMode(value: String?) {
    val newMode = when (value) {
      "inline", "headless" -> value
      else -> "headless"
    }
    if (anchorMode == newMode) return
    anchorMode = newMode
    rebuildUI()
  }

  fun applyVisible(value: String?) {
    visible = when (value) {
      "open", "closed" -> value
      else -> "closed"
    }

    if (anchorMode != "headless") return

    if (visible == "open") {
      presentHeadlessIfNeeded()
    } else {
      // We can't reliably force-close a Spinner dropdown, but we can at least signal state.
      // Most apps will set visible=closed after onSelect/onRequestClose anyway.
    }
  }

  fun applyPresentation(value: String?) {
    presentation = when (value) {
      "auto", "popover", "sheet" -> value
      else -> "auto"
    }
  }

  fun applyAndroidMaterial(value: String?) {
    val newValue = value ?: "system"
    if (androidMaterial == newValue) return
    androidMaterial = newValue
    if (anchorMode == "inline") rebuildUI()
  }

  // ---- UI building ----

  private fun rebuildUI() {
    removeAllViews()
    inlineLayout = null
    inlineText = null
    inlineSpinner = null
    headlessSpinner = null
    headlessDismissHooked = false

    // Headless should be invisible but anchorable.
    alpha = if (anchorMode == "headless") 0f else 1f

    if (anchorMode == "inline") {
      buildInline()
    } else {
      buildHeadless()
    }

    refreshAdapters()
    refreshSelections()
    updateEnabledState()
    requestLayout()
  }

  private fun buildInline() {
    val mode = parseMaterial(androidMaterial)

    if (mode == MaterialMode.M3) {
      // M3 inline = exposed dropdown look, but forced read-only
      val til = TextInputLayout(context).apply {
        layoutParams = FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.MATCH_PARENT
        )
        hint = placeholder
      }

      val actv = MaterialAutoCompleteTextView(til.context).apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
        isSingleLine = true
        threshold = 0

        // behave like picker
        inputType = InputType.TYPE_NULL
        keyListener = null
        isCursorVisible = false
        isFocusable = false
        isFocusableInTouchMode = false

        setOnClickListener {
          if (interactivity == "enabled") showDropDown()
        }

        setOnItemClickListener { _, _, position, _ ->
          val opt = options.getOrNull(position) ?: return@setOnItemClickListener
          selectedData = opt.data
          onSelect?.invoke(position, opt.label, opt.data)
        }
      }

      til.addView(actv)
      addView(til)
      inlineLayout = til
      inlineText = actv
    } else {
      // SYSTEM inline = native spinner
      val sp = Spinner(context, Spinner.MODE_DROPDOWN).apply {
        layoutParams = FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.WRAP_CONTENT
        )
      }

      sp.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
        override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
          if (suppressSpinnerSelection) return
          val opt = options.getOrNull(position) ?: return
          if (opt.data == selectedData) return
          selectedData = opt.data
          onSelect?.invoke(position, opt.label, opt.data)
        }
        override fun onNothingSelected(parent: AdapterView<*>?) = Unit
      }

      addView(sp)
      inlineSpinner = sp
    }
  }

  private fun buildHeadless() {
    // Headless = TRUE picker using Spinner dropdown
    val sp = Spinner(context, Spinner.MODE_DROPDOWN).apply {
      layoutParams = FrameLayout.LayoutParams(1, 1)
      // keep it anchorable but not interactive unless we programmatically open it
      isClickable = true
      isFocusable = false
      isFocusableInTouchMode = false
    }

    sp.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
      override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
        if (suppressSpinnerSelection) return
        val opt = options.getOrNull(position) ?: return

        selectedData = opt.data
        onSelect?.invoke(position, opt.label, opt.data)

        // After selection, close contract.
        onRequestClose?.invoke()
      }

      override fun onNothingSelected(parent: AdapterView<*>?) = Unit
    }

    addView(sp)
    headlessSpinner = sp
  }

  private fun updateEnabledState() {
    val enabled = interactivity == "enabled"
    inlineLayout?.isEnabled = enabled
    inlineText?.isEnabled = enabled
    inlineSpinner?.isEnabled = enabled
    headlessSpinner?.isEnabled = enabled
  }

  private fun refreshAdapters() {
    val labels = options.map { it.label }

    inlineText?.let { actv ->
      actv.setAdapter(ArrayAdapter(actv.context, android.R.layout.simple_list_item_1, labels))
    }

    fun applySpinnerAdapter(sp: Spinner) {
      val adapter = ArrayAdapter(sp.context, android.R.layout.simple_spinner_item, labels)
      adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
      sp.adapter = adapter
    }

    inlineSpinner?.let { applySpinnerAdapter(it) }
    headlessSpinner?.let { applySpinnerAdapter(it) }
  }

  private fun refreshSelections() {
    val idx = options.indexOfFirst { it.data == selectedData }
    val label = if (idx >= 0) options[idx].label else ""

    inlineText?.setText(label, false)

    fun setSpinnerSelection(sp: Spinner) {
      if (options.isEmpty()) return
      val target = if (idx >= 0) idx else 0
      if (sp.selectedItemPosition == target) return

      suppressSpinnerSelection = true
      try {
        sp.setSelection(target, false)
      } finally {
        suppressSpinnerSelection = false
      }
    }

    inlineSpinner?.let { setSpinnerSelection(it) }
    headlessSpinner?.let { setSpinnerSelection(it) }
  }

  // ---- Headless open ----

  private fun presentHeadlessIfNeeded() {
    val sp = headlessSpinner ?: return
    if (interactivity != "enabled") {
      onRequestClose?.invoke()
      return
    }
    post {
      if (!isAttachedToWindow) {
        onRequestClose?.invoke()
        return@post
      }

      // Make dropdown match the anchor view width
      val anchorW = this@PCSelectionMenuView.width
      if (anchorW > 0) {
        sp.dropDownWidth = anchorW
      }

      // Align dropdown’s left edge with the anchor’s left edge.
      // (X positioning comes from the anchor itself; this is just extra explicit.)
      sp.dropDownHorizontalOffset = 0
      sp.dropDownVerticalOffset = 0

      hookSpinnerDismiss(sp)
      sp.performClick()
    }
  }

  /**
   * Spinner doesn't expose dismiss callbacks publicly. Many Android builds use an internal
   * DropdownPopup (ListPopupWindow) stored in a private field. We hook it if possible.
   *
   * If this fails, selection still works, but you may not get an "onRequestClose" when dismissed.
   */
  private fun hookSpinnerDismiss(sp: Spinner) {
    if (headlessDismissHooked) return

    try {
      val f = Spinner::class.java.getDeclaredField("mPopup")
      f.isAccessible = true
      val popupObj = f.get(sp)

      // AOSP DropdownPopup extends ListPopupWindow on many versions.
      val setOnDismiss = popupObj?.javaClass?.methods?.firstOrNull { m ->
        m.name == "setOnDismissListener" && m.parameterTypes.size == 1
      }

      if (setOnDismiss != null) {
        val listener = DialogInterface.OnDismissListener {
          onRequestClose?.invoke()
        }
        setOnDismiss.invoke(popupObj, listener)
        headlessDismissHooked = true
      }
    } catch (_: Throwable) {
      // ignore; no dismiss hook available
    }
  }

  // ---- Helpers ----

  private enum class MaterialMode { SYSTEM, M3 }

  private fun parseMaterial(value: String?): MaterialMode =
    when (value) {
      "m3" -> MaterialMode.M3
      "system", null -> MaterialMode.SYSTEM
      else -> MaterialMode.SYSTEM
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
}
