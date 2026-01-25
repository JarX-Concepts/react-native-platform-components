package com.platformcomponents

import android.content.Context
import android.text.InputType
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.Spinner
import androidx.appcompat.widget.PopupMenu
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputLayout

class PCSelectionMenuView(context: Context) : FrameLayout(context) {

  data class Option(val label: String, val data: String)

  companion object {
    private const val TAG = "PCSelectionMenu"
  }

  // --- Props ---
  var options: List<Option> = emptyList()
  var selectedData: String = "" // sentinel for none

  var interactivity: String = "enabled" // "enabled" | "disabled"
  var placeholder: String? = null

  var anchorMode: String = "headless" // "inline" | "headless"
  var visible: String = "closed"      // "open" | "closed" (headless only)

  // Only used to choose inline rendering style.
  var androidMaterial: String? = "system" // "system" | "m3"

  // --- Events ---
  var onSelect: ((index: Int, label: String, data: String) -> Unit)? = null
  var onRequestClose: (() -> Unit)? = null

  // --- Inline UI ---
  private var inlineLayout: TextInputLayout? = null
  private var inlineText: MaterialAutoCompleteTextView? = null
  private var inlineSpinner: Spinner? = null
  private var inlineDropdownOverlay: View? = null
  private var inlineSpinnerSuppressCount = 0

  // --- Headless UI (true picker) ---
  private var headlessMenu: PopupMenu? = null
  private var headlessMenuShowing = false
  private var headlessDismissProgrammatic = false
  private var headlessDismissAfterSelect = false
  private var headlessOpenToken = 0

  init {
    minimumHeight = 0
    minimumWidth = 0
    rebuildUI()
  }

  private val minInlineHeightPx: Int by lazy {
    (PCConstants.MIN_TOUCH_TARGET_HEIGHT_DP * resources.displayMetrics.density).toInt()
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
    if (options == newOptions) return
    options = newOptions
    Log.d(TAG, "applyOptions size=${options.size}")
    refreshAdapters()
    refreshSelections()
  }

  fun applySelectedData(data: String?) {
    val next = data ?: ""
    if (selectedData == next) return
    selectedData = next
    Log.d(TAG, "applySelectedData selectedData=$selectedData")
    refreshSelections()
  }

  fun applyInteractivity(value: String?) {
    interactivity = if (value == "disabled") "disabled" else "enabled"
    Log.d(TAG, "applyInteractivity interactivity=$interactivity")
    updateEnabledState()

    // If disabled while open, request close.
    if (interactivity != "enabled" && visible == "open") {
      Log.d(TAG, "applyInteractivity disabled while open -> requestClose")
      if (anchorMode == "headless" && headlessMenuShowing) {
        headlessDismissProgrammatic = true
        headlessMenu?.dismiss()
      } else {
        onRequestClose?.invoke()
      }
    }
  }

  fun applyPlaceholder(value: String?) {
    if (placeholder == value) return
    placeholder = value
    inlineLayout?.hint = placeholder
    // Spinner doesn't support placeholder
  }

  fun applyAnchorMode(value: String?) {
    val newMode = when (value) {
      "inline", "headless" -> value
      else -> "headless"
    }
    if (anchorMode == newMode) return
    anchorMode = newMode
    Log.d(TAG, "applyAnchorMode anchorMode=$anchorMode")
    if (anchorMode != "headless") {
      headlessOpenToken += 1
      if (headlessMenuShowing) {
        headlessDismissProgrammatic = true
        headlessMenu?.dismiss()
      }
    }
    rebuildUI()
  }

  fun applyVisible(value: String?) {
    visible = when (value) {
      "open", "closed" -> value
      else -> "closed"
    }
    Log.d(TAG, "applyVisible visible=$visible anchorMode=$anchorMode")
    headlessOpenToken += 1
    val token = headlessOpenToken

    if (anchorMode != "headless") return

    if (visible == "open") {
      presentHeadlessIfNeeded(token)
    } else {
      Log.d(TAG, "applyVisible close -> dismiss")
      if (headlessMenuShowing) {
        headlessDismissProgrammatic = true
        headlessMenu?.dismiss()
      }
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
    if (headlessMenuShowing) {
      headlessDismissProgrammatic = true
      headlessMenu?.dismiss()
    }
    inlineText?.dismissDropDown()
    detachInlineDropdownOverlay()
    inlineDropdownOverlay = null
    removeAllViews()
    inlineLayout = null
    inlineText = null
    inlineSpinner = null
    inlineSpinnerSuppressCount = 0
    headlessMenu = null
    headlessMenuShowing = false
    headlessDismissProgrammatic = false
    headlessDismissAfterSelect = false

    // Headless should be invisible but anchorable.
    alpha = if (anchorMode == "headless") 0.01f else 1f
    Log.d(TAG, "rebuildUI anchorMode=$anchorMode alpha=$alpha")

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
      // M3 exposed dropdown menu - the standard Material 3 way
      val til = TextInputLayout(context).apply {
        layoutParams = FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.WRAP_CONTENT
        )
        hint = placeholder
        endIconMode = TextInputLayout.END_ICON_DROPDOWN_MENU
      }

      val actv = InlineAutoCompleteTextView(til.context)
      inlineText = actv
      actv.apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )

