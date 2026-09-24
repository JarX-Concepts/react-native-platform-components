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
public final class PCTabBarView: UIView, UITabBarDelegate, UITabBarControllerDelegate {
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

    /// iOS 26: "" (a standalone bar) | "automatic" | "never" | "onScrollDown"
    /// | "onScrollUp". Any value but "" hosts the bar in a UITabBarController,
    /// which minimizes it as the content scroll view scrolls.
    public var minimizeBehavior: String = "" {
        didSet { if oldValue != minimizeBehavior { configureHost() } }
    }

    /// nativeID of the ScrollView whose scrolling minimizes the bar
    public var scrollViewNativeID: String = "" {
        didSet { if oldValue != scrollViewNativeID { attachedScrollView = nil; attachScrollView() } }
    }

    // MARK: - Events back to ObjC++

    /// (index, value, reselected)
    public var onTabPress: ((Int, String, Bool) -> Void)?

    /// Called when the bar's height may have changed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let tabBar = PCLayoutReportingTabBar()

    /// The controller hosting the bar when it minimizes (iOS 26), else nil
    private var host: UITabBarController?
    private weak var attachedScrollView: UIScrollView?

    /// The bar on screen: the hosted controller's, or the standalone one
    private var activeBar: UITabBar { host?.tabBar ?? tabBar }
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
        if let host {
            // A controller's bar takes its items from view controllers
            host.setViewControllers(barItems.map { item in
                let child = UIViewController()
                child.view.backgroundColor = .clear
                child.view.isUserInteractionEnabled = false
                child.tabBarItem = item
                return child
            }, animated: false)
            attachScrollView(force: true)
        } else {
            tabBar.setItems(barItems, animated: false)
        }
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
        if let host {
            if let index = tabs.firstIndex(where: { $0.value == selectedValue }),
               index < (host.viewControllers?.count ?? 0) {
                host.selectedIndex = index
            }
            return
        }
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
            activeBar.standardAppearance = UITabBarAppearance()
            activeBar.scrollEdgeAppearance = nil
            activeBar.tintColor = nil
            activeBar.unselectedItemTintColor = nil
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

        activeBar.standardAppearance = appearance
        activeBar.scrollEdgeAppearance = appearance
        // The selected tint also drives template images and the selection
        activeBar.tintColor = activeTintColor
        activeBar.unselectedItemTintColor = inactiveTintColor
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

    // MARK: - UITabBarControllerDelegate (hosted bar)

    public func tabBarController(_ controller: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        guard let index = controller.viewControllers?.firstIndex(of: viewController), index < tabs.count else { return false }
        onTabPress?(index, tabs[index].value, tabs[index].value == selectedValue)
        // Controlled: the selection changes when selectedValue does
        return false
    }

    // MARK: - Hosting (iOS 26 minimize)

    private var wantsHost: Bool {
        guard #available(iOS 26.0, *) else { return false }
        return !minimizeBehavior.isEmpty
    }

    /// Moves the bar into a UITabBarController, or back to the standalone
    /// bar, for the current minimizeBehavior.
    private func configureHost() {
        if wantsHost {
            if host == nil {
                let controller = PCHostTabBarController()
                controller.delegate = self
                // The bar rebuilds its buttons as it minimizes and expands
                controller.onLayout = { [weak self] in
                    DispatchQueue.main.async { self?.applyTestIDs() }
                }
                controller.view.backgroundColor = .clear
                host = controller
                tabBar.removeFromSuperview()
                addSubview(controller.view)
                attachHostToParent()
                rebuildItems()
            }
            applyMinimizeBehavior()
        } else if let controller = host {
            controller.willMove(toParent: nil)
            controller.view.removeFromSuperview()
            controller.removeFromParent()
            host = nil
            addSubview(tabBar)
            rebuildItems()
        }
        setNeedsLayout()
    }

