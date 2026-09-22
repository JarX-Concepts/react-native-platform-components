package com.platformcomponents

import android.content.Context
import android.graphics.Rect
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.text.Editable
import android.text.InputFilter
import android.text.InputType
import android.text.TextWatcher
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.content.res.ColorStateList
import android.util.TypedValue
import android.view.MotionEvent
import androidx.core.widget.TextViewCompat
import androidx.appcompat.R as AppCompatR
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ReactCompoundViewGroup
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import com.facebook.react.views.scroll.ReactScrollViewHelper
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

/**
 * A Material 3 text field: a TextInputLayout (floating label, box, icons,
 * supporting text, counter) around a TextInputEditText. With
 * `android.material: 'system'` it is the platform EditText instead (the hint
 * as placeholder, compound-drawable icons, supporting text below), as the
 * other components' system mode gives the AppCompat widget.
 *
 * The widgets are rebuilt for the props they read at construction (the box
 * style, the native theme); everything else is applied to the live widgets.
 * The text and its edit counter live here, so a rebuild keeps them.
 *
 * Text flows one way at a time: user edits report an event count with the
 * text, and JS pushes a controlled value back with the last count it saw.
 * A push that is older than the latest edit is dropped, so a slow JS
 * round-trip can't erase what was typed meanwhile.
 */
