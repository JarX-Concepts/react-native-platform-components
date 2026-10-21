package com.platformcomponents

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.drawable.Drawable
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.widget.ImageViewCompat
import androidx.core.widget.NestedScrollView
import androidx.core.widget.TextViewCompat
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.R as MaterialR
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetDragHandleView
import kotlin.math.roundToInt

/**
 * The ActionSheet: a Material 3 modal bottom sheet (`BottomSheetDialog`)
 * with an optional title and message and a list of actions, shown while
 * `visible` is "open". Following Material, there is no cancel row: a swipe
 * down, a tap on the scrim and the back button dismiss it and report a
 * cancel. The view itself only hosts the React children.
 *
 * While the sheet is up, the title, the message and each row's enabled
 * state, tag and haptic follow the props. Its rows themselves stay as
 * presented, as on iOS (a presented `UIAlertController` can't change its
 * actions): a list of another shape (added, removed, reordered or retitled
 * actions, a changed destructive style or icon) shows from the next
 * presentation.
 */
class PCActionSheetView(context: Context) : ReactViewGroup(context) {

  companion object {
    private const val TAG = "PCActionSheet"

    // Material 3 list item metrics
    private const val ROW_MIN_HEIGHT_DP = 56
    private const val ROW_START_PADDING_DP = 16
    private const val ROW_END_PADDING_DP = 24
    private const val ICON_SIZE_DP = 24
    private const val ICON_GAP_DP = 16
    private const val HEADER_BOTTOM_PADDING_DP = 8
    private const val LIST_BOTTOM_PADDING_DP = 8

    // Material's disabled content alpha
    private const val DISABLED_ALPHA = 0.38f
  }

  /** One action from the `actions` prop. */
  data class Action(
    val id: String,
    val title: String,
    val icon: PCButtonSupport.Icon,
    val imageColor: String,
    val destructive: Boolean,
    val disabled: Boolean,
    /** The action's own `haptics`; "" = the component's */
    val haptics: String,
    /** The row's view tag, which Detox's `by.id` matches */
    val testID: String
  ) {
    /** Whether the sheet's row for this action can show [other]: same id, title, style and icon. */
    fun sameRow(other: Action): Boolean =
      id == other.id && title == other.title && icon == other.icon &&
        imageColor == other.imageColor && destructive == other.destructive
  }

  /** A row of the sheet on screen, with the views its state changes. */
  private class Row(val view: View, val label: TextView, val icon: ImageView?)

  // --- Props ---
  var sheetTitle: String = ""
  var message: String = ""
  var actions: List<Action> = emptyList()
  var visible: String = "closed" // "open" | "closed"
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap

  /** The `haptics` prop, played when an action is picked (an action's own `haptics` wins). */
  var haptics: String = ""

  // --- Events ---
  var onSelect: ((id: String) -> Unit)? = null
  var onCancel: (() -> Unit)? = null

  // --- Internal ---
  /** The sheet on screen, until a pick, a cancel or `visible` ends it */
  private var dialog: BottomSheetDialog? = null
  private var openToken = 0

  // What the sheet on screen shows. Its actions are the ones it was
  // presented with, updated while they keep their shape.
  private var shownTitle = ""
  private var shownMessage = ""
  private var shownActions: List<Action> = emptyList()
  /** The sheet's title and message, filled again when they change */
  private var header: LinearLayout? = null
  /** The sheet's rows, in [shownActions]' order */
  private var rows: List<Row> = emptyList()

  // ---- Public apply* (called by manager) ----

  fun applyVisible(value: String?) {
    val next = if (value == "open") "open" else "closed"
    if (next == visible) return
    visible = next
    openToken += 1
    if (visible == "open") {
      presentIfNeeded(openToken)
    } else {
      dismissIfNeeded()
    }
  }

  // ---- Presentation ----

  /** Presents after the current layout pass, so the props of this update are all in. */
  private fun presentIfNeeded(token: Int) {
    post {
      if (token != openToken || visible != "open") return@post
      if (dialog != null) return@post
      if (!isAttachedToWindow) {
        Log.d(TAG, "presentIfNeeded: not attached -> skip")
        return@post
      }
      present()
    }
  }

  /** Dismisses without a callback: neither onSelect nor onCancel fires. */
  private fun dismissIfNeeded() {
    val sheet = dialog ?: return
    dialog = null
    sheet.dismiss()
  }

