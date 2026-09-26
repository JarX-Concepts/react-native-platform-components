import UIKit

/// A native text field: a caption label, a `UITextField` (or a growing
/// `UITextView` for multi-line text) and supporting text below, with the
/// text traits iOS adds each year exposed as props.
///
/// The text and its edit counter live here. User edits report the counter
/// with the text; JS pushes a controlled value back with the last counter it
/// saw, and a push older than the latest edit is dropped so a slow JS
/// round-trip can't erase what was typed meanwhile.
@objcMembers
public final class PCTextFieldView: UIView, UITextFieldDelegate, UITextViewDelegate, UIGestureRecognizerDelegate {
    // MARK: - Props (set from ObjC++)

    public var label: String = "" {
        didSet { if oldValue != label { applyLabel() } }
    }

    public var placeholder: String = "" {
        didSet { if oldValue != placeholder { applyPlaceholder() } }
    }

    public var supportingText: String = "" {
        didSet { if oldValue != supportingText { applyFooter() } }
    }

    /// "none" | "error"
    public var errorState: String = "none" {
        didSet { if oldValue != errorState { applyFooter(); applyColors() } }
    }

    public var errorText: String = "" {
        didSet { if oldValue != errorText { applyFooter() } }
    }

    public var prefix: String = "" {
        didSet { if oldValue != prefix { applyAccessories() } }
    }

    public var suffix: String = "" {
        didSet { if oldValue != suffix { applyAccessories() } }
    }

    /// "never" | "while-editing" | "unless-editing" | "always"
    public var clearButtonMode: String = "never" {
        didSet { if oldValue != clearButtonMode { applyAccessories() } }
    }

    public var passwordToggle: Bool = false {
        didSet { if oldValue != passwordToggle { applyAccessories() } }
    }

    public var characterCount: Bool = false {
        didSet { if oldValue != characterCount { applyFooter() } }
    }

    /// 0 = unlimited
    public var maxLength: Int = 0 {
        didSet { if oldValue != maxLength { applyFooter() } }
    }

    public var keyboardType: String = "default" {
        didSet { if oldValue != keyboardType { applyTraits() } }
    }

    public var returnKeyType: String = "default" {
        didSet { if oldValue != returnKeyType { applyTraits() } }
    }

    public var autoCapitalize: String = "sentences" {
        didSet { if oldValue != autoCapitalize { applyTraits() } }
    }

    public var autoCorrect: Bool = true {
        didSet { if oldValue != autoCorrect { applyTraits() } }
    }

    public var secureTextEntry: Bool = false {
        didSet { if oldValue != secureTextEntry { revealed = false; applyTraits(); applyAccessories() } }
    }

    public var multiline: Bool = false {
        didSet { if oldValue != multiline { rebuildInput() } }
    }

    /// What the return key does: "submit" | "blurAndSubmit" | "newline";
    /// "" keeps the defaults (a newline in multi-line fields, else blur and submit)
    public var submitBehavior: String = ""

    /// UITextInputPasswordRules descriptor; "" = none
    public var passwordRules: String = "" {
        didSet { if oldValue != passwordRules { applyTraits() } }
    }

    /// The keyboard toolbar's items (kind, itemId, title, systemItem, icon
    /// fields, prominent, accessibilityLabel, testID); empty = no toolbar
    public var keyboardToolbarItems: [NSDictionary] = [] {
        didSet { if oldValue != keyboardToolbarItems { applyKeyboardToolbar() } }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { if oldValue != interactivity { applyEnabled() } }
    }

    public var autoFocus: Bool = false {
        didSet { if autoFocus, window != nil { performAutoFocus() } }
    }

    public var selectTextOnFocus: Bool = false

    /// React Native autoComplete value; "" = default
    public var autoComplete: String = "" {
        didSet { if oldValue != autoComplete { applyTraits() } }
    }

    /// "default" | "light" | "dark"
    public var keyboardAppearance: String = "default" {
        didSet { if oldValue != keyboardAppearance { applyTraits() } }
    }

    /// Input font; nil keeps the body text style
    public var textFont: UIFont? {
        didSet { applyFonts() }
    }

    /// Screen-reader label; empty uses the label
    public var spokenLabel: String = "" {
        didSet { applyAccessibility() }
    }

    // iOS text traits, "" for the system default
    public var writingTools: String = "" {
        didSet { if oldValue != writingTools { applyTraits() } }
    }

    public var inlinePrediction: String = "" {
        didSet { if oldValue != inlinePrediction { applyTraits() } }
    }

    public var smartQuotes: String = "" {
        didSet { if oldValue != smartQuotes { applyTraits() } }
    }

    public var smartDashes: String = "" {
        didSet { if oldValue != smartDashes { applyTraits() } }
    }

    public var smartInsertDelete: String = "" {
        didSet { if oldValue != smartInsertDelete { applyTraits() } }
    }

    public var mathExpressionCompletion: String = "" {
        didSet { if oldValue != mathExpressionCompletion { applyTraits() } }
    }

    /// "" | "roundedRect" | "none" | "line" | "bezel"
    public var borderStyle: String = "" {
        didSet { if oldValue != borderStyle { applyBorderStyle() } }
    }

    /// "" | "above" | "leading": the caption above the field, or in a column
    /// beside it, the layout of the grouped forms in Contacts and Settings
    public var labelPlacement: String = "" {
        didSet { if oldValue != labelPlacement { applyLabel(); applyFonts(); applyColors() } }
    }

    /// Width of the leading label column; 0 = default
    public var labelWidth: CGFloat = 0 {
        didSet { if oldValue != labelWidth { setNeedsLayout(); onNeedsRemeasure?() } }
    }

    /// Test id of the inner input, where E2E drivers type (see PCTextField.mm)
    public var inputTestID: String = "" {
        didSet { if oldValue != inputTestID { applyAccessibility() } }
    }

    public var leadingIconTestID: String = "" {
        didSet { if oldValue != leadingIconTestID { applyAccessories() } }
    }

    public var leadingIconSpokenLabel: String = "" {
        didSet { if oldValue != leadingIconSpokenLabel { applyAccessories() } }
    }

    public var trailingIconTestID: String = "" {
        didSet { if oldValue != trailingIconTestID { applyAccessories() } }
    }

    public var trailingIconSpokenLabel: String = "" {
        didSet { if oldValue != trailingIconSpokenLabel { applyAccessories() } }
    }

    // Colors; nil keeps the system color
    public var activeColor: UIColor? {
        didSet { if oldValue != activeColor { applyBorderStyle(); applyColors() } }
    }

    public var outlineColor: UIColor? {
        didSet { if oldValue != outlineColor { applyBorderStyle(); applyColors() } }
    }

    public var errorColor: UIColor? {
        didSet { if oldValue != errorColor { applyColors() } }
    }

