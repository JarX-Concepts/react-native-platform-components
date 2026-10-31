import UIKit

/// A checkbox (Checkbox). UIKit has none; this is the iOS list idiom: a row
/// with a leading `circle` that fills into `checkmark.circle.fill` in the
/// tint color when checked (`minus.circle.fill` when indeterminate), and a
/// label that wraps. In the error state the symbol turns red and the
/// message sits under the label. The whole row is one control and one
/// VoiceOver element (see `PCSelectionRow`).
///
/// Controlled: the row shows `checked`, and a tap reports the state it asks
/// for.
@objcMembers
public final class PCCheckboxView: UIView {
    // MARK: - Props (set from ObjC++)

    /// "true" | "false" | "indeterminate"
    public var checked: String = "false" {
        didSet { if oldValue != checked { apply() } }
    }

    public var label: String = "" {
        didSet { if oldValue != label { apply() } }
    }

    /// "none" | "error"
    public var errorState: String = "none" {
        didSet { if oldValue != errorState { apply() } }
    }

    /// Message under the label in the error state
    public var errorText: String = "" {
        didSet { if oldValue != errorText { apply() } }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { if oldValue != interactivity { apply() } }
    }

    public var maxFontSizeMultiplier: CGFloat = 0 {
        didSet {
            guard oldValue != maxFontSizeMultiplier else { return }
            row.maxFontSizeMultiplier = maxFontSizeMultiplier
            onNeedsRemeasure?()
        }
    }

    /// What VoiceOver announces; empty = the label
    public var spokenLabel: String = "" {
        didSet { if oldValue != spokenLabel { applyAccessibility() } }
    }

    /// The test identifier, on the row (the element with the label and the
    /// touches) rather than the host view
    public var testID: String = "" {
        didSet { row.accessibilityIdentifier = testID.isEmpty ? nil : testID }
    }

    /// The `haptics` prop: played when the user toggles the checkbox
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    /// Called with the state the user asked for
    public var onToggle: ((Bool) -> Void)?

    /// Called when content changed after layout (the text size changed), so
    /// the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let row = PCSelectionRow()

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        clipsToBounds = false
        row.onTouchDown = { [weak self] in
            guard let self else { return }
            self.haptics.prepare(in: self)
        }
        row.onTap = { [weak self] in self?.tapped() }
        row.onTextSizeChange = { [weak self] in
            self?.setNeedsLayout()
            self?.onNeedsRemeasure?()
        }
        addSubview(row)
        apply()
    }

    private var isDisabled: Bool { interactivity == "disabled" }
    private var showsError: Bool { errorState == "error" }

    private func apply() {
        let symbolName: String
        switch checked {
        case "true": symbolName = "checkmark.circle.fill"
        case "indeterminate": symbolName = "minus.circle.fill"
        default: symbolName = "circle"
        }

        let symbolColor: UIColor?
        if isDisabled {
            symbolColor = .tertiaryLabel
        } else if showsError {
            symbolColor = .systemRed
        } else if checked == "false" {
            // An empty circle is drawn in gray, as in Reminders
            symbolColor = .tertiaryLabel
        } else {
            symbolColor = nil // the tint color
        }

        row.configure(PCSelectionRow.Model(
            title: label,
            detail: showsError ? errorText : "",
            symbolName: symbolName,
            symbolPlacement: .leading,
            symbolColor: symbolColor,
            titleColor: isDisabled ? .tertiaryLabel : .label,
            detailColor: .systemRed,
            detailStyle: .footnote,
            disabled: isDisabled
        ))
        applyAccessibility()
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyAccessibility() {
        row.accessibilityLabel = spokenLabel.isEmpty ? label : spokenLabel
        let state: String
        switch checked {
        case "true": state = PCSelectionAccessibility.checked
        case "indeterminate": state = PCSelectionAccessibility.mixed
        default: state = PCSelectionAccessibility.unchecked
        }
        // The error message is read with the checkbox, after its state
        row.accessibilityValue = PCSelectionAccessibility.value([
            PCSelectionAccessibility.checkbox,
            state,
            showsError ? errorText : "",
        ])
        row.accessibilityTraits = isDisabled ? .notEnabled : []
    }

    private func tapped() {
        guard !isDisabled else { return }
        haptics.perform(in: self)
        // From indeterminate a tap checks, as Material and the web do
        onToggle?(checked != "true")
    }

    // MARK: - Layout

    public override func layoutSubviews() {
        super.layoutSubviews()
        row.frame = bounds
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        sizeForLayout(withConstrainedTo: size)
    }

    /// Called by the measuring pipeline to get the size for Yoga layout: the
    /// width of the box and the label on one line (Yoga clamps it to the
    /// space there is), and the height at the given width.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let natural = row.naturalWidth()
        let width = constrainedSize.width > 0 ? min(constrainedSize.width, natural) : natural
        return CGSize(width: natural, height: ceil(row.height(forWidth: width)))
    }
}
