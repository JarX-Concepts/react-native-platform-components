package com.platformcomponents.selectionmenu

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class PCSelectionMenuViewManager(
  private val appContext: ReactApplicationContext
) : SimpleViewManager<PCSelectionMenuView>() {

  override fun getName(): String = "PCSelectionMenu"

  override fun createViewInstance(reactContext: ThemedReactContext): PCSelectionMenuView {
    val view = PCSelectionMenuView(reactContext)

    view.onSelect = { index, label, data ->
      val event = com.facebook.react.bridge.Arguments.createMap().apply {
        putInt("index", index)
        putString("label", label)
        putString("data", data)
      }
      reactContext.getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(view.id, "onSelect", event)
    }

    view.onRequestClose = {
      val event = com.facebook.react.bridge.Arguments.createMap()
      reactContext.getJSModule(RCTEventEmitter::class.java)
        .receiveEvent(view.id, "onRequestClose", event)
    }

    return view
  }

  override fun getExportedCustomBubblingEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.builder<String, Any>()
      .put(
        "onSelect",
        MapBuilder.of(
          "phasedRegistrationNames",
          MapBuilder.of("bubbled", "onSelect")
        )
      )
      .put(
        "onRequestClose",
        MapBuilder.of(
          "phasedRegistrationNames",
          MapBuilder.of("bubbled", "onRequestClose")
        )
      )
      .build()
  }

  // ---------------- Props ----------------

  @ReactProp(name = "options")
  fun setOptions(view: PCSelectionMenuView, options: ReadableArray?) {
    if (options == null) {
      view.options = emptyList()
      return
    }

    val out = ArrayList<SelectionOption>(options.size())
    for (i in 0 until options.size()) {
      val m = options.getMap(i) ?: continue
      val label = m.getString("label") ?: ""
      val data = m.getString("data") ?: ""
      out.add(SelectionOption(label = label, data = data))
    }
    view.options = out
  }

  @ReactProp(name = "selectedData")
  fun setSelectedData(view: PCSelectionMenuView, selectedData: String?) {
    view.selectedData = selectedData ?: ""
  }

  @ReactProp(name = "interactivity")
  fun setInteractivity(view: PCSelectionMenuView, interactivity: String?) {
    view.interactivity = interactivity ?: "enabled"
  }

  @ReactProp(name = "placeholder")
  fun setPlaceholder(view: PCSelectionMenuView, placeholder: String?) {
    view.placeholder = placeholder
  }

  @ReactProp(name = "anchorMode")
  fun setAnchorMode(view: PCSelectionMenuView, anchorMode: String?) {
    view.anchorMode = anchorMode ?: "headless"
  }

  @ReactProp(name = "visible")
  fun setVisible(view: PCSelectionMenuView, visible: String?) {
    view.visible = visible ?: "closed"
  }

  @ReactProp(name = "presentation")
  fun setPresentation(view: PCSelectionMenuView, presentation: String?) {
    view.presentation = presentation ?: "auto"
  }

  @ReactProp(name = "android")
  fun setAndroid(view: PCSelectionMenuView, android: ReadableMap?) {
    // android.material: "auto" | "m2" | "m3"
    val material = android?.getString("material")
    view.material = material
  }
}