    public var containerColor: UIColor? {
        didSet { if oldValue != containerColor { applyBorderStyle(); applyColors() } }
    }

    public var textColor: UIColor? {
        didSet { if oldValue != textColor { applyColors() } }
    }

    public var placeholderTextColor: UIColor? {
        didSet { if oldValue != placeholderTextColor { applyPlaceholder() } }
    }

    /// Cap on the Dynamic Type scale of every text; values below 1 mean no cap
    public var maxFontSizeMultiplier: CGFloat = 0 {
        didSet { if oldValue != maxFontSizeMultiplier { applyFonts(); applyAccessories() } }
    }

    /// "" | "left" | "center" | "right"
    public var textAlign: String = "" {
        didSet { if oldValue != textAlign { applyAlignment() } }
    }

    /// Multi-line height bounds in lines; 0 = unset
    public var minLines: Int = 0 {
        didSet { if oldValue != minLines { setNeedsLayout(); onNeedsRemeasure?() } }
    }

    public var maxLines: Int = 0 {
        didSet { if oldValue != maxLines { setNeedsLayout(); onNeedsRemeasure?() } }
    }

    /// A non-editable field that reports presses, as a picker's anchor
    public var pressable: Bool = false {
        didSet { if oldValue != pressable { applyEnabled() } }
    }

    private var leadingLabel: Bool { labelPlacement == "leading" && !label.isEmpty }

    /// Whether the field acts as a button: pressable and not editable
    private var actsAsButton: Bool { pressable && interactivity == "disabled" }

    /// The rounded rect drawn here instead of by UIKit, whose border can't be colored
    private var drawsBox: Bool {
        (borderStyle.isEmpty || borderStyle == "roundedRect")
            && (activeColor != nil || outlineColor != nil || containerColor != nil)
    }
    private var leadingColumnWidth: CGFloat { labelWidth > 0 ? labelWidth : 100 }
    private let leadingSpacing: CGFloat = 8

    // MARK: - Events back to ObjC++

    public var onChange: ((String, Int) -> Void)?
    public var onFocusChange: ((Bool, String) -> Void)?
    public var onSubmit: ((String) -> Void)?
    public var onSelectionChange: ((Int, Int) -> Void)?
    public var onKeyboardToolbarPress: ((String) -> Void)?
    public var onTrailingIconPress: (() -> Void)?
    public var onPress: (() -> Void)?

    /// Called when content changed in a way that affects the height (a
    /// multi-line edit, an error message appearing), so the Fabric
    /// measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Text state

    public private(set) var text: String = ""
    private var nativeEventCount = 0
    private var initialTextApplied = false
    private var autoFocusDone = false

    /// Whether a secure field is currently showing its text (password toggle)
    private var revealed = false

    /// The selection JS last heard of, so a change is reported once. Changes
    /// made from JS (text or selection) update it without an event.
    private var lastReportedSelection = NSRange(location: NSNotFound, length: 0)
    private var applyingFromJS = false

    /// The toolbar above the keyboard, while there are toolbar items
    private var keyboardToolbar: UIToolbar?
    private var toolbarGeneration = 0

    // MARK: - Subviews

    private let captionLabel = UILabel()
    private let textField = PCInputTextField()
    private let textView = PCPlaceholderTextView()
    private let footerLabel = UILabel()
    private let counterLabel = UILabel()

    private var leadingIcon = PCButtonSupport.Icon.none
    private var trailingIcon = PCButtonSupport.Icon.none
    private var leadingImage: UIImage?
    private var trailingImage: UIImage?
    private var leadingIconGeneration = 0
    private var trailingIconGeneration = 0

    // MARK: - Layout metrics

    private let captionSpacing: CGFloat = 6
    private let footerSpacing: CGFloat = 4
    private let singleLineMinHeight: CGFloat = 34
    private let textViewInsets = UIEdgeInsets(top: 7, left: 4, bottom: 7, right: 4)

    // MARK: - Init

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        captionLabel.numberOfLines = 1
        captionLabel.adjustsFontForContentSizeCategory = true

        footerLabel.numberOfLines = 0
        footerLabel.adjustsFontForContentSizeCategory = true

        counterLabel.numberOfLines = 1
        counterLabel.adjustsFontForContentSizeCategory = true
        counterLabel.textAlignment = .right
        counterLabel.setContentCompressionResistancePriority(.required, for: .horizontal)

