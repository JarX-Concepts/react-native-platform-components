package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.viewmanagers.PCButtonGroupManagerDelegate
import com.facebook.react.viewmanagers.PCButtonGroupManagerInterface
import com.platformcomponents.PCButtonSupport.doubleOr
import com.platformcomponents.PCButtonSupport.stringOr

class PCButtonGroupViewManager :
  SimpleViewManager<PCButtonGroupView>(),
  PCButtonGroupManagerInterface<PCButtonGroupView> {

  companion object {
    private const val TAG = "PCButtonGroup"
  }

  private val delegate: ViewManagerDelegate<PCButtonGroupView> =
    PCButtonGroupManagerDelegate(this)

  override fun getName(): String = "PCButtonGroup"

  override fun getDelegate(): ViewManagerDelegate<PCButtonGroupView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCButtonGroupView {
    return PCButtonGroupView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCButtonGroupView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCButtonGroupView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    view.onPress = { index, value ->
      PCHaptics.perform(view, view.haptics)
      dispatcher?.dispatchEvent(PressEvent(view.id, index, value))
    }
    view.onSelectionChange = { values ->
      dispatcher?.dispatchEvent(SelectionEvent(view.id, values))
    }
    fun dispatch(name: String, fill: WritableMap.() -> Unit = {}) {
      dispatcher?.dispatchEvent(MenuEvent(UIManagerHelper.getSurfaceId(view), view.id, name, fill))
    }
    view.onMenuSelect = { id, title ->
      dispatch("topMenuSelect") {
        putString("id", id)
        putString("title", title)
      }
    }
    view.onMenuOpen = { dispatch("topMenuOpen") }
    view.onMenuClose = { dispatch("topMenuClose") }
  }

  // buttons: array of {label, value, disabled, iconType, iconName, iconUri,
  //                    iconScale, iconTinted, accessibilityLabel}
  override fun setButtons(view: PCButtonGroupView, value: ReadableArray?) {
    val out = ArrayList<PCButtonGroupView.Item>()
    if (value != null) {
      for (i in 0 until value.size()) {
        val m = value.getMap(i) ?: continue
        out.add(
          PCButtonGroupView.Item(
            label = m.stringOr("label", ""),
            value = m.stringOr("value", ""),
            disabled = m.stringOr("disabled", "enabled") == "disabled",
            icon = PCButtonSupport.parseIcon(m),
            accessibilityLabel = m.stringOr("accessibilityLabel", "")
          )
        )
      }
    }
    view.applyItems(out)
  }

  override fun setVariant(view: PCButtonGroupView, value: String?) {
    view.applyVariant(value)
  }

  override fun setSize(view: PCButtonGroupView, value: String?) {
    view.applySize(value)
  }

  override fun setShape(view: PCButtonGroupView, value: String?) {
    view.applyShape(value)
  }

  // Spec sentinel: "true" | "false"
  override fun setConnected(view: PCButtonGroupView, value: String?) {
    view.applyConnected(value == "true")
  }

  // Negative means the style's default spacing
  override fun setSpacing(view: PCButtonGroupView, value: Double) {
    view.applySpacing(value.toFloat())
  }

  override fun setSelection(view: PCButtonGroupView, value: String?) {
    view.applySelection(value)
  }

  override fun setSelectedValues(view: PCButtonGroupView, value: ReadableArray?) {
    val out = ArrayList<String>()
    if (value != null) {
      for (i in 0 until value.size()) {
        value.getString(i)?.let { out.add(it) }
      }
    }
    view.applySelectedValues(out)
  }

  override fun setSelectionRequired(view: PCButtonGroupView, value: String?) {
    view.applySelectionRequired(value == "true")
  }

  override fun setInteractivity(view: PCButtonGroupView, value: String?) {
    view.applyInteractivity(value)
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setColor(view: PCButtonGroupView, value: Int?) {
    view.applyColors(value, view.foregroundColor, view.rippleColor, view.strokeColor)
  }

  override fun setForegroundColor(view: PCButtonGroupView, value: Int?) {
    view.applyColors(view.containerColor, value, view.rippleColor, view.strokeColor)
  }

  override fun setAndroidRippleColor(view: PCButtonGroupView, value: Int?) {
    view.applyColors(view.containerColor, view.foregroundColor, value, view.strokeColor)
  }

  override fun setAndroidStrokeColor(view: PCButtonGroupView, value: Int?) {
    view.applyColors(view.containerColor, view.foregroundColor, view.rippleColor, value)
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}; empty / 0 = default
  override fun setLabelStyle(view: PCButtonGroupView, value: ReadableMap?) {
    view.applyLabelStyle(
      fontFamily = value?.stringOr("fontFamily", "") ?: "",
      fontSize = value?.doubleOr("fontSize", 0.0)?.toFloat() ?: 0f,
      fontWeight = value?.stringOr("fontWeight", "") ?: "",
      fontStyle = value?.stringOr("fontStyle", "") ?: ""
    )
  }

  // "none" | "menu" | "wrap"
  override fun setOverflow(view: PCButtonGroupView, value: String?) {
    view.applyOverflow(value)
  }

  // "true" | "false": MaterialSplitButton
  override fun setSplit(view: PCButtonGroupView, value: String?) {
    view.applySplit(value == "true")
  }

  // menu: the split button's flattened menu items
  override fun setMenu(view: PCButtonGroupView, value: ReadableArray?) {
    view.applyMenu(PCMenuSupport.parseItems(value))
  }

  override fun setMenuAccessibilityLabel(view: PCButtonGroupView, value: String?) {
    view.applyMenuAccessibilityLabel(value ?: "")
  }

  // "" (none added) | "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
  override fun setHaptics(view: PCButtonGroupView, value: String?) {
    view.haptics = PCHaptics.configure(view, value)
  }

  // android: {material}
  override fun setAndroid(view: PCButtonGroupView, value: ReadableMap?) {
    view.applyMaterial(value?.stringOr("material", "expressive"))
  }

  // --- Events ---
  private class PressEvent(
    surfaceId: Int,
    private val index: Int,
    private val value: String
  ) : Event<PressEvent>(surfaceId) {
    override fun getEventName(): String = "topButtonPress"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = Arguments.createMap().apply {
        putInt("index", index)
        putString("value", value)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class MenuEvent(
    surfaceId: Int,
    viewTag: Int,
    private val name: String,
    private val fill: WritableMap.() -> Unit
  ) : Event<MenuEvent>(surfaceId, viewTag) {
    override fun canCoalesce(): Boolean = false

    override fun getEventName(): String = name

    // Fabric reads the payload from here
    override fun getEventData(): WritableMap = Arguments.createMap().apply(fill)
  }

  private class SelectionEvent(
    surfaceId: Int,
    private val values: List<String>
  ) : Event<SelectionEvent>(surfaceId) {
    override fun getEventName(): String = "topGroupSelectionChange"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val array = Arguments.createArray()
      values.forEach { array.pushString(it) }
      val payload = Arguments.createMap().apply {
        putArray("values", array)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }
}
