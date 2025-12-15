package com.platformcomponents

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class SelectionMenuViewManager : SimpleViewManager<SelectionMenuView>() {

  override fun getName(): String = "SelectionMenu"

  override fun createViewInstance(reactContext: ThemedReactContext): SelectionMenuView {
    return SelectionMenuView(reactContext)
  }

  @ReactProp(name = "options")
  fun setOptions(view: SelectionMenuView, options: ReadableArray?) {
    val list = mutableListOf<String>()
    if (options != null) {
      for (i in 0 until options.size()) {
        if (options.getType(i) == ReadableType.String) {
          list.add(options.getString(i) ?: "")
        } else {
          // best-effort stringify
          list.add(options.getDynamic(i).asString() ?: "")
        }
      }
    }
    view.options = list
  }

  @ReactProp(name = "selectedIndex", defaultInt = -1)
  fun setSelectedIndex(view: SelectionMenuView, selectedIndex: Int) {
    view.selectedIndex = selectedIndex
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: SelectionMenuView, disabled: Boolean) {
    view.disabled = disabled
  }

  @ReactProp(name = "placeholder")
  fun setPlaceholder(view: SelectionMenuView, placeholder: String?) {
    view.placeholder = placeholder
  }

  @ReactProp(name = "inlineMode", defaultBoolean = false)
  fun setInlineMode(view: SelectionMenuView, inlineMode: Boolean) {
    view.inlineMode = inlineMode
  }

  @ReactProp(name = "visible")
  fun setVisible(view: SelectionMenuView, visible: String?) {
    view.visible = visible ?: "closed"
  }

  @ReactProp(name = "presentation")
  fun setPresentation(view: SelectionMenuView, presentation: String?) {
    view.presentation = presentation ?: "auto"
  }
}
