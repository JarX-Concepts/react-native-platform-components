import UIKit

/// A tab bar item, bridged from ObjC++ as a dictionary.
struct PCTabBarTab {
    let label: String
    let value: String
    let disabled: Bool
    let icon: PCButtonSupport.Icon
    let selectedIcon: PCButtonSupport.Icon
    /// "" = no badge, " " = a dot, anything else is the badge text
    let badge: String
    let accessibilityLabel: String
    let testID: String
}

/// A standalone `UITabBar`: the system tab bar, icons over labels, badges and
/// the selection look of the running iOS (the Liquid Glass selection on iOS
/// 26), without a `UITabBarController`. Selection is controlled from JS; a
/// press reports the tab and whether it was already selected.
@objcMembers
public final class PCTabBarView: UIView, UITabBarDelegate {
    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries; see `rebuildItems` for keys.
    public var items: [Any] = [] { didSet { rebuildItems() } }

    /// Controlled selection by value; "" = none.
    public var selectedValue: String = "" { didSet { updateSelection() } }

    /// "auto" | "labeled" | "selected" | "unlabeled"
    public var labelVisibility: String = "auto" {
        didSet { if oldValue != labelVisibility { rebuildItems() } }
    }

    public var activeTintColor: UIColor? { didSet { applyAppearance() } }
    public var inactiveTintColor: UIColor? { didSet { applyAppearance() } }
    public var barColor: UIColor? { didSet { applyAppearance() } }
    public var badgeBackgroundColor: UIColor? { didSet { applyAppearance() } }
    public var badgeTextColor: UIColor? { didSet { applyAppearance() } }

    /// Label font; nil keeps the system font
    public var labelFont: UIFont? { didSet { applyAppearance() } }

    // MARK: - Events back to ObjC++

    /// (index, value, reselected)
    public var onTabPress: ((Int, String, Bool) -> Void)?

    /// Called when the bar's height may have changed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let tabBar = PCLayoutReportingTabBar()
    private var tabs: [PCTabBarTab] = []

