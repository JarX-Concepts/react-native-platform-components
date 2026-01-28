import os.log
import UIKit

private let logger = Logger(subsystem: "com.platformcomponents", category: "ContextMenu")

// MARK: - Action model (bridged from ObjC++ as dictionaries)

struct PCContextMenuAction {
    let id: String
    let title: String
    let subtitle: String?
    let image: String?
    let imageColor: String?
    let destructive: Bool
    let disabled: Bool
    let hidden: Bool
    let state: String? // "off" | "on" | "mixed"
    let subactions: [PCContextMenuAction]

    init(from dict: [String: Any]) {
        self.id = (dict["id"] as? String) ?? ""
        self.title = (dict["title"] as? String) ?? ""
        self.subtitle = dict["subtitle"] as? String
        self.image = dict["image"] as? String
        self.imageColor = dict["imageColor"] as? String

        // Parse attributes
        if let attrs = dict["attributes"] as? [String: Any] {
            self.destructive = (attrs["destructive"] as? String) == "true"
            self.disabled = (attrs["disabled"] as? String) == "true"
            self.hidden = (attrs["hidden"] as? String) == "true"
        } else {
            self.destructive = false
            self.disabled = false
            self.hidden = false
        }

        self.state = dict["state"] as? String

        // Parse subactions recursively
        if let subs = dict["subactions"] as? [[String: Any]] {
            self.subactions = subs.map { PCContextMenuAction(from: $0) }
        } else {
            self.subactions = []
        }
    }
}

// MARK: - Main View

@objcMembers
public final class PCContextMenuView: UIView, UIContextMenuInteractionDelegate {
    // MARK: - Props (set from ObjC++)

    /// Menu title (shown as header on iOS)
    public var menuTitle: String? { didSet { sync() } }