        // Keep it a real text editor so the popup behaves modally
        inputType = InputType.TYPE_CLASS_TEXT

        // Prevent keyboard
        showSoftInputOnFocus = false

        // Optional: keep it from being typed into
        keyListener = null
        isCursorVisible = false

        // Nice UX: click anywhere opens dropdown
        setOnClickListener { showDropDown() }

        setOnItemClickListener { _, _, position, _ ->
          val opt = options.getOrNull(position) ?: return@setOnItemClickListener
          selectedData = opt.data
          onSelect?.invoke(position, opt.label, opt.data)
          detachInlineDropdownOverlay()
        }

        setOnTouchListener { _, e ->
          if (e.action == android.view.MotionEvent.ACTION_UP) {
            showDropDown()
          }
          false // let default handling run
        }
      }

      til.addView(actv)
      addView(til)
      inlineLayout = til
    } else {
      // SYSTEM mode: Use custom Spinner with dropdown mode to ensure callbacks fire
      val sp = object : Spinner(context, null, android.R.attr.spinnerStyle, Spinner.MODE_DROPDOWN) {
        override fun setSelection(position: Int, animate: Boolean) {
          val oldPos = selectedItemPosition
          super.setSelection(position, animate)

          // Manually trigger onItemSelectedListener if selection changed
          // This is needed because Spinner doesn't always trigger the callback when
          // the selection changes via user interaction with the dropdown
          if (position != oldPos && onItemSelectedListener != null) {
            post {
              onItemSelectedListener?.onItemSelected(
                this,
                selectedView,
                position,
                getItemIdAtPosition(position)
              )
            }
          }
        }

        override fun setSelection(position: Int) {
          val oldPos = selectedItemPosition
          super.setSelection(position)

          // Manually trigger onItemSelectedListener if selection changed
          if (position != oldPos && onItemSelectedListener != null) {
            post {
              onItemSelectedListener?.onItemSelected(
                this,
                selectedView,
                position,
                getItemIdAtPosition(position)
              )
            }
          }
        }
      }

      // Set listener FIRST, before adapter
      sp.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
        override fun onItemSelected(
          parent: AdapterView<*>,
          view: View?,
          position: Int,
          id: Long
        ) {
          // If suppress count > 0, this is a programmatic change (ignore it)
          if (inlineSpinnerSuppressCount > 0) return

          if (interactivity != "enabled") return

          val opt = options.getOrNull(position) ?: return

          // Only fire callback if selection actually changed
          if (opt.data == selectedData) return

          // Don't update selectedData here - let applySelectedData handle it
          // This ensures refreshSelections() is called to update the Spinner's display
          onSelect?.invoke(position, opt.label, opt.data)
        }

        override fun onNothingSelected(parent: AdapterView<*>) {
          // No-op
        }
      }

      sp.apply {
        layoutParams = FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.WRAP_CONTENT
        )
        visibility = View.VISIBLE
      }

      addView(sp)
      inlineSpinner = sp
    }
  }

  private fun buildHeadless() {
    val popup = PopupMenu(context, this@PCSelectionMenuView).apply {
      setOnMenuItemClickListener { item ->
        val index = item.itemId
        val opt = options.getOrNull(index)
        Log.d(
          TAG,
          "headless onMenuItemClick index=$index optData=${opt?.data} selectedData=$selectedData"
        )
        headlessDismissAfterSelect = true
        handleHeadlessSelection(index)
        true
      }
      setOnDismissListener {
        val programmatic = headlessDismissProgrammatic || headlessDismissAfterSelect
        headlessDismissProgrammatic = false
        headlessDismissAfterSelect = false
        headlessMenuShowing = false
        if (programmatic) {
          Log.d(TAG, "headless onDismiss programmatic")
        } else {
          Log.d(TAG, "headless onDismiss -> requestClose")
          onRequestClose?.invoke()
        }
      }
    }

    headlessMenu = popup
    Log.d(TAG, "buildHeadless menu=${System.identityHashCode(popup)}")
    refreshHeadlessMenu()
  }

  private fun updateEnabledState() {
    val enabled = interactivity == "enabled"
    inlineLayout?.isEnabled = enabled
    inlineText?.isEnabled = enabled
    inlineSpinner?.isEnabled = enabled
  }

  private fun refreshAdapters() {
    val labels = options.map { it.label }

    inlineText?.let { actv ->
      val adapter = ArrayAdapter(actv.context, android.R.layout.simple_list_item_1, labels)
      actv.setAdapter(adapter)
    }

    inlineSpinner?.let { sp ->
      suppressInlineSpinnerCallbacks(sp)
      val adapter = ArrayAdapter(sp.context, android.R.layout.simple_spinner_item, labels)
      adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
      sp.adapter = adapter
    }

    refreshHeadlessMenu()
  }

  private fun refreshSelections() {
    val idx = options.indexOfFirst { it.data == selectedData }

    inlineText?.let { actv ->
      if (idx >= 0) {
        // Show selected value
        actv.setText(options[idx].label, false)
      } else {
        // Clear text to show placeholder
        actv.setText("", false)
      }
    }

    inlineSpinner?.let { sp ->
      if (options.isEmpty()) return
      val target = if (idx >= 0) idx else 0
      // Always call setSelection to ensure the view is refreshed
      // Even if the position hasn't changed, we need to update the displayed text
      suppressInlineSpinnerCallbacks(sp)
      sp.setSelection(target, false)
    }
  }

  // ---- Inline dropdown overlay ----

  private inner class InlineAutoCompleteTextView(context: Context) :
    MaterialAutoCompleteTextView(context) {
    override fun showDropDown() {
      if (interactivity != "enabled" || !isEnabled) return
      attachInlineDropdownOverlay()
      super.showDropDown()
      post {
        if (!isPopupShowing) {
          detachInlineDropdownOverlay()
        }
      }
    }

    override fun dismissDropDown() {
      super.dismissDropDown()
      detachInlineDropdownOverlay()
    }
  }

  private fun attachInlineDropdownOverlay() {
    if (inlineDropdownOverlay?.parent != null) return
    val parent = findInlineOverlayParent() ?: return
    // Fullscreen touch guard to dismiss without leaking taps to underlying views.
    val overlay = inlineDropdownOverlay
      ?: View(parent.context).apply {
        layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
        isClickable = true
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        setOnTouchListener { _, event ->
          if (event.action == android.view.MotionEvent.ACTION_DOWN) {
            inlineText?.dismissDropDown()
            detachInlineDropdownOverlay()
          }
          true
        }
      }.also { inlineDropdownOverlay = it }
    parent.addView(overlay)
  }

  private fun detachInlineDropdownOverlay() {
    val overlay = inlineDropdownOverlay ?: return
    (overlay.parent as? ViewGroup)?.removeView(overlay)
  }

  private fun findInlineOverlayParent(): ViewGroup? {
    val activity = context.findActivity()
    val contentRoot = activity?.findViewById<ViewGroup>(android.R.id.content)
    if (contentRoot != null) return contentRoot
    val activityRoot = activity?.window?.decorView as? ViewGroup
    if (activityRoot != null) return activityRoot
    return rootView as? ViewGroup
  }

  // ---- Headless open ----

  private fun presentHeadlessIfNeeded(token: Int) {
    val popup = headlessMenu ?: return
    if (interactivity != "enabled") {
      Log.d(TAG, "presentHeadlessIfNeeded interactivity=$interactivity -> requestClose")
      onRequestClose?.invoke()
      return
    }
    post {
      if (token != headlessOpenToken) {
        Log.d(TAG, "presentHeadlessIfNeeded stale token -> skip")
        return@post
      }
      if (anchorMode != "headless" || visible != "open") {
        Log.d(TAG, "presentHeadlessIfNeeded no longer open -> skip")
        return@post
      }
      if (interactivity != "enabled") {
        Log.d(TAG, "presentHeadlessIfNeeded disabled -> skip")
        return@post
      }
      if (!isAttachedToWindow) {
        Log.d(TAG, "presentHeadlessIfNeeded not attached -> requestClose")
        onRequestClose?.invoke()
        return@post
      }
      Log.d(
        TAG,
        "presentHeadlessIfNeeded attached width=${this@PCSelectionMenuView.width} alpha=$alpha"
      )

      refreshHeadlessMenu()
      if (!headlessMenuShowing) {
        Log.d(TAG, "presentHeadlessIfNeeded show items=${options.size}")
        headlessDismissProgrammatic = false
        headlessDismissAfterSelect = false
        headlessMenuShowing = true
        popup.show()
      }
    }
  }

  private fun handleHeadlessSelection(position: Int) {
    val opt = options.getOrNull(position) ?: return
    Log.d(TAG, "handleHeadlessSelection pos=$position data=${opt.data}")
    selectedData = opt.data
    onSelect?.invoke(position, opt.label, opt.data)
  }

  private fun refreshHeadlessMenu() {
    val menu = headlessMenu?.menu ?: return
    menu.clear()
    options.forEachIndexed { index, opt ->
      menu.add(0, index, index, opt.label)
    }
  }

  private fun suppressInlineSpinnerCallbacks(sp: Spinner) {
    inlineSpinnerSuppressCount += 1
    val posted = sp.post {
      inlineSpinnerSuppressCount = (inlineSpinnerSuppressCount - 1).coerceAtLeast(0)
    }
    if (!posted) {
      inlineSpinnerSuppressCount = (inlineSpinnerSuppressCount - 1).coerceAtLeast(0)
    }
  }

  override fun onDetachedFromWindow() {
    detachInlineDropdownOverlay()
    super.onDetachedFromWindow()
  }

  // ---- Helpers ----

  private enum class MaterialMode { SYSTEM, M3 }

  private fun parseMaterial(value: String?): MaterialMode =
    when (value) {
      "m3" -> MaterialMode.M3
      "system", null -> MaterialMode.SYSTEM
      else -> MaterialMode.SYSTEM
    }
}
