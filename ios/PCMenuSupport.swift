import UIKit

/// One menu item bridged from JS (src/menuItems.ts). The action tree arrives
/// flattened: each item points at its parent submenu or section by index.
struct PCMenuItem {
    /// Position in the flattened list
    let index: Int
    let id: String
    let title: String
    let subtitle: String
    /// Index of the parent submenu or section; -1 at the top level
    let parent: Int
    /// "action" | "menu" | "section"
    let kind: String
    let icon: PCButtonSupport.Icon
    let imageColor: String
    let destructive: Bool
    let disabled: Bool
    let keepsMenuPresented: Bool
    /// "" | "off" | "on" | "mixed"
    let state: String
    /// The item's own `haptics`; "" = the component's
    let haptics: String

    init(
        index: Int,
        id: String,
        title: String,
        subtitle: String = "",
        parent: Int = -1,
        kind: String = "action",
        icon: PCButtonSupport.Icon = .none,
        imageColor: String = "",
        destructive: Bool = false,
        disabled: Bool = false,
        keepsMenuPresented: Bool = false,
        state: String = "",
        haptics: String = ""
    ) {
        self.index = index
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.parent = parent
        self.kind = kind
        self.icon = icon
        self.imageColor = imageColor
        self.destructive = destructive
        self.disabled = disabled
        self.keepsMenuPresented = keepsMenuPresented
        self.state = state
        self.haptics = haptics
    }

    /// Reads an item bridged from ObjC++ as a dictionary (see PCMenuItems.h).
    init(index: Int, dictionary dict: [String: Any]) {
        func string(_ key: String) -> String { (dict[key] as? String) ?? "" }
        self.init(
            index: index,
            id: string("id"),
            title: string("title"),
            subtitle: string("subtitle"),
            parent: (dict["parent"] as? NSNumber)?.intValue ?? -1,
            kind: string("kind").isEmpty ? "action" : string("kind"),
            icon: PCButtonSupport.Icon(dictionary: dict),
            imageColor: string("imageColor"),
            destructive: string("destructive") == "true",
            disabled: string("disabled") == "true",
            keepsMenuPresented: string("keepsMenuPresented") == "true",
            state: string("state"),
            haptics: string("haptics")
        )
    }
}

/// Builds UIKit menus from flattened menu items: actions, submenus, inline
/// sections, subtitles, icons (SF Symbols, asset catalog names and React
/// Native image sources), attributes and states. Shared by the components
/// that show a native menu.
///
/// Must be used from the main thread.
enum PCMenuSupport {
    /// Parses the array of dictionaries ObjC++ bridges.
    static func items(from array: [Any]) -> [PCMenuItem] {
        array.enumerated().compactMap { index, any in
            guard let dict = any as? [String: Any] else { return nil }
            return PCMenuItem(index: index, dictionary: dict)
        }
    }

    /// The root menu. Its identifier is UIKit's own, different for every
    /// build; `updatedVisibleMenu` finds it through the menu it replaces.
    ///
    /// - `onImageLoaded`: called when an image icon that wasn't cached has
    ///   loaded; build the menu again then (it is cached from now on).
    /// - `handler`: called with the item when an action is performed.
    static func menu(
        title: String,
        options: UIMenu.Options = [],
        items: [PCMenuItem],
        onImageLoaded: @escaping () -> Void,
        handler: @escaping (PCMenuItem) -> Void
    ) -> UIMenu {
        UIMenu(
            title: title,
            options: options,
            children: elements(for: items, onImageLoaded: onImageLoaded, handler: handler)
        )
    }

    /// The top-level elements of the menu. Submenus and sections without
    /// children are left out.
    static func elements(
        for items: [PCMenuItem],
        onImageLoaded: @escaping () -> Void,
        handler: @escaping (PCMenuItem) -> Void
    ) -> [UIMenuElement] {
        let children = Dictionary(grouping: items, by: { $0.parent })

        func build(_ parent: Int) -> [UIMenuElement] {
            (children[parent] ?? []).compactMap { item in
                switch item.kind {
                case "menu", "section":
                    let elements = build(item.index)
                    guard !elements.isEmpty else { return nil }
                    let inline = item.kind == "section"
                    let menu = UIMenu(
                        title: item.title,
                        image: inline ? nil : image(for: item, onImageLoaded: onImageLoaded),
                        identifier: identifier(for: item),
                        options: inline ? .displayInline : [],
                        children: elements
                    )
                    if !item.subtitle.isEmpty { menu.subtitle = item.subtitle }
                    return menu
                default:
                    return action(for: item, onImageLoaded: onImageLoaded, handler: handler)
                }
            }
        }

        return build(-1)
    }

    static func action(
        for item: PCMenuItem,
        onImageLoaded: @escaping () -> Void,
        handler: @escaping (PCMenuItem) -> Void
    ) -> UIAction {
        var attributes: UIMenuElement.Attributes = []
        if item.destructive { attributes.insert(.destructive) }
        if item.disabled { attributes.insert(.disabled) }
        if item.keepsMenuPresented, #available(iOS 16.0, *) {
            attributes.insert(.keepsMenuPresented)
        }

