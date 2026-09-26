import UIKit

/// A row of native buttons (`UIButton` with configurations), with optional
/// single / multiple selection shown through the buttons' selected state.
/// Buttons that don't fit can fold into a "…" button with a `UIMenu`
/// (overflow "menu"). In split mode the row is one button joined to a
/// chevron button that opens a `UIMenu` (SplitButton).
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

    /// "none" | "menu" | "wrap" (Android only; the same as "none" here)
    public var overflow: String = "none" {
        didSet {
            guard oldValue != overflow else { return }
            overflowDirty = true
            invalidateIntrinsicContentSize()
            setNeedsLayout()
        }
    }

    /// Split mode: the first button joined to a chevron button with `menu`.
    public var split: Bool = false {
        didSet { if oldValue != split { rebuild() } }
    }

    /// ObjC++ sets this as an array of dictionaries: the split button's
    /// flattened menu items
    public var menuItems: [Any] = [] {
        didSet {
            splitItems = PCMenuSupport.items(from: menuItems)
            updateSplitMenu()
        }
    }

    /// What VoiceOver announces for the split button's chevron.
    public var menuAccessibilityLabel: String = "" {
        didSet { chevronButton?.accessibilityLabel = menuAccessibilityLabel.isEmpty ? nil : menuAccessibilityLabel }
    }

    /// The `haptics` prop: PCButtonGroup.mm plays it on a press (an overflow
    /// pick included), the split menu handler on a pick
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onPress: ((Int, String) -> Void)? // (index, value)
    public var onSelectionChange: (([String]) -> Void)?
    public var onMenuSelect: ((String, String) -> Void)? // (id, title)
    public var onMenuOpen: (() -> Void)?
    public var onMenuClose: (() -> Void)?

    /// Called when content changed after layout (an icon finished loading),
    /// so the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let stack = UIStackView()
    private var items: [Item] = []
    private var uiButtons: [UIButton] = []
    private var iconImages: [UIImage?] = []

    /// Split mode: the chevron button after the button, and its menu items.
    private var chevronButton: PCMenuButton?
    private var splitItems: [PCMenuItem] = []
    private let splitMenuImages = PCMenuImageState()
    private let overflowMenuImages = PCMenuImageState()

    /// Overflow "menu": the "…" button that holds the buttons that don't
    /// fit (made the first time it is needed), and how many buttons are
    /// showing (all of them when nil).
    private var overflowButton: PCMenuButton?
    private var visibleCount: Int?
    /// Set when the buttons changed, so the next layout folds them again.
    private var overflowDirty = true

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
        chevronButton?.removeFromSuperview()
        chevronButton = nil
        visibleCount = nil
        overflowButton?.isHidden = true
        overflowDirty = true
        // A split button is one button and its chevron
        if split && items.count > 1 { items = Array(items.prefix(1)) }
        overflowMenuImages.retain(icons: items.map(\.icon))
        iconImages = Array(repeating: nil, count: items.count)

        for (index, item) in items.enumerated() {
            let button = UIButton(type: .system)
            button.tag = index
            button.addTarget(self, action: #selector(tapped(_:)), for: .touchUpInside)
            button.addTarget(self, action: #selector(touchedDown), for: .touchDown)
            // Before the overflow button, which stays last
            stack.insertArrangedSubview(button, at: index)
            uiButtons.append(button)

            iconImages[index] = PCButtonSupport.image(for: item.icon) { [weak self] image in
                guard let self, self.rebuildGeneration == generation, index < self.iconImages.count else { return }
                self.iconImages[index] = image
                self.applyConfigurations()
                self.onNeedsRemeasure?()
            }
        }

        if split {
            let chevron = PCMenuButton(type: .system)
            chevron.accessibilityLabel = menuAccessibilityLabel.isEmpty ? nil : menuAccessibilityLabel
            chevron.onMenuOpen = { [weak self] in self?.onMenuOpen?() }
            chevron.onMenuClose = { [weak self] in self?.onMenuClose?() }
            stack.insertArrangedSubview(chevron, at: items.count)
            chevronButton = chevron
            updateSplitMenu()
        }

        applyConfigurations()
        updateEnabled()
        setNeedsLayout()
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
        if let chevron = chevronButton { configureSymbolButton(chevron, symbol: "chevron.down") }
        if let more = overflowButton { configureSymbolButton(more, symbol: "ellipsis") }
        overflowDirty = true
        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    private func updateEnabled() {
        let enabled = interactivity != "disabled"
        alpha = enabled ? 1.0 : 0.5
        for (index, button) in uiButtons.enumerated() where index < items.count {
            button.isEnabled = enabled && !items[index].disabled
        }
        chevronButton?.isEnabled = enabled
        overflowButton?.isEnabled = enabled
        updateOverflowMenu()
    }

    /// The chevron and "…" buttons take the variant of the buttons.
    private func configureSymbolButton(_ button: UIButton, symbol: String) {
        button.configuration = PCButtonSupport.makeConfiguration(
            variant: variant,
            selected: false,
            size: size,
            shape: shape,
            label: "",
            image: UIImage(systemName: symbol),
            containerColor: containerColor,
            foregroundColor: foregroundColor,
            font: labelFont
        )
    }

    // MARK: - Split menu

    private func updateSplitMenu() {
        splitMenuImages.retain(icons: splitItems.map(\.icon))
        guard let chevron = chevronButton else { return }
        chevron.setMenu(splitItems.isEmpty ? nil : PCMenuSupport.menu(
            title: "",
            items: splitItems,
            imageState: splitMenuImages,
            onImageLoaded: { [weak self] in self?.updateSplitMenu() },
            handler: { [weak self] item in
                guard let self else { return }
                self.haptics.perform(in: self, override: item.haptics)
                self.onMenuSelect?(item.id, item.title)
            }
        ))
    }

    // MARK: - Overflow

    /// Folds the trailing buttons that don't fit into the "…" button, which
    /// takes their place at the end of the row.
    public override func layoutSubviews() {
        updateOverflow()
        super.layoutSubviews()
    }

    private func updateOverflow() {
        let count: Int? = overflow == "menu" && !split && bounds.width > 0 ? fittingCount() : nil
        guard overflowDirty || count != visibleCount else { return }
        overflowDirty = false
        visibleCount = count
        for (index, button) in uiButtons.enumerated() {
            button.isHidden = count.map { index >= $0 } ?? false
        }
        if count != nil {
            makeOverflowButton().isHidden = false
        } else {
            overflowButton?.isHidden = true
        }
        updateOverflowMenu()
    }

    /// The "…" button, at the end of the row. The ellipsis symbol reads as
    /// "More" in VoiceOver.
    private func makeOverflowButton() -> PCMenuButton {
        if let button = overflowButton { return button }
        let button = PCMenuButton(type: .system)
        button.isHidden = true
        button.isEnabled = interactivity != "disabled"
        configureSymbolButton(button, symbol: "ellipsis")
        stack.addArrangedSubview(button)
        overflowButton = button
        return button
    }

    /// How many buttons fit before the "…" button, or nil when all of them
    /// fit.
    private func fittingCount() -> Int? {
        let widths = uiButtons.map { $0.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize).width }
        let gap = stack.spacing
        let all = widths.reduce(0, +) + gap * CGFloat(max(widths.count - 1, 0))
        guard all > bounds.width + 0.5 else { return nil }
        var used = makeOverflowButton().systemLayoutSizeFitting(UIView.layoutFittingCompressedSize).width
        var count = 0
        for width in widths {
            guard used + gap + width <= bounds.width + 0.5 else { break }
            used += gap + width
            count += 1
        }
        return count
    }

    /// The "…" button's menu: the hidden buttons, with their icons, disabled
    /// state and selection checkmark. A pick acts like a press.
    private func updateOverflowMenu() {
        guard let overflowButton else { return }
        guard let count = visibleCount else {
            overflowMenuImages.retain(icons: [])
            overflowButton.setMenu(nil)
            return
        }
        let enabled = interactivity != "disabled"
        let hidden = items.enumerated().dropFirst(count).map { index, item in
            PCMenuItem(
                index: index,
                id: item.value,
                title: item.label.isEmpty ? item.accessibilityLabel : item.label,
                icon: item.icon,
                disabled: !enabled || item.disabled,
                state: selection != "none" && selectedValues.contains(item.value) ? "on" : ""
            )
        }
        overflowButton.setMenu(PCMenuSupport.menu(
            title: "",
            items: hidden,
            imageState: overflowMenuImages,
            onImageLoaded: { [weak self] in self?.updateOverflowMenu() },
            handler: { [weak self] item in self?.press(at: item.index) }
        ))
    }

    // MARK: - Selection

    /// Readies the haptic for the press that is likely to follow.
    @objc private func touchedDown() {
        haptics.prepare(in: self)
    }

    @objc private func tapped(_ sender: UIButton) {
        press(at: sender.tag)
    }

    /// A press on a button, or a pick of its overflow menu item.
    private func press(at index: Int) {
        guard index >= 0, index < items.count else { return }
        let item = items[index]
        onPress?(index, item.value)

        guard selection != "none", let next = nextSelection(tapping: item.value) else { return }
        // The parent owns selection. A rejected change must leave the
        // existing buttons (and overflow checkmarks) selected.
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

    /// The row with every button showing: an overflowing group reports its
    /// full width, and Yoga clamps it to the space there is.
    private func naturalSize() -> CGSize {
        guard visibleCount != nil else {
            return stack.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
        }
        let sizes = uiButtons.map { $0.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize) }
        let width = sizes.map(\.width).reduce(0, +) + stack.spacing * CGFloat(max(sizes.count - 1, 0))
        return CGSize(width: width, height: sizes.map(\.height).max() ?? 0)
    }

    public override var intrinsicContentSize: CGSize {
        naturalSize()
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        naturalSize()
    }

    /// Called by the measuring pipeline to get the size for Yoga layout.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let fitted = naturalSize()
        return CGSize(width: ceil(fitted.width), height: ceil(fitted.height))
    }
}