class PCTextFieldView(context: Context) :
  FrameLayout(context),
  ReactScrollViewHelper.HasStateWrapper,
  ReactCompoundViewGroup {

  companion object {
    private const val TAG = "PCTextField"
  }

  // --- State Wrapper for Fabric state updates ---
  override var stateWrapper: StateWrapper? = null

  private var lastReportedHeight: Float = -1f

  // --- Props ---
  var label: String = ""
  var placeholder: String = ""
  var supportingText: String = ""
  var errorState: String = "none" // "none" | "error"
  var errorText: String = ""
  var prefix: String = ""
  var suffix: String = ""
  var leadingIcon: PCButtonSupport.Icon = PCButtonSupport.NO_ICON
  var trailingIcon: PCButtonSupport.Icon = PCButtonSupport.NO_ICON
  var clearButtonMode: String = "never"
  var passwordToggle: Boolean = false
  var characterCount: Boolean = false
  var maxLength: Int = 0
  var keyboardType: String = "default"
  var returnKeyType: String = "default"
  var autoCapitalize: String = "sentences"
  var autoCorrect: Boolean = true
  var secure: Boolean = false
  var multiline: Boolean = false
  var fieldEnabled: Boolean = true
  var autoFocus: Boolean = false
  var selectTextOnFocus: Boolean = false
  var autoComplete: String = ""
  var spokenLabel: String = ""
  var fontFamily: String = ""
  var fontSize: Float = 0f
  var fontWeight: String = ""
  var fontStyle: String = ""
  var variant: String = "outlined" // "outlined" | "filled"
  var dense: Boolean = false
  var materialMode: String = "m3" // "m3" | "system"

  // --- Events ---
  var onChange: ((text: String, eventCount: Int) -> Unit)? = null
  var onFocusChange: ((focused: Boolean, text: String) -> Unit)? = null
  var onSubmit: ((text: String) -> Unit)? = null
  var onTrailingIconPress: (() -> Unit)? = null

  // --- Text state (survives rebuilds) ---
  private var text: String = ""
  private var nativeEventCount = 0
  private var settingTextInternally = false
  private var initialTextApplied = false
  private var autoFocusDone = false

  // --- UI ---
  /** The top-level widget: the TextInputLayout, or the system field's column. */
  private var widget: View? = null
  private var layout: TextInputLayout? = null
  private var editText: FieldEditText? = null
  private var helperView: TextView? = null

  /** The Material style's error icon, shown in the end slot while there is an error. */
  private var defaultErrorIcon: Drawable? = null

  /** Bumped on every rebuild and icon change so late image loads can't touch stale widgets. */
  private var startIconGeneration = 0
  private var endIconGeneration = 0

  // --- Native theme ---
  // Widgets read theme colors when they are created, so they are rebuilt when the
  // native theme changes (brand color, light/dark switch).
  private var builtThemeVersion = PCNativeTheme.version
  private val nativeThemeListener = PCNativeTheme.Listener {
    PCThemeSupport.clearColorStateListCaches(this)
    rebuildUI()
  }

  // Declared before init: rebuildUI() attaches the watcher, and Kotlin
  // initializes properties in declaration order.
  private val textWatcher = object : TextWatcher {
    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
    override fun afterTextChanged(s: Editable) {
      val next = s.toString()
      if (settingTextInternally) {
        text = next
        return
      }
      if (next == text) return
      text = next
      nativeEventCount += 1
      onChange?.invoke(next, nativeEventCount)
    }
  }

  private var manualLayoutPending = false

  init {
    clipChildren = false
    clipToPadding = false
    rebuildUI()
  }

  // ---- Public apply* (called by manager) ----

  /** The text the field starts with; only the first value is used (see setTextFromJS). */
  fun applyInitialText(value: String) {
    if (initialTextApplied) return
    initialTextApplied = true
    setTextInternal(value, moveCursorToEnd = true)
  }

  fun applyLabel(value: String) {
    if (label == value) return
    label = value
    applyHintAndPlaceholder()
  }

  fun applyPlaceholder(value: String) {
    if (placeholder == value) return
    placeholder = value
    applyHintAndPlaceholder()
  }

  fun applySupportingText(value: String) {
    if (supportingText == value) return
    supportingText = value
    applyHelperAndError()
  }

  fun applyError(state: String, message: String) {
    val nextState = if (state == "error") "error" else "none"
    if (errorState == nextState && errorText == message) return
    errorState = nextState
    errorText = message
    applyHelperAndError()
  }

  fun applyPrefix(value: String) {
    if (prefix == value) return
    prefix = value
    layout?.prefixText = value.ifEmpty { null }
    requestLayout()
  }

  fun applySuffix(value: String) {
    if (suffix == value) return
    suffix = value
    layout?.suffixText = value.ifEmpty { null }
    requestLayout()
  }

  fun applyLeadingIcon(value: PCButtonSupport.Icon) {
    if (leadingIcon == value) return
    leadingIcon = value
    applyStartIcon()
  }

  fun applyTrailingIcon(value: PCButtonSupport.Icon) {
    if (trailingIcon == value) return
    trailingIcon = value
    applyEndIcon()
  }

  fun applyClearButtonMode(value: String) {
    if (clearButtonMode == value) return
    clearButtonMode = value
    applyEndIcon()
  }

  fun applyPasswordToggle(value: Boolean) {
    if (passwordToggle == value) return
    passwordToggle = value
    applyEndIcon()
  }

  fun applyCharacterCount(value: Boolean) {
    if (characterCount == value) return
    characterCount = value
    applyCounterAndLength()
  }

  fun applyMaxLength(value: Int) {
    if (maxLength == value) return
    maxLength = value
    applyCounterAndLength()
  }

  fun applyKeyboardType(value: String) {
    if (keyboardType == value) return
    keyboardType = value
    applyInputType()
  }

  fun applyReturnKeyType(value: String) {
    if (returnKeyType == value) return
    returnKeyType = value
    applyInputType()
  }

  fun applyAutoCapitalize(value: String) {
    if (autoCapitalize == value) return
    autoCapitalize = value
    applyInputType()
  }

  fun applyAutoCorrect(value: Boolean) {
    if (autoCorrect == value) return
    autoCorrect = value
    applyInputType()
  }

  fun applySecure(value: Boolean) {
    if (secure == value) return
    secure = value
    applyInputType()
  }

  fun applyMultiline(value: Boolean) {
    if (multiline == value) return
    multiline = value
    applyInputType()
  }

  fun applyInteractivity(value: String?) {
    val next = value != "disabled"
    if (fieldEnabled == next) return
    fieldEnabled = next
    layout?.isEnabled = next
    if (layout == null) editText?.isEnabled = next
  }

  fun applyAutoFocus(value: Boolean) {
    autoFocus = value
    if (value && isAttachedToWindow) performAutoFocus()
  }

  fun applySelectTextOnFocus(value: Boolean) {
    if (selectTextOnFocus == value) return
    selectTextOnFocus = value
    editText?.setSelectAllOnFocus(value)
  }

  fun applyAutoComplete(value: String) {
    if (autoComplete == value) return
    autoComplete = value
    applyAutofill()
  }

  fun applySpokenLabel(value: String) {
    if (spokenLabel == value) return
    spokenLabel = value
    editText?.contentDescription = value.ifEmpty { null }
  }

  fun applyTextStyle(family: String, size: Float, weight: String, style: String) {
    if (fontFamily == family && fontSize == size && fontWeight == weight && fontStyle == style) return
    fontFamily = family
    fontSize = size
    fontWeight = weight
    fontStyle = style
    editText?.let { applyFont(it) }
    requestLayout()
  }

  fun applyVariant(value: String?) {
    val next = if (value == "filled") "filled" else "outlined"
    if (variant == next) return
    variant = next
    rebuildUI()
  }

  fun applyDensity(value: String?) {
    val next = value == "dense"
    if (dense == next) return
    dense = next
    rebuildUI()
  }

  fun applyMaterial(value: String?) {
    val next = if (value == "system") "system" else "m3"
    if (materialMode == next) return
    materialMode = next
    rebuildUI()
  }

  // ---- Commands ----

  fun focusFromJS() {
    val edit = editText ?: return
    edit.requestFocus()
    if (edit.isInTouchMode) showKeyboard(edit)
  }

  fun blurFromJS() {
    val edit = editText ?: return
    clearFocusAndMaybeRefocus(edit)
    hideKeyboard()
  }

  /** Clears the text as if the user had, so JS gets a change event. */
  fun clearFromJS() {
    val edit = editText ?: return
    if (edit.length() == 0) return
    edit.setText("")
  }

  /**
   * A controlled value from JS. Dropped when the user has edited since
   * [eventCount] was reported: the edit event that follows carries the text
   * JS should reconcile against.
   */
  fun setTextFromJS(eventCount: Int, value: String) {
    if (eventCount < nativeEventCount) return
    if (value == text) return
    setTextInternal(value, moveCursorToEnd = false)
  }

  // ---- Touch ----

  // The widgets have generated view ids, which React Native's touch handling
  // would take for React tags and dispatch JS touch events to unrelated views.
  // Claim the touch for this view; the field still receives it natively.
  override fun interceptsTouchEvent(touchX: Float, touchY: Float): Boolean = true

  override fun reactTagForTouch(touchX: Float, touchY: Float): Int = id

  // ---- Lifecycle ----

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    PCNativeTheme.addListener(nativeThemeListener)
    PCNativeTheme.attach(context)
    if (builtThemeVersion != PCNativeTheme.version) {
      nativeThemeListener.onNativeThemeChanged()
    }
    if (autoFocus) performAutoFocus()
  }

  override fun onDetachedFromWindow() {
    PCNativeTheme.removeListener(nativeThemeListener)
    super.onDetachedFromWindow()
  }

  private fun performAutoFocus() {
    if (autoFocusDone) return
    autoFocusDone = true
    post { focusFromJS() }
  }

  // ---- UI Building ----

  private fun rebuildUI() {
    builtThemeVersion = PCNativeTheme.version
    val wasFocused = editText?.isFocused == true
    val selection = editText?.selectionEnd ?: -1
    removeAllViews()
    startIconGeneration += 1
    endIconGeneration += 1
    layout = null
    helperView = null

    val edit: FieldEditText
    if (materialMode == "system") {
      // The platform field: an AppCompat EditText with a supporting-text line
      val column = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
      }
      edit = FieldEditText(context).apply {
        id = View.generateViewId()
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
        compoundDrawablePadding = dp(8)
        setSelectAllOnFocus(selectTextOnFocus)
        contentDescription = spokenLabel.ifEmpty { null }
        isEnabled = fieldEnabled
      }
      val helper = TextView(context).apply {
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { marginStart = dp(4); topMargin = dp(2) }
        TextViewCompat.setTextAppearance(this, android.R.style.TextAppearance_Material_Small)
        visibility = View.GONE
      }
      column.addView(edit)
      column.addView(helper)
      addView(column)
      widget = column
      helperView = helper
      editText = edit
    } else {
      // Material widgets need a Material theme; fall back to Material 3 defaults instead of crashing.
      val base = PCThemeSupport.materialContext(context, "TextField")
      val styleOverlay = when {
        variant == "filled" && dense -> R.style.PCTextField_Filled_Dense
        variant == "filled" -> R.style.PCTextField_Filled
        dense -> R.style.PCTextField_Outlined_Dense
        else -> R.style.PCTextField_Outlined
      }

      val til = TextInputLayout(ContextThemeWrapper(base, styleOverlay)).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
      }

      // The layout's context carries the style's theme overlay for its edit text
      edit = FieldEditText(til.context).apply {
        id = View.generateViewId()
        layoutParams = LinearLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.WRAP_CONTENT
        )
        setSelectAllOnFocus(selectTextOnFocus)
        contentDescription = spokenLabel.ifEmpty { null }
      }

      til.addView(edit)
      addView(til)
      widget = til
      layout = til
      editText = edit
      defaultErrorIcon = til.errorIconDrawable
      til.prefixText = prefix.ifEmpty { null }
      til.suffixText = suffix.ifEmpty { null }
      til.isEnabled = fieldEnabled
    }

    applyInputType()
    applyHintAndPlaceholder()
    applyHelperAndError()
    applyStartIcon()
    applyEndIcon()
    applyCounterAndLength()
    applyAutofill()

    // Restore the text without reporting it as an edit
    settingTextInternally = true
    edit.setText(text)
    val length = edit.length()
    edit.setSelection(if (selection in 0..length) selection else length)
    settingTextInternally = false

    edit.addTextChangedListener(textWatcher)
    // Focus changes are reported from FieldEditText.onFocusChanged: the Material
    // end-icon delegates (clear text, for one) install their own
    // OnFocusChangeListener on the edit text, replacing any listener set here.
    edit.setOnEditorActionListener { _, actionId, event -> onEditorAction(actionId, event) }

    if (wasFocused) edit.requestFocus()
    requestLayout()
  }

  private fun onEditorAction(actionId: Int, event: KeyEvent?): Boolean {
    // Multi-line fields keep the return key for newlines
    if (multiline) return false
    // A hardware / IME Enter reports IME_ACTION_UNSPECIFIED twice (key down and up)
    if (actionId == EditorInfo.IME_ACTION_UNSPECIFIED && event != null && event.action != KeyEvent.ACTION_DOWN) {
      return true
    }
    onSubmit?.invoke(text)
    // Single-line fields blur on submit, as the core TextInput does by default
    blurFromJS()
    return true
  }

  private fun setTextInternal(value: String, moveCursorToEnd: Boolean) {
    val edit = editText
    if (edit == null) {
      text = value
      return
    }
    settingTextInternally = true
    val wasAtEnd = edit.selectionEnd == edit.length()
    val cursor = edit.selectionStart
    edit.setText(value)
    text = value
    val length = edit.length()
    edit.setSelection(if (moveCursorToEnd || wasAtEnd) length else cursor.coerceIn(0, length))
    settingTextInternally = false
  }

  // ---- Decorations ----

  /**
   * With a label the Material layout floats it and shows the placeholder
   * while focused; without one the placeholder is the edit text's own hint,
   * and the box shrinks to the height of a plain field.
   */
  private fun applyHintAndPlaceholder() {
    val edit = editText ?: return
    val til = layout
    if (til == null) {
      // The platform field has one hint: the placeholder, else the label
      edit.hint = placeholder.ifEmpty { label }.ifEmpty { null }
      requestLayout()
      return
    }
    if (label.isNotEmpty()) {
      edit.hint = null
      til.isHintEnabled = true
      til.hint = label
      til.placeholderText = placeholder.ifEmpty { null }
    } else {
      til.placeholderText = null
      til.hint = null
      til.isHintEnabled = false
      edit.hint = placeholder.ifEmpty { null }
    }
    requestLayout()
  }

  private fun applyHelperAndError() {
    val til = layout
    if (til == null) {
      applySystemHelper()
      return
    }
    til.helperText = supportingText.ifEmpty { null }
    if (errorState == "error") {
      // No message: the supporting text turns to the error color, as the
      // Material spec shows; with nothing to show, keep the outline red only
      til.isErrorEnabled = true
      til.error = errorText.ifEmpty { supportingText.ifEmpty { " " } }
    } else {
      til.error = null
      til.isErrorEnabled = false
    }
    requestLayout()
  }

  /** The system field's supporting / error line, in the theme's secondary or error color. */
  private fun applySystemHelper() {
    val helper = helperView ?: return
    val showsError = errorState == "error"
    val message = if (showsError && errorText.isNotEmpty()) errorText else supportingText
    helper.text = message
    helper.visibility = if (message.isEmpty()) View.GONE else View.VISIBLE
    val color = if (showsError) {
      themeColor(AppCompatR.attr.colorError, 0xFFB3261E.toInt())
    } else {
      themeColor(android.R.attr.textColorSecondary, 0xFF757575.toInt())
    }
    helper.setTextColor(color)
    requestLayout()
  }

  private fun themeColor(attr: Int, fallback: Int): Int {
    val value = TypedValue()
    if (!context.theme.resolveAttribute(attr, value, true)) return fallback
    return if (value.resourceId != 0) context.getColor(value.resourceId) else value.data
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  /** Icons of the system field: compound drawables, the trailing one tappable. */
  private var systemStart: Drawable? = null
  private var systemEnd: Drawable? = null

  private fun applySystemIcons() {
    val edit = editText ?: return
    val start = systemStart
    val end = systemEnd
    edit.setCompoundDrawablesRelativeWithIntrinsicBounds(start, null, end, null)
    val tinted = (start != null && leadingIcon.tinted) || (end != null && trailingIcon.tinted)
    TextViewCompat.setCompoundDrawableTintList(
      edit,
      if (tinted) ColorStateList.valueOf(themeColor(android.R.attr.colorControlNormal, 0xFF757575.toInt())) else null
    )
    if (end != null) {
      edit.setOnTouchListener { v, event ->
        if (event.action == MotionEvent.ACTION_UP) {
          val width = end.bounds.width() + edit.compoundDrawablePadding
          val isRtl = v.layoutDirection == View.LAYOUT_DIRECTION_RTL
          val hit = if (isRtl) event.x <= v.paddingStart + width else event.x >= v.width - v.paddingEnd - width
          if (hit) {
            v.performClick()
            onTrailingIconPress?.invoke()
            return@setOnTouchListener true
          }
        }
        false
      }
    } else {
      edit.setOnTouchListener(null)
    }
    requestLayout()
  }

  private fun applyStartIcon() {
    startIconGeneration += 1
    val generation = startIconGeneration
    val til = layout
    if (til == null) {
      systemStart = null
      if (leadingIcon.isPresent) {
        loadIcon(leadingIcon) { drawable ->
          if (generation != startIconGeneration || layout != null) return@loadIcon
          systemStart = drawable
          applySystemIcons()
        }
      }
      applySystemIcons()
      return
    }
    if (!leadingIcon.isPresent) {
      til.startIconDrawable = null
      requestLayout()
      return
    }
    loadIcon(leadingIcon) { drawable ->
      if (generation != startIconGeneration || layout !== til) return@loadIcon
      if (!leadingIcon.tinted) til.setStartIconTintList(null)
      til.startIconDrawable = drawable
      requestLayout()
    }
  }

  /**
   * The end icon slot, by priority: a custom trailing icon, the password
   * toggle, the clear button (shown while the focused field has text).
   */
  private fun applyEndIcon() {
    endIconGeneration += 1
    val generation = endIconGeneration
    val til = layout
    if (til == null) {
      // The platform field has no clear button or password toggle
      systemEnd = null
      if (trailingIcon.isPresent) {
        loadIcon(trailingIcon) { drawable ->
          if (generation != endIconGeneration || layout != null) return@loadIcon
          systemEnd = drawable
          applySystemIcons()
        }
      }
      applySystemIcons()
      return
    }
    when {
      trailingIcon.isPresent -> {
        til.endIconMode = TextInputLayout.END_ICON_CUSTOM
        til.setEndIconOnClickListener { onTrailingIconPress?.invoke() }
        loadIcon(trailingIcon) { drawable ->
          if (generation != endIconGeneration || layout !== til) return@loadIcon
          if (!trailingIcon.tinted) til.setEndIconTintList(null)
          til.endIconDrawable = drawable
          requestLayout()
        }
      }
      passwordToggle -> til.endIconMode = TextInputLayout.END_ICON_PASSWORD_TOGGLE
      clearButtonMode != "never" -> til.endIconMode = TextInputLayout.END_ICON_CLEAR_TEXT
      else -> til.endIconMode = TextInputLayout.END_ICON_NONE
    }
    // Material replaces the end icon with its error icon while an error shows;
    // a password toggle or a custom icon stays, since the user still needs it
    til.errorIconDrawable = if (trailingIcon.isPresent || passwordToggle) null else defaultErrorIcon
    requestLayout()
  }

  private fun applyCounterAndLength() {
    val edit = editText ?: return
    edit.filters = if (maxLength > 0) arrayOf(InputFilter.LengthFilter(maxLength)) else emptyArray()
    val til = layout ?: return
    til.counterMaxLength = maxLength
    til.isCounterEnabled = characterCount
    requestLayout()
  }

  private fun applyInputType() {
    val edit = editText ?: return

    var type = when (keyboardType) {
      "numeric" -> InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL or InputType.TYPE_NUMBER_FLAG_SIGNED
      "number-pad" -> InputType.TYPE_CLASS_NUMBER
      "decimal-pad" -> InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
      "phone-pad" -> InputType.TYPE_CLASS_PHONE
      "email-address" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
      "url" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
      "visible-password" -> InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
      else -> InputType.TYPE_CLASS_TEXT
    }
    val isText = (type and InputType.TYPE_MASK_CLASS) == InputType.TYPE_CLASS_TEXT
    val isNumber = (type and InputType.TYPE_MASK_CLASS) == InputType.TYPE_CLASS_NUMBER

    if (secure) {
      if (isText) {
        type = (type and InputType.TYPE_MASK_VARIATION.inv()) or InputType.TYPE_TEXT_VARIATION_PASSWORD
      } else if (isNumber) {
        type = type or InputType.TYPE_NUMBER_VARIATION_PASSWORD
      }
    }

    if (isText && !secure) {
      type = type or when (autoCapitalize) {
        "characters" -> InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
        "words" -> InputType.TYPE_TEXT_FLAG_CAP_WORDS
        "sentences" -> InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
        else -> 0
      }
      type = type or if (autoCorrect) {
        InputType.TYPE_TEXT_FLAG_AUTO_CORRECT
      } else {
        InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
      }
    }

    if (multiline && isText) {
      type = type or InputType.TYPE_TEXT_FLAG_MULTI_LINE
    }

    if (edit.inputType != type) {
      // Setting the input type resets the typeface (password fields default
      // to monospace) and the transformation; the font is re-applied below.
      edit.inputType = type
    }

    edit.imeOptions = when (returnKeyType) {
      "done" -> EditorInfo.IME_ACTION_DONE
      "go" -> EditorInfo.IME_ACTION_GO
      "next" -> EditorInfo.IME_ACTION_NEXT
      "search" -> EditorInfo.IME_ACTION_SEARCH
      "send" -> EditorInfo.IME_ACTION_SEND
      "previous" -> EditorInfo.IME_ACTION_PREVIOUS
      "none" -> EditorInfo.IME_ACTION_NONE
      else -> EditorInfo.IME_ACTION_UNSPECIFIED
    }

    if (multiline) {
      edit.gravity = Gravity.TOP or Gravity.START
      edit.minLines = 1
    } else {
      edit.gravity = Gravity.CENTER_VERTICAL or Gravity.START
    }

    applyFont(edit)
    requestLayout()
  }

  private fun applyFont(edit: TextInputEditText) {
    PCButtonSupport.applyFont(edit, fontFamily, fontSize, fontWeight, fontStyle)
  }

  private fun applyAutofill() {
    val edit = editText ?: return
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    when (autoComplete) {
      "" -> {
        edit.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_AUTO
        edit.setAutofillHints()
      }
      "off" -> {
        edit.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO
        edit.setAutofillHints()
      }
      else -> {
        val hint = autofillHint(autoComplete)
        edit.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES
        if (hint != null) edit.setAutofillHints(hint) else edit.setAutofillHints()
      }
    }
  }

  /** React Native autoComplete values onto the Android autofill hints. */
  private fun autofillHint(value: String): String? = when (value) {
    "username" -> View.AUTOFILL_HINT_USERNAME
    "password" -> View.AUTOFILL_HINT_PASSWORD
    "new-password" -> "newPassword" // HintConstants.AUTOFILL_HINT_NEW_PASSWORD
    "one-time-code" -> "smsOTPCode" // HintConstants.AUTOFILL_HINT_SMS_OTP
    "email" -> View.AUTOFILL_HINT_EMAIL_ADDRESS
    "name" -> View.AUTOFILL_HINT_NAME
    "given-name" -> "personGivenName" // HintConstants.AUTOFILL_HINT_PERSON_NAME_GIVEN
    "family-name" -> "personFamilyName" // HintConstants.AUTOFILL_HINT_PERSON_NAME_FAMILY
    "tel" -> View.AUTOFILL_HINT_PHONE
    "street-address" -> View.AUTOFILL_HINT_POSTAL_ADDRESS
    "postal-code" -> View.AUTOFILL_HINT_POSTAL_CODE
    "country" -> "addressCountry" // HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_COUNTRY
    "cc-number" -> View.AUTOFILL_HINT_CREDIT_CARD_NUMBER
    "cc-exp" -> View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE
    "cc-csc" -> View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE
    else -> null
  }

  /**
   * Resolves an icon. Drawable names and release-bundled assets (which React
   * Native ships as drawable resources) resolve synchronously; other image
   * URIs load in the background and are delivered when they arrive.
   */
  private fun loadIcon(icon: PCButtonSupport.Icon, onLoaded: (Drawable?) -> Unit) {
    when (icon.type) {
      "drawable" -> onLoaded(ResourceDrawableIdHelper.instance.getResourceDrawable(context, icon.name))
      "image" -> {
        val uri = icon.uri
        if (!uri.contains(':')) {
          onLoaded(ResourceDrawableIdHelper.instance.getResourceDrawable(context, uri))
        } else {
          PCImageLoader.load(context, uri, icon.scale) { bitmap ->
            onLoaded(bitmap?.let { BitmapDrawable(context.resources, it) })
          }
        }
      }
      else -> onLoaded(null)
    }
  }

  // ---- Keyboard and focus ----

  private fun showKeyboard(view: View) {
    val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
    imm?.showSoftInput(view, 0)
  }

  private fun hideKeyboard() {
    val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
    imm?.hideSoftInputFromWindow(windowToken, 0)
  }

  /**
   * Drops focus. Android 9 and below would hand it to the next focusable
   * view (often another text field) when the root view refocuses; block
   * that, as the core TextInput does.
   */
  private fun clearFocusAndMaybeRefocus(edit: View) {
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.P || !edit.isInTouchMode) {
      edit.clearFocus()
      return
    }
    val root = rootView as? ViewGroup
    if (root == null) {
      edit.clearFocus()
      return
    }
    val previous = root.descendantFocusability
    root.descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
    edit.clearFocus()
    root.descendantFocusability = previous
  }

  /**
   * The edit text. The keyboard's back key hides the keyboard; the field
   * drops focus with it so JS gets onBlur, as the core TextInput does not,
   * but a Material field with a focused label and no keyboard looks stuck.
   */
  private inner class FieldEditText(context: Context) : TextInputEditText(context) {
    override fun onFocusChanged(focused: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
      super.onFocusChanged(focused, direction, previouslyFocusedRect)
      onFocusChange?.invoke(focused, this@PCTextFieldView.text)
    }

    override fun onKeyPreIme(keyCode: Int, event: KeyEvent): Boolean {
      if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP && isFocused) {
        clearFocusAndMaybeRefocus(this)
      }
      return super.onKeyPreIme(keyCode, event)
    }
  }

  // ---- Layout ----

  /**
   * React Native's root view ignores requestLayout after the initial pass, so
   * a native view whose subtree changes later (a longer multi-line text, an
   * error message appearing) has to measure and lay itself out. Coalesced to
   * one pass per frame.
   */
  override fun requestLayout() {
    super.requestLayout()
    if (!manualLayoutPending) {
      manualLayoutPending = true
      post { runManualLayout() }
    }
  }

  private fun runManualLayout() {
    manualLayoutPending = false
    // Nothing to do until Yoga has placed us; the regular pass covers that.
    if (width == 0 || height == 0) return
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  // ---- Measurement ----

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val child = widget
    if (child == null) {
      setMeasuredDimension(0, 0)
      return
    }

    // The field fills the width it is given and takes the height its
    // content needs; Yoga catches up through the state update.
    val width = resolveWidth(widthMeasureSpec)
    measureWidget(child, width)
    val naturalHeight = child.measuredHeight
    val heightSize = MeasureSpec.getSize(heightMeasureSpec)
    val height = when (MeasureSpec.getMode(heightMeasureSpec)) {
      // Fabric may give us 0 before the state is applied; keep the natural size then.
      MeasureSpec.EXACTLY -> if (heightSize > 0) heightSize else naturalHeight
      MeasureSpec.AT_MOST -> minOf(naturalHeight, heightSize)
      else -> naturalHeight
    }
    setMeasuredDimension(width, height)
    reportHeight(naturalHeight)
  }

  /** Measures the widget at [width], as tall as its content needs. */
  private fun measureWidget(child: View, width: Int) {
    child.measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
  }

  private fun resolveWidth(spec: Int): Int {
    val size = MeasureSpec.getSize(spec)
    return if (size > 0) size else (PCConstants.FALLBACK_WIDTH_DP * resources.displayMetrics.density).toInt()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val child = widget ?: return
    // Keep the widget at its natural height even when Yoga hasn't caught up
    child.layout(0, 0, right - left, child.measuredHeight)
    // TextInputLayout makes room for its start icon and prefix (invisible
    // compound drawables on the edit text) from a ViewTreeObserver global
    // layout callback, which only a window traversal delivers. React Native's
    // root doesn't run one for a native subtree that laid itself out, so run
    // it here; when it changes something it asks for another pass.
    layout?.onGlobalLayout()
  }

  /** Reports the intrinsic height to Fabric; called as soon as the state wrapper is available. */
  fun reportIntrinsicSize() {
    val child = widget ?: return
    val width = if (width > 0) width else (PCConstants.FALLBACK_WIDTH_DP * resources.displayMetrics.density).toInt()
    measureWidget(child, width)
    reportHeight(child.measuredHeight)
  }

  /**
   * Update Fabric state with the field's natural height. The width stays 0:
   * the shadow node fills the available width.
   */
  private fun reportHeight(heightPx: Int) {
    val wrapper = stateWrapper ?: return
    val heightDp = PixelUtil.toDIPFromPixel(heightPx.toFloat())
    if (heightDp == lastReportedHeight) return
    lastReportedHeight = heightDp

    val stateData = WritableNativeMap().apply {
      putDouble("width", 0.0)
      putDouble("height", heightDp.toDouble())
    }
    wrapper.updateState(stateData)
  }
}
