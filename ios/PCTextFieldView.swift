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
public final class PCTextFieldView: UIView, UITextFieldDelegate, UITextViewDelegate {
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

    private var leadingLabel: Bool { labelPlacement == "leading" && !label.isEmpty }
    private var leadingColumnWidth: CGFloat { labelWidth > 0 ? labelWidth : 100 }
    private let leadingSpacing: CGFloat = 8

    // MARK: - Events back to ObjC++

    public var onChange: ((String, Int) -> Void)?
    public var onFocusChange: ((Bool, String) -> Void)?
    public var onSubmit: ((String) -> Void)?
    public var onTrailingIconPress: (() -> Void)?

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

    // MARK: - Subviews

    private let captionLabel = UILabel()
    private let textField = UITextField()
    private let textView = PCPlaceholderTextView()
    private let footerLabel = UILabel()
    private let counterLabel = UILabel()

    private var leadingIcon = PCButtonSupport.Icon.none
    private var trailingIcon = PCButtonSupport.Icon.none
    private var leadingImage: UIImage?
    private var trailingImage: UIImage?
    private var iconGeneration = 0

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

        applyFonts()
        applyColors()
        applyBorderStyle()
        applyTraits()
        applyLabel()
        applyPlaceholder()
        applyFooter()
        applyAccessories()
        applyAccessibility()
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
    }

    public func focus() {
        activeInput.becomeFirstResponder()
    }

    public func blur() {
        activeInput.resignFirstResponder()
    }

    public func setLeadingIcon(type: String, name: String, uri: String, scale: CGFloat, tinted: Bool) {
        let next = PCButtonSupport.Icon(type: type, name: name, uri: uri, scale: scale, tinted: tinted)
        guard next != leadingIcon else { return }
        leadingIcon = next
        iconGeneration += 1
        let generation = iconGeneration
        leadingImage = PCButtonSupport.image(for: next) { [weak self] image in
            guard let self, self.iconGeneration == generation else { return }
            self.leadingImage = image
            self.applyAccessories()
        }
        applyAccessories()
    }

    public func setTrailingIcon(type: String, name: String, uri: String, scale: CGFloat, tinted: Bool) {
        let next = PCButtonSupport.Icon(type: type, name: name, uri: uri, scale: scale, tinted: tinted)
        guard next != trailingIcon else { return }
        trailingIcon = next
        iconGeneration += 1
        let generation = iconGeneration
        trailingImage = PCButtonSupport.image(for: next) { [weak self] image in
            guard let self, self.iconGeneration == generation else { return }
            self.trailingImage = image
            self.applyAccessories()
        }
        applyAccessories()
    }

    /// Resets the text state for a recycled view.
    public func resetForRecycle() {
        blur()
        initialTextApplied = false
        autoFocusDone = false
        nativeEventCount = 0
        revealed = false
        setTextInternal("", moveCursorToEnd: true)
    }

    private var activeInput: UIView & UITextInput {
        multiline ? textView : textField
    }

    private func setTextInternal(_ value: String, moveCursorToEnd: Bool) {
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

    public func textFieldShouldReturn(_ field: UITextField) -> Bool {
        onSubmit?(text)
        // Single-line fields blur on submit, as the core TextInput does by default
        field.resignFirstResponder()
        return true
    }

    public func textField(_ field: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        allowsChange(current: field.text ?? "", range: range, replacement: string, input: field)
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
        allowsChange(current: view.text ?? "", range: range, replacement: string, input: view)
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
        let focused = activeInput.isFirstResponder
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
        if focused { activeInput.becomeFirstResponder() }
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
        textField.placeholder = placeholder.isEmpty ? nil : placeholder
        textView.placeholder = placeholder
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

    private func applyFonts() {
        captionLabel.font = .preferredFont(forTextStyle: leadingLabel ? .body : .subheadline)
        footerLabel.font = .preferredFont(forTextStyle: .footnote)
        counterLabel.font = .preferredFont(forTextStyle: .footnote)
        let inputFont = textFont ?? .preferredFont(forTextStyle: .body)
        textField.font = inputFont
        textView.font = inputFont
        textView.placeholderLabel.font = inputFont
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyColors() {
        let showsError = errorState == "error"
        let focused = activeInput.isFirstResponder
        captionLabel.textColor = showsError
            ? .systemRed
            : (leadingLabel ? .label : (focused ? tintColor : .secondaryLabel))
        footerLabel.textColor = showsError ? .systemRed : .secondaryLabel
        counterLabel.textColor = showsError && maxLength > 0 && (text as NSString).length > maxLength
            ? .systemRed
            : .secondaryLabel
        textView.layer.borderColor = (showsError ? UIColor.systemRed : UIColor.systemGray4).cgColor
    }

    private func applyBorderStyle() {
        let style: UITextField.BorderStyle
        switch borderStyle {
        case "none": style = .none
        case "line": style = .line
        case "bezel": style = .bezel
        default: style = .roundedRect
        }
        textField.borderStyle = style
        // The text view mirrors the rounded-rect field
        let bordered = style != .none
        textView.layer.borderWidth = bordered ? 1 : 0
        textView.layer.cornerRadius = style == .roundedRect ? 5 : 0
        textView.backgroundColor = bordered ? .systemBackground : .clear
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyEnabled() {
        let enabled = interactivity != "disabled"
        textField.isEnabled = enabled
        textView.isEditable = enabled
        textView.isUserInteractionEnabled = enabled
        textView.alpha = enabled ? 1 : 0.5
    }

    private func applyAccessibility() {
        let spoken = spokenLabel.isEmpty ? (label.isEmpty ? nil : label) : spokenLabel
        textField.accessibilityLabel = spoken
        textView.accessibilityLabel = spoken
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

    /// Prefix and suffix labels, icons, the clear button and the password
    /// toggle. Single-line only: a text view has no accessory views.
    private func applyAccessories() {
        textField.leftView = nil
        textField.rightView = nil
        textField.leftViewMode = .never
        textField.rightViewMode = .never

        if let leading = accessoryView(image: leadingImage, tinted: leadingIcon.tinted, text: prefix, action: nil) {
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
        if let trailing = accessoryView(image: trailingImageForSlot, tinted: trailingTinted, text: suffix, action: trailingAction) {
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
    private func accessoryView(image: UIImage?, tinted: Bool, text: String, action: (() -> Void)?) -> UIView? {
        guard image != nil || !text.isEmpty else { return nil }
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 6
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 0, left: 8, bottom: 0, right: 8)

        if let image {
            let config = UIImage.SymbolConfiguration(textStyle: .body)
            if let action {
                let button = PCAccessoryButton(type: .system)
                button.setImage(image.applyingSymbolConfiguration(config) ?? image, for: .normal)
                button.tintColor = tinted ? .secondaryLabel : nil
                button.action = action
                button.accessibilityLabel = passwordToggle && trailingImage == nil
                    ? (revealed ? "Hide password" : "Show password")
                    : nil
                stack.addArrangedSubview(button)
            } else {
                let imageView = UIImageView(image: image.applyingSymbolConfiguration(config) ?? image)
                imageView.tintColor = tinted ? .secondaryLabel : nil
                imageView.contentMode = .scaleAspectFit
                stack.addArrangedSubview(imageView)
            }
        }
        if !text.isEmpty {
            let label = UILabel()
            label.text = text
            label.font = textFont ?? .preferredFont(forTextStyle: .body)
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

        let inputHeight: CGFloat
        if multiline {
            let fitted = textView.sizeThatFits(CGSize(width: fieldWidth, height: .greatestFiniteMagnitude))
            inputHeight = max(singleLineMinHeight, ceil(fitted.height))
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
        return Metrics(captionHeight: captionHeight, inputHeight: inputHeight, footerHeight: footerHeight, leading: leadingLabel)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        let width = bounds.width
        let m = metrics(for: width)
        let x = fieldOffset()
        let fieldWidth = max(0, width - x)
        var y: CGFloat = 0

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

    private static func contentType(_ value: String) -> UITextContentType? {
        switch value {
        case "username": return .username
        case "password": return .password
        case "new-password": return .newPassword
        case "one-time-code": return .oneTimeCode
        case "email": return .emailAddress
        case "name": return .name
        case "given-name": return .givenName
        case "family-name": return .familyName
        case "tel": return .telephoneNumber
        case "street-address": return .fullStreetAddress
        case "postal-code": return .postalCode
        case "country": return .countryName
        case "cc-number": return .creditCardNumber
        case "cc-exp":
            if #available(iOS 17.0, *) { return .creditCardExpiration }
            return nil
        case "cc-csc":
            if #available(iOS 17.0, *) { return .creditCardSecurityCode }
            return nil
        case "url": return .URL
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

/// A `UITextView` with a placeholder, drawn where the text starts.
final class PCPlaceholderTextView: UITextView {
    let placeholderLabel = UILabel()

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
