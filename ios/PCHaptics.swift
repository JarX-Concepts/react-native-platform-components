import UIKit

/// The shared `haptics` prop: a UIKit feedback generator played when a
/// control reports the user's action. Each view keeps one of these; the
/// generator is created on first use (attached to the view on iOS 17.5+) and
/// dropped when the kind changes. UIKit follows the system haptics setting.
@objcMembers
@MainActor
public final class PCHaptics: NSObject {
    /// "" (unset) | "none" | "selection" | "light" | "medium" | "heavy" |
    /// "success" | "warning" | "error". "" and "none" play nothing: UIKit has
    /// no switch for the haptics its own controls play.
    public var kind: String = "" {
        didSet { if oldValue != kind { reset() } }
    }

    private var generator: UIFeedbackGenerator?

    /// Readies the Taptic Engine for an action that is likely to follow, such
    /// as a touch down, so the haptic plays without delay.
    public func prepare(in view: UIView) {
        makeGenerator(in: view)?.prepare()
    }

    /// Plays the haptic for `kind`.
    public func perform(in view: UIView) {
        switch makeGenerator(in: view) {
        case let selection as UISelectionFeedbackGenerator:
            selection.selectionChanged()
        case let impact as UIImpactFeedbackGenerator:
            impact.impactOccurred()
        case let notification as UINotificationFeedbackGenerator:
            if case let .notification(type) = Feedback(kind) {
                notification.notificationOccurred(type)
            }
        default:
            break
        }
    }

    private enum Feedback {
        case selection
        case impact(UIImpactFeedbackGenerator.FeedbackStyle)
        case notification(UINotificationFeedbackGenerator.FeedbackType)

        init?(_ kind: String) {
            switch kind {
            case "selection": self = .selection
            case "light": self = .impact(.light)
            case "medium": self = .impact(.medium)
            case "heavy": self = .impact(.heavy)
            case "success": self = .notification(.success)
            case "warning": self = .notification(.warning)
            case "error": self = .notification(.error)
            default: return nil
            }
        }
    }

    private func makeGenerator(in view: UIView) -> UIFeedbackGenerator? {
        if let generator { return generator }
        guard let feedback = Feedback(kind) else { return nil }
        let made: UIFeedbackGenerator
        if #available(iOS 17.5, *) {
            // Attached to the view: UIKit's replacement for the plain
            // initializers, which are slated for deprecation
            switch feedback {
            case .selection: made = UISelectionFeedbackGenerator(view: view)
            case let .impact(style): made = UIImpactFeedbackGenerator(style: style, view: view)
            case .notification: made = UINotificationFeedbackGenerator(view: view)
            }
        } else {
            switch feedback {
            case .selection: made = UISelectionFeedbackGenerator()
            case let .impact(style): made = UIImpactFeedbackGenerator(style: style)
            case .notification: made = UINotificationFeedbackGenerator()
            }
        }
        generator = made
        return made
    }

    private func reset() {
        if #available(iOS 17.5, *), let generator, let view = generator.view {
            view.removeInteraction(generator)
        }
        generator = nil
    }
}
