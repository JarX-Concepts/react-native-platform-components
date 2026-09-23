package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.viewmanagers.PCButtonManagerDelegate
import com.facebook.react.viewmanagers.PCButtonManagerInterface
import com.platformcomponents.PCButtonSupport.doubleOr
import com.platformcomponents.PCButtonSupport.stringOr

class PCButtonViewManager :
  SimpleViewManager<PCButtonView>(),
  PCButtonManagerInterface<PCButtonView> {

  companion object {
    private const val TAG = "PCButton"
  }

  private val delegate: ViewManagerDelegate<PCButtonView> = PCButtonManagerDelegate(this)

  override fun getName(): String = "PCButton"

  override fun getDelegate(): ViewManagerDelegate<PCButtonView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCButtonView {
    return PCButtonView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural size, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCButtonView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCButtonView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    view.onPress = {
      dispatcher?.dispatchEvent(PressEvent(view.id))
    }
  }

  override fun setLabel(view: PCButtonView, value: String?) {
    view.applyLabel(value ?: "")
  }

  // icon: {iconType, iconName, iconUri, iconScale, iconTinted}
  override fun setIcon(view: PCButtonView, value: ReadableMap?) {
    view.applyIcon(PCButtonSupport.parseIcon(value))
  }

  override fun setVariant(view: PCButtonView, value: String?) {
    view.applyVariant(value)
  }

  override fun setSize(view: PCButtonView, value: String?) {
    view.applySize(value)
  }

  override fun setShape(view: PCButtonView, value: String?) {
    view.applyShape(value)
  }

  // "leading" (default) | "trailing"
  override fun setIconPosition(view: PCButtonView, value: String?) {
    view.applyIconPosition(value)
  }

  // Negative = use shape
  override fun setCornerRadius(view: PCButtonView, value: Double) {
    view.applyCornerRadius(value.toFloat())
  }

  override fun setInteractivity(view: PCButtonView, value: String?) {
    view.applyInteractivity(value)
  }

  // Colors arrive already processed by React Native (ARGB ints)
  override fun setColor(view: PCButtonView, value: Int?) {
    view.applyColors(value, view.foregroundColor, view.rippleColor, view.strokeColor)
  }

  override fun setForegroundColor(view: PCButtonView, value: Int?) {
    view.applyColors(view.containerColor, value, view.rippleColor, view.strokeColor)
  }

  override fun setAndroidRippleColor(view: PCButtonView, value: Int?) {
    view.applyColors(view.containerColor, view.foregroundColor, value, view.strokeColor)
  }

  override fun setAndroidStrokeColor(view: PCButtonView, value: Int?) {
    view.applyColors(view.containerColor, view.foregroundColor, view.rippleColor, value)
  }

  override fun setDisabledColor(view: PCButtonView, value: Int?) {
    view.applyDisabledColors(value, view.disabledForegroundColor)
  }

  override fun setDisabledForegroundColor(view: PCButtonView, value: Int?) {
    view.applyDisabledColors(view.disabledContainerColor, value)
  }

  // labelStyle: {fontFamily, fontSize, fontWeight, fontStyle}; empty / 0 = default
  override fun setLabelStyle(view: PCButtonView, value: ReadableMap?) {
    view.applyLabelStyle(
      fontFamily = value?.stringOr("fontFamily", "") ?: "",
      fontSize = value?.doubleOr("fontSize", 0.0)?.toFloat() ?: 0f,
      fontWeight = value?.stringOr("fontWeight", "") ?: "",
      fontStyle = value?.stringOr("fontStyle", "") ?: ""
    )
  }

  override fun setSpokenLabel(view: PCButtonView, value: String?) {
    view.applySpokenLabel(value ?: "")
  }

  // "expressive" (default) | "m3"
  override fun setAndroidMaterial(view: PCButtonView, value: String?) {
    view.applyMaterial(value)
  }

  // --- Events ---
  private class PressEvent(surfaceId: Int) : Event<PressEvent>(surfaceId) {
    override fun getEventName(): String = "topButtonPress"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewTag, eventName, Arguments.createMap())
    }
  }
}
