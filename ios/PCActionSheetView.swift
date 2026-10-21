import os.log
import UIKit

private let logger = Logger(subsystem: "com.platformcomponents", category: "ActionSheet")

/// One action bridged from ObjC++ (src/ActionSheet.tsx). Icons aren't drawn:
/// UIAlertAction has no public image API.
struct PCActionSheetItem {
    let id: String
    let title: String
    /// The icon fields in one string (see PCActionSheet.mm), only compared:
    /// a changed icon waits for the next presentation, as on Android
    let icon: String
    let destructive: Bool
    let disabled: Bool
    /// The action's own `haptics`; "" = the component's
    let haptics: String
    let testID: String

    init(dictionary dict: [String: Any]) {
        func string(_ key: String) -> String { (dict[key] as? String) ?? "" }
        id = string("id")
        title = string("title")
        icon = string("icon")
        destructive = string("destructive") == "true"
        disabled = string("disabled") == "true"
        haptics = string("haptics")
        testID = string("testID")
    }

    /// Whether the sheet's action for `self` can show `other`: the fields a
    /// presented `UIAlertAction` can't change (and the icon, which Android
    /// doesn't change either) are the same.
    func sameAction(as other: PCActionSheetItem) -> Bool {
        id == other.id && title == other.title && icon == other.icon && destructive == other.destructive
    }
}

/// The ActionSheet: a `UIAlertController` in the `.actionSheet` style,
/// presented from the nearest view controller while `visible` is "open".
///
/// The view covers the component's frame (the React children are mounted
/// next to it in the Fabric view) and takes no touches. Wherever UIKit shows
/// the sheet as a popover (iPad, and iPhone on iOS 26), the popover points
/// at the children; without children the sheet has no source.
///
/// While the sheet is up, the title, the message and each action's enabled
/// state, identifier and haptic follow the props. Its actions themselves
/// can't change once presented: a list of another shape (added, removed,
/// reordered or retitled actions, a changed style or icon, a new cancel
/// title) shows from the next presentation.
@objcMembers
public final class PCActionSheetView: UIView {
    // MARK: - Props (set from ObjC++)

    public var sheetTitle: String = "" {
        didSet {
            guard sheetTitle != oldValue, let alert else { return }
            alert.title = sheetTitle.isEmpty ? nil : sheetTitle
        }
    }

    public var message: String = "" {
        didSet {
            guard message != oldValue, let alert else { return }
            alert.message = message.isEmpty ? nil : message
        }
    }

    /// ObjC++ sets this as an array of dictionaries (see PCActionSheet.mm)
    public var actions: [Any] = [] {
        didSet {
            items = actions.compactMap { any in
                guard let dict = any as? [String: Any] else { return nil }
                return PCActionSheetItem(dictionary: dict)
            }
            updateShownActions()
        }
    }

    /// "" = the system's localized "Cancel"
    public var cancelTitle: String = ""
    public var cancelTestID: String = "" {
        didSet {
            guard cancelTestID != oldValue, alert != nil else { return }
            shownCancel?.accessibilityIdentifier = cancelTestID.isEmpty ? nil : cancelTestID
        }
    }

    /// "open" | "closed"
    public var visible: String = "closed" {
        didSet {
            guard visible != oldValue else { return }
            updatePresentation()
        }
    }

    /// The `haptics` prop, played when an action is picked (an action's own
    /// `haptics` wins)
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onSelect: ((String) -> Void)?
    public var onCancel: (() -> Void)?

    // MARK: - Internal

