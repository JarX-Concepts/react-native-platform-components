import os.log
import UIKit

private let logger = Logger(subsystem: "com.platformcomponents", category: "ContextMenu")

// MARK: - Main View

@objcMembers
public final class PCContextMenuView: UIView, UIContextMenuInteractionDelegate, UIGestureRecognizerDelegate {
    // MARK: - Props (set from ObjC++)

    /// Menu title (shown as header on iOS)
    public var menuTitle: String? { didSet { sync() } }

    /// ObjC++ sets this as an array of dictionaries: the flattened menu items
    public var actions: [Any] = [] {
        didSet {
            items = PCMenuSupport.items(from: actions)
            sync()
        }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet {
            updateEnabled()
            sync()
        }
    }

    /// "longPress" | "tap" | "none"
    public var trigger: String = "longPress" { didSet { updateTrigger() } }

    /// "open" | "closed". ObjC++ sets it only when the prop changes, so a
    /// menu the user opened stays open while the prop stays "closed".
    public var visible: String = "closed" { didSet { updatePresentation() } }

    /// iOS-specific: enable preview
    public var enablePreview: String = "false"

    /// The `haptics` prop, played when an action is pressed (an action's own
    /// `haptics` wins)
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onPressAction: ((String, String) -> Void)?  // (id, title)
    public var onMenuOpen: (() -> Void)?
    public var onMenuClose: (() -> Void)?
    public var onPreviewPress: (() -> Void)?

    // MARK: - Internal

    private var items: [PCMenuItem] = []
    private let menuImages = PCMenuImageState()
    private var contextMenuInteraction: UIContextMenuInteraction?
    /// Whether the long-press menu is showing, so new actions update it in place.
    private var isMenuVisible = false
    /// The long-press menu last handed to UIKit, to find the showing root.
    private var presentedMenu: UIMenu?

    // Tap mode: UIButton with UIMenu for tap-to-show. From iOS 17.4 it takes
    // no touches (see hitTest), and JS opens it (see handleTap).
    private var tapMenuButton: PCMenuButton?
    private var touchRecorder: UIGestureRecognizer?
    /// Where the last touch on the content went down (see installTouchRecorder)
    private weak var lastTouchView: UIView?

    /// Invisible anchor of a menu opened through `visible` in longPress and
    /// none modes (tap mode opens its own button). It never takes a touch;
    /// see hitTest.
    private var anchorMenuButton: PCMenuButton?
    private var presentationToken = 0

    private var isAnyMenuVisible: Bool {
        isMenuVisible || tapMenuButton?.isMenuVisible == true || anchorMenuButton?.isMenuVisible == true
    }

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

