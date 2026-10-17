package com.platformcomponents

import android.content.Context
import android.content.DialogInterface
import android.content.res.ColorStateList
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import androidx.appcompat.R as AppCompatR
import androidx.appcompat.app.AlertDialog
import androidx.core.graphics.ColorUtils
import androidx.core.widget.NestedScrollView
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlin.math.roundToInt

/**
 * The Dialog: a Material 3 alert dialog (`MaterialAlertDialogBuilder`) with
 * an optional title and message and a button per action, shown while
 * `visible` is "open". The view itself is empty.
 *
 * Up to three actions go in the dialog's own button slots (the preferred one
 * at the end as the positive button, the cancel action as the negative
 * one). More than three are stacked one per row, end aligned, as Material
 * stacks dialog buttons that don't fit side by side.
 */
class PCDialogView(context: Context) : ReactViewGroup(context) {

  companion object {
    private const val TAG = "PCDialog"

    /** The builder's button slots: positive, negative, neutral */
    private const val SLOT_COUNT = 3

    // Material 3 dialog metrics for the stacked buttons
    private const val STACK_START_PADDING_DP = 24
    private const val STACK_END_PADDING_DP = 24
    private const val STACK_BOTTOM_PADDING_DP = 16
    private const val STACK_GAP_DP = 0

    // Material's disabled content alpha and pressed state layer alpha
    private const val DISABLED_ALPHA = 0.38f
    private const val PRESSED_ALPHA = 0.12f

    /**
     * The dialogs of this component on screen (main thread only): one dialog
     * never goes over another, so an app showing one at a time learns that a
     * second one didn't show.
     */
    private val showing = HashSet<AlertDialog>()
  }

  /** One action from the `actions` prop. */
  data class Action(
    val id: String,
    val title: String,
    /** "default" | "cancel" | "destructive" */
    val role: String,
    val preferred: Boolean,
    val disabled: Boolean,
    /** The action's own `haptics`; "" = the component's (none for the cancel action) */
    val haptics: String,
    /** The button's view tag, which Detox's `by.id` matches */
    val testID: String
  ) {
    val isCancel: Boolean get() = role == "cancel"
  }

  // --- Props ---
  var dialogTitle: String = ""
  var message: String = ""
  var actions: List<Action> = emptyList()
  var visible: String = "closed" // "open" | "closed"
  var dismissable: Boolean = true
  var maxFontSizeMultiplier: Float = 0f // < 1 = no cap

  /** The `haptics` prop, played when a default or destructive action is picked. */
  var haptics: String = ""

  // --- Events ---
  var onSelect: ((id: String) -> Unit)? = null
  var onCancel: (() -> Unit)? = null
  var onShow: (() -> Unit)? = null
  var onDismiss: (() -> Unit)? = null
  /** "noWindow" | "busy" | "rejected" */
  var onPresentFailed: ((reason: String) -> Unit)? = null

