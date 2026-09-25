package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.RippleDrawable
import android.text.InputType
import android.text.TextUtils
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.BaseAdapter
import android.widget.Filter
import android.widget.Filterable
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.TextView
import androidx.appcompat.widget.PopupMenu
import androidx.core.widget.TextViewCompat
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.R as MaterialR
import com.google.android.material.color.MaterialColors
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputLayout
import java.util.Locale

class PCSelectionMenuView(context: Context) : FrameLayout(context), ReactScrollViewHelper.HasStateWrapper {

  data class Option(
    val label: String,
    val data: String,
    val subtitle: String = "",
    val icon: PCButtonSupport.Icon = PCButtonSupport.NO_ICON
  ) {
    /** Has content beyond a label, which needs the rich dropdown rows. */
    val isRich: Boolean get() = subtitle.isNotEmpty() || icon.isPresent
  }

  companion object {
    private const val TAG = "PCSelectionMenu"
    private const val HEADLESS_GROUP_ID = 0
  }

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedWidth: Float = 0f
  private var lastReportedHeight: Float = 0f

  // --- Props ---
  var options: List<Option> = emptyList()
  var selectedData: String = "" // sentinel for none

  var interactivity: String = "enabled" // "enabled" | "disabled"
  var placeholder: String? = null

  var anchorMode: String = "headless" // "inline" | "headless"
  var visible: String = "closed"      // "open" | "closed" (headless only)

  // Only used to choose inline rendering style.
  var androidMaterial: String? = "system" // "system" | "m3"

  // Embedded M3 only: the field accepts typing and filters the options.
  var androidSearchable: Boolean = false

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

