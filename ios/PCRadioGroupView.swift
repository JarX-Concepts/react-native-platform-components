import UIKit

/// A single choice (RadioGroup). UIKit has no radio button; this is the iOS
/// list idiom (Settings, `UITableViewCell.AccessoryType.checkmark`): a list
/// of rows separated by hairlines, with a trailing `checkmark` in the tint
/// color on the chosen row. A description goes under an option's label in
/// the secondary color, and the validation message under the group in red.
///
/// Each row is one control and one VoiceOver element (see
/// `PCSelectionRow`); the group is a semantic group VoiceOver names with
/// `groupLabel`. Controlled: the rows show `value`, and a tap reports the
/// option picked.
@objcMembers
public final class PCRadioGroupView: UIView {
    private struct Option: Equatable {
        let value: String
        let label: String
        let description: String
        let disabled: Bool
        let testID: String
        let accessibilityLabel: String
    }

    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries; see `rebuild` for keys.
    public var options: [Any] = [] { didSet { rebuild() } }

    /// Value of the chosen option; empty = none
    public var value: String = "" {
        didSet { if oldValue != value { apply() } }
    }

    /// "none" | "error"
    public var errorState: String = "none" {
        didSet { if oldValue != errorState { apply() } }
    }

    /// Validation message under the group in the error state
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
            rows.forEach { $0.maxFontSizeMultiplier = maxFontSizeMultiplier }
            applyErrorFont()
            setNeedsLayout()
            onNeedsRemeasure?()
        }
    }

    /// VoiceOver's name for the group; empty = none
    public var groupLabel: String = "" {
        didSet { accessibilityLabel = groupLabel.isEmpty ? nil : groupLabel }
    }

    /// The `haptics` prop: played when the user picks an option
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    /// (index, value) of the option the user picked
    public var onChange: ((Int, String) -> Void)?

    /// Called when content changed after layout (the text size changed), so
    /// the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private var items: [Option] = []
    private var rows: [PCSelectionRow] = []
    private var separators: [UIView] = []
    private let errorLabel = UILabel()

    /// Gap between the last row and the validation message
    private static let errorSpacing: CGFloat = 6

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
        // Rows are the elements; VoiceOver announces the group's name when
        // it moves into it
        isAccessibilityElement = false
        accessibilityContainerType = .semanticGroup

        errorLabel.numberOfLines = 0
        errorLabel.textColor = .systemRed
        errorLabel.isHidden = true
        addSubview(errorLabel)
        applyErrorFont()
    }

    private var isDisabled: Bool { interactivity == "disabled" }
    private var showsError: Bool { errorState == "error" }

    // MARK: - Props handling

    private func rebuild() {
        let next: [Option] = options.compactMap { any in
            guard let dict = any as? [String: Any] else { return nil }
            return Option(
                value: (dict["value"] as? String) ?? "",
                label: (dict["label"] as? String) ?? "",
                description: (dict["description"] as? String) ?? "",
                disabled: (dict["disabled"] as? String) == "disabled",
                testID: (dict["testID"] as? String) ?? "",
                accessibilityLabel: (dict["accessibilityLabel"] as? String) ?? ""
            )
        }
        guard next != items else { return }
        items = next

        // Reuse the rows there are; a row's tap looks its option up by index
        while rows.count > items.count {
            rows.removeLast().removeFromSuperview()
        }
        while rows.count < items.count {
            let index = rows.count
            let row = PCSelectionRow()
            row.maxFontSizeMultiplier = maxFontSizeMultiplier
            row.onTouchDown = { [weak self] in
                guard let self else { return }
                self.haptics.prepare(in: self)
            }
            row.onTap = { [weak self] in self?.tapped(at: index) }
            row.onTextSizeChange = { [weak self] in self?.textSizeChanged() }
            addSubview(row)
            rows.append(row)
        }

        let separatorCount = max(0, items.count - 1)
        while separators.count > separatorCount {
            separators.removeLast().removeFromSuperview()
        }
        while separators.count < separatorCount {
            let separator = UIView()
            separator.backgroundColor = .separator
            separator.isUserInteractionEnabled = false
            insertSubview(separator, at: 0)
            separators.append(separator)
        }

        apply()
    }

    private func apply() {
        for (index, row) in rows.enumerated() where index < items.count {
            let item = items[index]
            let disabled = isDisabled || item.disabled
            let chosen = !value.isEmpty && item.value == value
            row.configure(PCSelectionRow.Model(
                title: item.label,
                detail: item.description,
                symbolName: chosen ? "checkmark" : "",
                symbolPlacement: .trailing,
                symbolColor: disabled ? .tertiaryLabel : (showsError ? .systemRed : nil),
                titleColor: disabled ? .tertiaryLabel : .label,
                detailColor: disabled ? .tertiaryLabel : .secondaryLabel,
                detailStyle: .subheadline,
                disabled: disabled
            ))
            row.accessibilityLabel = item.accessibilityLabel.isEmpty ? item.label : item.accessibilityLabel
            row.accessibilityValue = PCSelectionAccessibility.value([
                item.description,
                PCSelectionAccessibility.radioButton,
                chosen ? PCSelectionAccessibility.checked : PCSelectionAccessibility.unchecked,
            ])
            row.accessibilityTraits = disabled ? .notEnabled : []
            row.accessibilityIdentifier = item.testID.isEmpty ? nil : item.testID
        }

        let message = showsError ? errorText : ""
        errorLabel.text = message
        errorLabel.isHidden = message.isEmpty
        setNeedsLayout()
        onNeedsRemeasure?()
    }

    private func applyErrorFont() {
        let style = UIFont.TextStyle.footnote
        let base = UIFont.preferredFont(
            forTextStyle: style,
            compatibleWith: UITraitCollection(preferredContentSizeCategory: .large)
        )
        let metrics = UIFontMetrics(forTextStyle: style)
        errorLabel.font = maxFontSizeMultiplier >= 1
            ? metrics.scaledFont(for: base, maximumPointSize: base.pointSize * maxFontSizeMultiplier, compatibleWith: traitCollection)
            : metrics.scaledFont(for: base, compatibleWith: traitCollection)
    }

    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard let previousTraitCollection,
              previousTraitCollection.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
        else { return }
        applyErrorFont()
        textSizeChanged()
    }

    /// Every row reports a text size change; the group lays out and
    /// remeasures once for all of them.
    private var textSizeChangePending = false

    private func textSizeChanged() {
        guard !textSizeChangePending else { return }
        textSizeChangePending = true
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.textSizeChangePending = false
            self.setNeedsLayout()
            self.onNeedsRemeasure?()
        }
    }

    // MARK: - Taps

    private func tapped(at index: Int) {
        guard !isDisabled, index >= 0, index < items.count else { return }
        let item = items[index]
        guard !item.disabled else { return }
        // Picking the chosen option again changes nothing
        guard item.value != value else { return }
        haptics.perform(in: self)
        // The parent owns the choice; the checkmark moves once `value` does
        onChange?(index, item.value)
    }

    // MARK: - Layout

    private var hairline: CGFloat {
        1 / max(1, traitCollection.displayScale)
    }

    /// The rows' heights at `width`, and the group's height
    private func layoutHeights(width: CGFloat) -> (rows: [CGFloat], error: CGFloat, total: CGFloat) {
        let heights = rows.map { $0.height(forWidth: width) }
        var total = heights.reduce(0, +)
        var errorHeight: CGFloat = 0
        if !errorLabel.isHidden {
            errorHeight = ceil(errorLabel.sizeThatFits(
                CGSize(width: max(0, width), height: .greatestFiniteMagnitude)
            ).height)
            total += Self.errorSpacing + errorHeight
        }
        return (heights, errorHeight, total)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        let width = bounds.width
        let (heights, errorHeight, _) = layoutHeights(width: width)
        var y: CGFloat = 0
        for (index, row) in rows.enumerated() {
            let height = index < heights.count ? heights[index] : 0
            row.frame = CGRect(x: 0, y: y, width: width, height: height)
            y += height
            if index < separators.count {
                // The hairline sits on the bottom edge of the row, as in a list
                separators[index].frame = CGRect(x: 0, y: y - hairline, width: width, height: hairline)
            }
        }
        if !errorLabel.isHidden {
            errorLabel.frame = CGRect(x: 0, y: y + Self.errorSpacing, width: width, height: errorHeight)
            errorLabel.textAlignment = .natural
        }
    }

    /// The widest option on one line
    private func naturalWidth() -> CGFloat {
        var width = rows.map { $0.naturalWidth() }.max() ?? 0
        if !errorLabel.isHidden {
            width = max(width, ceil(errorLabel.sizeThatFits(
                CGSize(width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude)
            ).width))
        }
        return width
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        sizeForLayout(withConstrainedTo: size)
    }

    /// Called by the measuring pipeline to get the size for Yoga layout: the
    /// width of the widest option on one line (Yoga clamps it to the space
    /// there is), and the height at the given width.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let natural = naturalWidth()
        let width = constrainedSize.width > 0 ? min(constrainedSize.width, natural) : natural
        return CGSize(width: natural, height: ceil(layoutHeights(width: width).total))
    }
}
