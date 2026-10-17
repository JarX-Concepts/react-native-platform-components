import os.log
import UIKit

private let logger = Logger(subsystem: "com.platformcomponents", category: "Dialog")

/// One action bridged from ObjC++ (src/Dialog.tsx). At most one has the
/// cancel role: the JS side demotes extras, as UIKit throws on a second.
struct PCDialogItem {
    let id: String
    let title: String
    /// "default" | "cancel" | "destructive"
    let role: String
    let preferred: Bool
    let disabled: Bool
    /// The action's own `haptics`; "" = the component's (none for the cancel action)
    let haptics: String
    let testID: String

    init(dictionary dict: [String: Any]) {
        func string(_ key: String) -> String { (dict[key] as? String) ?? "" }
        id = string("id")
        title = string("title")
        role = string("role")
        preferred = string("preferred") == "true"
        disabled = string("disabled") == "true"
        haptics = string("haptics")
        testID = string("testID")
    }

    var style: UIAlertAction.Style {
        switch role {
        case "cancel": return .cancel
        case "destructive": return .destructive
        default: return .default
        }
    }
}

/// The alert, telling the view when it has gone for good.
final class PCAlertController: UIAlertController {
    /// Called once, when the alert has left the screen for good (not when
    /// something is presented over it)
    var onGone: (() -> Void)?

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        let gone = isBeingDismissed || presentingViewController == nil
            || presentingViewController?.isBeingDismissed == true
        guard gone, let onGone else { return }
        self.onGone = nil
        onGone()
    }
}

/// The Dialog: a `UIAlertController` in the `.alert` style, presented from
/// the topmost view controller while `visible` is "open".
///
/// The view is empty and takes no touches. A presentation that can't happen
/// reports `onPresentFailed` instead of waiting: one alert never goes over
/// another (UIKit would stack them), so an app that shows one dialog at a
/// time learns that this one didn't show.
@objcMembers
public final class PCDialogView: UIView {
    // MARK: - Props (set from ObjC++)

    public var dialogTitle: String = ""
    public var message: String = ""

    /// ObjC++ sets this as an array of dictionaries (see PCDialog.mm)
    public var actions: [Any] = [] {
        didSet {
            items = actions.compactMap { any in
                guard let dict = any as? [String: Any] else { return nil }
                return PCDialogItem(dictionary: dict)
            }
        }
    }

    /// "open" | "closed"
    public var visible: String = "closed" {
        didSet {
            guard visible != oldValue else { return }
            updatePresentation()
        }
    }

    /// The `haptics` prop, played when a default or destructive action is
    /// picked (an action's own `haptics` wins)
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onSelect: ((String) -> Void)?
    public var onCancel: (() -> Void)?
    public var onShow: (() -> Void)?
    public var onDismiss: (() -> Void)?
    /// "noWindow" | "busy" | "rejected"
    public var onPresentFailed: ((String) -> Void)?

    // MARK: - Internal

    private var items: [PCDialogItem] = []
    /// The alert on screen (or on its way), until an action ends it, it is
    /// dismissed through `visible`, or it goes behind our back
    private var alert: PCAlertController?
    /// Bumped on every visibility change, so a deferred presentation that
    /// has been overtaken does nothing
    private var presentationToken = 0
    /// Bumped when Fabric recycles the view, so an alert of its previous
    /// owner that is still closing reports nothing to the next one
    private var generation = 0