  // --- Native theme ---
  // Widgets read theme colors when they are created, so they are rebuilt when the
  // native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  init {
    minimumHeight = 0
    minimumWidth = 0
    // Allow content to draw outside bounds if Yoga assigns less space than needed
    clipChildren = false
    clipToPadding = false
    rebuildUI()
  }

  // Track if we've requested a layout update after first measure
  private var hasRequestedLayoutUpdate = false

  // Headless needs a non-zero anchor rect for dropdown
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (anchorMode == "headless") {
      val w = MeasureSpec.getSize(widthMeasureSpec)
      setMeasuredDimension(if (w > 0) w else 1, 1)
      return
    }

    // Inline mode: Always measure children with UNSPECIFIED height to get intrinsic size.
    // This ensures TextInputLayout/Spinner can report their true desired height
    // regardless of what constraints React Native passed.
    val unconstrainedHeightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    super.onMeasure(widthMeasureSpec, unconstrainedHeightSpec)

    // Get intrinsic height from children, enforce minimum (which varies by mode)
    // minimumHeight is set in buildInline() based on the material mode
    val intrinsicHeight = measuredHeight.coerceAtLeast(minimumHeight)

    // For inline mode, always use intrinsic height to prevent clipping.
    // React Native's Yoga doesn't know our content size, so it may pass
    // constraints that would clip the content. We prioritize showing the
    // full control over strictly respecting layout constraints.
    setMeasuredDimension(measuredWidth, intrinsicHeight)
  }

  // Override requestLayout to handle React Native's layout timing.
  // This ensures that after children are added/measured, we trigger
  // a re-layout that React Native's Yoga can pick up.
  override fun requestLayout() {
    super.requestLayout()
    // Post a measure/layout pass to ensure the view is properly sized
    // after React Native's initial layout pass
    if (!hasRequestedLayoutUpdate && anchorMode == "inline") {
      hasRequestedLayoutUpdate = true
      post(measureAndLayout)
    }
  }

  private val measureAndLayout = Runnable {
    if (!isAttachedToWindow || anchorMode != "inline") return@Runnable

    // Re-measure to get correct intrinsic height
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    // Force layout with measured height - this overrides Yoga's assigned bounds
    // to ensure the component isn't clipped
    layout(left, top, right, top + measuredHeight)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    if (anchorMode != "inline") {
      super.onLayout(changed, left, top, right, bottom)
      return
    }

    // For inline mode, we may need to override Yoga's assigned height.
    // First, measure ourselves to get intrinsic height.
    val widthSpec = MeasureSpec.makeMeasureSpec(right - left, MeasureSpec.EXACTLY)
    val heightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    measure(widthSpec, heightSpec)

    val intrinsicHeight = measuredHeight
    val assignedHeight = bottom - top

    // If Yoga gave us less height than we need, resize
    val actualBottom = if (assignedHeight < intrinsicHeight) {
      top + intrinsicHeight
    } else {
      bottom
    }

    // Layout children with the correct bounds
    super.onLayout(changed, left, top, right, actualBottom)

    // Update Fabric state with measured dimensions
    updateFrameSizeState()

    // If we resized, update our own bounds
    if (actualBottom != bottom) {
      // Use setFrame to update our bounds without triggering another layout pass
      post {
        if (isAttachedToWindow && anchorMode == "inline") {
          layout(left, top, right, actualBottom)
        }
      }
    }
  }

  /**
   * Update Fabric state with the measured frame size.
   * This allows the shadow node to use actual measured dimensions for Yoga layout.
   */
  private fun updateFrameSizeState() {
    if (anchorMode != "inline") return
    val wrapper = stateWrapper ?: return

    // Get the actual inline widget
    val inlineWidget: View? = inlineLayout ?: inlineSpinner
    if (inlineWidget == null) return

    val density = resources.displayMetrics.density

    // Use AT_MOST with a large upper bound rather than UNSPECIFIED.
    // TextInputLayout (and other composite views) can return incorrect
    // intrinsic widths with UNSPECIFIED because their children don't
    // handle that mode reliably. AT_MOST mirrors normal layout behavior.
    val maxPx = (10000 * density).toInt()
    val widthSpec = MeasureSpec.makeMeasureSpec(maxPx, MeasureSpec.AT_MOST)
    val heightSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    inlineWidget.measure(widthSpec, heightSpec)
    val intrinsicWidthPx = inlineWidget.measuredWidth
    val intrinsicHeightPx = inlineWidget.measuredHeight

    val widthDp = PixelUtil.toDIPFromPixel(intrinsicWidthPx.toFloat())
    val rawHeightDp = PixelUtil.toDIPFromPixel(intrinsicHeightPx.toFloat())

    Log.d(TAG, "updateFrameSizeState: widget=${inlineWidget.javaClass.simpleName}, intrinsicWidthPx=$intrinsicWidthPx, widthDp=$widthDp, intrinsicHeightPx=$intrinsicHeightPx, rawHeightDp=$rawHeightDp, minimumHeight=$minimumHeight, density=$density")

    // Only update if changed
    if (widthDp != lastReportedWidth || rawHeightDp != lastReportedHeight) {
      lastReportedWidth = widthDp
      lastReportedHeight = rawHeightDp

      val stateData = WritableNativeMap().apply {
        putDouble("width", widthDp.toDouble())
        putDouble("height", rawHeightDp.toDouble())
      }
      wrapper.updateState(stateData)
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

    // Re-measure after placeholder change
    if (anchorMode == "inline") {
      post { updateFrameSizeState() }
    }
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

  fun applyAndroidSearchable(value: Boolean) {
    if (androidSearchable == value) return
    androidSearchable = value
    if (anchorMode == "inline" && parseMaterial(androidMaterial) == MaterialMode.M3) rebuildUI()
  }

  /** The embedded M3 field takes typing to filter the options. */
  private val isSearchable: Boolean
    get() = androidSearchable && anchorMode == "inline" && parseMaterial(androidMaterial) == MaterialMode.M3

  // ---- UI building ----

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
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
    hasRequestedLayoutUpdate = false
    lastReportedWidth = 0f
    lastReportedHeight = 0f

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

    // Set minimum height based on mode - M3 TextInputLayout needs more space for floating label
    val minHeightDp = if (mode == MaterialMode.M3) {
      PCConstants.MIN_M3_TEXT_INPUT_HEIGHT_DP
    } else {
      PCConstants.MIN_TOUCH_TARGET_HEIGHT_DP
    }
    minimumHeight = (minHeightDp * resources.displayMetrics.density).toInt()

    if (mode == MaterialMode.M3) {
      // M3 exposed dropdown menu - the standard Material 3 way
      // Must set box background mode BEFORE setting endIconMode to avoid IllegalStateException
      // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
      val til = TextInputLayout(PCThemeSupport.materialContext(context, "SelectionMenu")).apply {
        layoutParams = FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.WRAP_CONTENT,
          FrameLayout.LayoutParams.WRAP_CONTENT
        )
        // Set box background mode first - required for END_ICON_DROPDOWN_MENU
        boxBackgroundMode = TextInputLayout.BOX_BACKGROUND_OUTLINE
        hint = placeholder
        // Now safe to set the dropdown icon
        endIconMode = TextInputLayout.END_ICON_DROPDOWN_MENU
      }

      val actv = InlineAutoCompleteTextView(til.context)
      inlineText = actv
      actv.apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )

        if (isSearchable) {
          // Typing filters the options (see OptionAdapter). The text is only a
          // query: selection still comes from picking an option.
          inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
          imeOptions = EditorInfo.IME_ACTION_DONE
          // The first tap selects the label, so typing replaces it
          setSelectAllOnFocus(true)
          setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
              clearFocus()
              true
            } else {
              false
            }
          }
        } else {
          // Keep it a real text editor so the popup behaves modally
          inputType = InputType.TYPE_CLASS_TEXT

          // Prevent keyboard
          showSoftInputOnFocus = false

          // Optional: keep it from being typed into
          keyListener = null
          isCursorVisible = false
        }

        // Highlight the selected option in the dropdown, like the M3 exposed dropdown menu.
        // The adapter from setSimpleItems() marks the item whose text matches the field.
        simpleItemSelectedColor = MaterialColors.getColor(
          til.context,
          com.google.android.material.R.attr.colorSecondaryContainer,
          0
        )

        // Nice UX: click anywhere opens dropdown
        setOnClickListener { showDropDown() }

        setOnItemClickListener { _, _, position, _ ->
          // A filtered list's positions differ from the options'
          val opt = (adapter as? OptionAdapter)?.getItem(position)
            ?: options.getOrNull(position)
            ?: return@setOnItemClickListener
          val index = options.indexOf(opt)
          selectedData = opt.data
          onSelect?.invoke(index, opt.label, opt.data)
          detachInlineDropdownOverlay()
          if (isSearchable) clearFocus()
        }

        setOnTouchListener { _, e ->
          if (e.action == android.view.MotionEvent.ACTION_UP) {
            showDropDown()
          }
          false // let default handling run
        }
      }

      til.addView(actv)
      if (isSearchable) {
        // Set after the field joins the layout, whose dropdown icon installs its
        // own focus listener; that one still runs first.
        val materialFocusListener = actv.onFocusChangeListener
        actv.setOnFocusChangeListener { view, hasFocus ->
          materialFocusListener?.onFocusChange(view, hasFocus)
          if (hasFocus) return@setOnFocusChangeListener
          // Leaving the field: the query goes, and the field shows the
          // selected option again (or the placeholder)
          actv.dismissDropDown()
          showSelectedText()
          val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
          imm?.hideSoftInputFromWindow(view.windowToken, 0)
        }
      }
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
          FrameLayout.LayoutParams.WRAP_CONTENT,
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
    val rich = options.any { it.isRich }

    inlineText?.let { actv ->
      if (rich || isSearchable) {
        // Icon + label + subtitle rows, filtered by the typed query
        actv.setAdapter(OptionAdapter(actv.context, options))
      } else {
        // Material's simple-item adapter highlights the selected option (simpleItemSelectedColor).
        actv.setSimpleItems(labels.toTypedArray())
      }
    }

    inlineSpinner?.let { sp ->
      suppressInlineSpinnerCallbacks(sp)
      // The platform Spinner keeps its own rows (labels only): its dropdown is
      // sized to its widest row and anchored at the field's start, so rich
      // rows would run off the screen's edge.
      val adapter = ArrayAdapter(sp.context, android.R.layout.simple_spinner_item, labels)
      adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
      sp.adapter = adapter
    }

    refreshHeadlessMenu()

    // Re-measure after adapter change so Fabric state reflects new content width
    if (anchorMode == "inline") {
      post { updateFrameSizeState() }
    }
  }

  private fun refreshSelections() {
    val idx = options.indexOfFirst { it.data == selectedData }

    // A searchable field keeps the user's query while it has focus
    if (!(isSearchable && inlineText?.hasFocus() == true)) showSelectedText()

    inlineSpinner?.let { sp ->
      if (options.isEmpty()) return
      val target = if (idx >= 0) idx else 0
      // Always call setSelection to ensure the view is refreshed
      // Even if the position hasn't changed, we need to update the displayed text
      suppressInlineSpinnerCallbacks(sp)
      sp.setSelection(target, false)
    }

    // Update headless menu checked state
    refreshHeadlessMenu()

    // Re-measure after selection change so Fabric state reflects new text width
    if (anchorMode == "inline") {
      post { updateFrameSizeState() }
    }
  }

  /** The embedded M3 field shows the selected option's label, or empty for the placeholder. */
  private fun showSelectedText() {
    val actv = inlineText ?: return
    val label = options.firstOrNull { it.data == selectedData }?.label ?: ""
    actv.setText(label, false)
    // The next open lists every option until the user types again
    (actv.adapter as? OptionAdapter)?.resetFilter()
  }

  // ---- Rich dropdown rows ----

  /**
   * Rows for the M3 exposed dropdown when options have icons or subtitles, or
   * the field is searchable: a leading icon, the label and a second line,
   * laid out like a Material list item. The selected row is highlighted like
   * Material's simple items, and the list filters by the typed query (a
   * case-insensitive prefix of the label or of any word in it, as
   * ArrayAdapter does).
   */
  private inner class OptionAdapter(
    private val themed: Context,
    private val all: List<Option>
  ) : BaseAdapter(), Filterable {
    private var shown: List<Option> = all
    private val showsIcons = all.any { it.icon.isPresent }
    private val icons = HashMap<Int, Drawable?>()
    private val density = themed.resources.displayMetrics.density

    init {
      // Resolve icons up front; ones that load in the background redraw the list
      all.forEachIndexed { index, option ->
        if (!option.icon.isPresent) return@forEachIndexed
        var sync = true
        PCMenuSupport.loadIcon(themed, option.icon) { drawable ->
          icons[index] = drawable
          if (!sync) notifyDataSetChanged()
        }
        sync = false
      }
    }

    fun resetFilter() {
      if (shown === all) return
      shown = all
      notifyDataSetChanged()
    }

    override fun getCount(): Int = shown.size
    override fun getItem(position: Int): Option? = shown.getOrNull(position)
    override fun getItemId(position: Int): Long = position.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
      val option = shown[position]
      val holder = (convertView?.tag as? RowHolder) ?: RowHolder()
      val selected = option.data == selectedData && selectedData.isNotEmpty()

      holder.icon.visibility = if (showsIcons) View.VISIBLE else View.GONE
      holder.icon.setImageDrawable(icons[all.indexOf(option)])
      holder.label.text = option.label
      holder.subtitle.text = option.subtitle
      holder.subtitle.visibility = if (option.subtitle.isEmpty()) View.GONE else View.VISIBLE
      holder.root.minimumHeight = dp(if (option.subtitle.isEmpty()) 48 else 64)
      holder.root.background = if (selected) selectedBackground() else itemBackground()
      holder.root.isSelected = selected
      return holder.root
    }

    private fun dp(value: Int): Int = (value * density).toInt()

    private fun selectedBackground(): Drawable {
      val color = MaterialColors.getColor(themed, MaterialR.attr.colorSecondaryContainer, 0)
      val ripple = MaterialColors.getColor(themed, MaterialR.attr.colorOnSecondaryContainer, 0)
      return RippleDrawable(
        ColorStateList.valueOf(ripple and 0x1FFFFFFF),
        ColorDrawable(color),
        null
      )
    }

    private fun itemBackground(): Drawable? {
      val value = TypedValue()
      if (!themed.theme.resolveAttribute(android.R.attr.selectableItemBackground, value, true)) return null
      return themed.getDrawable(value.resourceId)
    }

    private fun textAppearance(attr: Int, fallback: Int): Int {
      val value = TypedValue()
      return if (themed.theme.resolveAttribute(attr, value, true) && value.resourceId != 0) {
        value.resourceId
      } else {
        fallback
      }
    }

    private inner class RowHolder {
      val icon = ImageView(themed).apply {
        layoutParams = LinearLayout.LayoutParams(dp(24), dp(24)).apply { marginEnd = dp(16) }
        scaleType = ImageView.ScaleType.FIT_CENTER
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
      }
      val label = TextView(themed).apply {
        TextViewCompat.setTextAppearance(
          this,
          textAppearance(MaterialR.attr.textAppearanceBodyLarge, android.R.style.TextAppearance_Material_Subhead)
        )
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
      }
      val subtitle = TextView(themed).apply {
        TextViewCompat.setTextAppearance(
          this,
          textAppearance(MaterialR.attr.textAppearanceBodyMedium, android.R.style.TextAppearance_Material_Body1)
        )
        MaterialColors.getColor(themed, MaterialR.attr.colorOnSurfaceVariant, 0)
          .takeIf { it != 0 }
          ?.let { setTextColor(it) }
        maxLines = 1
        ellipsize = TextUtils.TruncateAt.END
      }
      val root = LinearLayout(themed).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPaddingRelative(dp(16), dp(8), dp(16), dp(8))
        layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        addView(icon)
        addView(
          LinearLayout(themed).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            addView(label)
            addView(subtitle)
          }
        )
        tag = this@RowHolder
      }
    }

    override fun getFilter(): Filter = object : Filter() {
      override fun performFiltering(constraint: CharSequence?): FilterResults {
        val query = constraint?.toString()?.trim()?.lowercase(Locale.getDefault()).orEmpty()
        val matches = if (!isSearchable || query.isEmpty()) all else all.filter { matches(it.label, query) }
        return FilterResults().apply {
          values = matches
          count = matches.size
        }
      }

      @Suppress("UNCHECKED_CAST")
      override fun publishResults(constraint: CharSequence?, results: FilterResults?) {
        shown = (results?.values as? List<Option>) ?: all
        if (shown.isNotEmpty()) notifyDataSetChanged() else notifyDataSetInvalidated()
      }

      override fun convertResultToString(resultValue: Any?): CharSequence =
        (resultValue as? Option)?.label ?: ""
    }

    /** ArrayAdapter's rule: the label, or one of its words, starts with the query. */
    private fun matches(label: String, query: String): Boolean {
      val lower = label.lowercase(Locale.getDefault())
      return lower.startsWith(query) || lower.split(' ').any { it.startsWith(query) }
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
            // A tap outside also leaves a searchable field
            if (isSearchable) inlineText?.clearFocus()
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
    val popup = headlessMenu ?: return
    val menu = popup.menu
    menu.clear()
    val selectedIdx = options.indexOfFirst { it.data == selectedData }
    options.forEachIndexed { index, opt ->
      val item = menu.add(HEADLESS_GROUP_ID, index, index, opt.label)
      item.isChecked = index == selectedIdx
      // PopupMenu rows have one line, so only the icon is shown (no subtitle)
      if (opt.icon.isPresent) {
        PCMenuSupport.loadIcon(context, opt.icon) { drawable ->
          if (drawable != null && headlessMenu === popup) item.icon = drawable
        }
      }
    }
    // Single-choice group: the menu draws a native radio indicator on each row.
    menu.setGroupCheckable(HEADLESS_GROUP_ID, true, true)
    popup.setForceShowIcon(options.any { it.icon.isPresent })
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

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (builtThemeVersion != PCNativeTheme.version) nativeThemeListener.onNativeThemeChanged()
    // When attached, trigger a measure/layout pass to ensure correct sizing
    if (anchorMode == "inline") {
      // Use ViewTreeObserver to wait until after the first layout pass
      viewTreeObserver.addOnGlobalLayoutListener(object : ViewTreeObserver.OnGlobalLayoutListener {
        override fun onGlobalLayout() {
          viewTreeObserver.removeOnGlobalLayoutListener(this)

          if (!isAttachedToWindow || anchorMode != "inline") return

          // Measure to get intrinsic height
          measure(
            MeasureSpec.makeMeasureSpec(width.coerceAtLeast(1), MeasureSpec.EXACTLY),
            MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
          )

          val intrinsicHeight = measuredHeight.coerceAtLeast(minimumHeight)

          // If current height is too small, force layout with correct height
          if (height < intrinsicHeight) {
            layout(left, top, right, top + intrinsicHeight)
          }
        }
      })
    }
  }

  override fun onDetachedFromWindow() {
    detachInlineDropdownOverlay()
    PCNativeTheme.removeListener(nativeThemeListener)
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
