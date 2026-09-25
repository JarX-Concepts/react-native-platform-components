import UIKit

/// A row of native buttons (`UIButton` with configurations), with optional
/// single / multiple selection shown through the buttons' selected state.
@objcMembers
public final class PCButtonGroupView: UIView {
    private struct Item {
        let label: String
        let value: String
        let disabled: Bool
        let icon: PCButtonSupport.Icon
        let accessibilityLabel: String

        /// What VoiceOver announces for the button.
        var spokenLabel: String { accessibilityLabel.isEmpty ? label : accessibilityLabel }
    }

    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries; see `rebuild` for keys.
    public var buttons: [Any] = [] { didSet { rebuild() } }

    /// "filled" | "tonal" | "outlined" | "text" | "elevated"
    public var variant: String = "outlined" {
        didSet { if oldValue != variant { applyConfigurations() } }
    }

    /// "xsmall" | "small" | "medium" | "large" | "xlarge"
    public var size: String = "small" {
        didSet { if oldValue != size { applyConfigurations() } }
    }

    /// "" (UIKit default) | "round" | "square"
    public var shape: String = "" {
        didSet { if oldValue != shape { applyConfigurations() } }
    }

    /// Connected groups sit closer together (a hairline gap)
    public var connected: Bool = false {
        didSet { if oldValue != connected { applyLayout() } }
    }

    /// Gap between buttons in points; negative means the default
    public var spacing: CGFloat = -1 {
        didSet { if oldValue != spacing { applyLayout() } }
    }

    /// "none" | "single" | "multiple"
    public var selection: String = "none" {
        didSet { if oldValue != selection { applyConfigurations() } }
    }

    /// Controlled selection by value
    public var selectedValues: [String] = [] {
        didSet { if oldValue != selectedValues { applyConfigurations() } }
    }

    /// Whether at least one button must stay selected
    public var selectionRequired: Bool = false

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { updateEnabled() }
    }

    /// Container color; nil keeps the configuration's color
    public var containerColor: UIColor? {
        didSet { applyConfigurations() }
    }

    /// Label and icon color; nil keeps the configuration's color
    public var foregroundColor: UIColor? {
        didSet { applyConfigurations() }
    }

    /// Label font; nil keeps the configuration's font
    public var labelFont: UIFont? {
        didSet { applyConfigurations() }
    }

    /// The `haptics` prop; PCButtonGroup.mm plays it on a press
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onPress: ((Int, String) -> Void)? // (index, value)
    public var onSelectionChange: (([String]) -> Void)?

    /// Called when content changed after layout (an icon finished loading),
    /// so the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let stack = UIStackView()
    private var items: [Item] = []
    private var uiButtons: [UIButton] = []
    private var iconImages: [UIImage?] = []

    /// Bumped on every rebuild so late image loads can't touch stale buttons.
    private var rebuildGeneration = 0

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
        stack.axis = .horizontal
        stack.alignment = .fill
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])

        applyLayout()
    }

    // MARK: - Props handling

    private func rebuild() {
        items = buttons.compactMap { any in
            guard let dict = any as? [String: Any] else { return nil }
            return Item(
                label: (dict["label"] as? String) ?? "",
                value: (dict["value"] as? String) ?? "",
                disabled: (dict["disabled"] as? String) == "disabled",
                icon: PCButtonSupport.Icon(dictionary: dict),
                accessibilityLabel: (dict["accessibilityLabel"] as? String) ?? ""
            )
        }

        rebuildGeneration += 1
        let generation = rebuildGeneration

        uiButtons.forEach { $0.removeFromSuperview() }
        uiButtons = []
        iconImages = Array(repeating: nil, count: items.count)

        for (index, item) in items.enumerated() {
            let button = UIButton(type: .system)
            button.tag = index
            button.addTarget(self, action: #selector(tapped(_:)), for: .touchUpInside)
            button.addTarget(self, action: #selector(touchedDown), for: .touchDown)
            stack.addArrangedSubview(button)
            uiButtons.append(button)

            iconImages[index] = PCButtonSupport.image(for: item.icon) { [weak self] image in
                guard let self, self.rebuildGeneration == generation, index < self.iconImages.count else { return }
                self.iconImages[index] = image
                self.applyConfigurations()
                self.onNeedsRemeasure?()
            }
        }

        applyConfigurations()
        updateEnabled()
    }

    private func applyLayout() {
        stack.spacing = spacing >= 0 ? spacing : (connected ? 2 : 8)
        // Buttons size to their content; extra or missing width is shared in
        // proportion when the group is stretched or squeezed.
        stack.distribution = .fillProportionally
        invalidateIntrinsicContentSize()
    }

    private func applyConfigurations() {
        for (index, button) in uiButtons.enumerated() where index < items.count {
            let item = items[index]
            let selected = selection != "none" && selectedValues.contains(item.value)
            button.isSelected = selected
            button.configuration = PCButtonSupport.makeConfiguration(
                variant: variant,
                selected: selected,
                size: size,
                shape: shape,
                label: item.label,
                image: iconImages[index],
                containerColor: containerColor,
                foregroundColor: foregroundColor,
                font: labelFont
            )
            button.accessibilityLabel = item.spokenLabel.isEmpty ? nil : item.spokenLabel
        }
        invalidateIntrinsicContentSize()
    }

    private func updateEnabled() {
        let enabled = interactivity != "disabled"
        alpha = enabled ? 1.0 : 0.5
        for (index, button) in uiButtons.enumerated() where index < items.count {
            button.isEnabled = enabled && !items[index].disabled
        }
    }

    // MARK: - Selection

    /// Readies the haptic for the press that is likely to follow.
    @objc private func touchedDown() {
        haptics.prepare(in: self)
    }

    @objc private func tapped(_ sender: UIButton) {
        let index = sender.tag
        guard index >= 0, index < items.count else { return }
        let item = items[index]
        onPress?(index, item.value)

        guard selection != "none", let next = nextSelection(tapping: item.value) else { return }
        selectedValues = next
        onSelectionChange?(next)
    }

    /// The selection after a tap, or nil when the tap changes nothing.
    private func nextSelection(tapping value: String) -> [String]? {
        let isSelected = selectedValues.contains(value)
        if selection == "single" {
            if isSelected {
                return selectionRequired ? nil : []
            }
            return [value]
        }

        // multiple
        if isSelected {
            if selectionRequired && selectedValues.count == 1 { return nil }
            return selectedValues.filter { $0 != value }
        }
        var chosen = Set(selectedValues)
        chosen.insert(value)
        // Report in button order
        return items.map(\.value).filter { chosen.contains($0) }
    }

    // MARK: - Sizing

    public override var intrinsicContentSize: CGSize {
        stack.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        stack.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
    }

    /// Called by the measuring pipeline to get the size for Yoga layout.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let fitted = stack.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
        return CGSize(width: ceil(fitted.width), height: ceil(fitted.height))
    }
}
