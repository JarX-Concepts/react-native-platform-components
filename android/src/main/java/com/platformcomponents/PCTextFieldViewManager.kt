package com.platformcomponents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.viewmanagers.PCTextFieldManagerDelegate
import com.facebook.react.viewmanagers.PCTextFieldManagerInterface
import com.platformcomponents.PCButtonSupport.doubleOr
import com.platformcomponents.PCButtonSupport.stringOr

class PCTextFieldViewManager :
  SimpleViewManager<PCTextFieldView>(),
  PCTextFieldManagerInterface<PCTextFieldView> {

  companion object {
    private const val TAG = "PCTextField"
  }

  private val delegate: ViewManagerDelegate<PCTextFieldView> = PCTextFieldManagerDelegate(this)

  override fun getName(): String = "PCTextField"

  override fun getDelegate(): ViewManagerDelegate<PCTextFieldView> = delegate

  override fun createViewInstance(reactContext: ThemedReactContext): PCTextFieldView {
    return PCTextFieldView(reactContext)
  }

  /**
   * Pass the StateWrapper to the view so it can update Fabric state with its
   * natural height, and report it right away so the first layout already fits.
   */
  override fun updateState(
    view: PCTextFieldView,
    props: ReactStylesDiffMap,
    stateWrapper: StateWrapper
  ): Any? {
    view.stateWrapper = stateWrapper
    view.reportIntrinsicSize()
    return null
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: PCTextFieldView) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, view.id)

    view.onChange = { text, eventCount ->
      dispatcher?.dispatchEvent(ChangeEvent(view.id, text, eventCount))
    }
    view.onFocusChange = { focused, text ->
      dispatcher?.dispatchEvent(TextEvent(view.id, if (focused) "topFieldFocus" else "topFieldBlur", text))
    }
    view.onSubmit = { text ->
      dispatcher?.dispatchEvent(TextEvent(view.id, "topFieldSubmit", text))
    }
    view.onSelectionChange = { start, end ->
      dispatcher?.dispatchEvent(SelectionEvent(view.id, start, end))
    }
    view.onTrailingIconPress = {
      dispatcher?.dispatchEvent(EmptyEvent(view.id, "topTrailingIconPress"))
    }
    view.onPress = {
      dispatcher?.dispatchEvent(EmptyEvent(view.id, "topFieldPress"))
    }
  }

  // --- Props ---

  override fun setInitialText(view: PCTextFieldView, value: String?) {
    view.applyInitialText(value ?: "")
  }

  override fun setLabel(view: PCTextFieldView, value: String?) {
    view.applyLabel(value ?: "")
  }

  override fun setPlaceholder(view: PCTextFieldView, value: String?) {
    view.applyPlaceholder(value ?: "")
  }

  override fun setSupportingText(view: PCTextFieldView, value: String?) {
    view.applySupportingText(value ?: "")
  }

  override fun setErrorState(view: PCTextFieldView, value: String?) {
    view.applyError(value ?: "none", view.errorText)
  }

  override fun setErrorText(view: PCTextFieldView, value: String?) {
    view.applyError(view.errorState, value ?: "")
  }

  override fun setPrefix(view: PCTextFieldView, value: String?) {
    view.applyPrefix(value ?: "")
  }

  override fun setSuffix(view: PCTextFieldView, value: String?) {
    view.applySuffix(value ?: "")
  }

  // icons: {iconType, iconName, iconUri, iconScale, iconTinted}
  override fun setLeadingIcon(view: PCTextFieldView, value: ReadableMap?) {
    view.applyLeadingIcon(PCButtonSupport.parseIcon(value))
  }

  override fun setTrailingIcon(view: PCTextFieldView, value: ReadableMap?) {
    view.applyTrailingIcon(PCButtonSupport.parseIcon(value))
  }

  override fun setClearButtonMode(view: PCTextFieldView, value: String?) {
    view.applyClearButtonMode(value ?: "never")
  }

  override fun setPasswordToggle(view: PCTextFieldView, value: String?) {
    view.applyPasswordToggle(value == "shown")
  }

  override fun setCharacterCount(view: PCTextFieldView, value: String?) {
    view.applyCharacterCount(value == "shown")
  }

  override fun setMaxLength(view: PCTextFieldView, value: Int) {
    view.applyMaxLength(value)
  }

  override fun setKeyboardType(view: PCTextFieldView, value: String?) {
    view.applyKeyboardType(value ?: "default")
  }

  override fun setReturnKeyType(view: PCTextFieldView, value: String?) {
    view.applyReturnKeyType(value ?: "default")
  }

  override fun setAutoCapitalize(view: PCTextFieldView, value: String?) {
    view.applyAutoCapitalize(value ?: "sentences")
  }

  override fun setAutoCorrect(view: PCTextFieldView, value: String?) {
    view.applyAutoCorrect(value != "disabled")
  }

  override fun setSecureTextEntry(view: PCTextFieldView, value: String?) {
    view.applySecure(value == "secure")
  }

  override fun setLines(view: PCTextFieldView, value: String?) {
    view.applyMultiline(value == "multiline")
  }

  override fun setSubmitBehavior(view: PCTextFieldView, value: String?) {
    view.applySubmitBehavior(value ?: "")
  }

  override fun setKeyboardToolbarItems(view: PCTextFieldView, value: ReadableArray?) {
    // iOS only: Android keyboards have no toolbar; returnKeyType picks the
    // action key, which number pads have too
  }

  override fun setInteractivity(view: PCTextFieldView, value: String?) {
    view.applyInteractivity(value)
  }

  override fun setAutoFocus(view: PCTextFieldView, value: String?) {
    view.applyAutoFocus(value == "focus")
  }

  override fun setSelectTextOnFocus(view: PCTextFieldView, value: String?) {
    view.applySelectTextOnFocus(value == "select")
  }

  override fun setAutoComplete(view: PCTextFieldView, value: String?) {
    view.applyAutoComplete(value ?: "")
  }

  override fun setKeyboardAppearance(view: PCTextFieldView, value: String?) {
    // iOS only
  }

  // textStyle: {fontFamily, fontSize, fontWeight, fontStyle}; empty / 0 = default
  override fun setTextStyle(view: PCTextFieldView, value: ReadableMap?) {
    view.applyTextStyle(
      family = value?.stringOr("fontFamily", "") ?: "",
      size = value?.doubleOr("fontSize", 0.0)?.toFloat() ?: 0f,
      weight = value?.stringOr("fontWeight", "") ?: "",
      style = value?.stringOr("fontStyle", "") ?: ""
    )
  }

  override fun setSpokenLabel(view: PCTextFieldView, value: String?) {
    view.applySpokenLabel(value ?: "")
  }

  /**
   * testID goes on the EditText, where Espresso types (Detox matches the view
   * tag); the host keeps only React Native's own test-id key, so one id never
   * matches two views.
   */
  override fun setTestId(view: PCTextFieldView, testId: String?) {
    view.setTag(com.facebook.react.R.id.react_test_id, testId)
    view.applyInputTestID(testId ?: "")
  }

  override fun setLeadingIconTestID(view: PCTextFieldView, value: String?) {
    view.applyIconAccessibility(value ?: "", view.leadingIconSpokenLabel, view.trailingIconTestID, view.trailingIconSpokenLabel)
  }

  override fun setLeadingIconSpokenLabel(view: PCTextFieldView, value: String?) {
    view.applyIconAccessibility(view.leadingIconTestID, value ?: "", view.trailingIconTestID, view.trailingIconSpokenLabel)
  }

  override fun setTrailingIconTestID(view: PCTextFieldView, value: String?) {
    view.applyIconAccessibility(view.leadingIconTestID, view.leadingIconSpokenLabel, value ?: "", view.trailingIconSpokenLabel)
  }

  override fun setTrailingIconSpokenLabel(view: PCTextFieldView, value: String?) {
    view.applyIconAccessibility(view.leadingIconTestID, view.leadingIconSpokenLabel, view.trailingIconTestID, value ?: "")
  }

  // Colors: processed color ints, null when unset
  override fun setActiveColor(view: PCTextFieldView, value: Int?) {
    view.applyColors(value, view.outlineColor, view.errorColor, view.containerColor, view.textColor, view.placeholderTextColor)
  }

  override fun setOutlineColor(view: PCTextFieldView, value: Int?) {
    view.applyColors(view.activeColor, value, view.errorColor, view.containerColor, view.textColor, view.placeholderTextColor)
  }

  override fun setErrorColor(view: PCTextFieldView, value: Int?) {
    view.applyColors(view.activeColor, view.outlineColor, value, view.containerColor, view.textColor, view.placeholderTextColor)
  }

  override fun setContainerColor(view: PCTextFieldView, value: Int?) {
    view.applyColors(view.activeColor, view.outlineColor, view.errorColor, value, view.textColor, view.placeholderTextColor)
  }

  override fun setTextColor(view: PCTextFieldView, value: Int?) {
    view.applyColors(view.activeColor, view.outlineColor, view.errorColor, view.containerColor, value, view.placeholderTextColor)
  }

  override fun setPlaceholderTextColor(view: PCTextFieldView, value: Int?) {
    view.applyColors(view.activeColor, view.outlineColor, view.errorColor, view.containerColor, view.textColor, value)
  }

  override fun setMaxFontSizeMultiplier(view: PCTextFieldView, value: Double) {
    view.applyMaxFontSizeMultiplier(value.toFloat())
  }

  override fun setTextAlign(view: PCTextFieldView, value: String?) {
    view.applyTextAlign(value ?: "")
  }

  override fun setMinLines(view: PCTextFieldView, value: Int) {
    view.applyLineBounds(value, view.maxLines)
  }

  override fun setMaxLines(view: PCTextFieldView, value: Int) {
    view.applyLineBounds(view.minLines, value)
  }

  override fun setPressMode(view: PCTextFieldView, value: String?) {
    view.applyPressable(value == "button")
  }

  override fun setIos(view: PCTextFieldView, value: ReadableMap?) {
    // Android ignores iOS config
  }

  // android: {material, variant, density}
  override fun setAndroid(view: PCTextFieldView, value: ReadableMap?) {
    view.applyMaterial(value?.stringOr("material", "m3"))
    view.applyVariant(value?.stringOr("variant", "outlined"))
    view.applyDensity(value?.stringOr("density", "standard"))
  }

  // --- Commands ---

  override fun focus(view: PCTextFieldView) {
    view.focusFromJS()
  }

  override fun blur(view: PCTextFieldView) {
    view.blurFromJS()
  }

  override fun clear(view: PCTextFieldView) {
    view.clearFromJS()
  }

  override fun setText(view: PCTextFieldView, eventCount: Int, text: String?) {
    view.setTextFromJS(eventCount, text ?: "")
  }

  override fun setSelection(view: PCTextFieldView, eventCount: Int, start: Int, end: Int) {
    view.setSelectionFromJS(eventCount, start, end)
  }

  // --- Events ---

  private class ChangeEvent(
    surfaceId: Int,
    private val text: String,
    private val eventCount: Int
  ) : Event<ChangeEvent>(surfaceId) {
    override fun getEventName(): String = "topFieldChange"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = Arguments.createMap().apply {
        putString("text", text)
        putInt("eventCount", eventCount)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class TextEvent(
    surfaceId: Int,
    private val name: String,
    private val text: String
  ) : Event<TextEvent>(surfaceId) {
    override fun getEventName(): String = name
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = Arguments.createMap().apply { putString("text", text) }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class SelectionEvent(
    surfaceId: Int,
    private val start: Int,
    private val end: Int
  ) : Event<SelectionEvent>(surfaceId) {
    override fun getEventName(): String = "topFieldSelectionChange"
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      val payload = Arguments.createMap().apply {
        putInt("start", start)
        putInt("end", end)
      }
      rctEventEmitter.receiveEvent(viewTag, eventName, payload)
    }
  }

  private class EmptyEvent(surfaceId: Int, private val name: String) : Event<EmptyEvent>(surfaceId) {
    override fun getEventName(): String = name
    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
      rctEventEmitter.receiveEvent(viewTag, eventName, Arguments.createMap())
    }
  }
}
