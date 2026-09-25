import UIKit

/// A rail destination, bridged from ObjC++ as a dictionary.
struct PCNavigationRailItem {
    let label: String
    let value: String
    let disabled: Bool
    let icon: PCButtonSupport.Icon
    let selectedIcon: PCButtonSupport.Icon
    /// "" = no badge, " " = a dot, anything else is the badge text
    let badge: String
    let accessibilityLabel: String
    let testID: String
    /// "" | "search": a search destination without an icon gets the magnifying glass
    let role: String
}

/// iOS has no navigation rail (the iPad sidebar belongs to the navigation
/// controller), so this is a column of tab-style `UIButton`s: the plain
/// configuration with the image above the title, the selected one in the
/// accent color as `UITabBar` shows it, badges, and the React header above
/// them. Expanded, the image sits before the title. Selection is controlled
/// from JS; a press reports the destination and whether it was selected.
@objcMembers
public final class PCNavigationRailView: UIView {
    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries; see `rebuildItems` for keys.
    public var items: [Any] = [] { didSet { rebuildItems() } }

    /// Controlled selection by value; "" = none.
    public var selectedValue: String = "" {
        didSet { if oldValue != selectedValue { applyConfigurations() } }
    }

    /// "auto" | "labeled" | "selected" | "unlabeled"
    public var labelVisibility: String = "auto" {
        didSet { if oldValue != labelVisibility { applyConfigurations(); onNeedsRemeasure?() } }
    }

    /// "top" | "center" | "bottom"
    public var menuGravity: String = "top" {
        didSet { if oldValue != menuGravity { setNeedsLayout() } }
    }

    /// The expanded rail: the image before the title
    public var expanded: Bool = false {
        didSet { if oldValue != expanded { updateExpanded() } }
    }

    public var activeTintColor: UIColor? { didSet { applyConfigurations() } }
    public var inactiveTintColor: UIColor? { didSet { applyConfigurations() } }
    public var railColor: UIColor? { didSet { backgroundColor = railColor } }
    public var badgeBackgroundColor: UIColor? { didSet { updateBadges() } }
    public var badgeTextColor: UIColor? { didSet { updateBadges() } }

    /// Label font; nil keeps the default (caption, medium)
    public var labelFont: UIFont? {
        didSet { applyConfigurations(); onNeedsRemeasure?() }
    }

    /// The `haptics` prop; PCNavigationRail.mm plays it on a destination press
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    /// (index, value, reselected)
    public var onItemPress: ((Int, String, Bool) -> Void)?

    /// Called when the rail's natural width may have changed.
    public var onNeedsRemeasure: (() -> Void)?

    /// Where ObjC++ mounts the React header.
    public let headerContainer = PCRailHeaderContainer()

    // MARK: - Internal

    private var railItems: [PCNavigationRailItem] = []
    private var buttons: [UIButton] = []
    private var badges: [UILabel] = []
    private var images: [(normal: UIImage?, selected: UIImage?)] = []

    /// Bumped on every rebuild so late image loads can't touch stale buttons.
    private var generation = 0

