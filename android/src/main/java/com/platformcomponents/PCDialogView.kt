package com.platformcomponents

import android.app.Activity
import android.content.Context
import android.content.DialogInterface
import android.content.res.ColorStateList
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
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
 *
 * While the dialog is up, the title, the message, `dismissable` and each
 * button's enabled state, tag and haptic follow the props. Its buttons
 * themselves stay as presented, as on iOS (a presented `UIAlertController`
 * can't change its actions): a list of another shape (added, removed,
 * reordered or retitled actions, a changed role or preferred action) shows
 * from the next presentation.
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

    /** Whether the dialog's button for this action can show [other]: same id, title, role and slot. */
    fun sameButton(other: Action): Boolean =
      id == other.id && title == other.title && role == other.role && preferred == other.preferred
  }

  /** A dialog built from the props, with the buttons to set up once it is shown. */
  private class Built(
    val dialog: AlertDialog,
    /** The builder's slots in use; their buttons exist once the dialog is shown */
    val slots: Map<Int, Action>,
    /** The stacked buttons, for more than three actions */
    val stacked: List<Pair<Button, Action>>
  )

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
  /** The presentation hasn't reported onShow yet */
  private var showPending = false

  // What the dialog on screen shows. Its actions are the ones it was
  // presented with, updated while they keep their shape.
  private var shownTitle = ""
  private var shownMessage = ""
  private var shownDismissable = true
  private var shownActions: List<Action> = emptyList()
  /** The dialog's buttons, each with the index of its action in [shownActions] */
  private var shownButtons: List<Pair<Button, Int>> = emptyList()

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

    val built = build(activity, actions)
    val created = built.dialog
    showPending = true

    dialog = created
    try {
      created.show()
    } catch (e: WindowManager.BadTokenException) {
      dialog = null
      fail("rejected", "BadTokenException: ${e.message}")
      return
    }
    showing.add(created)
    finishShow(built, actions)
  }

  /**
   * A dialog from the current title, message and `dismissable`, with a
   * button per action in [actions], and its cancel and dismiss listeners.
   */
  private fun build(activity: Activity, actions: List<Action>): Built {
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
    val stacked = if (actions.size > SLOT_COUNT) buildStack(builder.context, actions) else null
    if (stacked != null) builder.setView(stacked.first)

    val created = builder.create()
    if (!dismissable) created.setCanceledOnTouchOutside(false)

    // Once per presentation: a dialog that replaces one that hadn't shown
    // yet reports it.
    created.setOnShowListener {
      if (dialog !== created || !showPending) return@setOnShowListener
      showPending = false
      onShow?.invoke()
    }
    // Back and a tap outside
    created.setOnCancelListener {
      if (dialog !== created) return@setOnCancelListener
      dialog = null
      onCancel?.invoke()
    }
    // Every way out, after onSelect / onCancel
    created.setOnDismissListener {
      showing.remove(created)
      if (dialog === created) dialog = null
      onDismiss?.invoke()
    }
    return Built(created, slots, stacked?.second ?: emptyList())
  }

  /** Once [built] is shown: its buttons get their [actions], its text the size cap. */
  private fun finishShow(built: Built, actions: List<Action>) {
    val created = built.dialog
    // The views exist once shown, before the first frame draws.
    val buttons = built.slots.mapNotNull { (which, action) ->
      created.getButton(which)?.let { it to action }
    } + built.stacked
    shownTitle = dialogTitle
    shownMessage = message
    shownDismissable = dismissable
    shownActions = actions
    shownButtons = buttons.map { (button, action) ->
      button to actions.indexOfFirst { it === action }
    }
    for ((button, index) in shownButtons) configureButton(created, button, index)
    created.window?.decorView?.let { PCThemeSupport.capTextSizes(it, maxFontSizeMultiplier) }
  }

  /**
   * Called once every prop of an update is in: the dialog on screen takes
   * the new title, message, `dismissable`, and the buttons' enabled state,
   * tag and haptic while the actions keep their shape.
   */
  fun commit() {
    val current = dialog ?: return

    if (actions != shownActions && actions.size == shownActions.size &&
      actions.zip(shownActions).all { (next, shown) -> next.sameButton(shown) }
    ) {
      shownActions = actions
      for ((button, index) in shownButtons) {
        val action = actions[index]
        button.tag = action.testID.ifEmpty { null }
        button.isEnabled = !action.disabled
      }
    }

    if (dismissable != shownDismissable) {
      shownDismissable = dismissable
      current.setCancelable(dismissable)
      current.setCanceledOnTouchOutside(dismissable)
    }

    // AppCompat hides the title panel and removes the message view when the
    // dialog is created without them, so setTitle and setMessage can't add
    // one (nor take one away): a new dialog takes its place.
    if (dialogTitle.isEmpty() != shownTitle.isEmpty() || message.isEmpty() != shownMessage.isEmpty()) {
      replace(current)
      return
    }
    if (dialogTitle != shownTitle) {
      shownTitle = dialogTitle
      current.setTitle(dialogTitle)
    }
    if (message != shownMessage) {
      shownMessage = message
      current.setMessage(message)
    }
  }

  /**
   * Replaces the dialog on screen with one built from the props and the
   * actions it shows. Neither window animates, so the new dialog is simply
   * there; the swap reports no onShow, onCancel or onDismiss.
   */
  private fun replace(old: AlertDialog) {
    val activity = PCNativeTheme.findActivity(context)
    if (activity == null || activity.isFinishing || activity.isDestroyed) return
    val built = build(activity, shownActions)
    val created = built.dialog
    // Created now (not in show), so the theme's animations are in to turn off.
    created.create()
    val window = created.window
    val animations = window?.attributes?.windowAnimations ?: 0
    window?.setWindowAnimations(0)
    old.window?.setWindowAnimations(0)

    dialog = created
    try {
      created.show()
    } catch (e: WindowManager.BadTokenException) {
      Log.w(TAG, "replace: BadTokenException: ${e.message}")
      dialog = old
      return
    }
    showing.add(created)
    finishShow(built, shownActions)

    // The old dialog goes without a word.
    old.setOnShowListener(null)
    old.setOnCancelListener(null)
    old.setOnDismissListener(null)
    showing.remove(old)
    // Once the new one has drawn over it: the scrim stays put as long as a
    // window asks for it, where removing the old one first fades it out and
    // back in.
    val decor = window?.decorView
    if (decor == null) {
      old.dismiss()
    } else {
      decor.viewTreeObserver.addOnDrawListener(object : ViewTreeObserver.OnDrawListener {
        private var drawn = false

        override fun onDraw() {
          if (drawn) return
          drawn = true
          decor.post {
            decor.viewTreeObserver.removeOnDrawListener(this)
            old.dismiss()
          }
        }
      })
    }

    // Its own animation back, for when it closes.
    window?.decorView?.post { window.setWindowAnimations(animations) }
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
  private fun buildStack(ctx: Context, actions: List<Action>): Pair<View, List<Pair<Button, Action>>> {
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

  /** Sets up [button] for the action at [index] of [shownActions]. */
  private fun configureButton(owner: AlertDialog, button: Button, index: Int) {
    val action = shownActions[index]
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
      if (dialog !== owner) return@setOnClickListener
      // The action as it is now: its haptic may have changed since.
      val action = shownActions[index]
      if (action.disabled) return@setOnClickListener
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