    /// This view lies over the React content and lets its touches through,
    /// so the content's own pressables get them: the long-press interaction
    /// sits on the parent component view, around the content, and JS opens
    /// a tap menu for taps no pressable took. Only the tap button keeps its
    /// touches, before iOS 17.4, where JS can't open its menu.
    public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let button = tapMenuButton, !PCMenuButton.canPresentMenuProgrammatically else { return nil }
        let view = super.hitTest(point, with: event)
        return view?.isDescendant(of: button) == true ? view : nil
    }

    public override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        removeContextMenuInteraction()
        removeTouchRecorder()
    }

    public override func didMoveToSuperview() {
        super.didMoveToSuperview()
        // The long-press interaction goes on the new parent
        updateTrigger()
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        // A menu asked for before the view was on screen opens now.
        if window != nil, visible == "open" { updatePresentation() }
    }

    private func updateEnabled() {
        let disabled = (interactivity == "disabled")
        alpha = disabled ? 0.5 : 1.0
        isUserInteractionEnabled = !disabled
        accessibilityTraits = disabled ? [.notEnabled] : []
        if disabled { dismissMenu() }
    }

    private func sync() {
        menuImages.retain(icons: items.map(\.icon))
        // Re-setup trigger mode if needed
        updateTrigger()
        // Update tap menu content if in tap mode
        if trigger == "tap" {
            updateTapMenuButton()
        } else if let anchor = anchorMenuButton, anchor.isMenuVisible {
            // A menu opened through `visible`; updates it in place.
            anchor.setMenu(buildMenu())
        } else if isMenuVisible, let interaction = contextMenuInteraction {
            // An action that keeps the menu presented changed a title or state.
            let menu = buildMenu()
            let oldMenu = presentedMenu
            presentedMenu = menu
            interaction.updateVisibleMenu { visible in
                PCMenuSupport.updatedVisibleMenu(visible, in: menu, replacing: oldMenu)
            }
        } else {
            // Start loading image icons now, so they are ready when the menu opens.
            _ = buildMenu()
        }
    }

    // MARK: - Trigger Mode

    private func updateTrigger() {
        switch trigger {
        case "tap":
            // Tap mode: use UIButton with UIMenu for tap-to-show
            removeContextMenuInteraction()
            installTapMenuButton()
            installTouchRecorder()
        case "none":
            // Only `visible` opens the menu, from the anchor
            removeContextMenuInteraction()
            removeTapMenuButton()
            removeTouchRecorder()
        default:
            // Install context menu interaction for long-press
            installContextMenuInteraction()
            removeTapMenuButton()
            removeTouchRecorder()
        }
    }

    private func installContextMenuInteraction() {
        guard contextMenuInteraction == nil, let parentView = getParentComponentView() else { return }

        // Install interaction on the parent component view, which holds the React
        // content, so a long-press anywhere on it (an inner button too) triggers the
        // menu while taps still reach the content.
        // We use UITargetedPreview in the delegate methods to show the parent view
        // as the preview.
        let interaction = UIContextMenuInteraction(delegate: self)
        parentView.addInteraction(interaction)
        contextMenuInteraction = interaction
        logger.debug("Installed UIContextMenuInteraction on the parent component view")
    }

    private func removeContextMenuInteraction() {
        guard let interaction = contextMenuInteraction else { return }
        interaction.view?.removeInteraction(interaction)
        contextMenuInteraction = nil
        logger.debug("Removed UIContextMenuInteraction")
    }

    /// The long-press menu took the touch over, but React Native's touch
    /// handler would still end it as a press of the pressable under the
    /// finger. Cancels it the way RN does for its own touches: toggling
    /// `isEnabled` cancels a gesture recognizer, and RN sends touchcancel.
    private func cancelReactTouches() {
        guard let handlerClass = NSClassFromString("RCTSurfaceTouchHandler") else { return }
        var view = superview
        while let current = view {
            if let handler = current.gestureRecognizers?.first(where: { $0.isKind(of: handlerClass) }) {
                handler.isEnabled = false
                handler.isEnabled = true
                return
            }
            view = current.superview
        }
    }

    // MARK: - Tap Mode Button

    private func installTapMenuButton() {
        guard tapMenuButton == nil else {
            updateTapMenuButton()
            return
        }

        let button = PCMenuButton(type: .system)
        button.backgroundColor = .clear
        button.translatesAutoresizingMaskIntoConstraints = false
        // Make button invisible but still tappable
        button.tintColor = .clear
        // Still VoiceOver's element for the menu where it lets touches through
        button.opensMenuOnAccessibilityActivate = true
        button.onMenuOpen = { [weak self] in
            guard let self else { return }
            self.haptics.prepare(in: self)
            self.onMenuOpen?()
        }
        button.onMenuClose = { [weak self] in self?.onMenuClose?() }

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
        button.setMenu(items.isEmpty ? nil : buildMenu())
    }

    /// Tap mode, iOS 17.4+: JS calls this for a tap on the content that no
    /// inner pressable took (React Native's responder system knows that: the
    /// deepest responder wins). Earlier versions open the menu from the tap
    /// button's own touch, and do nothing here.
    public func handleTap() {
        guard trigger == "tap", interactivity != "disabled", !items.isEmpty else { return }
        guard let button = tapMenuButton, !isAnyMenuVisible else { return }
        // A native control (this library's Button, a switch) handles its own
        // taps, outside the JS responder system
        guard !isInsideControl(lastTouchView) else { return }
        logger.debug("handleTap: presenting \(self.items.count) items")
        button.presentMenu()
    }

    // MARK: - Tap Mode Touch Recorder

    /// Notes the view each touch on the content lands on, for handleTap,
    /// without taking part in the touch.
    private func installTouchRecorder() {
        guard touchRecorder == nil, let parentView = getParentComponentView() else { return }
        let recorder = UIGestureRecognizer(target: nil, action: nil)
        recorder.cancelsTouchesInView = false
        recorder.delegate = self
        parentView.addGestureRecognizer(recorder)
        touchRecorder = recorder
    }

    private func removeTouchRecorder() {
        guard let recorder = touchRecorder else { return }
        recorder.view?.removeGestureRecognizer(recorder)
        touchRecorder = nil
        lastTouchView = nil
    }

    public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        lastTouchView = touch.view
        return false
    }

    /// Whether the view is, or is inside, an enabled UIControl of the content.
    private func isInsideControl(_ view: UIView?) -> Bool {
        var current = view
        while let candidate = current, candidate !== superview {
            if let control = candidate as? UIControl, control !== tapMenuButton, control.isEnabled {
                return true
            }
            current = candidate.superview
        }
        return false
    }

    // MARK: - Programmatic presentation (`visible`)

    private func installAnchorMenuButton() -> PCMenuButton {
        if let button = anchorMenuButton { return button }

        // Over the view's bounds, so the system menu attaches to the content
        let button = PCMenuButton(type: .custom)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = .clear
        button.isAccessibilityElement = false
        button.onMenuOpen = { [weak self] in
            guard let self else { return }
            self.haptics.prepare(in: self)
            self.onMenuOpen?()
        }
        button.onMenuClose = { [weak self] in self?.onMenuClose?() }

        addSubview(button)
        NSLayoutConstraint.activate([
            button.topAnchor.constraint(equalTo: topAnchor),
            button.bottomAnchor.constraint(equalTo: bottomAnchor),
            button.leadingAnchor.constraint(equalTo: leadingAnchor),
            button.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])

        anchorMenuButton = button
        return button
    }

    private func updatePresentation() {
        presentationToken += 1
        if visible == "open" {
            presentMenuIfNeeded(token: presentationToken)
        } else {
            dismissMenu()
        }
    }

    /// iOS 17.4+: opens the menu from the tap button or the anchor with
    /// `UIControl.performPrimaryAction()`. Earlier versions have no public
    /// API to open a menu without a touch, and do nothing.
    private func presentMenuIfNeeded(token: Int) {
        guard PCMenuButton.canPresentMenuProgrammatically else {
            logger.debug("presentMenuIfNeeded: needs iOS 17.4")
            return
        }

        // Next run loop turn, so the anchor has its final frame.
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard self.presentationToken == token, self.visible == "open" else { return }
            guard self.interactivity != "disabled", !self.items.isEmpty else { return }
            guard self.window != nil, !self.isAnyMenuVisible else { return }

            let button = self.tapMenuButton ?? self.installAnchorMenuButton()
            logger.debug("presentMenuIfNeeded: presenting \(self.items.count) items")
            self.layoutIfNeeded()
            button.setMenu(self.buildMenu())
            button.presentMenu()
        }
    }

    /// Closes the open menu, whichever way it opened.
    private func dismissMenu() {
        tapMenuButton?.dismissMenu()
        anchorMenuButton?.dismissMenu()
        if isMenuVisible { contextMenuInteraction?.dismissMenu() }
    }

    // MARK: - UIContextMenuInteractionDelegate

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        configurationForMenuAtLocation location: CGPoint
    ) -> UIContextMenuConfiguration? {
        guard interactivity != "disabled" else { return nil }

        guard !items.isEmpty else { return nil }

        logger.debug("contextMenuInteraction: creating configuration with \(self.items.count) items")

        // Use nil previewProvider - we'll use UITargetedPreview via delegate instead
        return UIContextMenuConfiguration(
            identifier: nil,
            previewProvider: nil,
            actionProvider: { [weak self] _ in
                guard let self else { return nil }
                let menu = self.buildMenu()
                self.presentedMenu = menu
                return menu
            }
        )
    }

    /// Get the parent component view (PCContextMenu) which contains all React content
    private func getParentComponentView() -> UIView? {
        return superview
    }

    /// Preview targeted by the highlight and dismissal animations.
    /// With `enablePreview`, the parent component view (which holds the React content)
    /// lifts; otherwise we target self with a zero-size path so iOS does not manipulate
    /// the parent view (which caused white flashes).
    private func targetedPreview() -> UITargetedPreview? {
        let parameters = UIPreviewParameters()
        parameters.backgroundColor = .clear

        if enablePreview == "true" {
            guard let parentView = getParentComponentView() else {
                logger.debug("targetedPreview: no parent found")
                return nil
            }
            parameters.visiblePath = UIBezierPath(roundedRect: parentView.bounds, cornerRadius: 8)
            return UITargetedPreview(view: parentView, parameters: parameters)
        } else {
            parameters.visiblePath = UIBezierPath(rect: .zero)
            return UITargetedPreview(view: self, parameters: parameters)
        }
    }

    // iOS 16+: per-item preview delegate methods. UIKit prefers these over the
    // deprecated configuration-level ones below when both are implemented.

    @available(iOS 16.0, *)
    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        configuration: UIContextMenuConfiguration,
        highlightPreviewForItemWithIdentifier identifier: NSCopying
    ) -> UITargetedPreview? {
        targetedPreview()
    }

    @available(iOS 16.0, *)
    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        configuration: UIContextMenuConfiguration,
        dismissalPreviewForItemWithIdentifier identifier: NSCopying
    ) -> UITargetedPreview? {
        targetedPreview()
    }

    // iOS 15 fallback (deprecated in iOS 16; not called there when the methods above exist).

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        previewForHighlightingMenuWithConfiguration configuration: UIContextMenuConfiguration
    ) -> UITargetedPreview? {
        targetedPreview()
    }

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        previewForDismissingMenuWithConfiguration configuration: UIContextMenuConfiguration
    ) -> UITargetedPreview? {
        targetedPreview()
    }

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willDisplayMenuFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        logger.debug("contextMenuInteraction: willDisplayMenu")
        isMenuVisible = true
        cancelReactTouches()
        haptics.prepare(in: self)
        onMenuOpen?()
    }

    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willEndFor configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionAnimating?
    ) {
        logger.debug("contextMenuInteraction: willEnd")
        isMenuVisible = false
        onMenuClose?()
    }

    /// The user tapped the preview. The menu dismisses back to the content,
    /// then `onPreviewPress` fires so the app can open the item.
    public func contextMenuInteraction(
        _ interaction: UIContextMenuInteraction,
        willPerformPreviewActionForMenuWith configuration: UIContextMenuConfiguration,
        animator: UIContextMenuInteractionCommitAnimating
    ) {
        logger.debug("contextMenuInteraction: willPerformPreviewAction")
        animator.preferredCommitStyle = .dismiss
        animator.addCompletion { [weak self] in
            self?.onPreviewPress?()
        }
    }

    // MARK: - Menu Building

    private func buildMenu() -> UIMenu {
        PCMenuSupport.menu(
            title: menuTitle ?? "",
            items: items,
            imageState: menuImages,
            onImageLoaded: { [weak self] in self?.sync() },
            handler: { [weak self] item in
                logger.debug("UIAction selected: id=\(item.id), title=\(item.title)")
                guard let self else { return }
                self.haptics.perform(in: self, override: item.haptics)
                self.onPressAction?(item.id, item.title)
            }
        )
    }
}
