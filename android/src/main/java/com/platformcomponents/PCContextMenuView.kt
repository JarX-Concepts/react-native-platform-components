package com.platformcomponents

import android.content.Context
import android.util.Log
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.ViewConfiguration
import androidx.appcompat.widget.PopupMenu
import com.facebook.react.views.view.ReactViewGroup

class PCContextMenuView(context: Context) : ReactViewGroup(context) {

  companion object {
    private const val TAG = "PCContextMenu"
  }

  // --- Props ---
  var menuTitle: String? = null
  /** The flattened menu items (see PCMenuSupport) */
  var actions: List<PCMenuSupport.Item> = emptyList()
  var interactivity: String = "enabled" // "enabled" | "disabled"
  var trigger: String = "longPress"     // "longPress" | "tap"
  var androidVisible: String = "closed" // "open" | "closed" (Android-only programmatic)
  var androidAnchorPosition: String? = "left" // "left" | "right"

  /** The `haptics` prop; the manager plays it with the user's action (see PCHaptics). */
  var haptics: String = ""

  // --- Events ---
  var onPressAction: ((id: String, title: String) -> Unit)? = null
  var onMenuOpen: (() -> Unit)? = null
  var onMenuClose: (() -> Unit)? = null

  // --- Internal ---
  private var popupMenu: PopupMenu? = null
  private var popupShowing = false
  private var dismissProgrammatic = false
  private var dismissAfterSelect = false
  private var openToken = 0

  // Long-press detection
  private var longPressRunnable: Runnable? = null
  private var touchDownX = 0f
  private var touchDownY = 0f
  private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
  private val longPressTimeout = ViewConfiguration.getLongPressTimeout().toLong()

  init {
    // Enable long-click for longPress mode
    isLongClickable = true
    setOnLongClickListener { handleLongClick() }
    // Enable click for tap mode
    setOnClickListener { handleTap() }
  }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    if (interactivity != "enabled") {
      return super.onInterceptTouchEvent(ev)
    }

    when (ev.action) {
      MotionEvent.ACTION_DOWN -> {
        touchDownX = ev.x
        touchDownY = ev.y
        // In longPress mode, schedule long-press detection
        if (trigger == "longPress") {
          longPressRunnable = Runnable {
            if (handleLongClick()) {
              // The long-press haptic View.performLongClick plays, which this
              // path bypasses; off with haptics "none" (isHapticFeedbackEnabled)
              if (popupShowing) performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
              // Cancel any pending touch events on children
              val cancel = MotionEvent.obtain(
                ev.downTime, System.currentTimeMillis(),
                MotionEvent.ACTION_CANCEL, ev.x, ev.y, 0
              )
              super.dispatchTouchEvent(cancel)
              cancel.recycle()
            }
          }
          postDelayed(longPressRunnable, longPressTimeout)
        }
      }
      MotionEvent.ACTION_MOVE -> {
        // Cancel if moved too much
        if (Math.abs(ev.x - touchDownX) > touchSlop ||
            Math.abs(ev.y - touchDownY) > touchSlop) {
          cancelPendingLongPress()
        }
      }
      MotionEvent.ACTION_UP -> {
        cancelPendingLongPress()
        // In tap mode, handle tap on ACTION_UP if within slop
        if (trigger == "tap" &&
            Math.abs(ev.x - touchDownX) <= touchSlop &&
            Math.abs(ev.y - touchDownY) <= touchSlop) {
          handleTap()
          return true // Consume the event
        }
      }
      MotionEvent.ACTION_CANCEL -> {
        cancelPendingLongPress()
      }
    }

