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

  override fun setActions(view: PCContextMenuView, value: ReadableArray?) {
    val out = ArrayList<PCContextMenuView.Action>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(parseAction(m))
      }
    }
    view.applyActions(out)
  }

  private fun parseAction(map: ReadableMap): PCContextMenuView.Action {
    val id = map.getStringOrEmpty("id")
    val title = map.getStringOrEmpty("title")
    val subtitle = map.getStringOrNull("subtitle")
    val image = map.getStringOrNull("image")
    val imageColor = map.getStringOrNull("imageColor")
    val state = map.getStringOrNull("state")

    // Parse attributes
    var destructive = false
    var disabled = false
    var hidden = false
    if (map.hasKey("attributes") && !map.isNull("attributes")) {
      val attrs = map.getMap("attributes")
      if (attrs != null) {
        destructive = attrs.getStringOrEmpty("destructive") == "true"
        disabled = attrs.getStringOrEmpty("disabled") == "true"
        hidden = attrs.getStringOrEmpty("hidden") == "true"
      }
    }

    // Parse subactions recursively
    val subactions = ArrayList<PCContextMenuView.Action>()
    if (map.hasKey("subactions") && !map.isNull("subactions")) {
      val subs = map.getArray("subactions")
      if (subs != null) {
        for (j in 0 until subs.size()) {
          val subMap = subs.getMap(j) ?: continue
          subactions.add(parseAction(subMap))
        }
      }
    }

    return PCContextMenuView.Action(
      id = id,
      title = title,
      subtitle = subtitle,
      image = image,
      imageColor = imageColor,
      destructive = destructive,
      disabled = disabled,
      hidden = hidden,
      state = state,
      subactions = subactions
    )
  }

  private fun ReadableMap.getStringOrEmpty(key: String): String {
    return if (hasKey(key) && !isNull(key)) getString(key) ?: "" else ""
  }

  private fun ReadableMap.getStringOrNull(key: String): String? {
    return if (hasKey(key) && !isNull(key)) getString(key) else null
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