    /// How many transitions in a row a presentation waits for before it
    /// gives up as busy
    private static let maxTransitionWaits = 3

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
        isUserInteractionEnabled = false
        isAccessibilityElement = false
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window == nil {
            // Unmounted, or its screen went away: the alert goes too, without
            // onSelect or onCancel.
            presentationToken += 1
            dismissIfNeeded()
        }
    }

    /// Called by PCDialog.mm before Fabric reuses the view.
    public func resetForRecycle() {
        presentationToken += 1
        // The old dialog's events must not reach the view's next owner.
        generation += 1
        dismissIfNeeded()
        visible = "closed"
        dialogTitle = ""
        message = ""
        actions = []
        haptics.kind = ""
    }

    // MARK: - Presentation

    private func updatePresentation() {
        presentationToken += 1
        if visible == "open" {
            presentIfNeeded(token: presentationToken, waits: 0)
        } else {
            dismissIfNeeded()
        }
    }

    /// Dismisses without onSelect or onCancel; onDismiss follows once the
    /// alert has gone.
    private func dismissIfNeeded() {
        guard let alert else { return }
        self.alert = nil
        if alert.isBeingPresented, let coordinator = alert.transitionCoordinator {
            // UIKit ignores a dismissal while the presentation runs.
            coordinator.animate(alongsideTransition: nil) { _ in
                alert.dismiss(animated: true)
            }
        } else if alert.presentingViewController != nil, !alert.isBeingDismissed {
            alert.dismiss(animated: true)
        }
    }

    private func fail(_ reason: String, _ detail: String) {
        logger.debug("present: \(detail, privacy: .public) -> \(reason, privacy: .public)")
        onPresentFailed?(reason)
    }

    /// Presents on the next run loop turn, so the props of this update are
    /// all in and the view is mounted.
    private func presentIfNeeded(token: Int, waits: Int) {
        DispatchQueue.main.async { [weak self] in
            guard let self, self.presentationToken == token, self.visible == "open" else { return }
            if let alert = self.alert {
                // Still up (or presenting): nothing to do. An alert that went
                // behind our back is replaced.
                if alert.presentingViewController != nil || alert.isBeingPresented { return }
                self.alert = nil
            }
            guard let window = self.window else {
                self.fail("noWindow", "not in a window")
                return
            }
            guard let base = self.nearestViewController() ?? window.rootViewController,
                  base.viewIfLoaded?.window != nil
            else {
                self.fail("noWindow", "no view controller")
                return
            }
            // The screen the component is on is closing: nothing to show it on.
            if base.isBeingDismissed || base.isMovingFromParent {
                self.fail("busy", "the presenter is being dismissed")
                return
            }
            let top = Self.topmost(from: base)
            // A presentation or dismissal is still animating (an alert that
            // just closed, say, when the app chains dialogs from onSelect):
            // present once it ends.
            if let coordinator = top.transitionCoordinator {
                guard waits < Self.maxTransitionWaits else {
                    self.fail("busy", "the presenter stays in transition")
                    return
                }
                coordinator.animate(alongsideTransition: nil) { [weak self] _ in
                    self?.presentIfNeeded(token: token, waits: waits + 1)
                }
                return
            }
            // One alert at a time: UIKit would stack this one over the other
            // (any UIAlertController: a Dialog, an ActionSheet, RN's Alert).
            if top is UIAlertController {
                self.fail("busy", "another alert is up")
                return
            }
            if top.presentedViewController != nil {
                self.fail("busy", "the presenter is presenting")
                return
            }
            self.present(from: top)
        }
    }

    private func present(from presenter: UIViewController) {
        let alert = PCAlertController(
            title: dialogTitle.isEmpty ? nil : dialogTitle,
            message: message.isEmpty ? nil : message,
            preferredStyle: .alert
        )

        var preferred: UIAlertAction?
        var cancelSeen = false
        for item in items {
            // The JS side keeps one cancel action; a second would throw.
            var style = item.style
            if style == .cancel {
                if cancelSeen { style = .default }
                cancelSeen = true
            }
            let isCancel = style == .cancel
            let action = UIAlertAction(title: item.title, style: style) { [weak self, weak alert] _ in
                guard let self, let alert, self.alert === alert else { return }
                self.alert = nil
                if isCancel {
                    // Only an action's own haptic: cancelling isn't a pick.
                    if !item.haptics.isEmpty { self.haptics.perform(in: self, override: item.haptics) }
                    self.onCancel?()
                } else {
                    self.haptics.perform(in: self, override: item.haptics)
                    self.onSelect?(item.id)
                }
            }
            action.isEnabled = !item.disabled
            action.accessibilityIdentifier = item.testID.isEmpty ? nil : item.testID
            alert.addAction(action)
            if item.preferred, preferred == nil { preferred = action }
        }
        alert.preferredAction = preferred

        let generation = self.generation
        alert.onGone = { [weak self, weak alert] in
            // After the action's handler, which UIKit calls as the dismissal
            // completes.
            DispatchQueue.main.async {
                guard let self, self.generation == generation else { return }
                if let alert, self.alert === alert { self.alert = nil }
                self.onDismiss?()
            }
        }

        logger.debug("present: \(self.items.count) actions")
        self.alert = alert
        presenter.present(alert, animated: true) { [weak self, weak alert] in
            guard let self, let alert, self.alert === alert else { return }
            self.onShow?()
        }
        // UIKit refuses some presentations with only a console warning (a
        // presenter that isn't in the window hierarchy, say).
        if alert.presentingViewController == nil, !alert.isBeingPresented {
            self.alert = nil
            alert.onGone = nil
            fail("rejected", "UIKit didn't present the alert")
            return
        }
        haptics.prepare(in: self)
    }

    /// The nearest view controller up the responder chain.
    private func nearestViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while let next = responder?.next {
            if let vc = next as? UIViewController { return vc }
            responder = next
        }
        return nil
    }

    /// The controller to present from: `base`, or the last controller it
    /// presents (a modal screen), skipping one that is being dismissed.
    private static func topmost(from base: UIViewController) -> UIViewController {
        var vc = base
        while let presented = vc.presentedViewController, !presented.isBeingDismissed {
            vc = presented
        }
        return vc
    }
}
