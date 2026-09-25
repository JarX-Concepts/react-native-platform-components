package com.platformcomponents

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.viewmanagers.PCContextMenuManagerDelegate
import com.facebook.react.viewmanagers.PCContextMenuManagerInterface

class PCContextMenuViewManager :
  ViewGroupManager<PCContextMenuView>(),
  PCContextMenuManagerInterface<PCContextMenuView> {

  companion object {
    private const val TAG = "PCContextMenu"
  }

  private val delegate: ViewManagerDelegate<PCContextMenuView> =
    PCContextMenuManagerDelegate(this)

  override fun getName(): String = "PCContextMenu"

  override fun getDelegate(): ViewManagerDelegate<PCContextMenuView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCContextMenuView {
    return PCContextMenuView(reactContext)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCContextMenuView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    view.onPressAction = { id, title ->
      dispatcher?.dispatchEvent(PressActionEvent(view.id, id, title))
    }

    view.onMenuOpen = {
      dispatcher?.dispatchEvent(MenuOpenEvent(view.id))
    }

    view.onMenuClose = {
      dispatcher?.dispatchEvent(MenuCloseEvent(view.id))
    }
  }

  override fun setTitle(view: PCContextMenuView, value: String?) {
    view.applyMenuTitle(value)
  }

  // actions: the flattened menu items (src/menuItems.ts)
  override fun setActions(view: PCContextMenuView, value: ReadableArray?) {
    view.applyActions(PCMenuSupport.parseItems(value))
  }

  override fun setInteractivity(view: PCContextMenuView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setTrigger(view: PCContextMenuView, value: String?) {
    view.applyTrigger(value)
  }

  override fun setIos(view: PCContextMenuView, value: ReadableMap?) {
    // Android ignores iOS config
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCContextMenuView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  override fun setAndroid(view: PCContextMenuView, value: ReadableMap?) {
    if (value == null) {
      view.applyAndroidAnchorPosition(null)
      view.applyAndroidVisible(null)
      return
    }

    val anchorPosition = if (value.hasKey("anchorPosition") && !value.isNull("anchorPosition")) {
      value.getString("anchorPosition")
    } else {
      null
    }
    view.applyAndroidAnchorPosition(anchorPosition)

    val visible = if (value.hasKey("visible") && !value.isNull("visible")) {
      value.getString("visible")
    } else {
      null
    }
    view.applyAndroidVisible(visible)
  }

  // --- ViewGroupManager child management ---
  override fun addView(parent: PCContextMenuView, child: View, index: Int) {
    parent.addView(child, index)
  }

  override fun removeViewAt(parent: PCContextMenuView, index: Int) {
    parent.removeViewAt(index)
  }

  override fun getChildCount(parent: PCContextMenuView): Int {
    return parent.childCount
  }

  override fun getChildAt(parent: PCContextMenuView, index: Int): View? {
    return parent.getChildAt(index)
  }

  // --- Events ---
  private class PressActionEvent(
    surfaceId: Int,
    private val actionId: String,
    private val actionTitle: String
  ) : Event<PressActionEvent>(surfaceId) {
    override fun getEventName(): String = "topPressAction"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = com.facebook.react.bridge.Arguments.createMap().apply {
        putString("actionId", actionId)
        putString("actionTitle", actionTitle)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class MenuOpenEvent(surfaceId: Int) : Event<MenuOpenEvent>(surfaceId) {
    override fun getEventName(): String = "topMenuOpen"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewTag, eventName, com.facebook.react.bridge.Arguments.createMap())
    }
  }

  private class MenuCloseEvent(surfaceId: Int) : Event<MenuCloseEvent>(surfaceId) {
    override fun getEventName(): String = "topMenuClose"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewTag, eventName, com.facebook.react.bridge.Arguments.createMap())
    }
  }
}