    /// Bumped on every rebuild so late image loads can't touch stale items.
    private var generation = 0

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        tabBar.delegate = self
        // UIKit rebuilds the tab buttons as the bar lays out; follow every pass
        tabBar.onLayout = { [weak self] in self?.applyTestIDs() }
        // Frame layout, as UITabBarController gives its bar: the iOS 26 bar
        // lays its tabs out wrongly under Auto Layout constraints
        addSubview(tabBar)
        applyAppearance()
    }

    // MARK: - Items

    private func rebuildItems() {
        tabs = items.compactMap { any in
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
            return PCTabBarTab(
                label: (dict["label"] as? String) ?? "",
                value: (dict["value"] as? String) ?? "",
                disabled: (dict["disabled"] as? String) == "disabled",
                icon: icon(""),
                selectedIcon: icon("selected"),
                badge: (dict["badge"] as? String) ?? "",
                accessibilityLabel: (dict["accessibilityLabel"] as? String) ?? "",
                testID: (dict["testID"] as? String) ?? ""
            )
        }

        generation += 1
        let current = generation
        let unlabeled = labelVisibility == "unlabeled"

        let barItems = tabs.enumerated().map { index, tab -> UITabBarItem in
            let item = UITabBarItem(title: unlabeled ? nil : tab.label, image: nil, tag: index)
            item.image = PCTabBarView.symbol(tab.icon) ?? PCButtonSupport.image(for: tab.icon) { [weak self, weak item] image in
                guard let self, let item, self.generation == current else { return }
                item.image = image
            }
            if !tab.selectedIcon.isPresent {
                item.selectedImage = nil
            } else {
                item.selectedImage = PCTabBarView.symbol(tab.selectedIcon) ?? PCButtonSupport.image(for: tab.selectedIcon) { [weak self, weak item] image in
                    guard let self, let item, self.generation == current else { return }
                    item.selectedImage = image
                }
            }
            item.isEnabled = !tab.disabled
            item.badgeValue = tab.badge.isEmpty ? nil : (tab.badge == " " ? "" : tab.badge)
            let spoken = tab.accessibilityLabel.isEmpty ? tab.label : tab.accessibilityLabel
            item.accessibilityLabel = tab.badge.isEmpty || tab.badge == " " ? spoken : "\(spoken), \(tab.badge)"
            return item
        }
        tabBar.setItems(barItems, animated: false)
        applyAppearance()
        updateSelection()
        invalidateIntrinsicContentSize()
        onNeedsRemeasure?()
    }

    /// An SF Symbol as UIKit gives it, so the tab bar applies its own symbol
    /// configuration (size and weight for the running iOS)
    private static func symbol(_ icon: PCButtonSupport.Icon) -> UIImage? {
        guard icon.type == "sfSymbol" else { return nil }
        return UIImage(systemName: icon.name)
    }

    private func updateSelection() {
        guard let barItems = tabBar.items else { return }
        if let index = tabs.firstIndex(where: { $0.value == selectedValue }), index < barItems.count {
            tabBar.selectedItem = barItems[index]
        } else {
            tabBar.selectedItem = nil
        }
    }

    // MARK: - Appearance

    /// Colors, background and font through `UITabBarAppearance`, which covers
    /// the stacked (phone), inline and compact-inline item layouts.
    private func applyAppearance() {
        let customized = activeTintColor != nil || inactiveTintColor != nil || barColor != nil
            || badgeBackgroundColor != nil || badgeTextColor != nil || labelFont != nil
        guard customized else {
            tabBar.standardAppearance = UITabBarAppearance()
            tabBar.scrollEdgeAppearance = nil
            tabBar.tintColor = nil
            tabBar.unselectedItemTintColor = nil
            onNeedsRemeasure?()
            return
        }
        let appearance = UITabBarAppearance()
        if let barColor {
            if barColor.cgColor.alpha == 0 {
                appearance.configureWithTransparentBackground()
            } else {
                appearance.configureWithOpaqueBackground()
                appearance.backgroundColor = barColor
            }
        } else {
            appearance.configureWithDefaultBackground()
        }

        for layout in [appearance.stackedLayoutAppearance, appearance.inlineLayoutAppearance, appearance.compactInlineLayoutAppearance] {
            style(layout.normal, color: inactiveTintColor)
            style(layout.selected, color: activeTintColor)
            style(layout.disabled, color: nil)
        }

        tabBar.standardAppearance = appearance
        tabBar.scrollEdgeAppearance = appearance
        // The selected tint also drives template images and the selection
        tabBar.tintColor = activeTintColor
        tabBar.unselectedItemTintColor = inactiveTintColor
        onNeedsRemeasure?()
    }

    private func style(_ state: UITabBarItemStateAppearance, color: UIColor?) {
        var attributes: [NSAttributedString.Key: Any] = [:]
        if let color {
            state.iconColor = color
            attributes[.foregroundColor] = color
        }
        if let labelFont {
            attributes[.font] = labelFont
        }
        if !attributes.isEmpty {
            state.titleTextAttributes = attributes
        }
        if let badgeBackgroundColor {
            state.badgeBackgroundColor = badgeBackgroundColor
        }
        if let badgeTextColor {
            state.badgeTextAttributes = [.foregroundColor: badgeTextColor]
        }
    }

    // MARK: - UITabBarDelegate

    public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        let index = item.tag
        guard index >= 0, index < tabs.count else { return }
        let reselected = tabs[index].value == selectedValue
        onTabPress?(index, tabs[index].value, reselected)
        // Controlled: the selection follows selectedValue, so a press JS
        // doesn't act on leaves the previous tab selected
        DispatchQueue.main.async { [weak self] in self?.updateSelection() }
    }

    // MARK: - Sizing

    public override var intrinsicContentSize: CGSize {
        CGSize(width: UIView.noIntrinsicMetric, height: tabBar.sizeThatFits(bounds.size).height)
    }

    /// Called by the measuring pipeline: the bar fills the width it is given
    /// and takes the height UIKit wants for it at that width.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let width = constrainedSize.width > 0 ? constrainedSize.width : PCConstants.fallbackWidth
        let fitted = tabBar.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
        return CGSize(width: width, height: fitted.height)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        // Frame layout, as UITabBarController gives its bar: under Auto Layout
        // constraints the iOS 26 bar squeezes its tab labels out of view
        tabBar.frame = bounds
    }

    /// Puts each tab's testID on its tab button, the view E2E drivers find
    /// and tap. An identifier on the UITabBarItem doesn't reach every
    /// button (a badged tab's, on iOS 26). The iOS 26 bar draws each button
    /// twice, once for the glass selection and once in front; the front one
    /// takes the touches, so it gets the id.
    private func applyTestIDs() {
        guard tabs.contains(where: { !$0.testID.isEmpty }) else { return }
        var buttons: [UIView] = []
        func collect(_ view: UIView) {
            let name = NSStringFromClass(type(of: view))
            if name.hasSuffix("TabBarButton") || name.hasSuffix("_UITabButton") {
                buttons.append(view)
                return
            }
            view.subviews.forEach(collect)
        }
        collect(tabBar)
        // One button per position, the frontmost (last collected) copy
        var byPosition: [Int: UIView] = [:]
        for button in buttons {
            byPosition[Int(tabBar.convert(button.bounds, from: button).minX.rounded())] = button
        }
        buttons = Array(byPosition.values)
        buttons.sort { tabBar.convert($0.bounds, from: $0).minX < tabBar.convert($1.bounds, from: $1).minX }
        if tabBar.effectiveUserInterfaceLayoutDirection == .rightToLeft { buttons.reverse() }
        guard buttons.count == tabs.count else { return }
        for (button, tab) in zip(buttons, tabs) {
            button.accessibilityIdentifier = tab.testID.isEmpty ? nil : tab.testID
        }
    }

    public override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        // A bar at the bottom of the screen grows over the home indicator
        onNeedsRemeasure?()
    }
}

/// A UITabBar that reports its layout passes.
final class PCLayoutReportingTabBar: UITabBar {
    var onLayout: (() -> Void)?

    override func layoutSubviews() {
        super.layoutSubviews()
        onLayout?()
    }
}