  private fun present() {
    val activity = PCNativeTheme.findActivity(context)
    if (activity == null || activity.isFinishing) {
      Log.w(TAG, "present: no activity")
      return
    }

    // The app's Material theme, or Material 3 defaults when it has none;
    // BottomSheetDialog adds the theme's bottomSheetDialogTheme overlay.
    val sheet = BottomSheetDialog(PCThemeSupport.materialContext(activity, "ActionSheet"))
    // Current before the rows are built: drawable icons resolve right away
    // and check it.
    dialog = sheet
    sheet.setContentView(buildContent(sheet, sheet.context))

    // Open fully, and a swipe down closes it instead of stopping half way.
    sheet.behavior.skipCollapsed = true
    sheet.behavior.state = BottomSheetBehavior.STATE_EXPANDED

    // Swipe down, scrim tap and back: BottomSheetDialog cancels.
    sheet.setOnCancelListener {
      if (dialog !== sheet) return@setOnCancelListener
      dialog = null
      onCancel?.invoke()
    }
    sheet.setOnDismissListener {
      if (dialog === sheet) dialog = null
    }

    sheet.show()
  }

  /**
   * Called once every prop of an update is in: the sheet on screen takes
   * the new title and message, and the rows' enabled state, tag and haptic
   * while the actions keep their shape.
   */
  fun commit() {
    if (dialog == null) return

    if (actions != shownActions && actions.size == shownActions.size &&
      actions.zip(shownActions).all { (next, shown) -> next.sameRow(shown) }
    ) {
      shownActions = actions
      rows.forEachIndexed { index, row -> applyRowState(row, actions[index]) }
    }

    if (sheetTitle != shownTitle || message != shownMessage) {
      header?.let { fillHeader(it) }
    }
  }

  private fun buildContent(sheet: BottomSheetDialog, ctx: Context): View {
    val density = ctx.resources.displayMetrics.density
    fun dp(value: Int) = (value * density).roundToInt()

    val root = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
    }

    // Material 3 modal sheets carry a drag handle; it also gives TalkBack a
    // way to dismiss the sheet.
    root.addView(
      BottomSheetDragHandleView(ctx),
      LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    )