        textField.delegate = self
        textField.borderStyle = .roundedRect
        textField.adjustsFontForContentSizeCategory = true
        textField.addTarget(self, action: #selector(fieldEditingChanged), for: .editingChanged)

        textView.delegate = self
        textView.isScrollEnabled = false
        textView.adjustsFontForContentSizeCategory = true
        textView.textContainerInset = textViewInsets
        textView.textContainer.lineFragmentPadding = 4
        textView.backgroundColor = .clear

        addSubview(captionLabel)
        addSubview(textField)
        addSubview(footerLabel)
        addSubview(counterLabel)

        // Presses of a field that acts as a button; accessory buttons keep their own
        pressRecognizer.addTarget(self, action: #selector(handlePress))
        pressRecognizer.delegate = self
        pressRecognizer.isEnabled = false
        addGestureRecognizer(pressRecognizer)
        textField.onActivate = { [weak self] in self?.activateAsButton() ?? false }
        textView.onActivate = { [weak self] in self?.activateAsButton() ?? false }

        applyFonts()
        applyColors()
        applyBorderStyle()
        applyTraits()
        applyLabel()
        applyPlaceholder()
        applyFooter()
        applyAccessories()
        applyAccessibility()
        applyAlignment()
    }

    // MARK: - Text

    /// The text the field starts with; only the first value is used (see setText).
    public func applyInitialText(_ value: String) {
        guard !initialTextApplied else { return }
        initialTextApplied = true
        setTextInternal(value, moveCursorToEnd: true)
    }

    /// A controlled value from JS. Dropped when the user has edited since
    /// `eventCount` was reported: the edit event that follows carries the
    /// text JS should reconcile against.
    public func setText(_ value: String, eventCount: Int) {
        guard eventCount >= nativeEventCount, value != text else { return }
        // Replacing text mid-composition (Japanese, Chinese keyboards) would
        // break the composition; the next edit reconciles instead
        guard activeInput.markedTextRange == nil else { return }
        setTextInternal(value, moveCursorToEnd: false)
    }

    /// Clears the text as if the user had, so JS gets a change event.
    public func clear() {
        guard !text.isEmpty else { return }
        setTextInternal("", moveCursorToEnd: true)
        reportEdit()
        lastReportedSelection = NSRange(location: NSNotFound, length: 0)
        reportSelection()
    }

    /// A selection from JS, in UTF-16 offsets clamped to the text. Dropped
    /// like a stale `setText` when the user has edited since `eventCount`.
    public func setSelection(start: Int, end: Int, eventCount: Int) {
        guard eventCount >= nativeEventCount else { return }
        guard activeInput.markedTextRange == nil else { return }
        let length = (text as NSString).length
        let from = min(max(0, start), length)
        let to = min(max(from, end), length)
        let range = NSRange(location: from, length: to - from)
        applyingFromJS = true
        if multiline {
            textView.selectedRange = range
        } else if let startPosition = textField.position(from: textField.beginningOfDocument, offset: from),
                  let endPosition = textField.position(from: startPosition, offset: to - from) {
            textField.selectedTextRange = textField.textRange(from: startPosition, to: endPosition)
        }
        applyingFromJS = false
        lastReportedSelection = currentSelection() ?? range
    }

    public func focus() {
        activeInput.becomeFirstResponder()
    }

    public func blur() {
        activeInput.resignFirstResponder()
    }

    public func setLeadingIcon(type: String, name: String, request: String, uri: String, scale: CGFloat, tinted: Bool) {
        let next = PCButtonSupport.Icon(type: type, name: name, uri: uri, scale: scale, tinted: tinted, request: request)
        guard next != leadingIcon else { return }
        leadingIcon = next
        leadingIconGeneration += 1
        let generation = leadingIconGeneration
        leadingImage = PCButtonSupport.image(for: next) { [weak self] image in
            guard let self, self.leadingIconGeneration == generation else { return }
            self.leadingImage = image
            self.applyAccessories()
        }
        applyAccessories()
    }

    public func setTrailingIcon(type: String, name: String, request: String, uri: String, scale: CGFloat, tinted: Bool) {
        let next = PCButtonSupport.Icon(type: type, name: name, uri: uri, scale: scale, tinted: tinted, request: request)
        guard next != trailingIcon else { return }
        trailingIcon = next
        trailingIconGeneration += 1
        let generation = trailingIconGeneration
        trailingImage = PCButtonSupport.image(for: next) { [weak self] image in
            guard let self, self.trailingIconGeneration == generation else { return }
            self.trailingImage = image
            self.applyAccessories()
        }
        applyAccessories()
    }

    /// Resets the text state for a recycled view.
    public func resetForRecycle() {
        blur()
        leadingIconGeneration += 1
        trailingIconGeneration += 1
        initialTextApplied = false
        autoFocusDone = false
        nativeEventCount = 0
        revealed = false
        setTextInternal("", moveCursorToEnd: true)
        lastReportedSelection = NSRange(location: NSNotFound, length: 0)
    }

    private var activeInput: UIView & UITextInput {
        multiline ? textView : textField
    }

    private func setTextInternal(_ value: String, moveCursorToEnd: Bool) {
        // The cursor moves with the text; JS knows, so there is no event
        applyingFromJS = true
        defer {
            applyingFromJS = false
            lastReportedSelection = currentSelection() ?? lastReportedSelection
        }
        if multiline {
            let wasAtEnd = textView.selectedRange.location == (textView.text as NSString).length
            let cursor = textView.selectedRange.location
            textView.text = value
            let length = (value as NSString).length
            textView.selectedRange = NSRange(location: moveCursorToEnd || wasAtEnd ? length : min(cursor, length), length: 0)
            textView.updatePlaceholderVisibility()
        } else {
            let wasAtEnd: Bool
            if let selected = textField.selectedTextRange {
                wasAtEnd = textField.compare(selected.end, to: textField.endOfDocument) == .orderedSame
            } else {
                wasAtEnd = true
            }
            let cursorOffset = textField.selectedTextRange.map {
                textField.offset(from: textField.beginningOfDocument, to: $0.start)
            } ?? 0
            textField.text = value
            let length = (value as NSString).length
            let offset = moveCursorToEnd || wasAtEnd ? length : min(cursorOffset, length)
            if let position = textField.position(from: textField.beginningOfDocument, offset: offset) {
                textField.selectedTextRange = textField.textRange(from: position, to: position)
            }
        }
        text = value
        applyFooter()
        onNeedsRemeasure?()
    }

    private func reportEdit() {
        nativeEventCount += 1
        onChange?(text, nativeEventCount)
    }

    /// The selection in UTF-16 offsets, as JS strings count them.
    private func currentSelection() -> NSRange? {
        if multiline { return textView.selectedRange }
        guard let range = textField.selectedTextRange else { return nil }
        let start = textField.offset(from: textField.beginningOfDocument, to: range.start)
        let end = textField.offset(from: textField.beginningOfDocument, to: range.end)
        return NSRange(location: start, length: max(0, end - start))
    }

    private func reportSelection() {
        guard !applyingFromJS, let selection = currentSelection(), selection != lastReportedSelection else { return }
        lastReportedSelection = selection
        onSelectionChange?(selection.location, selection.location + selection.length)
    }

    /// The return key: submits unless it inserts a newline, and blurs
    /// unless submitBehavior is "submit". Returns whether it submitted.
    private func handleReturn() -> Bool {
        let behavior = submitBehavior.isEmpty ? (multiline ? "newline" : "blurAndSubmit") : submitBehavior
        if multiline && behavior == "newline" { return false }
        onSubmit?(text)
        if behavior != "submit" { activeInput.resignFirstResponder() }
        return true
    }

    // MARK: - UITextField

    @objc private func fieldEditingChanged() {
        text = textField.text ?? ""
        applyFooter()
        reportEdit()
    }

    public func textFieldDidBeginEditing(_ field: UITextField) {
        if selectTextOnFocus {
            field.selectAll(nil)
        }
        applyColors()
        onFocusChange?(true, text)
    }

    public func textFieldDidEndEditing(_ field: UITextField) {
        applyColors()
        onFocusChange?(false, text)
    }

    public func textFieldShouldBeginEditing(_ field: UITextField) -> Bool {
        !actsAsButton
    }

    /// The clear button doesn't send .editingChanged on every iOS version;
    /// report the cleared text once UIKit has applied it, unless it did.
    public func textFieldShouldClear(_ field: UITextField) -> Bool {
        DispatchQueue.main.async { [weak self] in
            guard let self, (self.textField.text ?? "") != self.text else { return }
            self.fieldEditingChanged()
        }
        return true
    }

    public func textFieldShouldReturn(_ field: UITextField) -> Bool {
        // Single-line fields blur on submit unless submitBehavior is
        // "submit", as the core TextInput does
        _ = handleReturn()
        return true
    }

    public func textFieldDidChangeSelection(_ field: UITextField) {
        reportSelection()
    }

    public func textField(_ field: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        allowsChange(current: field.text ?? "", range: range, replacement: string, input: field)
    }

    // MARK: - Press (a field acting as a button)

    private let pressRecognizer = UITapGestureRecognizer()

    @objc private func handlePress() {
        guard actsAsButton else { return }
        // Brief highlight, as a plain UIButton gives
        activeInput.alpha = 0.5
        UIView.animate(withDuration: 0.25, delay: 0.05, options: [.allowUserInteraction]) {
            self.activeInput.alpha = 1
        }
        onPress?()
    }

    private func activateAsButton() -> Bool {
        guard actsAsButton else { return false }
        onPress?()
        return true
    }

    public func gestureRecognizer(_ recognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        // The trailing icon and the password toggle handle their own taps
        !(touch.view is PCAccessoryButton)
    }

    /// UITextField's own tap recognizers would otherwise take the tap (and
    /// then find editing refused), leaving the press unreported
    public func gestureRecognizer(
        _ recognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
    ) -> Bool {
        recognizer === pressRecognizer
    }

    // MARK: - UITextView

    public func textViewDidChange(_ view: UITextView) {
        text = view.text ?? ""
        textView.updatePlaceholderVisibility()
        applyFooter()
        reportEdit()
        onNeedsRemeasure?()
    }

    public func textViewDidBeginEditing(_ view: UITextView) {
        if selectTextOnFocus {
            view.selectAll(nil)
        }
        applyColors()
        onFocusChange?(true, text)
    }

    public func textViewDidEndEditing(_ view: UITextView) {
        applyColors()
        onFocusChange?(false, text)
    }

    public func textView(_ view: UITextView, shouldChangeTextIn range: NSRange, replacementText string: String) -> Bool {
        // Return submits instead of inserting a newline, unless submitBehavior is "newline"
        if string == "\n", view.markedTextRange == nil, handleReturn() {
            return false
        }
        return allowsChange(current: view.text ?? "", range: range, replacement: string, input: view)
    }

    public func textViewDidChangeSelection(_ view: UITextView) {
        reportSelection()
    }

    /// Enforces `maxLength` in UTF-16 units, like the core TextInput and the
    /// Android length filter, leaving IME composition alone.
    private func allowsChange(current: String, range: NSRange, replacement: String, input: UITextInput) -> Bool {
        guard maxLength > 0, input.markedTextRange == nil else { return true }
        let currentLength = (current as NSString).length
        let nextLength = currentLength - range.length + (replacement as NSString).length
        return nextLength <= maxLength
    }

    // MARK: - Props handling

    private func rebuildInput() {
        // `multiline` already has its new value in didSet, so activeInput
        // points to the replacement. Read focus and selection from the old input.
        let previousInput: UIView & UITextInput = multiline ? textField : textView
        let focused = previousInput.isFirstResponder
        let selection = previousInput.selectedTextRange.map { range in
            let start = previousInput.offset(from: previousInput.beginningOfDocument, to: range.start)
            let end = previousInput.offset(from: previousInput.beginningOfDocument, to: range.end)
            return NSRange(location: start, length: max(0, end - start))
        }
        textField.removeFromSuperview()
        textView.removeFromSuperview()
        if multiline {
            textView.text = text
            textView.updatePlaceholderVisibility()
            insertSubview(textView, at: 1)
        } else {
            textField.text = text
            insertSubview(textField, at: 1)
        }
        applyFonts()
        applyColors()
        applyBorderStyle()
        applyTraits()
        applyPlaceholder()
        applyAccessories()
        applyEnabled()
        applyAccessibility()
        applyAlignment()
        if focused { activeInput.becomeFirstResponder() }
        if let selection {
            setSelection(start: selection.location, end: NSMaxRange(selection), eventCount: nativeEventCount)
        }
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyLabel() {
        captionLabel.text = label
        captionLabel.isHidden = label.isEmpty
        applyAccessibility()
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyPlaceholder() {
        if placeholder.isEmpty {
            textField.placeholder = nil
        } else if let placeholderTextColor {
            textField.attributedPlaceholder = NSAttributedString(
                string: placeholder,
                attributes: [.foregroundColor: placeholderTextColor]
            )
        } else {
            textField.placeholder = placeholder
        }
        textView.placeholder = placeholder
        textView.placeholderLabel.textColor = placeholderTextColor ?? .placeholderText
    }

    /// Supporting text, error message and counter below the field.
    private func applyFooter() {
        let showsError = errorState == "error"
        let message = showsError && !errorText.isEmpty ? errorText : supportingText
        footerLabel.text = message
        footerLabel.isHidden = message.isEmpty

        if characterCount {
            let count = (text as NSString).length
            counterLabel.text = maxLength > 0 ? "\(count) / \(maxLength)" : "\(count)"
            counterLabel.isHidden = false
        } else {
            counterLabel.text = nil
            counterLabel.isHidden = true
        }
        applyColors()
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    /// A text style's font at the current text size, capped at
    /// `maxFontSizeMultiplier` times its size at the default text size.
    /// `base` replaces the style's own font (the `textStyle` font, given at
    /// its default-size point size), scaled along the style's curve.
    private func scaledFont(_ style: UIFont.TextStyle, base: UIFont? = nil) -> UIFont {
        let font = base ?? .preferredFont(
            forTextStyle: style,
            compatibleWith: UITraitCollection(preferredContentSizeCategory: .large)
        )
        let metrics = UIFontMetrics(forTextStyle: style)
        if maxFontSizeMultiplier >= 1 {
            return metrics.scaledFont(
                for: font,
                maximumPointSize: font.pointSize * maxFontSizeMultiplier,
                compatibleWith: traitCollection
            )
        }
        return metrics.scaledFont(for: font, compatibleWith: traitCollection)
    }

    private var inputFont: UIFont { scaledFont(.body, base: textFont) }

    private func applyFonts() {
        captionLabel.font = scaledFont(leadingLabel ? .body : .subheadline)
        footerLabel.font = scaledFont(.footnote)
        counterLabel.font = scaledFont(.footnote)
        let inputFont = self.inputFont
        textField.font = inputFont
        textView.font = inputFont
        textView.placeholderLabel.font = inputFont
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyColors() {
        let showsError = errorState == "error"
        let focused = activeInput.isFirstResponder
        let error = errorColor ?? .systemRed
        captionLabel.textColor = showsError
            ? error
            : (leadingLabel ? .label : (focused ? (activeColor ?? tintColor) : .secondaryLabel))
        footerLabel.textColor = showsError ? error : .secondaryLabel
        counterLabel.textColor = showsError && maxLength > 0 && (text as NSString).length > maxLength
            ? error
            : .secondaryLabel

        // The outline of the text view and of a field whose box is drawn here
        let outline: UIColor
        if showsError {
            outline = error
        } else if focused {
            outline = activeColor ?? outlineColor ?? .systemGray4
        } else {
            outline = outlineColor ?? .systemGray4
        }
        let resolved = outline.resolvedColor(with: traitCollection).cgColor
        textView.layer.borderColor = resolved
        textField.layer.borderColor = drawsBox ? resolved : nil

        // Cursor and selection
        textField.tintColor = activeColor
        textView.tintColor = activeColor
        textField.textColor = textColor ?? .label
        textView.textColor = textColor ?? .label
    }

    private func applyBorderStyle() {
        let style: UITextField.BorderStyle
        switch borderStyle {
        case "none": style = .none
        case "line": style = .line
        case "bezel": style = .bezel
        default: style = .roundedRect
        }
        // UIKit's rounded rect can't take colors; draw its look instead
        let drawsBox = self.drawsBox
        textField.borderStyle = drawsBox ? .none : style
        textField.layer.borderWidth = drawsBox ? 1 : 0
        textField.layer.cornerRadius = drawsBox ? 5 : 0
        textField.textInsets = drawsBox ? UIEdgeInsets(top: 0, left: 7, bottom: 0, right: 7) : .zero
        if drawsBox {
            textField.backgroundColor = containerColor ?? .systemBackground
        } else {
            textField.backgroundColor = style == .none ? containerColor : nil
        }
        // The text view mirrors the rounded-rect field
        let bordered = style != .none
        textView.layer.borderWidth = bordered ? 1 : 0
        textView.layer.cornerRadius = style == .roundedRect ? 5 : 0
        textView.backgroundColor = containerColor ?? (bordered ? .systemBackground : .clear)
        applyColors()
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyEnabled() {
        let enabled = interactivity != "disabled"
        let button = actsAsButton
        // A field acting as a button keeps its enabled look; editing is
        // refused in textFieldShouldBeginEditing and presses come from the
        // gesture recognizer
        textField.isEnabled = enabled || button
        textView.isEditable = enabled
        textView.isUserInteractionEnabled = enabled
        textView.alpha = enabled || button ? 1 : 0.5
        pressRecognizer.isEnabled = button
        if button, activeInput.isFirstResponder { blur() }
        applyAccessibility()
    }

    private func applyAccessibility() {
        let spoken = spokenLabel.isEmpty ? (label.isEmpty ? nil : label) : spokenLabel
        textField.accessibilityLabel = spoken
        textView.accessibilityLabel = spoken
        let id = inputTestID.isEmpty ? nil : inputTestID
        textField.accessibilityIdentifier = id
        textView.accessibilityIdentifier = id
        for input in [textField as UIView, textView] {
            if actsAsButton {
                input.accessibilityTraits.insert(.button)
            } else {
                input.accessibilityTraits.remove(.button)
            }
        }
    }

    private func applyAlignment() {
        let alignment: NSTextAlignment
        switch textAlign {
        case "left": alignment = .left
        case "center": alignment = .center
        case "right": alignment = .right
        default: alignment = .natural
        }
        textField.textAlignment = alignment
        textView.textAlignment = alignment
        textView.placeholderLabel.textAlignment = alignment
    }

    private func applyTraits() {
        applyTraits(to: textField)
        applyTraits(to: textView)
        // The keyboard only picks the traits up when input restarts
        if activeInput.isFirstResponder {
            activeInput.reloadInputViews()
        }
    }

    /// Both inputs get the traits: UITextField and UITextView declare the
    /// same UITextInputTraits properties, but as their own members.
    private func applyTraits(to input: UITextField) {
        input.keyboardType = PCTextFieldView.keyboardType(keyboardType)
        input.returnKeyType = PCTextFieldView.returnKeyType(returnKeyType)
        input.autocapitalizationType = PCTextFieldView.autocapitalization(autoCapitalize)
        input.autocorrectionType = autoCorrect ? .default : .no
        input.spellCheckingType = autoCorrect ? .default : .no
        input.isSecureTextEntry = secureTextEntry && !revealed
        input.textContentType = PCTextFieldView.contentType(autoComplete)
        input.keyboardAppearance = PCTextFieldView.keyboardAppearance(keyboardAppearance)
        input.passwordRules = passwordRules.isEmpty ? nil : UITextInputPasswordRules(descriptor: passwordRules)
        input.smartQuotesType = PCTextFieldView.smartQuotesType(smartQuotes)
        input.smartDashesType = PCTextFieldView.smartDashesType(smartDashes)
        input.smartInsertDeleteType = PCTextFieldView.smartInsertDeleteType(smartInsertDelete)
        if #available(iOS 17.0, *) {
            input.inlinePredictionType = PCTextFieldView.inlinePredictionType(inlinePrediction)
        }
        if #available(iOS 18.0, *) {
            input.mathExpressionCompletionType = PCTextFieldView.mathCompletionType(mathExpressionCompletion)
            input.writingToolsBehavior = PCTextFieldView.writingToolsBehavior(writingTools)
        }
    }

    private func applyTraits(to input: UITextView) {
        input.keyboardType = PCTextFieldView.keyboardType(keyboardType)
        input.returnKeyType = PCTextFieldView.returnKeyType(returnKeyType)
        input.autocapitalizationType = PCTextFieldView.autocapitalization(autoCapitalize)
        input.autocorrectionType = autoCorrect ? .default : .no
        input.spellCheckingType = autoCorrect ? .default : .no
        input.isSecureTextEntry = secureTextEntry && !revealed
        input.textContentType = PCTextFieldView.contentType(autoComplete)
        input.keyboardAppearance = PCTextFieldView.keyboardAppearance(keyboardAppearance)
        input.passwordRules = passwordRules.isEmpty ? nil : UITextInputPasswordRules(descriptor: passwordRules)
        input.smartQuotesType = PCTextFieldView.smartQuotesType(smartQuotes)
        input.smartDashesType = PCTextFieldView.smartDashesType(smartDashes)
        input.smartInsertDeleteType = PCTextFieldView.smartInsertDeleteType(smartInsertDelete)
        if #available(iOS 17.0, *) {
            input.inlinePredictionType = PCTextFieldView.inlinePredictionType(inlinePrediction)
        }
        if #available(iOS 18.0, *) {
            input.mathExpressionCompletionType = PCTextFieldView.mathCompletionType(mathExpressionCompletion)
            input.writingToolsBehavior = PCTextFieldView.writingToolsBehavior(writingTools)
        }
    }

    /// The keyboard toolbar: a `UIToolbar` as the input's
    /// `inputAccessoryView`, with the given buttons, flexible spaces and a
    /// Done button that dismisses the keyboard.
    private func applyKeyboardToolbar() {
        toolbarGeneration += 1
        if keyboardToolbarItems.isEmpty {
            keyboardToolbar = nil
        } else {
            let toolbar = keyboardToolbar ?? UIToolbar(frame: CGRect(x: 0, y: 0, width: 320, height: 44))
            toolbar.items = keyboardToolbarItems.map { toolbarItem(from: $0) }
            toolbar.sizeToFit()
            keyboardToolbar = toolbar
        }
        textField.inputAccessoryView = keyboardToolbar
        textView.inputAccessoryView = keyboardToolbar
        if activeInput.isFirstResponder {
            activeInput.reloadInputViews()
        }
    }

    private func toolbarItem(from spec: NSDictionary) -> UIBarButtonItem {
        let kind = spec["kind"] as? String ?? "button"
        if kind == "flexibleSpace" {
            return .flexibleSpace()
        }
        let itemId = spec["itemId"] as? String ?? ""
        let title = spec["title"] as? String ?? ""
        let spokenLabel = spec["accessibilityLabel"] as? String ?? ""
        let testID = spec["testID"] as? String ?? ""
        let action: UIAction
        if kind == "done" {
            action = UIAction { [weak self] _ in self?.blur() }
        } else {
            action = UIAction { [weak self] _ in self?.onKeyboardToolbarPress?(itemId) }
        }

        let item: UIBarButtonItem
        let systemItem = kind == "done" && title.isEmpty
            ? UIBarButtonItem.SystemItem.done
            : PCTextFieldView.toolbarSystemItem(spec["systemItem"] as? String ?? "")
        let icon = PCButtonSupport.Icon(dictionary: spec as? [String: Any] ?? [:])
        if let systemItem {
            item = UIBarButtonItem(systemItem: systemItem, primaryAction: action)
        } else if icon.isPresent {
            item = UIBarButtonItem(title: nil, image: nil, primaryAction: action, menu: nil)
            // The title is what VoiceOver reads for an icon button
            item.accessibilityLabel = title.isEmpty ? nil : title
            let generation = toolbarGeneration
            item.image = PCButtonSupport.image(for: icon) { [weak self, weak item] image in
                guard let self, self.toolbarGeneration == generation else { return }
                item?.image = image
            }
        } else {
            item = UIBarButtonItem(title: title, image: nil, primaryAction: action, menu: nil)
        }
        if (spec["prominent"] as? String) == "true" {
            PCTextFieldView.makeProminent(item)
        }
        if !spokenLabel.isEmpty {
            item.accessibilityLabel = spokenLabel
        }
        item.accessibilityIdentifier = testID.isEmpty ? nil : testID
        return item
    }

    /// The prominent style: tinted glass on iOS 26, bold before
    private static func makeProminent(_ item: UIBarButtonItem) {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            item.style = .prominent
            return
        }
        #endif
        item.style = .done
    }

    private static func toolbarSystemItem(_ value: String) -> UIBarButtonItem.SystemItem? {
        switch value {
        case "done": return .done
        case "cancel": return .cancel
        case "save": return .save
        case "add": return .add
        case "edit": return .edit
        case "close": return .close
        case "search": return .search
        case "compose": return .compose
        case "reply": return .reply
        case "action": return .action
        case "camera": return .camera
        case "trash": return .trash
        case "undo": return .undo
        case "redo": return .redo
        default: return nil
        }
    }

    /// Prefix and suffix labels, icons, the clear button and the password
    /// toggle. Single-line only: a text view has no accessory views.
    private func applyAccessories() {
        textField.leftView = nil
        textField.rightView = nil
        textField.leftViewMode = .never
        textField.rightViewMode = .never

        if let leading = accessoryView(
            image: leadingImage, tinted: leadingIcon.tinted, text: prefix, action: nil,
            testID: leadingIconTestID, spokenLabel: leadingIconSpokenLabel
        ) {
            textField.leftView = leading
            textField.leftViewMode = .always
        }

        let trailingAction: (() -> Void)?
        let trailingImageForSlot: UIImage?
        if trailingImage != nil {
            trailingImageForSlot = trailingImage
            trailingAction = { [weak self] in self?.onTrailingIconPress?() }
        } else if passwordToggle, secureTextEntry || revealed {
            trailingImageForSlot = UIImage(systemName: revealed ? "eye.slash" : "eye")
            trailingAction = { [weak self] in self?.toggleReveal() }
        } else {
            trailingImageForSlot = nil
            trailingAction = nil
        }
        let trailingTinted = trailingImage != nil ? trailingIcon.tinted : true
        let customTrailing = trailingImage != nil
        if let trailing = accessoryView(
            image: trailingImageForSlot, tinted: trailingTinted, text: suffix, action: trailingAction,
            testID: customTrailing ? trailingIconTestID : "",
            spokenLabel: customTrailing ? trailingIconSpokenLabel : ""
        ) {
            textField.rightView = trailing
            textField.rightViewMode = .always
        }

        // A right view takes the clear button's place, as UIKit draws them in the same slot
        switch clearButtonMode {
        case "while-editing": textField.clearButtonMode = .whileEditing
        case "unless-editing": textField.clearButtonMode = .unlessEditing
        case "always": textField.clearButtonMode = .always
        default: textField.clearButtonMode = .never
        }
        setNeedsLayout()
    }

    /// A label and/or an image button for the field's left or right slot.
    private func accessoryView(
        image: UIImage?, tinted: Bool, text: String, action: (() -> Void)?,
        testID: String, spokenLabel: String
    ) -> UIView? {
        guard image != nil || !text.isEmpty else { return nil }
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 6
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 0, left: 8, bottom: 0, right: 8)

        if let image {
            let config = UIImage.SymbolConfiguration(font: inputFont)
            if let action {
                let button = PCAccessoryButton(type: .system)
                button.setImage(image.applyingSymbolConfiguration(config) ?? image, for: .normal)
                button.tintColor = tinted ? .secondaryLabel : nil
                button.action = action
                button.accessibilityLabel = passwordToggle && trailingImage == nil
                    ? (revealed ? "Hide password" : "Show password")
                    : (spokenLabel.isEmpty ? nil : spokenLabel)
                button.accessibilityIdentifier = testID.isEmpty ? nil : testID
                stack.addArrangedSubview(button)
            } else {
                let imageView = UIImageView(image: image.applyingSymbolConfiguration(config) ?? image)
                imageView.tintColor = tinted ? .secondaryLabel : nil
                imageView.contentMode = .scaleAspectFit
                imageView.accessibilityIdentifier = testID.isEmpty ? nil : testID
                if !spokenLabel.isEmpty {
                    imageView.isAccessibilityElement = true
                    imageView.accessibilityLabel = spokenLabel
                }
                stack.addArrangedSubview(imageView)
            }
        }
        if !text.isEmpty {
            let label = UILabel()
            label.text = text
            label.font = inputFont
            label.textColor = .secondaryLabel
            label.adjustsFontForContentSizeCategory = true
            stack.addArrangedSubview(label)
        }
        stack.frame.size = stack.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
        return stack
    }

