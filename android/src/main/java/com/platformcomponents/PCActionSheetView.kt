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
  )

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

    if (sheetTitle.isNotEmpty() || message.isNotEmpty()) {
      val header = LinearLayout(ctx).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(ROW_START_PADDING_DP), 0, dp(ROW_END_PADDING_DP), dp(HEADER_BOTTOM_PADDING_DP))
      }
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
      root.addView(header)
    }

    val list = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(0, 0, 0, dp(LIST_BOTTOM_PADDING_DP))
    }
    // Rows line up: with any icon, every row keeps the icon column.
    val iconColumn = actions.any { it.icon.isPresent }
    for (action in actions) {
      list.addView(buildRow(sheet, ctx, action, iconColumn))
    }

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

  private fun buildRow(sheet: BottomSheetDialog, ctx: Context, action: Action, iconColumn: Boolean): View {
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
      isEnabled = !action.disabled
      tag = action.testID.ifEmpty { null }
    }

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
      if (action.disabled) icon.alpha = DISABLED_ALPHA
    }

    val label = TextView(ctx).apply {
      applyTextAppearance(this, MaterialR.attr.textAppearanceBodyLarge)
      contentColor?.let { setTextColor(it) }
      text = action.title
      if (action.disabled) alpha = DISABLED_ALPHA
    }
    row.addView(label, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))

    row.setOnClickListener {
      if (dialog !== sheet || action.disabled) return@setOnClickListener
      dialog = null
      PCHaptics.perform(this, action.haptics.ifEmpty { haptics })
      sheet.dismiss()
      onSelect?.invoke(action.id)
    }
    return row
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