    // The title and message; gone without either
    val header = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(ROW_START_PADDING_DP), 0, dp(ROW_END_PADDING_DP), dp(HEADER_BOTTOM_PADDING_DP))
    }
    this.header = header
    fillHeader(header, capText = false)
    root.addView(header)

    val list = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(0, 0, 0, dp(LIST_BOTTOM_PADDING_DP))
    }
    // Rows line up: with any icon, every row keeps the icon column.
    shownActions = actions
    val iconColumn = actions.any { it.icon.isPresent }
    rows = actions.indices.map { index -> buildRow(sheet, ctx, index, iconColumn) }
    for (row in rows) list.addView(row.view)

    // Long lists scroll inside the sheet; the header and handle stay.
    val scroll = NestedScrollView(ctx).apply {
      isFillViewport = false
      addView(list)
    }
    root.addView(
      scroll,
      LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    )

    PCThemeSupport.capTextSizes(root, maxFontSizeMultiplier)
    return root
  }

  /** Fills [header] with the current title and message (the text size capped unless [capText] is false). */
  private fun fillHeader(header: LinearLayout, capText: Boolean = true) {
    val ctx = header.context
    val density = ctx.resources.displayMetrics.density
    fun dp(value: Int) = (value * density).roundToInt()

    shownTitle = sheetTitle
    shownMessage = message
    header.removeAllViews()
    header.visibility = if (sheetTitle.isEmpty() && message.isEmpty()) View.GONE else View.VISIBLE
    if (sheetTitle.isNotEmpty()) {
      header.addView(
        TextView(ctx).apply {
          applyTextAppearance(this, MaterialR.attr.textAppearanceTitleMedium)
          PCMenuSupport.themeColor(ctx, MaterialR.attr.colorOnSurface)?.let { setTextColor(it) }
          text = sheetTitle
          ViewCompat.setAccessibilityHeading(this, true)
        }
      )
    }
    if (message.isNotEmpty()) {
      header.addView(
        TextView(ctx).apply {
          applyTextAppearance(this, MaterialR.attr.textAppearanceBodyMedium)
          PCMenuSupport.themeColor(ctx, MaterialR.attr.colorOnSurfaceVariant)?.let { setTextColor(it) }
          text = message
          if (sheetTitle.isNotEmpty()) setPadding(0, dp(4), 0, 0)
        }
      )
    }
    if (capText) PCThemeSupport.capTextSizes(header, maxFontSizeMultiplier)
  }

  /** Builds the row for the action at [index] of [shownActions]. */
  private fun buildRow(sheet: BottomSheetDialog, ctx: Context, index: Int, iconColumn: Boolean): Row {
    val action = shownActions[index]
    val density = ctx.resources.displayMetrics.density
    fun dp(value: Int) = (value * density).roundToInt()

    val contentColor = if (action.destructive) {
      PCMenuSupport.errorColor(ctx)
    } else {
      PCMenuSupport.themeColor(ctx, MaterialR.attr.colorOnSurface)
    }

    val row = LinearLayout(ctx).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      minimumHeight = dp(ROW_MIN_HEIGHT_DP)
      setPadding(dp(ROW_START_PADDING_DP), dp(8), dp(ROW_END_PADDING_DP), dp(8))
      setBackgroundResource(resolveStyle(ctx, android.R.attr.selectableItemBackground))
      isClickable = true
      isFocusable = true
    }

    var iconView: ImageView? = null
    if (iconColumn) {
      val icon = ImageView(ctx).apply {
        scaleType = ImageView.ScaleType.CENTER_INSIDE
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
      }
      row.addView(
        icon,
        LinearLayout.LayoutParams(dp(ICON_SIZE_DP), dp(ICON_SIZE_DP)).apply {
          marginEnd = dp(ICON_GAP_DP)
        }
      )
      if (action.icon.isPresent) {
        PCMenuSupport.loadIcon(ctx, action.icon) { drawable: Drawable? ->
          if (drawable == null || dialog !== sheet) return@loadIcon
          icon.setImageDrawable(drawable)
          // An explicit imageColor wins; destructive icons take the error color.
          val tint = when {
            action.imageColor.isNotEmpty() -> ColorParser.parse(action.imageColor)
            action.destructive -> PCMenuSupport.errorColor(ctx)
            else -> null
          }
          if (tint != null) ImageViewCompat.setImageTintList(icon, ColorStateList.valueOf(tint))
        }
      }
      iconView = icon
    }

    val label = TextView(ctx).apply {
      applyTextAppearance(this, MaterialR.attr.textAppearanceBodyLarge)
      contentColor?.let { setTextColor(it) }
      text = action.title
    }
    row.addView(label, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))

    row.setOnClickListener {
      if (dialog !== sheet) return@setOnClickListener
      // The action as it is now: its haptic may have changed since.
      val current = shownActions[index]
      if (current.disabled) return@setOnClickListener
      dialog = null
      PCHaptics.perform(this, current.haptics.ifEmpty { haptics })
      sheet.dismiss()
      onSelect?.invoke(current.id)
    }
    return Row(row, label, iconView).also { applyRowState(it, action) }
  }

  /** The row's enabled state and tag, from [action]. */
  private fun applyRowState(row: Row, action: Action) {
    row.view.isEnabled = !action.disabled
    row.view.tag = action.testID.ifEmpty { null }
    val alpha = if (action.disabled) DISABLED_ALPHA else 1f
    row.label.alpha = alpha
    row.icon?.alpha = alpha
  }

  /** Applies the theme's text appearance [attr], when the theme has one. */
  private fun applyTextAppearance(view: TextView, attr: Int) {
    val style = resolveStyle(view.context, attr)
    if (style != 0) TextViewCompat.setTextAppearance(view, style)
  }

  /** The resource id an attribute points at (a style or a drawable), or 0. */
  private fun resolveStyle(ctx: Context, attr: Int): Int {
    val value = TypedValue()
    return if (ctx.theme.resolveAttribute(attr, value, true)) value.resourceId else 0
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // A sheet asked for before the view was on screen opens now.
    if (visible == "open" && dialog == null) presentIfNeeded(++openToken)
  }

  override fun onDetachedFromWindow() {
    // Unmounted, or its screen went away: the sheet goes too, without a callback.
    openToken += 1
    dismissIfNeeded()
    super.onDetachedFromWindow()
  }
}