    /// Shows or hides the text of a secure field. Toggling `isSecureTextEntry`
    /// makes UIKit clear the field on the next keystroke; re-inserting the
    /// text through the text range keeps it and the caret.
    private func toggleReveal() {
        revealed.toggle()
        let current = textField.text ?? ""
        textField.isSecureTextEntry = secureTextEntry && !revealed
        if textField.isFirstResponder, let range = textField.textRange(from: textField.beginningOfDocument, to: textField.endOfDocument) {
            textField.replace(range, withText: current)
        }
        applyAccessories()
    }

    private func performAutoFocus() {
        guard !autoFocusDone else { return }
        autoFocusDone = true
        DispatchQueue.main.async { [weak self] in self?.focus() }
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil, autoFocus { performAutoFocus() }
    }

    public override func tintColorDidChange() {
        super.tintColorDidChange()
        applyColors()
    }

    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        if previousTraitCollection?.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory {
            applyFonts()
            applyAccessories()
        }
        if previousTraitCollection?.hasDifferentColorAppearance(comparedTo: traitCollection) == true {
            applyColors()
        }
    }

    // MARK: - Layout

    private struct Metrics {
        var captionHeight: CGFloat
        var inputHeight: CGFloat
        var footerHeight: CGFloat
        var leading: Bool
        /// A multi-line field past maxLines scrolls its text
        var inputScrolls: Bool
        var total: CGFloat {
            var height = leading ? max(inputHeight, captionHeight) : inputHeight
            if captionHeight > 0 && !leading { height += captionHeight + 6 }
            if footerHeight > 0 { height += footerHeight + 4 }
            return height
        }
    }

    /// The x where the field (and the footer) starts: after a leading label column
    private func fieldOffset() -> CGFloat {
        leadingLabel ? leadingColumnWidth + leadingSpacing : 0
    }

    private func metrics(for width: CGFloat) -> Metrics {
        let captionHeight = label.isEmpty ? 0 : ceil(captionLabel.font.lineHeight)
        let fieldWidth = max(1, width - fieldOffset())

        var inputHeight: CGFloat
        var inputScrolls = false
        if multiline {
            let fitted = ceil(textView.sizeThatFits(CGSize(width: fieldWidth, height: .greatestFiniteMagnitude)).height)
            inputHeight = max(singleLineMinHeight, fitted)
            let lineHeight = inputFont.lineHeight
            let chrome = textViewInsets.top + textViewInsets.bottom
            if minLines > 0 {
                inputHeight = max(inputHeight, ceil(lineHeight * CGFloat(minLines) + chrome))
            }
            if maxLines > 0 {
                let cap = max(singleLineMinHeight, ceil(lineHeight * CGFloat(maxLines) + chrome))
                inputScrolls = fitted > cap
                inputHeight = min(inputHeight, cap)
            }
        } else {
            let fitted = textField.sizeThatFits(CGSize(width: fieldWidth, height: .greatestFiniteMagnitude))
            inputHeight = max(singleLineMinHeight, ceil(fitted.height))
        }

        var footerHeight: CGFloat = 0
        if !footerLabel.isHidden || !counterLabel.isHidden {
            let counterWidth = counterLabel.isHidden
                ? 0
                : ceil(counterLabel.sizeThatFits(CGSize(width: fieldWidth, height: .greatestFiniteMagnitude)).width) + 8
            let messageWidth = max(1, fieldWidth - counterWidth)
            let messageHeight = footerLabel.isHidden
                ? 0
                : ceil(footerLabel.sizeThatFits(CGSize(width: messageWidth, height: .greatestFiniteMagnitude)).height)
            let counterHeight = counterLabel.isHidden ? 0 : ceil(counterLabel.font.lineHeight)
            footerHeight = max(messageHeight, counterHeight)
        }
        return Metrics(
            captionHeight: captionHeight,
            inputHeight: inputHeight,
            footerHeight: footerHeight,
            leading: leadingLabel,
            inputScrolls: inputScrolls
        )
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        let width = bounds.width
        let m = metrics(for: width)
        let x = fieldOffset()
        let fieldWidth = max(0, width - x)
        var y: CGFloat = 0
        if multiline, textView.isScrollEnabled != m.inputScrolls {
            textView.isScrollEnabled = m.inputScrolls
        }

        if m.leading {
            // Label column and field side by side, centred on the taller one
            let rowHeight = max(m.inputHeight, m.captionHeight)
            captionLabel.frame = CGRect(
                x: 0,
                y: (rowHeight - m.captionHeight) / 2,
                width: leadingColumnWidth,
                height: m.captionHeight
            )
            activeInput.frame = CGRect(x: x, y: (rowHeight - m.inputHeight) / 2, width: fieldWidth, height: m.inputHeight)
            y += rowHeight
        } else {
            if m.captionHeight > 0 {
                captionLabel.frame = CGRect(x: 0, y: y, width: width, height: m.captionHeight)
                y += m.captionHeight + captionSpacing
            }
            activeInput.frame = CGRect(x: 0, y: y, width: width, height: m.inputHeight)
            y += m.inputHeight
        }

        if m.footerHeight > 0 {
            y += footerSpacing
            let counterWidth = counterLabel.isHidden
                ? 0
                : ceil(counterLabel.sizeThatFits(CGSize(width: fieldWidth, height: .greatestFiniteMagnitude)).width)
            let messageWidth = max(0, fieldWidth - (counterWidth > 0 ? counterWidth + 8 : 0))
            footerLabel.frame = CGRect(x: x, y: y, width: messageWidth, height: m.footerHeight)
            counterLabel.frame = CGRect(x: width - counterWidth, y: y, width: counterWidth, height: m.footerHeight)
        }
    }

    /// Called by the measuring pipeline to get the size for Yoga layout: the
    /// height the field needs at the given width. The width is whatever Yoga
    /// offers; a text field fills its row.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let width: CGFloat
        if constrainedSize.width > 0 && constrainedSize.width < CGFloat.greatestFiniteMagnitude {
            width = constrainedSize.width
        } else if bounds.width > 0 {
            width = bounds.width
        } else {
            width = PCConstants.fallbackWidth
        }
        return CGSize(width: 0, height: ceil(metrics(for: width).total))
    }

    // MARK: - Trait mapping

    private static func keyboardType(_ value: String) -> UIKeyboardType {
        switch value {
        case "number-pad": return .numberPad
        case "decimal-pad": return .decimalPad
        case "numeric": return .decimalPad
        case "email-address": return .emailAddress
        case "phone-pad": return .phonePad
        case "url": return .URL
        case "ascii-capable": return .asciiCapable
        case "numbers-and-punctuation": return .numbersAndPunctuation
        case "name-phone-pad": return .namePhonePad
        case "twitter": return .twitter
        case "web-search": return .webSearch
        case "visible-password": return .asciiCapable
        default: return .default
        }
    }

    private static func returnKeyType(_ value: String) -> UIReturnKeyType {
        switch value {
        case "done": return .done
        case "go": return .go
        case "next": return .next
        case "search": return .search
        case "send": return .send
        default: return .default
        }
    }

    private static func autocapitalization(_ value: String) -> UITextAutocapitalizationType {
        switch value {
        case "none": return .none
        case "words": return .words
        case "characters": return .allCharacters
        default: return .sentences
        }
    }

    private static func keyboardAppearance(_ value: String) -> UIKeyboardAppearance {
        switch value {
        case "light": return .light
        case "dark": return .dark
        default: return .default
        }
    }

    /// React Native autoComplete values onto text content types, as the
    /// core TextInput maps them, plus the names it leaves out. Values with no
    /// iOS equivalent, and unknown ones, give no content type.
    private static func contentType(_ value: String) -> UITextContentType? {
        switch value {
        case "username", "username-new": return .username
        case "password", "current-password": return .password
        case "new-password", "password-new": return .newPassword
        case "one-time-code", "sms-otp", "email-otp", "2fa-app-otp": return .oneTimeCode
        case "email": return .emailAddress
        case "name": return .name
        case "given-name", "name-given": return .givenName
        case "family-name", "name-family": return .familyName
        case "additional-name", "name-middle": return .middleName
        case "honorific-prefix", "name-prefix": return .namePrefix
        case "honorific-suffix", "name-suffix": return .nameSuffix
        case "nickname": return .nickname
        case "organization": return .organizationName
        case "organization-title": return .jobTitle
        case "tel", "tel-national", "tel-device": return .telephoneNumber
        case "street-address", "postal-address": return .fullStreetAddress
        case "address-line1": return .streetAddressLine1
        case "address-line2", "postal-address-extended": return .streetAddressLine2
        case "postal-address-locality": return .addressCity
        case "postal-address-region": return .addressState
        case "postal-address-dependent-locality": return .sublocality
        case "postal-code": return .postalCode
        case "country", "postal-address-country": return .countryName
        case "cc-number": return .creditCardNumber
        case "url": return .URL
        case "flight-number": return .flightNumber
        default:
            if #available(iOS 17.0, *) { return contentType17(value) }
            return nil
        }
    }

    @available(iOS 17.0, *)
    private static func contentType17(_ value: String) -> UITextContentType? {
        switch value {
        case "cc-exp": return .creditCardExpiration
        case "cc-exp-month": return .creditCardExpirationMonth
        case "cc-exp-year": return .creditCardExpirationYear
        case "cc-csc": return .creditCardSecurityCode
        case "cc-name": return .creditCardName
        case "cc-given-name": return .creditCardGivenName
        case "cc-middle-name": return .creditCardMiddleName
        case "cc-family-name": return .creditCardFamilyName
        case "cc-type": return .creditCardType
        case "birthdate-full": return .birthdate
        case "birthdate-day": return .birthdateDay
        case "birthdate-month": return .birthdateMonth
        case "birthdate-year": return .birthdateYear
        default: return nil
        }
    }

    private static func smartQuotesType(_ value: String) -> UITextSmartQuotesType {
        switch value {
        case "yes": return .yes
        case "no": return .no
        default: return .default
        }
    }

    private static func smartDashesType(_ value: String) -> UITextSmartDashesType {
        switch value {
        case "yes": return .yes
        case "no": return .no
        default: return .default
        }
    }

    private static func smartInsertDeleteType(_ value: String) -> UITextSmartInsertDeleteType {
        switch value {
        case "yes": return .yes
        case "no": return .no
        default: return .default
        }
    }

    @available(iOS 17.0, *)
    private static func inlinePredictionType(_ value: String) -> UITextInlinePredictionType {
        switch value {
        case "yes": return .yes
        case "no": return .no
        default: return .default
        }
    }

    @available(iOS 18.0, *)
    private static func mathCompletionType(_ value: String) -> UITextMathExpressionCompletionType {
        switch value {
        case "yes": return .yes
        case "no": return .no
        default: return .default
        }
    }

    @available(iOS 18.0, *)
    private static func writingToolsBehavior(_ value: String) -> UIWritingToolsBehavior {
        switch value {
        case "complete": return .complete
        case "limited": return .limited
        case "none": return .none
        default: return .default
        }
    }
}