    private var items: [PCActionSheetItem] = []
    /// The sheet on screen (or on its way), until an action ends it or it is
    /// dismissed through `visible`
    private var alert: UIAlertController?
    /// The sheet's actions and the items they show now: the items it was
    /// presented with, updated while the actions keep their shape
    private var shownActions: [UIAlertAction] = []
    private var shownItems: [PCActionSheetItem] = []
    private var shownCancel: UIAlertAction?
    /// Bumped on every visibility change, so a deferred presentation that
    /// has been overtaken does nothing
    private var presentationToken = 0

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
        // Only the popover's source: touches reach the children.
        isUserInteractionEnabled = false
        isAccessibilityElement = false
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window == nil {
            // Unmounted, or its screen went away: the sheet goes too, without
            // a callback.
            dismissIfNeeded()
        } else if visible == "open" {
            // A sheet asked for before the view was on screen opens now.
            updatePresentation()
        }
    }

    /// Called by PCActionSheet.mm before Fabric reuses the view.
    public func resetForRecycle() {
        presentationToken += 1
        dismissIfNeeded()
        visible = "closed"
        sheetTitle = ""
        message = ""
        actions = []
        cancelTitle = ""
        cancelTestID = ""
        haptics.kind = ""
    }

    // MARK: - Presentation

    private func updatePresentation() {
        presentationToken += 1
        if visible == "open" {
            presentIfNeeded(token: presentationToken)
        } else {
            dismissIfNeeded()
        }
    }

    private func dismissIfNeeded() {
        guard let alert else { return }
        self.alert = nil
        // A programmatic dismissal calls no action handler, so neither
        // onSelect nor onCancel fires.
        if alert.presentingViewController != nil, !alert.isBeingDismissed {
            alert.dismiss(animated: true)
        }
    }

    /// Presents on the next run loop turn, so the frame the popover points
    /// at is final and a sheet that is still closing has started to go.
    private func presentIfNeeded(token: Int) {
        DispatchQueue.main.async { [weak self] in
            guard let self, self.presentationToken == token else { return }
            guard self.visible == "open", self.window != nil else { return }
            if let alert = self.alert {
                // Still up (or presenting): nothing to do. A sheet dismissed
                // behind our back (its presenter went away) is replaced.
                if alert.presentingViewController != nil || alert.isBeingPresented { return }
                self.alert = nil
            }
            guard let presenter = self.presenter() else {
                logger.debug("presentIfNeeded: no view controller to present from")
                return
            }
            // A sheet (ours or another controller) is still animating away:
            // present once that transition ends.
            if let coordinator = presenter.transitionCoordinator {
                coordinator.animate(alongsideTransition: nil) { [weak self] _ in
                    self?.presentIfNeeded(token: token)
                }
                return
            }
            if presenter.presentedViewController != nil {
                logger.debug("presentIfNeeded: the presenter is busy")
                return
            }
            self.present(from: presenter)
        }
    }

    /// Applies the actions to the sheet on screen when they keep the shape it
    /// was presented with; otherwise they wait for the next presentation.
    private func updateShownActions() {
        guard alert != nil, items.count == shownItems.count,
              zip(items, shownItems).allSatisfy({ $0.sameAction(as: $1) })
        else { return }
        shownItems = items
        for (action, item) in zip(shownActions, items) {
            action.isEnabled = !item.disabled
            action.accessibilityIdentifier = item.testID.isEmpty ? nil : item.testID
        }
    }

    private func present(from presenter: UIViewController) {
        let alert = UIAlertController(
            title: sheetTitle.isEmpty ? nil : sheetTitle,
            message: message.isEmpty ? nil : message,
            preferredStyle: .actionSheet
        )

        var actions: [UIAlertAction] = []
        for (index, item) in items.enumerated() {
            let action = UIAlertAction(
                title: item.title,
                style: item.destructive ? .destructive : .default
            ) { [weak self, weak alert] _ in
                guard let self, let alert, self.alert === alert else { return }
                self.alert = nil
                // The item as it is now: its haptic may have changed since.
                let item = self.shownItems[index]
                self.haptics.perform(in: self, override: item.haptics)
                self.onSelect?(item.id)
            }
            action.isEnabled = !item.disabled
            action.accessibilityIdentifier = item.testID.isEmpty ? nil : item.testID
            alert.addAction(action)
            actions.append(action)
        }
        shownActions = actions
        shownItems = items

        // The cancel action: a row on iPhone, and on a popover (iPad) UIKit
        // calls it for a tap outside instead of showing it.
        let cancel = UIAlertAction(
            title: cancelTitle.isEmpty ? Self.systemCancelTitle : cancelTitle,
            style: .cancel
        ) { [weak self, weak alert] _ in
            guard let self, let alert, self.alert === alert else { return }
            self.alert = nil
            self.onCancel?()
        }
        cancel.accessibilityIdentifier = cancelTestID.isEmpty ? nil : cancelTestID
        alert.addAction(cancel)
        shownCancel = cancel

        // With a source, UIKit shows the sheet as a popover pointing at it: on
        // iPad, and on iPhone from iOS 26. Without children there is nothing
        // to point at; an iPhone then shows the sheet with its Cancel row (in
        // the middle of the screen on iOS 26, at the bottom before), and an
        // iPad (which needs a source) a centered popover.
        if let popover = alert.popoverPresentationController {
            if let (host, frame) = childrenFrame() {
                // Point at the children
                popover.sourceView = host
                popover.sourceRect = frame
            } else if traitCollection.userInterfaceIdiom == .pad {
                // Nothing to point at: the middle of the screen, no arrow
                popover.sourceView = presenter.view
                popover.sourceRect = CGRect(
                    x: presenter.view.bounds.midX,
                    y: presenter.view.bounds.midY,
                    width: 0,
                    height: 0
                )
                popover.permittedArrowDirections = []
            }
        }

        logger.debug("present: \(self.items.count) actions")
        self.alert = alert
        presenter.present(alert, animated: true)
        haptics.prepare(in: self)
    }

    /// The view the React children are mounted in and the frame they cover
    /// there, or nil without children. Fabric mounts them next to this view
    /// (its content view), so they are its siblings. The component's own
    /// frame says nothing: a childless sheet in a column is full width and
    /// 0 high, and must not become a popover pointing at that line.
    private func childrenFrame() -> (UIView, CGRect)? {
        guard let host = superview else { return nil }
        let children = host.subviews.filter { $0 !== self }
        guard let first = children.first else { return nil }
        let frame = children.dropFirst().reduce(first.frame) { $0.union($1.frame) }
        return (host, frame)
    }

    /// The controller to present from: the nearest one, or whatever it is
    /// presenting already (a modal screen).
    private func presenter() -> UIViewController? {
        var responder: UIResponder? = self
        var nearest: UIViewController?
        while let next = responder?.next {
            if let vc = next as? UIViewController {
                nearest = vc
                break
            }
            responder = next
        }
        guard var vc = nearest ?? window?.rootViewController else { return nil }
        while let presented = vc.presentedViewController, !presented.isBeingDismissed {
            vc = presented
        }
        return vc
    }

    /// UIKit's own localized "Cancel".
    private static var systemCancelTitle: String {
        Bundle(for: UIApplication.self).localizedString(forKey: "Cancel", value: "Cancel", table: nil)
    }
}
