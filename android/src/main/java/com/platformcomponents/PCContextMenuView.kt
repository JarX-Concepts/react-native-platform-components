package com.platformcomponents

import android.content.Context
import android.os.SystemClock
import android.util.Log
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.ViewConfiguration
import android.view.ViewGroup
import androidx.appcompat.widget.PopupMenu
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.events.NativeGestureUtil
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
  var trigger: String = "longPress"     // "longPress" | "tap" | "none"
  var visible: String = "closed"        // "open" | "closed" (programmatic)
  var androidAnchorPosition: String? = "left" // "left" | "right"

  /** The `haptics` prop, played when an action is picked (an action's own `haptics` wins). */
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
  /** A long press opened the menu and cancelled the touch in JS. */
  private var nativeGestureStarted = false
  private var touchDownX = 0f
  private var touchDownY = 0f
  /** Tap mode: the last touch went down on a native control (see handleTap). */
  private var downOnNativeControl = false
  private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
  private val longPressTimeout = ViewConfiguration.getLongPressTimeout().toLong()

  init {
    // Enable long-click for longPress mode
    isLongClickable = true
    setOnLongClickListener { handleLongClick() }
    // Enable click for tap mode (accessibility services; touches go through JS)
    setOnClickListener { openTapMenu() }
  }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    if (interactivity != "enabled") {
      return super.onInterceptTouchEvent(ev)
    }

    when (ev.action) {
      MotionEvent.ACTION_DOWN -> {
        touchDownX = ev.x
        touchDownY = ev.y
        downOnNativeControl = trigger == "tap" && isOnNativeControl(this, ev.x, ev.y)
        // In longPress mode, schedule long-press detection
        if (trigger == "longPress") {
          // Dispatch recycles MotionEvent instances before this callback runs.
          val downTime = ev.downTime
          val downX = ev.x
          val downY = ev.y
          cancelPendingLongPress()
          longPressRunnable = Runnable {
            if (handleLongClick()) {
              // The long-press haptic View.performLongClick plays, which this
              // path bypasses; off with haptics "none" (isHapticFeedbackEnabled)
              if (popupShowing) performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
              // Cancel any pending touch events on children, and the touch in
              // JS, so a pressable under the finger doesn't fire onPress when
              // it lifts (as a ScrollView does when it starts scrolling)
              val cancel = MotionEvent.obtain(
                downTime, SystemClock.uptimeMillis(),
                MotionEvent.ACTION_CANCEL, downX, downY, 0
              )
              super.dispatchTouchEvent(cancel)
              if (hasReactRoot()) {
                NativeGestureUtil.notifyNativeGestureStarted(this, cancel)
                nativeGestureStarted = true
              }
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
      // Tap mode opens the menu from JS (handleTap), for taps that no inner
      // pressable took
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
        cancelPendingLongPress()
        endNativeGesture(ev)
      }
    }

    return super.onInterceptTouchEvent(ev)
  }

  private fun endNativeGesture(ev: MotionEvent) {
    if (!nativeGestureStarted) return
    nativeGestureStarted = false
    if (hasReactRoot()) NativeGestureUtil.notifyNativeGestureEnded(this, ev)
  }

  /**
   * Whether a React root (a RootView) is above this view. NativeGestureUtil
   * asserts on one, and crashes for a view hosted outside React Native.
   */
  private fun hasReactRoot(): Boolean {
    var parent = parent
    while (parent != null) {
      if (parent is RootView) return true
      parent = parent.parent
    }
    return false
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

  /**
   * Tap mode: JS calls this for a tap on the content that no inner pressable
   * took (React Native's responder system knows: the deepest responder wins).
   */
  fun handleTap() {
    // A native control (this library's Button) handles its own taps,
    // outside the JS responder system
    if (downOnNativeControl) return
    openTapMenu()
  }

  /** Tap mode: JS taps (handleTap), and TalkBack through the click listener. */
  private fun openTapMenu() {
    if (trigger != "tap") return
    if (interactivity != "enabled") return

    showPopupMenu()
  }

  /** Whether (x, y) of `group` lands on a descendant with its own click listener. */
  private fun isOnNativeControl(group: ViewGroup, x: Float, y: Float): Boolean {
    for (i in group.childCount - 1 downTo 0) {
      val child = group.getChildAt(i)
      if (child.visibility != VISIBLE) continue
      val childX = x + group.scrollX - child.left - child.translationX
      val childY = y + group.scrollY - child.top - child.translationY
      if (childX < 0 || childY < 0 || childX >= child.width || childY >= child.height) continue
      if (child.isEnabled && child.hasOnClickListeners()) return true
      return child is ViewGroup && isOnNativeControl(child, childX, childY)
    }
    return false
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
      // "none": only `visible` opens the menu; no touch is intercepted
      "longPress", "tap", "none" -> value
      else -> "longPress"
    }
    Log.d(TAG, "applyTrigger trigger=$trigger")
    updateTriggerState()
  }

  /** Called only when the prop changes, so a menu the user opened stays open. */
  fun applyVisible(value: String?) {
    visible = if (value == "open") "open" else "closed"
    Log.d(TAG, "applyVisible visible=$visible")
    openToken += 1
    val token = openToken

    if (visible == "open") {
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
      if (visible != "open") {
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
      if (item == null || !item.isAction) {
        post { PCMenuSupport.tagPopupRows(popup.menu, items) }
        return@setOnMenuItemClickListener false
      }
      Log.d(TAG, "popup onMenuItemClick")
      dismissAfterSelect = true
      PCHaptics.perform(this, item.haptics.ifEmpty { haptics })
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
    PCMenuSupport.tagPopupRows(popup.menu, items)
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
