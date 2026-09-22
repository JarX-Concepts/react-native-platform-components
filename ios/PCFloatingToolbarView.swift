import UIKit

/// The floating toolbar container: a Liquid Glass capsule on iOS 26, and a
/// blur-material capsule with a soft shadow on earlier versions, where a blur
/// over a flat background would otherwise have no edge.
@objcMembers
public final class PCFloatingToolbarView: UIView {
    // MARK: - Props (set from ObjC++)

    /// "regular" | "clear"
    public var effectStyle: String = "regular" {
        didSet { if oldValue != effectStyle { applyEffect() } }
    }

    /// Tint over the material; nil keeps the plain material
    public var tintUIColor: UIColor? {
        didSet { applyEffect() }
    }

    /// React children mount here
    public var contentView: UIView { effectView.contentView }

    // MARK: - Internal

    private let effectView = UIVisualEffectView(effect: nil)

    /// Liquid Glass needs both the iOS 26 SDK at build time and iOS 26 at runtime.
    private static var glassAvailable: Bool {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) { return true }
        #endif
        return false
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
        clipsToBounds = false
        effectView.layer.cornerCurve = .continuous
        addSubview(effectView)

        if !Self.glassAvailable {
            // The blur is clipped to the capsule; the shadow lives on this view
            effectView.clipsToBounds = true
            layer.shadowColor = UIColor.black.cgColor
            layer.shadowOpacity = 0.12
            layer.shadowRadius = 10
            layer.shadowOffset = CGSize(width: 0, height: 4)
        }
        applyEffect()
    }

    // MARK: - Layout

    public override func layoutSubviews() {
        super.layoutSubviews()
        effectView.frame = bounds
        let radius = min(bounds.width, bounds.height) / 2
        effectView.layer.cornerRadius = radius
        if !Self.glassAvailable {
            layer.shadowPath = UIBezierPath(roundedRect: bounds, cornerRadius: radius).cgPath
        }
    }

    // MARK: - Effect

    private func applyEffect() {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            let glass = UIGlassEffect(style: effectStyle == "clear" ? .clear : .regular)
            if let tintUIColor {
                glass.tintColor = tintUIColor
            }
            effectView.effect = glass
            effectView.contentView.backgroundColor = nil
            return
        }
        #endif
        effectView.effect = UIBlurEffect(
            style: effectStyle == "clear" ? .systemUltraThinMaterial : .systemThinMaterial
        )
        // UIBlurEffect has no tint; wash the content area with the color instead
        effectView.contentView.backgroundColor = tintUIColor?.withAlphaComponent(0.35)
    }
}