    private func applyMinimizeBehavior() {
        #if compiler(>=6.2)
        guard #available(iOS 26.0, *), let host else { return }
        switch minimizeBehavior {
        case "never": host.tabBarMinimizeBehavior = .never
        case "onScrollDown": host.tabBarMinimizeBehavior = .onScrollDown
        case "onScrollUp": host.tabBarMinimizeBehavior = .onScrollUp
        default: host.tabBarMinimizeBehavior = .automatic
        }
        #endif
    }

    /// A child view controller of the nearest view controller, so the host
    /// gets appearance and trait updates.
    private func attachHostToParent() {
        guard let host, host.parent == nil, window != nil else { return }
        var responder: UIResponder? = next
        while let current = responder, !(current is UIViewController) { responder = current.next }
        guard let parent = responder as? UIViewController else { return }
        parent.addChild(host)
        host.didMove(toParent: parent)
    }

    /// Hands the ScrollView with scrollViewNativeID to the hosted tabs as
    /// their content scroll view, which drives the minimize behavior.
    private func attachScrollView(force: Bool = false) {
        guard let host, !scrollViewNativeID.isEmpty, let window else { return }
        if !force, attachedScrollView != nil { return }
        guard let scrollView = PCTabBarView.scrollView(nativeID: scrollViewNativeID, in: window) else { return }
        attachedScrollView = scrollView
        for child in host.viewControllers ?? [] {
            child.setContentScrollView(scrollView, for: .bottom)
        }
    }

    /// The UIScrollView of the React Native view with this nativeID.
    private static func scrollView(nativeID: String, in root: UIView) -> UIScrollView? {
        var match: UIView?
        func find(_ view: UIView) {
            guard match == nil else { return }
            if view.responds(to: NSSelectorFromString("nativeId")),
               view.value(forKey: "nativeId") as? String == nativeID {
                match = view
                return
            }
            view.subviews.forEach(find)
        }
        find(root)
        guard let match else { return nil }
        if let scroll = match as? UIScrollView { return scroll }
        var scroll: UIScrollView?
        func firstScroll(_ view: UIView) {
            guard scroll == nil else { return }
            if let s = view as? UIScrollView { scroll = s; return }
            view.subviews.forEach(firstScroll)
        }
        firstScroll(match)
        return scroll
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        attachHostToParent()
        attachScrollView()
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
        // A bar given more height than it needs keeps its own height at the
        // bottom of it, as the system places its bar; stretched, UITabBar
        // spreads the icons and labels apart
        let fitted = ceil(tabBar.sizeThatFits(CGSize(width: bounds.width, height: .greatestFiniteMagnitude)).height)
        let height = min(bounds.height, fitted)
        let frame = CGRect(x: 0, y: bounds.height - height, width: bounds.width, height: height)
        tabBar.frame = frame
        host?.view.frame = frame
        // The ScrollView may mount after the bar
        attachScrollView()
        if host != nil {
            DispatchQueue.main.async { [weak self] in self?.applyTestIDs() }
        }
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
        let bar = activeBar
        collect(bar)
        // The hosted iOS 26 bar keeps a hidden button for its minimized state
        func shown(_ view: UIView) -> Bool {
            var current: UIView? = view
            while let v = current, v !== bar {
                if v.isHidden || v.alpha < 0.01 { return false }
                current = v.superview
            }
            return true
        }
        buttons = buttons.filter(shown)
        // One button per position, the frontmost (last collected) copy
        var byPosition: [Int: UIView] = [:]
        for button in buttons {
            byPosition[Int(bar.convert(button.bounds, from: button).minX.rounded())] = button
        }
        buttons = Array(byPosition.values)
        buttons.sort { bar.convert($0.bounds, from: $0).minX < bar.convert($1.bounds, from: $1).minX }
        if bar.effectiveUserInterfaceLayoutDirection == .rightToLeft { buttons.reverse() }
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

/// The tab bar controller hosting a minimizing bar, reporting its layout
/// passes (the bar lays its buttons out again as it minimizes and expands).
final class PCHostTabBarController: UITabBarController {
    var onLayout: (() -> Void)?

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        onLayout?()
    }
}