    return super.onInterceptTouchEvent(ev)
  }

  private fun cancelPendingLongPress() {
    longPressRunnable?.let {
      removeCallbacks(it)
      longPressRunnable = null
    }
  }

  private fun handleLongClick(): Boolean {
    if (trigger != "longPress") return false
    if (interactivity != "enabled") return false

    showPopupMenu()
    return true
  }

  private fun handleTap() {
    if (trigger != "tap") return
    if (interactivity != "enabled") return

    showPopupMenu()
  }

  // ---- Public apply* (called by manager) ----

  fun applyMenuTitle(value: String?) {
    menuTitle = value
  }

  fun applyActions(newActions: List<PCMenuSupport.Item>) {
    actions = newActions
    Log.d(TAG, "applyActions size=${actions.size}")
  }

  fun applyInteractivity(value: String?) {
    interactivity = if (value == "disabled") "disabled" else "enabled"
    Log.d(TAG, "applyInteractivity interactivity=$interactivity")
    updateEnabledState()

    // If disabled while menu is open, dismiss
    if (interactivity != "enabled" && popupShowing) {
      Log.d(TAG, "applyInteractivity disabled while open -> dismiss")
      dismissProgrammatic = true
      popupMenu?.dismiss()
    }
  }

  fun applyTrigger(value: String?) {
    trigger = when (value) {
      "longPress", "tap" -> value
      else -> "longPress"
    }
    Log.d(TAG, "applyTrigger trigger=$trigger")
    updateTriggerState()
  }

  fun applyAndroidVisible(value: String?) {
    androidVisible = when (value) {
      "open", "closed" -> value
      else -> "closed"
    }
    Log.d(TAG, "applyAndroidVisible androidVisible=$androidVisible")
    openToken += 1
    val token = openToken

    if (androidVisible == "open") {
      presentIfNeeded(token)
    } else {
      if (popupShowing) {
        dismissProgrammatic = true
        popupMenu?.dismiss()
      }
    }
  }

  fun applyAndroidAnchorPosition(value: String?) {
    androidAnchorPosition = if (value == "right") "right" else "left"
    popupMenu?.gravity = popupGravity()
  }

  /** "right" aligns the popup to the anchor's end edge, "left" to its start edge. */
  private fun popupGravity(): Int =
    if (androidAnchorPosition == "right") Gravity.END else Gravity.START

  // ---- Internal ----

  private fun updateEnabledState() {
    val enabled = interactivity == "enabled"
    alpha = if (enabled) 1f else 0.5f
    isLongClickable = enabled && trigger == "longPress"
    isClickable = enabled && trigger == "tap"
  }

  private fun updateTriggerState() {
    val enabled = interactivity == "enabled"
    isLongClickable = enabled && trigger == "longPress"
    isClickable = enabled && trigger == "tap"
  }

  private fun presentIfNeeded(token: Int) {
    post {
      if (token != openToken) {
        Log.d(TAG, "presentIfNeeded stale token -> skip")
        return@post
      }
      if (androidVisible != "open") {
        Log.d(TAG, "presentIfNeeded no longer open -> skip")
        return@post
      }
      if (interactivity != "enabled") {
        Log.d(TAG, "presentIfNeeded disabled -> skip")
        return@post
      }
      if (!isAttachedToWindow) {
        Log.d(TAG, "presentIfNeeded not attached -> skip")
        return@post
      }

      showPopupMenu()
    }
  }

  private fun showPopupMenu() {
    val items = actions
    if (items.isEmpty()) {
      Log.d(TAG, "showPopupMenu: no visible actions")
      return
    }

    if (popupShowing) {
      Log.d(TAG, "showPopupMenu: already showing")
      return
    }

    Log.d(TAG, "showPopupMenu: creating popup with ${items.size} items")

    val popup = PopupMenu(context, this, popupGravity())
    popupMenu = popup
    val hasIcons = PCMenuSupport.populate(context, popup.menu, items) { popupMenu === popup }
    // Show item icons (public AndroidX PopupMenu API, works on every supported API level).
    popup.setForceShowIcon(hasIcons)

    popup.setOnMenuItemClickListener { menuItem ->
      // Submenu headers open their submenu; they aren't actions.
      val item = PCMenuSupport.itemFor(menuItem, items)
      if (item == null || !item.isAction) return@setOnMenuItemClickListener false
      Log.d(TAG, "popup onMenuItemClick id=${item.id} title=${item.title}")
      dismissAfterSelect = true
      onPressAction?.invoke(item.id, item.title)
      true
    }

    popup.setOnDismissListener {
      val programmatic = dismissProgrammatic || dismissAfterSelect
      dismissProgrammatic = false
      dismissAfterSelect = false
      popupShowing = false
      popupMenu = null

      if (!programmatic) {
        Log.d(TAG, "popup onDismiss user-initiated")
      }
      onMenuClose?.invoke()
    }

    popupMenu = popup
    popupShowing = true
    dismissProgrammatic = false
    dismissAfterSelect = false

    onMenuOpen?.invoke()
    popup.show()
  }

  override fun onDetachedFromWindow() {
    cancelPendingLongPress()
    if (popupShowing) {
      dismissProgrammatic = true
      popupMenu?.dismiss()
    }
    super.onDetachedFromWindow()
  }
}