  // --- Internal ---
  /** The dialog on screen, until a pick, a cancel or `visible` ends it */
  private var dialog: AlertDialog? = null
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
        fail("noWindow", "not attached")
        return@post
      }
      present()
    }
  }

  /** Dismisses without onSelect or onCancel; onDismiss follows. */
  private fun dismissIfNeeded() {
    val current = dialog ?: return
    dialog = null
    current.dismiss()
  }

  private fun fail(reason: String, detail: String) {
    Log.w(TAG, "present: $detail -> $reason")
    onPresentFailed?.invoke(reason)
  }

  private fun present() {
    val activity = PCNativeTheme.findActivity(context)
    if (activity == null || activity.isFinishing || activity.isDestroyed) {
      fail("noWindow", "no live activity")
      return
    }
    // A dialog whose activity went away without a dismissal doesn't count.
    showing.removeAll { !it.isShowing }
    if (showing.isNotEmpty()) {
      fail("busy", "another dialog is up")
      return
    }

    // The app's Material theme, or Material 3 defaults when it has none;
    // the builder adds the theme's materialAlertDialogTheme overlay.
    val builder = MaterialAlertDialogBuilder(PCThemeSupport.materialContext(activity, "Dialog"))
    if (dialogTitle.isNotEmpty()) builder.setTitle(dialogTitle)
    if (message.isNotEmpty()) builder.setMessage(message)
    builder.setCancelable(dismissable)

    // The buttons get their listeners once they exist (after show); a null
    // listener here only reserves the slot.
    val slots = if (actions.size <= SLOT_COUNT) assignSlots(actions) else emptyMap()
    slots.forEach { (which, action) ->
      when (which) {
        DialogInterface.BUTTON_POSITIVE -> builder.setPositiveButton(action.title, null)
        DialogInterface.BUTTON_NEGATIVE -> builder.setNegativeButton(action.title, null)
        else -> builder.setNeutralButton(action.title, null)
      }
    }
    val stacked = if (actions.size > SLOT_COUNT) buildStack(builder.context) else null
    if (stacked != null) builder.setView(stacked.first)

    val created = builder.create()
    if (!dismissable) created.setCanceledOnTouchOutside(false)

    // Back and a tap outside
    created.setOnCancelListener {
      if (dialog !== created) return@setOnCancelListener
      dialog = null
      onCancel?.invoke()
    }
    created.setOnShowListener {
      if (dialog === created) onShow?.invoke()
    }
    // Every way out, after onSelect / onCancel
    created.setOnDismissListener {
      showing.remove(created)
      if (dialog === created) dialog = null
      onDismiss?.invoke()
    }

    dialog = created
    try {
      created.show()
    } catch (e: WindowManager.BadTokenException) {
      dialog = null
      fail("rejected", "BadTokenException: ${e.message}")
      return
    }
    showing.add(created)

    // The views exist once shown, before the first frame draws.
    val buttons = slots.mapNotNull { (which, action) ->
      created.getButton(which)?.let { it to action }
    } + (stacked?.second ?: emptyList())
    for ((button, action) in buttons) configureButton(created, button, action)
    created.window?.decorView?.let { PCThemeSupport.capTextSizes(it, maxFontSizeMultiplier) }
  }

  /**
   * Up to three actions in the builder's slots, which lay out as
   * [neutral] … [negative] [positive]: the preferred action (else the last
   * one that isn't the cancel action) is the positive button, the cancel
   * action the negative one, and the others fill the negative and neutral
   * slots so the row keeps the actions' order where it can.
   */
  private fun assignSlots(actions: List<Action>): Map<Int, Action> {
    val out = LinkedHashMap<Int, Action>()
    val cancel = actions.firstOrNull { it.isCancel }
    val others = actions.filter { it !== cancel }.toMutableList()
    val positive = others.firstOrNull { it.preferred } ?: others.lastOrNull()
    if (positive != null) {
      others.remove(positive)
      out[DialogInterface.BUTTON_POSITIVE] = positive
    }
    if (cancel != null) {
      out[DialogInterface.BUTTON_NEGATIVE] = cancel
    } else if (others.isNotEmpty()) {
      out[DialogInterface.BUTTON_NEGATIVE] = others.removeAt(others.size - 1)
    }
    if (others.isNotEmpty()) out[DialogInterface.BUTTON_NEUTRAL] = others.removeAt(0)
    return out
  }

  /**
   * More than three actions: a column of the dialog's text buttons, end
   * aligned, in the actions' order with the cancel action last. It scrolls
   * when it doesn't fit.
   */
  private fun buildStack(ctx: Context): Pair<View, List<Pair<Button, Action>>> {
    val density = ctx.resources.displayMetrics.density
    fun dp(value: Int) = (value * density).roundToInt()

    val column = LinearLayout(ctx).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.END
      setPadding(dp(STACK_START_PADDING_DP), 0, dp(STACK_END_PADDING_DP), dp(STACK_BOTTOM_PADDING_DP))
    }
    val ordered = actions.filter { !it.isCancel } + actions.filter { it.isCancel }
    val buttons = ordered.mapIndexed { index, action ->
      // The theme's dialog button style (Widget.Material3.Button.TextButton.Dialog)
      val button = MaterialButton(ctx, null, AppCompatR.attr.buttonBarPositiveButtonStyle).apply {
        text = action.title
        maxLines = 2
      }
      column.addView(
        button,
        LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
          gravity = Gravity.END
          if (index > 0) topMargin = dp(STACK_GAP_DP)
        }
      )
      button as Button to action
    }
    val scroll = NestedScrollView(ctx).apply {
      isFillViewport = false
      addView(column)
    }
    return scroll to buttons
  }

  private fun configureButton(owner: AlertDialog, button: Button, action: Action) {
    button.tag = action.testID.ifEmpty { null }
    button.isEnabled = !action.disabled
    if (action.role == "destructive") {
      val error = PCMenuSupport.errorColor(button.context)
      button.setTextColor(
        ColorStateList(
          arrayOf(intArrayOf(-android.R.attr.state_enabled), intArrayOf()),
          intArrayOf(withAlpha(error, DISABLED_ALPHA), error)
        )
      )
      (button as? MaterialButton)?.rippleColor =
        ColorStateList.valueOf(withAlpha(error, PRESSED_ALPHA))
    }
    // Replaces the dialog's own handler, so the dialog closes here, after
    // the event.
    button.setOnClickListener {
      if (dialog !== owner || action.disabled) return@setOnClickListener
      dialog = null
      if (action.isCancel) {
        // Only an action's own haptic: cancelling isn't a pick.
        if (action.haptics.isNotEmpty()) PCHaptics.perform(button, action.haptics)
        onCancel?.invoke()
      } else {
        PCHaptics.perform(button, action.haptics.ifEmpty { haptics })
        onSelect?.invoke(action.id)
      }
      owner.dismiss()
    }
  }

  private fun withAlpha(color: Int, alpha: Float): Int =
    ColorUtils.setAlphaComponent(color, (alpha * 255).roundToInt())

  override fun onDetachedFromWindow() {
    // Unmounted, or its screen went away: the dialog goes too, without
    // onSelect or onCancel.
    openToken += 1
    dismissIfNeeded()
    super.onDetachedFromWindow()
  }
}
