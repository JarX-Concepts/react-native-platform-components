package com.platformcomponents.selectionmenu

import android.app.Dialog
import android.content.Context
import android.content.ContextWrapper
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.view.ContextThemeWrapper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.ReactContext
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder

data class SelectionOption(
  val label: String,
  val data: String,
)

class PCSelectionMenuView(context: Context) : FrameLayout(context) {

  // ---------- Props (set by manager) ----------

  var options: List<SelectionOption> = emptyList()
    set(value) {
      field = value
      syncLabel()
      // If open, refresh list UI by re-presenting (simple + predictable)
      if (isPresented()) {
        dismiss(emitClose = false)
        presentIfNeeded()
      }
    }

  /** Controlled selection. "" means no selection. */
  var selectedData: String = ""
    set(value) {
      field = value
      syncLabel()
      // No other side effects.
    }

  /** "enabled" | "disabled" */
  var interactivity: String = "enabled"
    set(value) {
      field = value
      updateEnabled()
    }

  var placeholder: String? = null
    set(value) {
      field = value
      syncLabel()
    }

  /** "inline" | "headless" */
  var anchorMode: String = "headless"
    set(value) {
      field = value
      updateAnchorMode()
    }

  /** headless only: "open" | "closed" */
  var visible: String = "closed"
    set(value) {
      field = value
      updatePresentationFromProps()
    }

  /** headless only: "auto" | "popover" | "sheet" */
  var presentation: String = "auto"
    set(value) {
      field = value
      updatePresentationFromProps()
    }

  /** android.material: "auto" | "m2" | "m3" */
  var material: String? = null
    set(value) {
      field = value
      // If a dialog is open, rebuild with new theme.
      if (isPresented()) {
        dismiss(emitClose = false)
        presentIfNeeded()
      }
    }

  // ---------- Events back to RN ----------

  var onSelect: ((index: Int, label: String, data: String) -> Unit)? = null
  var onRequestClose: (() -> Unit)? = null

  // ---------- Internal UI ----------