// MARK: - Helpers

/// The single-line input: insets for the box the field view draws, and
/// VoiceOver activation for a field acting as a button.
final class PCInputTextField: UITextField {
    var textInsets: UIEdgeInsets = .zero {
        didSet { if oldValue != textInsets { setNeedsLayout() } }
    }

    /// Returns true when it handled the activation
    var onActivate: (() -> Bool)?

    private func inset(_ rect: CGRect) -> CGRect {
        // Accessory views bring their own margins
        let left = leftView == nil ? textInsets.left : 0
        let right = rightView == nil ? textInsets.right : 0
        return rect.inset(by: UIEdgeInsets(top: textInsets.top, left: left, bottom: textInsets.bottom, right: right))
    }

    override func textRect(forBounds bounds: CGRect) -> CGRect {
        inset(super.textRect(forBounds: bounds))
    }

    override func editingRect(forBounds bounds: CGRect) -> CGRect {
        inset(super.editingRect(forBounds: bounds))
    }

    override func placeholderRect(forBounds bounds: CGRect) -> CGRect {
        inset(super.placeholderRect(forBounds: bounds))
    }

    override func accessibilityActivate() -> Bool {
        onActivate?() == true || super.accessibilityActivate()
    }
}

/// A `UITextView` with a placeholder, drawn where the text starts.
final class PCPlaceholderTextView: UITextView {
    let placeholderLabel = UILabel()