    /// ObjC++ sets this as an array of dictionaries
    public var actions: [Any] = [] { didSet { sync() } }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet {
            updateEnabled()
            sync()
        }
    }

    /// "longPress" | "tap"
    public var trigger: String = "longPress" { didSet { updateTrigger() } }

    /// iOS-specific: enable preview
    public var enablePreview: String = "false"

    // MARK: - Events back to ObjC++

    public var onPressAction: ((String, String) -> Void)?  // (id, title)
    public var onMenuOpen: (() -> Void)?
    public var onMenuClose: (() -> Void)?

    // MARK: - Internal

    private var contextMenuInteraction: UIContextMenuInteraction?
    private var parsedActions: [PCContextMenuAction] {
        (actions as? [[String: Any]])?.map { PCContextMenuAction(from: $0) } ?? []
    }

    // Tap mode: UIButton with UIMenu for tap-to-show
    private var tapMenuButton: UIButton?

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
        backgroundColor = .clear
        updateEnabled()
        updateTrigger()
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        // Ensure tap button stays on top of React Native children
        if let button = tapMenuButton {
            bringSubviewToFront(button)
        }
    }

    private func updateEnabled() {
        let disabled = (interactivity == "disabled")
        alpha = disabled ? 0.5 : 1.0
        isUserInteractionEnabled = !disabled
        accessibilityTraits = disabled ? [.notEnabled] : []
    }

    private func sync() {
        // Re-setup trigger mode if needed
        updateTrigger()
        // Update tap menu content if in tap mode
        if trigger == "tap" {
            updateTapMenuButton()
        }
    }

    // MARK: - Trigger Mode

    private func updateTrigger() {
        if trigger == "longPress" {
            // Install context menu interaction for long-press
            installContextMenuInteraction()
            removeTapMenuButton()
        } else {
            // Tap mode: use UIButton with UIMenu for tap-to-show
            removeContextMenuInteraction()
            installTapMenuButton()
        }
    }

    private func installContextMenuInteraction() {
        guard contextMenuInteraction == nil else { return }
        let interaction = UIContextMenuInteraction(delegate: self)
        addInteraction(interaction)
        contextMenuInteraction = interaction
        logger.debug("Installed UIContextMenuInteraction")
    }

    private func removeContextMenuInteraction() {
        guard let interaction = contextMenuInteraction else { return }
        removeInteraction(interaction)
        contextMenuInteraction = nil
        logger.debug("Removed UIContextMenuInteraction")
    }

    // MARK: - Tap Mode Button

    private func installTapMenuButton() {
        guard tapMenuButton == nil else {
            updateTapMenuButton()
            return
        }

        let button = UIButton(type: .custom)
        button.backgroundColor = .clear
        button.showsMenuAsPrimaryAction = true
        button.translatesAutoresizingMaskIntoConstraints = false

        // Add context menu interaction to track menu lifecycle
        let interaction = UIContextMenuInteraction(delegate: self)
        button.addInteraction(interaction)

        addSubview(button)
        NSLayoutConstraint.activate([
            button.topAnchor.constraint(equalTo: topAnchor),
            button.bottomAnchor.constraint(equalTo: bottomAnchor),
            button.leadingAnchor.constraint(equalTo: leadingAnchor),
            button.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])

        tapMenuButton = button
        updateTapMenuButton()
        logger.debug("Installed tap menu button")
    }

    private func removeTapMenuButton() {
        tapMenuButton?.removeFromSuperview()
        tapMenuButton = nil
    }

    private func updateTapMenuButton() {
        guard let button = tapMenuButton else { return }

        let actions = parsedActions.filter { !$0.hidden }
        guard !actions.isEmpty else {
            button.menu = nil
            return
        }

        let menu = buildMenu(from: actions, title: menuTitle)
        button.menu = menu
    }

    // MARK: - UIContextMenuInteractionDelegate

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        configurationForMenuAtLocation location: CGPoint
    ) -> UIContextMenuConfiguration? {
        guard interactivity != "disabled" else { return nil }

        let actions = parsedActions.filter { !$0.hidden }
        guard !actions.isEmpty else { return nil }

        logger.debug("contextMenuInteraction: creating configuration with \(actions.count) actions")

        return UIContextMenuConfiguration(
            identifier: nil,
            previewProvider: enablePreview == "true" ? { [weak self] in
                // Return a preview controller showing the content
                guard let self else { return nil }
                let preview = UIViewController()
                preview.view.backgroundColor = .clear

                // Snapshot the current view for preview
                let snapshot = self.snapshotView(afterScreenUpdates: false)
                if let snap = snapshot {
                    snap.frame = CGRect(origin: .zero, size: self.bounds.size)
                    preview.view.addSubview(snap)
                    preview.preferredContentSize = self.bounds.size
                }
                return preview
            } : nil,
            actionProvider: { [weak self] suggestedActions in
                guard let self else { return nil }
                return self.buildMenu(from: actions, title: self.menuTitle)
            }
        )
    }

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willDisplayMenuFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        logger.debug("contextMenuInteraction: willDisplayMenu")
        onMenuOpen?()
    }

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willEndFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        logger.debug("contextMenuInteraction: willEnd")
        onMenuClose?()
    }

    // MARK: - Menu Building

    private func buildMenu(from actions: [PCContextMenuAction], title: String?) -> UIMenu {
        let menuElements = actions.compactMap { buildMenuElement(from: $0) }

        return UIMenu(
            title: title ?? "",
            children: menuElements
        )
    }

    private func buildMenuElement(from action: PCContextMenuAction) -> UIMenuElement? {
        guard !action.hidden else { return nil }

        // If has subactions, create a submenu
        if !action.subactions.isEmpty {
            let children = action.subactions.compactMap { buildMenuElement(from: $0) }
            return UIMenu(
                title: action.title,
                image: imageForAction(action),
                children: children
            )
        }

        // Build action attributes
        var attributes: UIMenuElement.Attributes = []
        if action.destructive { attributes.insert(.destructive) }
        if action.disabled { attributes.insert(.disabled) }

        // Build state
        let state: UIMenuElement.State
        switch action.state {
        case "on": state = .on
        case "mixed": state = .mixed
        default: state = .off
        }

        let uiAction = UIAction(
            title: action.title,
            subtitle: action.subtitle,
            image: imageForAction(action),
            attributes: attributes,
            state: state
        ) { [weak self] _ in
            logger.debug("UIAction selected: id=\(action.id), title=\(action.title)")
            self?.onPressAction?(action.id, action.title)
        }

        return uiAction
    }

    private func imageForAction(_ action: PCContextMenuAction) -> UIImage? {
        guard let imageName = action.image, !imageName.isEmpty else { return nil }

        var image = UIImage(systemName: imageName)

        // Apply tint color if specified
        if let colorStr = action.imageColor, !colorStr.isEmpty, let color = colorFromString(colorStr) {
            image = image?.withTintColor(color, renderingMode: .alwaysOriginal)
        }

        return image
    }

    private func colorFromString(_ str: String) -> UIColor? {
        // Support hex colors like "#FF0000" or "FF0000"
        var hex = str.trimmingCharacters(in: .whitespacesAndNewlines)
        if hex.hasPrefix("#") {
            hex = String(hex.dropFirst())
        }

        guard hex.count == 6, let rgbValue = UInt64(hex, radix: 16) else {
            return nil
        }

        let r = CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = CGFloat(rgbValue & 0x0000FF) / 255.0

        return UIColor(red: r, green: g, blue: b, alpha: 1.0)
    }
}