  private val anchorRow: LinearLayout = LinearLayout(context).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    isClickable = true
    isFocusable = true
    setPadding(dp(12), dp(10), dp(12), dp(10))
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
    setOnClickListener { handleAnchorPress() }
  }

  private val labelView: TextView = TextView(context).apply {
    layoutParams = LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f)
    maxLines = 1
  }

  private val chevronView: TextView = TextView(context).apply {
    layoutParams = LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
    text = "▾"
    setPadding(dp(8), 0, 0, 0)
    alpha = 0.7f
  }

  private var presentedDialog: Dialog? = null

  init {
    anchorRow.addView(labelView)
    anchorRow.addView(chevronView)
    addView(anchorRow)

    updateEnabled()
    updateAnchorMode()
    syncLabel()
  }

  private fun dp(v: Int): Int =
    (v * resources.displayMetrics.density).toInt()

  private fun updateEnabled() {
    val disabled = (interactivity == "disabled")
    anchorRow.isEnabled = !disabled
    anchorRow.alpha = if (disabled) 0.5f else 1.0f
  }

  private fun updateAnchorMode() {
    // Inline: show anchor UI + manage open/close internally (tap on anchor).
    // Headless: hide anchor UI (height 0) and respond to visible/presentation props.
    if (anchorMode == "inline") {
      anchorRow.visibility = View.VISIBLE
      updatePresentationFromProps() // ensures headless doesn't keep a dialog open
    } else {
      anchorRow.visibility = View.GONE
      updatePresentationFromProps()
    }
  }

  private fun syncLabel() {
    val selected = options.firstOrNull { it.data == selectedData && selectedData.isNotEmpty() }
    labelView.text = selected?.label ?: (placeholder ?: "Select")
  }

  private fun handleAnchorPress() {
    if (interactivity == "disabled") return
    if (anchorMode != "inline") return
    // Inline manages its own presentation: just open.
    presentIfNeeded()
  }

  private fun updatePresentationFromProps() {
    if (anchorMode == "inline") {
      // Ignore headless props.
      return
    }

    if (interactivity == "disabled") {
      dismiss(emitClose = false)
      return
    }

    if (visible == "open") {
      presentIfNeeded()
    } else {
      dismiss(emitClose = false)
    }
  }

  private fun isPresented(): Boolean = presentedDialog?.isShowing == true

  private fun presentIfNeeded() {
    if (isPresented()) return
    if (options.isEmpty()) return

    val mode = (material ?: "auto")
    val isSheet = when (presentation) {
      "sheet" -> true
      "popover" -> false
      else -> {
        // "auto"
        // Common Android UX: bottom sheet on phones, dialog on tablets.
        // Keep it simple: sheet by default.
        true
      }
    }

    if (isSheet) {
      presentBottomSheet(mode)
    } else {
      presentDialog(mode)
    }
  }

  private fun themedContext(mode: String): Context {
    val themeRes = when (mode) {
      "m3" -> resolveMaterial3DialogTheme()
      "m2" -> resolveMaterial2DialogTheme()
      else -> 0
    }
    return if (themeRes != 0) ContextThemeWrapper(context, themeRes) else context
  }

  private fun resolveMaterial2DialogTheme(): Int {
    // Exists in Material Components
    return try {
      com.google.android.material.R.style.ThemeOverlay_MaterialComponents_MaterialAlertDialog
    } catch (_: Throwable) {
      0
    }
  }

  private fun resolveMaterial3DialogTheme(): Int {
    // Exists in Material 3 (MaterialComponents 1.8+ typically)
    return try {
      com.google.android.material.R.style.ThemeOverlay_Material3_MaterialAlertDialog
    } catch (_: Throwable) {
      // Fall back to M2 overlay if M3 overlay is missing
      resolveMaterial2DialogTheme()
    }
  }

  private fun resolveMaterial2BottomSheetTheme(): Int {
    return try {
      com.google.android.material.R.style.ThemeOverlay_MaterialComponents_BottomSheetDialog
    } catch (_: Throwable) {
      0
    }
  }

  private fun resolveMaterial3BottomSheetTheme(): Int {
    return try {
      com.google.android.material.R.style.ThemeOverlay_Material3_BottomSheetDialog
    } catch (_: Throwable) {
      resolveMaterial2BottomSheetTheme()
    }
  }

  private fun presentDialog(mode: String) {
    val ctx = themedContext(mode)

    val items = options.map { it.label }.toTypedArray()
    val selectedIndex = options.indexOfFirst { it.data == selectedData }.coerceAtLeast(-1)

    val builder = MaterialAlertDialogBuilder(ctx)
      .setTitle(placeholder ?: "Select")
      .setSingleChoiceItems(items, selectedIndex) { dialog, which ->
        val opt = options[which]
        selectedData = opt.data
        onSelect?.invoke(which, opt.label, opt.data)
        dialog.dismiss()
      }
      .setOnDismissListener {
        presentedDialog = null
        onRequestClose?.invoke()
      }

    val dlg = builder.create()
    presentedDialog = dlg
    dlg.show()
  }

  private fun presentBottomSheet(mode: String) {
    val themeRes = when (mode) {
      "m3" -> resolveMaterial3BottomSheetTheme()
      "m2" -> resolveMaterial2BottomSheetTheme()
      else -> 0
    }

    val dlg = if (themeRes != 0) BottomSheetDialog(context, themeRes) else BottomSheetDialog(context)

    val rv = RecyclerView(dlg.context).apply {
      layoutManager = LinearLayoutManager(dlg.context)
      adapter = OptionsAdapter(options, selectedData) { idx ->
        val opt = options[idx]
        selectedData = opt.data
        onSelect?.invoke(idx, opt.label, opt.data)
        dlg.dismiss()
      }
    }

    dlg.setContentView(rv)
    dlg.setOnDismissListener {
      presentedDialog = null
      onRequestClose?.invoke()
    }

    presentedDialog = dlg
    dlg.show()
  }

  private class OptionsAdapter(
    private val options: List<SelectionOption>,
    private val selectedData: String,
    private val onTapIndex: (Int) -> Unit,
  ) : RecyclerView.Adapter<OptionVH>() {

    override fun onCreateViewHolder(parent: android.view.ViewGroup, viewType: Int): OptionVH {
      val tv = TextView(parent.context).apply {
        setPadding(dp(parent.context, 16), dp(parent.context, 14), dp(parent.context, 16), dp(parent.context, 14))
        maxLines = 1
      }
      return OptionVH(tv)
    }

    override fun onBindViewHolder(holder: OptionVH, position: Int) {
      val opt = options[position]
      val tv = holder.itemView as TextView
      tv.text = if (opt.data == selectedData && selectedData.isNotEmpty()) "✓  ${opt.label}" else opt.label
      tv.setOnClickListener { onTapIndex(position) }
    }

    override fun getItemCount(): Int = options.size

    private fun dp(ctx: Context, v: Int): Int = (v * ctx.resources.displayMetrics.density).toInt()
  }

  private class OptionVH(view: View) : RecyclerView.ViewHolder(view)

  private fun dismiss(emitClose: Boolean) {
    val dlg = presentedDialog ?: return
    presentedDialog = null
    dlg.dismiss()
    if (emitClose) onRequestClose?.invoke()
  }
}