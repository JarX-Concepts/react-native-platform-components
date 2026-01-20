package com.platformcomponents

import android.util.Log
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.viewmanagers.PCSelectionMenuManagerDelegate
import com.facebook.react.viewmanagers.PCSelectionMenuManagerInterface

class PCSelectionMenuViewManager :
  SimpleViewManager<PCSelectionMenuView>(),
  PCSelectionMenuManagerInterface<PCSelectionMenuView> {

  companion object {
    private const val TAG = "PCSelectionMenu"
  }

  private val delegate: ViewManagerDelegate<PCSelectionMenuView> =
    PCSelectionMenuManagerDelegate(this)

  override fun getName(): String = "PCSelectionMenu"

  override fun getDelegate(): ViewManagerDelegate<PCSelectionMenuView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCSelectionMenuView {
    return PCSelectionMenuView(reactContext)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCSelectionMenuView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    view.onSelect = { index, label, data ->
      Log.d(TAG, "dispatch onSelect index=$index data=$data label=$label")
      dispatcher?.dispatchEvent(SelectEvent(view.id, index, label, data))
    }

    view.onRequestClose = {
      Log.d(TAG, "dispatch onRequestClose")
      dispatcher?.dispatchEvent(RequestCloseEvent(view.id))
    }
  }

  // options: array of {label,data}
  override fun setOptions(view: PCSelectionMenuView, value: ReadableArray?) {
    val out = ArrayList<PCSelectionMenuView.Option>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        val label = if (m.hasKey("label") && !m.isNull("label")) m.getString("label") ?: "" else ""
        val data = if (m.hasKey("data") && !m.isNull("data")) m.getString("data") ?: "" else ""
        out.add(PCSelectionMenuView.Option(label = label, data = data))
      }
    }
    view.applyOptions(out)
  }

  override fun setSelectedData(view: PCSelectionMenuView, value: String?) {
    // Spec sentinel: empty string means "no selection"
    view.applySelectedData(value ?: "")
  }

  override fun setInteractivity(view: PCSelectionMenuView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setPlaceholder(view: PCSelectionMenuView, value: String?) {
    view.applyPlaceholder(value)
  }

  override fun setAnchorMode(view: PCSelectionMenuView, value: String?) {
    view.applyAnchorMode(value)
  }

  override fun setVisible(view: PCSelectionMenuView, value: String?) {
    view.applyVisible(value)
  }

  override fun setPresentation(view: PCSelectionMenuView, value: String?) {
    view.applyPresentation(value)
  }

  override fun setAndroid(view: PCSelectionMenuView, value: ReadableMap?) {
    val material =
      if (value != null && value.hasKey("material") && !value.isNull("material")) value.getString("material") else null
    view.applyAndroidMaterial(material)
  }

  override fun setIos(view: PCSelectionMenuView, value: ReadableMap?) {
    // Android ignores iOS config
  }

  // --- Events ---
  private class SelectEvent(
    surfaceId: Int,
    private val index: Int,
    private val label: String,
    private val data: String
  ) : Event<SelectEvent>(surfaceId) {
    override fun getEventName(): String = "topSelect"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = com.facebook.react.bridge.Arguments.createMap().apply {
        putInt("index", index)
        putString("label", label)
        putString("data", data)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class RequestCloseEvent(surfaceId: Int) : Event<RequestCloseEvent>(surfaceId) {
    override fun getEventName(): String = "topRequestClose"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewTag, eventName, com.facebook.react.bridge.Arguments.createMap())
    }
  }
}