    /// Returns true when it handled the activation
    var onActivate: (() -> Bool)?

    override func accessibilityActivate() -> Bool {
        onActivate?() == true || super.accessibilityActivate()
    }

    var placeholder: String = "" {
        didSet {
            placeholderLabel.text = placeholder
            updatePlaceholderVisibility()
        }
    }

    override init(frame: CGRect, textContainer: NSTextContainer?) {
        super.init(frame: frame, textContainer: textContainer)
        placeholderLabel.textColor = .placeholderText
        placeholderLabel.numberOfLines = 0
        placeholderLabel.adjustsFontForContentSizeCategory = true
        placeholderLabel.isUserInteractionEnabled = false
        addSubview(placeholderLabel)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    func updatePlaceholderVisibility() {
        placeholderLabel.isHidden = !(text ?? "").isEmpty || placeholder.isEmpty
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let x = textContainerInset.left + textContainer.lineFragmentPadding
        let width = max(0, bounds.width - x - textContainerInset.right - textContainer.lineFragmentPadding)
        let height = placeholderLabel.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude)).height
        placeholderLabel.frame = CGRect(x: x, y: textContainerInset.top, width: width, height: height)
    }
}

/// A button with a closure action, for the accessory slots.
final class PCAccessoryButton: UIButton {
    var action: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        addTarget(self, action: #selector(pressed), for: .touchUpInside)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        addTarget(self, action: #selector(pressed), for: .touchUpInside)
    }

    @objc private func pressed() {
        action?()
    }
}
