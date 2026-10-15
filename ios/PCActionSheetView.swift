import os.log
import UIKit

private let logger = Logger(subsystem: "com.platformcomponents", category: "ActionSheet")

/// One action bridged from ObjC++ (src/ActionSheet.tsx). Icons aren't read:
/// UIAlertAction has no public image API.
struct PCActionSheetItem {
    let id: String
    let title: String
    let destructive: Bool
    let disabled: Bool
    /// The action's own `haptics`; "" = the component's
    let haptics: String
    let testID: String

    init(dictionary dict: [String: Any]) {
        func string(_ key: String) -> String { (dict[key] as? String) ?? "" }
        id = string("id")
        title = string("title")
        destructive = string("destructive") == "true"
        disabled = string("disabled") == "true"
        haptics = string("haptics")
        testID = string("testID")
    }
}

/// The ActionSheet: a `UIAlertController` in the `.actionSheet` style,
/// presented from the nearest view controller while `visible` is "open".
///
/// The view covers the component's frame (the React children render in the
/// Fabric view around it) and takes no touches. It is the popover's source
/// wherever UIKit shows the sheet as a popover (iPad, and iPhone on iOS 26),
/// so the sheet points at the children.
@objcMembers
public final class PCActionSheetView: UIView {
    // MARK: - Props (set from ObjC++)

    public var sheetTitle: String = ""
    public var message: String = ""

    /// ObjC++ sets this as an array of dictionaries (see PCActionSheet.mm)
    public var actions: [Any] = [] {
        didSet {
            items = actions.compactMap { any in
                guard let dict = any as? [String: Any] else { return nil }
                return PCActionSheetItem(dictionary: dict)
            }
        }
    }

    /// "" = the system's localized "Cancel"
    public var cancelTitle: String = ""
    public var cancelTestID: String = ""

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

    private func present(from presenter: UIViewController) {
        let alert = UIAlertController(
            title: sheetTitle.isEmpty ? nil : sheetTitle,
            message: message.isEmpty ? nil : message,
            preferredStyle: .actionSheet
        )

        for item in items {
            let action = UIAlertAction(
                title: item.title,
                style: item.destructive ? .destructive : .default
            ) { [weak self, weak alert] _ in
                guard let self, let alert, self.alert === alert else { return }
                self.alert = nil
                self.haptics.perform(in: self, override: item.haptics)
                self.onSelect?(item.id)
            }
            action.isEnabled = !item.disabled
            action.accessibilityIdentifier = item.testID.isEmpty ? nil : item.testID
            alert.addAction(action)
        }

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

        // With a source, UIKit shows the sheet as a popover pointing at it: on
        // iPad, and on iPhone from iOS 26. Without children there is nothing
        // to point at; an iPhone then shows the sheet with its Cancel row (in
        // the middle of the screen on iOS 26, at the bottom before), and an
        // iPad (which needs a source) a centered popover.
        if let popover = alert.popoverPresentationController {
            if bounds.width > 0 || bounds.height > 0 {
                // Point at the children
                popover.sourceView = self
                popover.sourceRect = bounds
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
