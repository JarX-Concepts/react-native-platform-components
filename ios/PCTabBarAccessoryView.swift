import UIKit

/// The content of a TabBar accessory: the view the accessory's React
/// children mount into. On iOS 26 the TabBar with the same `accessoryID`
/// hands it to UIKit as its bottom accessory's content view; otherwise it
/// stays in its placeholder, the PCTabBarAccessory component view.
@objcMembers
public final class PCTabBarAccessoryView: UIView {
    /// Links the content to its TabBar; "" = not linked.
    public var accessoryID: String = "" {
        didSet {
            guard oldValue != accessoryID else { return }
            PCTabBarAccessoryView.unregister(self, id: oldValue)
            PCTabBarAccessoryView.register(self, id: accessoryID)
        }
    }

    /// The placeholder the content returns to when no bar hosts it.
    public weak var home: UIView?

    /// Called by the hosting bar's side: the content resized or its
    /// accessory environment (regular / inline) changed.
    var onLayoutChange: (() -> Void)?

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        // The content is laid out from JS after UIKit resizes the accessory;
        // clipped, it doesn't spill out of the capsule meanwhile
        clipsToBounds = true
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            registerForTraitChanges([UITraitTabAccessoryEnvironment.self]) { (view: PCTabBarAccessoryView, _: UITraitCollection) in
                view.onLayoutChange?()
            }
        }
        #endif
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        onLayoutChange?()
    }

    /// Back into the placeholder, filling it.
    public func returnHome() {
        guard let home, superview !== home else { return }
        removeFromSuperview()
        frame = home.bounds
        home.addSubview(self)
    }

    /// "regular" or "inline" (iOS 26), from the accessory environment trait.
    var environment: String {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *), traitCollection.tabAccessoryEnvironment == .inline {
            return "inline"
        }
        #endif
        return "regular"
    }

    // MARK: - Registry

    /// Posted with the accessoryID (object) when the content for an id
    /// appears or goes away.
    static let didChangeNotification = Notification.Name("PCTabBarAccessoryViewDidChange")

    private static let registry = NSMapTable<NSString, PCTabBarAccessoryView>.strongToWeakObjects()

    /// The content registered for an id, if it is still alive.
    static func content(for id: String) -> PCTabBarAccessoryView? {
        guard !id.isEmpty else { return nil }
        return registry.object(forKey: id as NSString)
    }

    private static func register(_ view: PCTabBarAccessoryView, id: String) {
        guard !id.isEmpty else { return }
        registry.setObject(view, forKey: id as NSString)
        NotificationCenter.default.post(name: didChangeNotification, object: id as NSString)
    }

    private static func unregister(_ view: PCTabBarAccessoryView, id: String) {
        guard !id.isEmpty, registry.object(forKey: id as NSString) === view else { return }
        registry.removeObject(forKey: id as NSString)
        NotificationCenter.default.post(name: didChangeNotification, object: id as NSString)
    }
}
