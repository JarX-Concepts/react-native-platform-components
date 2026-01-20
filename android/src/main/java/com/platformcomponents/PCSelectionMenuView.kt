package com.platformcomponents

import android.content.Context
import android.util.Log
import android.view.View
import android.widget.ArrayAdapter
import android.widget.FrameLayout
import android.widget.Spinner
import androidx.appcompat.widget.PopupMenu

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

  // Kept for backward compatibility with your interface; ignored on Android headless.
  var presentation: String = "auto"   // "auto" | "popover" | "sheet"

  // Only used to choose inline rendering style.
  var androidMaterial: String? = "system" // "system" | "m3"

  // --- Events ---
  var onSelect: ((index: Int, label: String, data: String) -> Unit)? = null
  var onRequestClose: (() -> Unit)? = null

  // --- Inline UI ---
  private var inlineSpinner: Spinner? = null

  // --- Headless UI (true picker) ---
  private var headlessMenu: PopupMenu? = null
  private var headlessMenuShowing = false
  private var headlessDismissProgrammatic = false
  private var headlessDismissAfterSelect = false

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
    Log.d(TAG, "applyOptions size=${options.size}")
    refreshAdapters()
    refreshSelections()
  }

  fun applySelectedData(data: String?) {
    selectedData = data ?: ""
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
    placeholder = value
    // Spinner doesn't support placeholder/hint
  }

  fun applyAnchorMode(value: String?) {
    val newMode = when (value) {
      "inline", "headless" -> value
      else -> "headless"
    }
    if (anchorMode == newMode) return
    anchorMode = newMode
    Log.d(TAG, "applyAnchorMode anchorMode=$anchorMode")
    rebuildUI()
  }

  fun applyVisible(value: String?) {
    visible = when (value) {
      "open", "closed" -> value
      else -> "closed"
    }
    Log.d(TAG, "applyVisible visible=$visible anchorMode=$anchorMode")

    if (anchorMode != "headless") return

    if (visible == "open") {
      presentHeadlessIfNeeded()
    } else {
      Log.d(TAG, "applyVisible close -> dismiss")
      if (headlessMenuShowing) {
        headlessDismissProgrammatic = true
        headlessMenu?.dismiss()
      }
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
    inlineSpinner = null
    headlessMenu = null
    headlessMenuShowing = false
    headlessDismissProgrammatic = false
    headlessDismissAfterSelect = false

    // Headless should be invisible but anchorable.
    // Spinner dropdown dismisses if the anchor isn't visible; keep a tiny alpha > 0.
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
    // Inline mode uses Spinner for appearance + PopupMenu for dropdown behavior
    // This works reliably and inherits the app's Material theme automatically
    val sp = Spinner(context).apply {
      layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.WRAP_CONTENT
      )
      visibility = View.VISIBLE

      // Intercept touch to prevent default Spinner dropdown, show PopupMenu instead
      setOnTouchListener { view, event ->
        if (event.action == android.view.MotionEvent.ACTION_UP) {
          if (interactivity == "enabled") {
            showInlinePopupMenu(view)
          }
          true // Consume the event to prevent Spinner's default behavior
        } else {
          false
        }
      }
    }

    addView(sp)
    inlineSpinner = sp
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
    inlineSpinner?.isEnabled = enabled
  }

  private fun refreshAdapters() {
    val labels = options.map { it.label }

    inlineSpinner?.let { sp ->
      val adapter = ArrayAdapter(sp.context, android.R.layout.simple_spinner_item, labels)
      adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
      sp.adapter = adapter
    }

    refreshHeadlessMenu()
  }

  private fun refreshSelections() {
    val idx = options.indexOfFirst { it.data == selectedData }

    inlineSpinner?.let { sp ->
      if (options.isEmpty()) return
      val target = if (idx >= 0) idx else 0
      if (sp.selectedItemPosition != target) {
        sp.setSelection(target, false)
      }
    }
  }

  private fun showInlinePopupMenu(anchor: View) {
    if (options.isEmpty()) return

    PopupMenu(context, anchor).apply {
      options.forEachIndexed { index, opt ->
        menu.add(0, index, index, opt.label)
      }

      setOnMenuItemClickListener { item ->
        val index = item.itemId
        val opt = options.getOrNull(index) ?: return@setOnMenuItemClickListener false
        selectedData = opt.data
        onSelect?.invoke(index, opt.label, opt.data)
        refreshSelections()
        true
      }
    }.show()
  }

  // ---- Headless open ----

  private fun presentHeadlessIfNeeded() {
    val popup = headlessMenu ?: return
    if (interactivity != "enabled") {
      Log.d(TAG, "presentHeadlessIfNeeded interactivity=$interactivity -> requestClose")
      onRequestClose?.invoke()
      return
    }
    post {
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

  // ---- Helpers ----

}