        return UIAction(
            title: item.title,
            subtitle: item.subtitle.isEmpty ? nil : item.subtitle,
            image: image(for: item, onImageLoaded: onImageLoaded),
            attributes: attributes,
            state: state(item.state)
        ) { _ in
            handler(item)
        }
    }

    static func state(_ value: String) -> UIMenuElement.State {
        switch value {
        case "on": return .on
        case "mixed": return .mixed
        default: return .off
        }
    }

    /// Submenus are identified by their action id, so an open submenu can be
    /// found again when the menu is rebuilt (`updatedVisibleMenu`).
    static func identifier(for item: PCMenuItem) -> UIMenu.Identifier {
        UIMenu.Identifier("com.platformcomponents.menu.\(item.id)")
    }

    /// The item's icon. SF Symbol and asset catalog names resolve right away;
    /// an image source that is still loading gives nil and calls
    /// `onImageLoaded` when it arrives.
    static func image(for item: PCMenuItem, onImageLoaded: @escaping () -> Void) -> UIImage? {
        let icon = item.icon
        var image: UIImage?
        switch icon.type {
        case "sfSymbol":
            // SF Symbols are templates already; asset catalog images keep the
            // rendering mode set in the catalog.
            image = PCImageLoader.symbol(named: icon.name)
        case "image":
            image = PCButtonSupport.image(for: icon) { loaded in
                if loaded != nil { onImageLoaded() }
            }
        default:
            return nil
        }

        if let color = color(hex: item.imageColor) {
            image = image?.withTintColor(color, renderingMode: .alwaysOriginal)
        }
        return image
    }

    /// The menu in `root` that replaces the one showing, for
    /// `updateVisibleMenu`: `root` itself when the root of `oldRoot` is
    /// showing, else the submenu with the visible submenu's identifier. Falls
    /// back to the visible menu, unchanged, when it no longer exists.
    static func updatedVisibleMenu(_ visible: UIMenu, in root: UIMenu, replacing oldRoot: UIMenu? = nil) -> UIMenu {
        if let oldRoot, visible.identifier == oldRoot.identifier { return root }
        func find(_ menu: UIMenu) -> UIMenu? {
            if menu.identifier == visible.identifier { return menu }
            for case let child as UIMenu in menu.children {
                if let found = find(child) { return found }
            }
            return nil
        }
        return find(root) ?? visible
    }

    /// "#RRGGBB" or "RRGGBB"; nil for anything else.
    static func color(hex string: String) -> UIColor? {
        var hex = string.trimmingCharacters(in: .whitespacesAndNewlines)
        if hex.hasPrefix("#") { hex = String(hex.dropFirst()) }
        guard hex.count == 6, let rgb = UInt64(hex, radix: 16) else { return nil }
        return UIColor(
            red: CGFloat((rgb & 0xFF0000) >> 16) / 255,
            green: CGFloat((rgb & 0x00FF00) >> 8) / 255,
            blue: CGFloat(rgb & 0x0000FF) / 255,
            alpha: 1
        )
    }
}

/// A button that shows its `menu` as its primary action and reports when the
/// menu opens and closes, through UIControl's context menu delegate methods.
/// Used as an invisible anchor that presents a system menu over React
/// content.
final class PCMenuButton: UIButton {
    var onMenuOpen: (() -> Void)?
    /// Called once the menu has finished dismissing.
    var onMenuClose: (() -> Void)?

    private(set) var isMenuVisible = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        showsMenuAsPrimaryAction = true
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        showsMenuAsPrimaryAction = true
    }

    /// Replaces the menu. While it is open, `updatingVisibleMenu` also
    /// updates it in place (for actions that keep the menu presented); pass
    /// false when the change comes from a pick, while the menu is closing.
    func setMenu(_ newMenu: UIMenu?, updatingVisibleMenu: Bool = true) {
        let oldMenu = menu
        menu = newMenu
        guard updatingVisibleMenu, isMenuVisible, let newMenu,
              let interaction = contextMenuInteraction else { return }
        interaction.updateVisibleMenu { visible in
            PCMenuSupport.updatedVisibleMenu(visible, in: newMenu, replacing: oldMenu)
        }
    }

    /// Whether `presentMenu()` can open the menu without a touch:
    /// `UIControl.performPrimaryAction()`, iOS 17.4+.
    static var canPresentMenuProgrammatically: Bool {
        if #available(iOS 17.4, *) { return true }
        return false
    }

    /// Opens the menu without a touch. Returns false where UIKit has no public
    /// API for it (before iOS 17.4).
    @discardableResult
    func presentMenu() -> Bool {
        guard #available(iOS 17.4, *) else { return false }
        performPrimaryAction()
        return true
    }

    /// Closes the menu if it is open; a closed menu's interaction is left alone.
    func dismissMenu() {
        guard isMenuVisible else { return }
        contextMenuInteraction?.dismissMenu()
    }

    override func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willDisplayMenuFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        super.contextMenuInteraction(interaction, willDisplayMenuFor: configuration, animator: animator)
        isMenuVisible = true
        onMenuOpen?()
    }

    override func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willEndFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        super.contextMenuInteraction(interaction, willEndFor: configuration, animator: animator)
        isMenuVisible = false
        // Report after the dismissal, when a selected action has run.
        if let animator {
            animator.addCompletion { [weak self] in self?.onMenuClose?() }
        } else {
            DispatchQueue.main.async { [weak self] in self?.onMenuClose?() }
        }
    }
}