    private let inset: CGFloat = 8
    private let topInset: CGFloat = 12
    private let headerSpacing: CGFloat = 20
    private let itemSpacing: CGFloat = 4

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        addSubview(headerContainer)
        headerContainer.onSizeChange = { [weak self] in
            self?.setNeedsLayout()
            self?.onNeedsRemeasure?()
        }
    }

    // MARK: - Items

    private func rebuildItems() {
        railItems = items.compactMap { any in
            guard let dict = any as? [String: Any] else { return nil }
            func icon(_ prefix: String) -> PCButtonSupport.Icon {
                let key = { (name: String) in prefix.isEmpty ? name : prefix + name.prefix(1).uppercased() + name.dropFirst() }
                let scale = (dict[key("iconScale")] as? NSNumber).map { CGFloat(truncating: $0) } ?? 1
                return PCButtonSupport.Icon(
                    type: (dict[key("iconType")] as? String) ?? "",
                    name: (dict[key("iconName")] as? String) ?? "",
                    uri: (dict[key("iconUri")] as? String) ?? "",
                    scale: scale > 0 ? scale : 1,
                    tinted: (dict[key("iconTinted")] as? String) != "false"
                )
            }
            return PCNavigationRailItem(
                label: (dict["label"] as? String) ?? "",
                value: (dict["value"] as? String) ?? "",
                disabled: (dict["disabled"] as? String) == "disabled",
                icon: icon(""),
                selectedIcon: icon("selected"),
                badge: (dict["badge"] as? String) ?? "",
                accessibilityLabel: (dict["accessibilityLabel"] as? String) ?? "",
                testID: (dict["testID"] as? String) ?? "",
                role: (dict["role"] as? String) ?? ""
            )
        }

        generation += 1
        let current = generation
        buttons.forEach { $0.removeFromSuperview() }
        buttons = []
        badges = []
        images = []

        for (index, item) in railItems.enumerated() {
            let button = UIButton(type: .system)
            button.tag = index
            button.addTarget(self, action: #selector(pressed(_:)), for: .touchUpInside)
            button.addTarget(self, action: #selector(touchedDown), for: .touchDown)
            button.accessibilityIdentifier = item.testID.isEmpty ? nil : item.testID
            let badge = UILabel()
            badge.textAlignment = .center
            badge.clipsToBounds = true
            badge.isAccessibilityElement = false
            button.addSubview(badge)
            addSubview(button)
            buttons.append(button)
            badges.append(badge)

            let icon = item.role == "search" && !item.icon.isPresent
                ? PCButtonSupport.Icon(type: "sfSymbol", name: "magnifyingglass", uri: "", scale: 1, tinted: true)
                : item.icon
            let normal = PCButtonSupport.image(for: icon) { [weak self] image in
                guard let self, self.generation == current, index < self.images.count else { return }
                self.images[index].normal = image
                self.applyConfigurations()
            }
            let selected = item.selectedIcon.isPresent
                ? PCButtonSupport.image(for: item.selectedIcon) { [weak self] image in
                    guard let self, self.generation == current, index < self.images.count else { return }
                    self.images[index].selected = image
                    self.applyConfigurations()
                }
                : nil
            images.append((normal, selected))
        }
        applyConfigurations()
        updateBadges()
        onNeedsRemeasure?()
    }

    /// Readies the haptic for the press that is likely to follow.
    @objc private func touchedDown() {
        haptics.prepare(in: self)
    }

    @objc private func pressed(_ sender: UIButton) {
        let index = sender.tag
        guard index >= 0, index < railItems.count else { return }
        let value = railItems[index].value
        onItemPress?(index, value, value == selectedValue)
    }

    // MARK: - Appearance

    private var defaultLabelFont: UIFont {
        let style: UIFont.TextStyle = expanded ? .subheadline : .caption1
        let base = UIFont.systemFont(ofSize: UIFont.preferredFont(forTextStyle: style).pointSize, weight: .medium)
        return base
    }

    /// The symbol configuration of a destination's image.
    private func symbolConfiguration(selected: Bool) -> UIImage.SymbolConfiguration {
        UIImage.SymbolConfiguration(pointSize: expanded ? 18 : 20, weight: selected ? .semibold : .regular)
    }

    /// The image a destination shows in its current state.
    private func image(for index: Int) -> UIImage? {
        let isSelected = railItems[index].value == selectedValue
        return isSelected ? (images[index].selected ?? images[index].normal) : images[index].normal
    }

    /// Expanded, the titles line up: each image gets the padding that makes
    /// up the difference to the widest one.
    private var widestImage: CGFloat {
        buttons.indices.compactMap { index -> CGFloat? in
            guard index < railItems.count, let shown = image(for: index) else { return nil }
            let selected = railItems[index].value == selectedValue
            return (shown.applyingSymbolConfiguration(symbolConfiguration(selected: selected)) ?? shown).size.width
        }.max() ?? 0
    }

    private func applyConfigurations() {
        let widest = expanded ? widestImage : 0
        for (index, button) in buttons.enumerated() where index < railItems.count {
            button.configuration = configuration(for: index, widestImage: widest)
            let item = railItems[index]
            button.isEnabled = !item.disabled
            let isSelected = item.value == selectedValue
            button.accessibilityTraits = isSelected ? [.button, .selected] : .button
            let spoken = item.accessibilityLabel.isEmpty ? item.label : item.accessibilityLabel
            button.accessibilityLabel = item.badge.isEmpty || item.badge == " " ? spoken : "\(spoken), \(item.badge)"
        }
        setNeedsLayout()
    }

    private func configuration(for index: Int, widestImage: CGFloat) -> UIButton.Configuration {
        let item = railItems[index]
        let isSelected = item.value == selectedValue
        var config = UIButton.Configuration.plain()
        let shown = image(for: index)
        let symbols = symbolConfiguration(selected: isSelected)
        config.image = shown
        config.preferredSymbolConfigurationForImage = symbols
        let showsLabel = labelVisibility != "unlabeled" && (labelVisibility != "selected" || isSelected)
        config.title = showsLabel ? item.label : nil
        config.imagePlacement = expanded ? .leading : .top
        if showsLabel, let shown {
            let width = (shown.applyingSymbolConfiguration(symbols) ?? shown).size.width
            config.imagePadding = expanded ? 12 + max(0, widestImage - width) : 4
        } else {
            config.imagePadding = 0
        }
        config.titleAlignment = expanded ? .leading : .center
        config.titleLineBreakMode = .byTruncatingTail
        config.contentInsets = expanded
            ? NSDirectionalEdgeInsets(top: 12, leading: 12, bottom: 12, trailing: 12)
            : NSDirectionalEdgeInsets(top: 8, leading: 4, bottom: 8, trailing: 4)
        // The selected destination takes the accent color, as UITabBar shows it
        config.baseForegroundColor = isSelected
            ? (activeTintColor ?? tintColor)
            : (inactiveTintColor ?? .secondaryLabel)
        let font = labelFont ?? defaultLabelFont
        config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var outgoing = incoming
            outgoing.font = font
            return outgoing
        }
        return config
    }

    public override func tintColorDidChange() {
        super.tintColorDidChange()
        applyConfigurations()
    }

    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard previousTraitCollection?.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
        else { return }
        applyConfigurations()
        onNeedsRemeasure?()
    }

    /// Badges in the system's badge colors: a count or text in a red capsule, or a dot.
    private func updateBadges() {
        for (index, badge) in badges.enumerated() where index < railItems.count {
            let text = railItems[index].badge
            badge.isHidden = text.isEmpty
            badge.text = text == " " ? nil : text
            badge.font = UIFont.systemFont(ofSize: 12, weight: .semibold)
            badge.textColor = badgeTextColor ?? .white
            badge.backgroundColor = badgeBackgroundColor ?? .systemRed
        }
        setNeedsLayout()
    }

    private func updateExpanded() {
        onNeedsRemeasure?()
        guard window != nil else {
            applyConfigurations()
            return
        }
        UIView.animate(withDuration: 0.3, delay: 0, options: [.beginFromCurrentState, .curveEaseInOut]) {
            self.applyConfigurations()
            self.layoutIfNeeded()
        }
    }

    // MARK: - Sizing

    private func fittedSize(_ button: UIButton) -> CGSize {
        let size = button.sizeThatFits(CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude))
        return CGSize(width: ceil(size.width), height: ceil(size.height))
    }

    /// The width the rail wants: its widest destination or header, and at
    /// least 80pt (200pt expanded).
    @objc public func naturalWidth() -> CGFloat {
        let buttonWidth = buttons.map { fittedSize($0).width }.max() ?? 0
        let headerWidth = headerContainer.contentSize.width
        let minimum: CGFloat = expanded ? 200 : 80
        return ceil(max(minimum, buttonWidth + inset * 2, headerWidth + inset * 2))
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        let headerSize = headerContainer.contentSize
        let hasHeader = headerSize.width > 0 && headerSize.height > 0
        // Centered over the destinations, at their leading edge when expanded
        let headerX = expanded
            ? (effectiveUserInterfaceLayoutDirection == .rightToLeft
                ? bounds.width - inset - 4 - headerSize.width
                : inset + 4)
            : (bounds.width - headerSize.width) / 2
        headerContainer.frame = CGRect(
            x: headerX,
            y: topInset,
            width: headerSize.width,
            height: headerSize.height
        )
        let regionTop = hasHeader ? headerContainer.frame.maxY + headerSpacing : topInset
        let regionBottom = bounds.height - topInset

        let buttonWidth = bounds.width - inset * 2
        let heights = buttons.map { max(expanded ? 44 : 56, fittedSize($0).height) }
        let total = heights.reduce(0, +) + itemSpacing * CGFloat(max(0, buttons.count - 1))
        // As the Material rail does it: placed in the rail's height, and
        // never above the header
        var y: CGFloat
        switch menuGravity {
        case "center": y = max(regionTop, (bounds.height - total) / 2)
        case "bottom": y = max(regionTop, regionBottom - total)
        default: y = regionTop
        }
        for (index, button) in buttons.enumerated() {
            button.frame = CGRect(x: inset, y: y, width: buttonWidth, height: heights[index])
            button.contentHorizontalAlignment = expanded ? .leading : .center
            y += heights[index] + itemSpacing
            layoutBadge(index)
        }
    }

    /// The badge at the image's top trailing corner.
    private func layoutBadge(_ index: Int) {
        let badge = badges[index]
        guard !badge.isHidden else { return }
        let button = buttons[index]
        button.layoutIfNeeded()
        let dot = badge.text == nil
        let height: CGFloat = dot ? 8 : 18
        let width = dot ? 8 : max(18, ceil(badge.intrinsicContentSize.width) + 10)
        badge.layer.cornerRadius = height / 2
        let imageFrame = button.imageView.map { button.convert($0.bounds, from: $0) } ?? .zero
        let anchorX = imageFrame.maxX
        let anchorY = imageFrame.minY
        badge.frame = CGRect(
            x: anchorX - (dot ? 4 : 8),
            y: anchorY - (dot ? 2 : 6),
            width: width,
            height: height
        )
        button.bringSubviewToFront(badge)
    }
}

/// Holds the React header, reporting when React resizes it.
@objcMembers
public final class PCRailHeaderContainer: UIView {
    var onSizeChange: (() -> Void)?
    private var observations: [ObjectIdentifier: NSKeyValueObservation] = [:]

    /// The header's size, as React laid it out.
    var contentSize: CGSize {
        subviews.reduce(CGSize.zero) { size, view in
            CGSize(width: max(size.width, view.frame.maxX), height: max(size.height, view.frame.maxY))
        }
    }

    public override func didAddSubview(_ subview: UIView) {
        super.didAddSubview(subview)
        observations[ObjectIdentifier(subview)] = subview.layer.observe(\.bounds, options: [.old, .new]) { [weak self] _, change in
            guard change.oldValue?.size != change.newValue?.size else { return }
            DispatchQueue.main.async { self?.onSizeChange?() }
        }
        onSizeChange?()
    }

    public override func willRemoveSubview(_ subview: UIView) {
        super.willRemoveSubview(subview)
        observations.removeValue(forKey: ObjectIdentifier(subview))?.invalidate()
        DispatchQueue.main.async { [weak self] in self?.onSizeChange?() }
    }
}
