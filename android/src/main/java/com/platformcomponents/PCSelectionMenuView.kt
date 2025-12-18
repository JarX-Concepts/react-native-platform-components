package com.platformcomponents

import android.content.Context
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.FrameLayout
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.FragmentActivity
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputLayout
import android.widget.LinearLayout

class PCSelectionMenuView(context: Context) : FrameLayout(context) {

  data class Option(val label: String, val data: String)

  // --- Props ---
  var options: List<Option> = emptyList()
  var selectedData: String = "" // sentinel for none

  var interactivity: String = "enabled" // "enabled" | "disabled"
  var placeholder: String? = null

  var anchorMode: String = "headless" // "inline" | "headless"
  var visible: String = "closed"      // "open" | "closed" (headless only)
  var presentation: String = "auto"   // "auto" | "popover" | "sheet" (headless only)

  var androidMaterial: String? = null // "auto" | "m2" | "m3"

  // --- Events ---
  var onSelect: ((index: Int, label: String, data: String) -> Unit)? = null
  var onRequestClose: (() -> Unit)? = null

  // --- Inline UI ---
  private var inlineLayout: TextInputLayout? = null
  private var inlineText: MaterialAutoCompleteTextView? = null

  private var showingDialog: Boolean = false

  init {
    minimumHeight = 0
    minimumWidth = 0
    updateAnchorMode()
  }

  // --- Public apply* (called by manager) ---

  fun applyOptions(newOptions: List<Option>) {
    options = newOptions
    refreshInlineAdapter()
    refreshInlineSelection()
  }

  fun applySelectedData(data: String?) {
    selectedData = data ?: ""
    refreshInlineSelection()
  }

  fun applyInteractivity(value: String?) {
    interactivity = if (value == "disabled") "disabled" else "enabled"
    updateEnabledState()
    if (interactivity != "enabled" && showingDialog) {
      // Can't forcibly dismiss without keeping refs; just mark closed and notify
      showingDialog = false
      onRequestClose?.invoke()
    }
  }

  fun applyPlaceholder(value: String?) {
    placeholder = value
    inlineLayout?.hint = placeholder
  }

  fun applyAnchorMode(value: String?) {
    anchorMode = when (value) {
      "inline", "headless" -> value
      else -> "headless"
    }
    updateAnchorMode()
  }

  fun applyVisible(value: String?) {
    visible = when (value) {
      "open", "closed" -> value
      else -> "closed"
    }

    // Only meaningful in headless mode.
    if (anchorMode != "headless") return

    if (visible == "open") presentIfNeeded()
    else dismissIfNeeded()
  }

  fun applyPresentation(value: String?) {
    presentation = when (value) {
      "auto", "popover", "sheet" -> value
      else -> "auto"
    }
  }

  fun applyAndroidMaterial(value: String?) {
    androidMaterial = value
  }

  // --- Layout: headless should take no space ---
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (anchorMode == "headless") {
      setMeasuredDimension(0, 0)
      return
    }
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  // --- Anchor mode switching ---
  private fun updateAnchorMode() {
    removeAllViews()
    inlineLayout = null
    inlineText = null

    if (anchorMode == "inline") {
      val til = TextInputLayout(context).apply {
        layoutParams = FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.WRAP_CONTENT
        )
        hint = placeholder
      }

      val actv = MaterialAutoCompleteTextView(til.context).apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
        isSingleLine = true

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

      refreshInlineAdapter()
      refreshInlineSelection()
      updateEnabledState()
    }

    requestLayout()
  }

  private fun updateEnabledState() {
    val enabled = interactivity == "enabled"
    inlineLayout?.isEnabled = enabled
    inlineText?.isEnabled = enabled
  }

  private fun refreshInlineAdapter() {
    val actv = inlineText ?: return
    val labels = options.map { it.label }
    val adapter = ArrayAdapter(actv.context, android.R.layout.simple_list_item_1, labels)
    actv.setAdapter(adapter)
  }

  private fun refreshInlineSelection() {
    val actv = inlineText ?: return
    val idx = options.indexOfFirst { it.data == selectedData }
    val label = if (idx >= 0) options[idx].label else ""
    // setText(label, false) prevents dropdown from reopening
    actv.setText(label, false)
  }

  // --- Headless presentation ---

  private fun presentIfNeeded() {
    if (showingDialog) return
    if (interactivity != "enabled") return

    val act = findFragmentActivity() ?: run {
      onRequestClose?.invoke()
      return
    }

    showingDialog = true

    val requested = parseMaterialMode(androidMaterial)
    val resolved = resolveAutoMaterialMode(act, requested)

    val useSheet = when (presentation) {
      "sheet" -> true
      "popover" -> false
      else -> true // auto => sheet
    }

    if (useSheet) showBottomSheet(act, resolved) else showAlert(act, resolved)
  }

  private fun dismissIfNeeded() {
    // dialogs dismiss themselves; we just reset state
    if (!showingDialog) return
    showingDialog = false
  }

  private fun showAlert(act: FragmentActivity, resolved: PCMaterialMode) {
    val ctx = act

    val labels = options.map { it.label }.toTypedArray()
    val checked = options.indexOfFirst { it.data == selectedData } // -1 allowed

    val builder =
      if (resolved == PCMaterialMode.M3) MaterialAlertDialogBuilder(ctx)
      else AlertDialog.Builder(ctx)

    val dlg = builder
      .setTitle(placeholder ?: "")
      .setSingleChoiceItems(labels, checked) { dialog, which ->
        val opt = options.getOrNull(which)
        if (opt != null) {
          selectedData = opt.data
          onSelect?.invoke(which, opt.label, opt.data)
        }
        dialog.dismiss()
      }
      .setOnCancelListener {
        onRequestClose?.invoke()
        showingDialog = false
      }
      .setOnDismissListener {
        onRequestClose?.invoke()
        showingDialog = false
      }
      .create()

    dlg.show()
  }

  private fun showBottomSheet(act: FragmentActivity, resolved: PCMaterialMode) {
    val ctx = act
    val dlg = BottomSheetDialog(ctx)

    val list = android.widget.ListView(ctx)
    val labels = options.map { it.label }
    list.adapter = ArrayAdapter(ctx, android.R.layout.simple_list_item_1, labels)
    list.setOnItemClickListener { _, _, position, _ ->
      val opt = options.getOrNull(position)
      if (opt != null) {
        selectedData = opt.data
        onSelect?.invoke(position, opt.label, opt.data)
      }
      dlg.dismiss()
    }

    dlg.setContentView(list)
    dlg.setOnCancelListener {
      onRequestClose?.invoke()
      showingDialog = false
    }
    dlg.setOnDismissListener {
      onRequestClose?.invoke()
      showingDialog = false
    }

    dlg.show()
  }

  private fun findFragmentActivity(): FragmentActivity? =
    context as? FragmentActivity
}
