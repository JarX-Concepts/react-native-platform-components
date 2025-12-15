package com.platformcomponents

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.DialogInterface
import android.util.AttributeSet
import android.view.View
import android.widget.ArrayAdapter
import android.widget.FrameLayout
import android.widget.ListView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputLayout
import android.widget.AutoCompleteTextView
import android.view.ViewGroup
import android.widget.TextView

class SelectionMenuView @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null
) : FrameLayout(context, attrs) {

  // Props
  var options: List<String> = emptyList()
    set(value) {
      field = value
      if (inlineMode) syncInlineAdapter()
      // If currently presented (headless), we won't hot-update the dialog contents; keep it simple.
    }

  var selectedIndex: Int = -1
    set(value) {
      field = value
      if (inlineMode) syncInlineSelection()
    }

  var disabled: Boolean = false
    set(value) {
      field = value
      if (inlineMode) syncInlineEnabled()
      // headless: prevents opening
      if (disabled) dismissPresented(emitClose = true)
    }

  var placeholder: String? = null
    set(value) {
      field = value
      if (inlineMode) syncInlineHint()
    }

  /** "open" | "closed" (headless only) */
  var visible: String = "closed"
    set(value) {
      field = value
      if (!inlineMode) syncHeadlessPresentation()
    }

  /** "auto" | "popover" | "sheet" (headless only) */
  var presentation: String = "auto"
    set(value) {
      field = value
      if (!inlineMode) syncHeadlessPresentation()
    }

  /** true = inline exposed dropdown; false = headless presenter */
  var inlineMode: Boolean = false
    set(value) {
      val prev = field
      field = value
      if (prev != value) {
        if (value) {
          // switching into inline: dismiss any headless UI
          dismissPresented(emitClose = false)
          ensureInlineViews()
          syncInlineAll()
        } else {
          // switching into headless: remove inline views and apply visible/presentation
          teardownInlineViews()
          syncHeadlessPresentation()
        }
      }
    }

  // --- Inline UI ---
  private var inlineTextInputLayout: TextInputLayout? = null
  private var inlineAutoComplete: AutoCompleteTextView? = null
  private var inlineAdapter: ArrayAdapter<String>? = null

  // --- Headless presenters ---
  private var alertDialog: androidx.appcompat.app.AlertDialog? = null
  private var bottomSheetDialog: BottomSheetDialog? = null

  // --- Events ---
  private fun eventDispatcher(): EventDispatcher? {
    val reactContext = context as? ReactContext ?: return null
    val uiManager = UIManagerHelper.getUIManager(reactContext, id) ?: return null
    return uiManager.eventDispatcher
  }

  private fun emitSelect(index: Int, value: String) {
    val dispatcher = eventDispatcher() ?: return
    val payload = Arguments.createMap().apply {
      putInt("index", index)
      putString("value", value)
    }
    dispatcher.dispatchEvent(
      SelectionMenuSelectEvent(id, payload)
    )
  }

  private fun emitRequestClose() {
    val dispatcher = eventDispatcher() ?: return
    dispatcher.dispatchEvent(
      SelectionMenuRequestCloseEvent(id)
    )
  }

  // MARK: - Inline

  private fun ensureInlineViews() {
    if (inlineTextInputLayout != null) return

    val til = TextInputLayout(context).apply {
      layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.WRAP_CONTENT
      )
      // Material exposed dropdown pattern:
      // If you want the dropdown icon, set endIconMode appropriately.
      endIconMode = TextInputLayout.END_ICON_DROPDOWN_MENU
    }

    val actv = AutoCompleteTextView(context).apply {
      layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.WRAP_CONTENT
      )
      isSingleLine = true
      threshold = 0
      setOnItemClickListener { _, _, position, _ ->
        if (disabled) return@setOnItemClickListener
        val idx = position
        val v = options.getOrNull(idx) ?: return@setOnItemClickListener
        selectedIndex = idx
        emitSelect(idx, v)
      }
    }

    til.addView(actv)
    addView(til)

    inlineTextInputLayout = til
    inlineAutoComplete = actv

    syncInlineAll()
  }

  private fun teardownInlineViews() {
    inlineTextInputLayout?.let { removeView(it) }
    inlineTextInputLayout = null
    inlineAutoComplete = null
    inlineAdapter = null
  }

  private fun syncInlineAll() {
    syncInlineHint()
    syncInlineAdapter()
    syncInlineSelection()
    syncInlineEnabled()
  }

  private fun syncInlineHint() {
    inlineTextInputLayout?.hint = placeholder ?: "Select"
  }

  private fun syncInlineAdapter() {
    val actv = inlineAutoComplete ?: return
    val adapter = inlineAdapter ?: ArrayAdapter(
      context,
      android.R.layout.simple_list_item_1,
      options
    ).also { inlineAdapter = it }

    adapter.clear()
    adapter.addAll(options)
    adapter.notifyDataSetChanged()
    actv.setAdapter(adapter)
  }

  private fun syncInlineSelection() {
    val actv = inlineAutoComplete ?: return
    val text =
      if (selectedIndex in options.indices) options[selectedIndex]
      else ""

    // false => don't filter/dropdown instantly
    actv.setText(text, false)
  }

  private fun syncInlineEnabled() {
    val til = inlineTextInputLayout ?: return
    val actv = inlineAutoComplete ?: return
    til.isEnabled = !disabled
    actv.isEnabled = !disabled
  }

  // MARK: - Headless (visible-controlled)

  private fun syncHeadlessPresentation() {
    if (disabled) {
      dismissPresented(emitClose = false)
      return
    }

    if (visible == "open") {
      presentIfNeeded()
    } else {
      dismissPresented(emitClose = false)
    }
  }

  private fun presentIfNeeded() {
    // already showing?
    if (alertDialog?.isShowing == true) return
    if (bottomSheetDialog?.isShowing == true) return

    val activity = findActivity() ?: return
    val mode = resolvePresentationForAndroid(presentation)

    when (mode) {
      "dialog" -> presentDialog(activity)
      "sheet" -> presentBottomSheet(activity)
      else -> presentBottomSheet(activity) // default
    }
  }

  private fun resolvePresentationForAndroid(p: String): String {
    return when (p) {
      "popover" -> "dialog"
      "sheet" -> "sheet"
      "auto" -> "sheet"
      else -> "sheet"
    }
  }

  private fun dismissPresented(emitClose: Boolean) {
    var didDismiss = false

    alertDialog?.let {
      if (it.isShowing) {
        it.setOnDismissListener(null)
        it.dismiss()
        didDismiss = true
      }
    }
    alertDialog = null

    bottomSheetDialog?.let {
      if (it.isShowing) {
        it.setOnDismissListener(null)
        it.dismiss()
        didDismiss = true
      }
    }
    bottomSheetDialog = null

    if (emitClose && didDismiss) {
      emitRequestClose()
    }
  }

  private fun presentDialog(activity: Activity) {
    val items = options.toTypedArray()
    val checked = if (selectedIndex in options.indices) selectedIndex else -1

    val dialog = MaterialAlertDialogBuilder(activity)
      .setTitle(placeholder ?: "Select")
      .setSingleChoiceItems(items, checked) { d: DialogInterface, which: Int ->
        val v = options.getOrNull(which) ?: return@setSingleChoiceItems
        selectedIndex = which
        emitSelect(which, v)
        d.dismiss()
        // Dismiss callback will fire and emit request close.
      }
      .setOnCancelListener {
        emitRequestClose()
      }
      .create()

    dialog.setOnDismissListener {
      // Headless contract: native tells JS to close
      emitRequestClose()
    }

    alertDialog = dialog
    dialog.show()
  }

  private fun presentBottomSheet(activity: Activity) {
    val sheet = BottomSheetDialog(activity)

    val rv = RecyclerView(activity).apply {
      layoutParams = LayoutParams(
        LayoutParams.MATCH_PARENT,
        LayoutParams.WRAP_CONTENT
      )
      layoutManager = LinearLayoutManager(activity)
      adapter = SimpleStringAdapter(
        items = options,
        onClick = { idx ->
          val v = options.getOrNull(idx) ?: return@SimpleStringAdapter
          selectedIndex = idx
          emitSelect(idx, v)
          sheet.dismiss()
        }
      )
    }

    sheet.setContentView(rv)

    sheet.setOnDismissListener {
      emitRequestClose()
    }

    bottomSheetDialog = sheet
    sheet.show()
  }

  private fun findActivity(): Activity? {
    var c: Context? = context
    while (c is ContextWrapper) {
      if (c is Activity) return c
      c = c.baseContext
    }
    return null
  }

  // MARK: - Event classes (Fabric-compatible EventDispatcher usage)

  private class SelectionMenuSelectEvent(
    viewId: Int,
    private val payload: com.facebook.react.bridge.WritableMap
  ) : com.facebook.react.uimanager.events.Event<SelectionMenuSelectEvent>(viewId) {
    override fun getEventName() = "onSelect"
    override fun dispatch(rctEventEmitter: com.facebook.react.uimanager.events.RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class SelectionMenuRequestCloseEvent(
    viewId: Int
  ) : com.facebook.react.uimanager.events.Event<SelectionMenuRequestCloseEvent>(viewId) {
    override fun getEventName() = "onRequestClose"
    override fun dispatch(rctEventEmitter: com.facebook.react.uimanager.events.RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewTag, eventName, null)
    }
  }

  // Simple recycler adapter for bottom sheet
  private class SimpleStringAdapter(
    private val items: List<String>,
    private val onClick: (Int) -> Unit
  ) : RecyclerView.Adapter<SimpleStringAdapter.VH>() {

    class VH(val tv: TextView) : RecyclerView.ViewHolder(tv)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
      val tv = TextView(parent.context).apply {
        layoutParams = RecyclerView.LayoutParams(
          RecyclerView.LayoutParams.MATCH_PARENT,
          RecyclerView.LayoutParams.WRAP_CONTENT
        )
        // Simple system-ish row padding
        val pH = (16 * resources.displayMetrics.density).toInt()
        val pV = (14 * resources.displayMetrics.density).toInt()
        setPadding(pH, pV, pH, pV)
        textSize = 16f
      }
      return VH(tv)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
      holder.tv.text = items[position]
      holder.tv.setOnClickListener { onClick(position) }
    }

    override fun getItemCount(): Int = items.size
  }
}
