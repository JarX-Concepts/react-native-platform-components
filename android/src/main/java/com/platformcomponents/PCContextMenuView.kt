package com.platformcomponents

import android.content.Context
import android.graphics.drawable.Drawable
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.Menu
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import androidx.appcompat.R as AppCompatR
import androidx.appcompat.widget.PopupMenu
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.DrawableCompat
import com.facebook.react.views.view.ReactViewGroup

class PCContextMenuView(context: Context) : ReactViewGroup(context) {

  data class Action(
    val id: String,
    val title: String,
    val subtitle: String?,
    val image: String?,
    val imageColor: String?,
    val destructive: Boolean,
    val disabled: Boolean,
    val hidden: Boolean,
    val state: String?, // "off" | "on" | "mixed"
    val subactions: List<Action>
  )

  companion object {
    private const val TAG = "PCContextMenu"
    // Material 3 baseline error color, used when the theme has no colorError.
    private const val FALLBACK_ERROR_COLOR = 0xFFB3261E.toInt()
  }

  // --- Props ---
  var menuTitle: String? = null
  var actions: List<Action> = emptyList()
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

  fun applyActions(newActions: List<Action>) {
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
    val visibleActions = actions.filter { !it.hidden }
    if (visibleActions.isEmpty()) {
      Log.d(TAG, "showPopupMenu: no visible actions")
      return
    }

    if (popupShowing) {
      Log.d(TAG, "showPopupMenu: already showing")
      return
    }

    Log.d(TAG, "showPopupMenu: creating popup with ${visibleActions.size} actions")

    val popup = PopupMenu(context, this, popupGravity())
    // Show item icons (public AndroidX PopupMenu API, works on every supported API level).
    popup.setForceShowIcon(true)

    buildMenu(popup.menu, visibleActions, 0)

    popup.setOnMenuItemClickListener { item ->
      val actionId = item.intent?.getStringExtra("actionId") ?: ""
      val actionTitle = item.title?.toString() ?: ""
      Log.d(TAG, "popup onMenuItemClick id=$actionId title=$actionTitle")
      dismissAfterSelect = true
      onPressAction?.invoke(actionId, actionTitle)
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

  private fun buildMenu(menu: Menu, actions: List<Action>, groupId: Int) {
    var order = 0
    for (action in actions) {
      if (action.hidden) continue

      if (action.subactions.isNotEmpty()) {
        // Create submenu
        val subMenu = menu.addSubMenu(groupId, order, order, action.title)
        buildMenu(subMenu, action.subactions, groupId + 1)

        // Set icon on submenu header if available
        action.image?.let { imageName ->
          getDrawableByName(imageName)?.let { drawable ->
            val tintedDrawable = tintDrawable(drawable, action.imageColor)
            subMenu.item.icon = tintedDrawable
          }
        }
      } else {
        // Create regular item
        val item = menu.add(groupId, order, order, buildTitle(action))

        // Store action ID in intent for retrieval
        item.intent = android.content.Intent().apply {
          putExtra("actionId", action.id)
        }

        // Set enabled state
        item.isEnabled = !action.disabled

        // Set icon (destructive icons take the error color unless imageColor is set)
        action.image?.let { imageName ->
          getDrawableByName(imageName)?.let { drawable ->
            item.icon = if (action.destructive && action.imageColor.isNullOrEmpty()) {
              tintDrawable(drawable, errorColor())
            } else {
              tintDrawable(drawable, action.imageColor)
            }
          }
        }

        // Set checkable state
        when (action.state) {
          "on" -> {
            item.isCheckable = true
            item.isChecked = true
          }
          "mixed" -> {
            item.isCheckable = true
            item.isChecked = true // Android doesn't have "mixed", treat as checked
          }
          else -> {
            item.isCheckable = false
          }
        }
      }
      order++
    }
  }

  private fun buildTitle(action: Action): CharSequence {
    if (!action.destructive) return action.title
    // Destructive actions are drawn in the theme's error color.
    return SpannableString(action.title).apply {
      setSpan(ForegroundColorSpan(errorColor()), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
  }

  /** The theme's ?attr/colorError, falling back to the Material 3 error red. */
  private fun errorColor(): Int {
    val value = TypedValue()
    if (!context.theme.resolveAttribute(AppCompatR.attr.colorError, value, true)) {
      return FALLBACK_ERROR_COLOR
    }
    return if (value.resourceId != 0) {
      ContextCompat.getColor(context, value.resourceId)
    } else {
      value.data
    }
  }

  private fun getDrawableByName(name: String): Drawable? {
    // First try as a drawable resource
    val resourceId = context.resources.getIdentifier(
      name,
      "drawable",
      context.packageName
    )

    if (resourceId != 0) {
      return ContextCompat.getDrawable(context, resourceId)
    }

    // Try common Material icons (ic_ prefix)
    val icResourceId = context.resources.getIdentifier(
      "ic_$name",
      "drawable",
      context.packageName
    )

    if (icResourceId != 0) {
      return ContextCompat.getDrawable(context, icResourceId)
    }

    Log.d(TAG, "Drawable not found: $name")
    return null
  }

  private fun tintDrawable(drawable: Drawable, colorString: String?): Drawable {
    if (colorString.isNullOrEmpty()) return drawable
    val color = ColorParser.parse(colorString) ?: return drawable
    return tintDrawable(drawable, color)
  }

  private fun tintDrawable(drawable: Drawable, color: Int): Drawable {
    val wrappedDrawable = DrawableCompat.wrap(drawable.mutate())
    DrawableCompat.setTint(wrappedDrawable, color)
    return wrappedDrawable
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
