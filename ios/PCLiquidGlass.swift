import UIKit

/// Glass effect style enum for bridging to ObjC++
@objc public enum PCLiquidGlassEffectStyle: Int {
    case regular
    case clear
    case none

    #if compiler(>=6.2)
    @available(iOS 26.0, *)
    var glassStyle: UIGlassEffect.Style? {
        switch self {
        case .regular:
            return .regular
        case .clear:
            return .clear
        case .none:
            return nil
        }
    }
    #endif
}

#if compiler(>=6.2)

/// The actual Liquid Glass view implementation for iOS 26+
/// Extends UIVisualEffectView to properly support UIGlassEffect
@available(iOS 26.0, *)
@objcMembers
public final class PCLiquidGlassView: UIVisualEffectView {

    // MARK: - Static

    @objc public static var isSupported: Bool {
        return true
    }

    // MARK: - Props (set from ObjC++)

    private var isFirstMount: Bool = true

    /// Effect style: "clear", "regular", "none"
    public var effectStyle: String = "regular" {
        didSet { applyGlassEffect() }
    }

    /// Corner radius for the glass effect
    public var glassCornerRadius: CGFloat = 0 {
        didSet { applyCornerRadius() }
    }

    /// Enable touch interaction feedback
    public var interactive: Bool = false

    /// Tint color for the glass effect (hex string)
    public var glassTintColor: String? {
        didSet { applyGlassEffect() }
    }

    /// Color scheme: "light", "dark", "system"
    public var colorScheme: String = "system" {
        didSet { applyColorScheme() }
    }

    /// Shadow radius for glow effect
    public var glassShadowRadius: CGFloat = 20 {
        didSet { applyShadow() }
    }

    /// Manual highlight state control (no-op on iOS 26+, use `interactive` instead)
    /// The native UIGlassEffect.isInteractive handles touch-based highlighting automatically
    public var isHighlighted: Bool = false

    /// Callback for press events with touch coordinates
    public var onPressCallback: ((CGFloat, CGFloat) -> Void)?

    // MARK: - Init

    public override init(effect: UIVisualEffect?) {
        super.init(effect: effect)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        clipsToBounds = false
        setupTapGesture()
    }

    private func setupTapGesture() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        addGestureRecognizer(tap)
    }

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: self)
        onPressCallback?(location.x, location.y)
    }

    // MARK: - Layout

    public override func layoutSubviews() {
        super.layoutSubviews()

        // Apply glass effect on first layout when we have bounds
        if effect == nil && bounds.size != .zero {
            applyGlassEffect()
        }
    }

    // MARK: - Public Setup (called from ObjC++ after props are set)

    /// Call this after setting props to apply/re-apply the glass effect
    @objc public func setupView() {
        applyGlassEffect()
    }

    // MARK: - Glass Effect

    private func applyGlassEffect() {
        guard bounds.size != .zero else { return }

        // Parse effect style
        let style: PCLiquidGlassEffectStyle
        switch effectStyle {
        case "clear":
            style = .clear
        case "none":
            style = .none
        default:
            style = .regular
        }

        // Handle "none" style
        guard let glassStyle = style.glassStyle else {
            UIView.animate(withDuration: 0.2) {
                self.effect = nil
            }
            return
        }

        // Create the glass effect
        let glassEffect = UIGlassEffect(style: glassStyle)
        glassEffect.isInteractive = interactive

        // Apply tint color
        if let tintHex = glassTintColor, !tintHex.isEmpty,
           let color = UIColor(pcHex: tintHex) {
            glassEffect.tintColor = color
        }

        // Apply the effect
        if isFirstMount {
            self.effect = glassEffect
            isFirstMount = false
        } else {
            UIView.animate(withDuration: 0.2) {
                self.effect = glassEffect
            }
        }

        applyCornerRadius()
        applyShadow()
    }

    private func applyCornerRadius() {
        layer.cornerRadius = glassCornerRadius
        layer.cornerCurve = .continuous
        // Don't clip to bounds - allow shadow to show
    }

    private func applyShadow() {
        if glassShadowRadius > 0 {
            layer.shadowColor = UIColor.white.cgColor
            layer.shadowOpacity = 0.2
            layer.shadowRadius = glassShadowRadius
            layer.shadowOffset = .zero
            layer.masksToBounds = false
        } else {
            layer.shadowOpacity = 0
        }
    }

    private func applyColorScheme() {
        switch colorScheme {
        case "light":
            overrideUserInterfaceStyle = .light
        case "dark":
            overrideUserInterfaceStyle = .dark
        default:
            overrideUserInterfaceStyle = .unspecified
        }
        applyGlassEffect()
    }

    // MARK: - Sizing

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        return size
    }

    public override var intrinsicContentSize: CGSize {
        return CGSize(width: UIView.noIntrinsicMetric, height: UIView.noIntrinsicMetric)
    }
}

#else

/// Fallback for older Swift compilers (pre-iOS 26 SDK)
/// Uses UIBlurEffect as a fallback
@objcMembers
public final class PCLiquidGlassView: UIVisualEffectView {

    @objc public static var isSupported: Bool {
        return false
    }

    public var effectStyle: String = "regular" {
        didSet { applyFallbackEffect() }
    }

    public var glassCornerRadius: CGFloat = 0 {
        didSet { applyCornerRadius() }
    }

    public var interactive: Bool = false
    public var glassTintColor: String?
    public var colorScheme: String = "system" {
        didSet { applyColorScheme() }
    }
    public var glassShadowRadius: CGFloat = 20
    public var isHighlighted: Bool = false
    public var onPressCallback: ((CGFloat, CGFloat) -> Void)?

    public override init(effect: UIVisualEffect?) {
        super.init(effect: effect)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        clipsToBounds = false
        setupTapGesture()
        applyFallbackEffect()
    }

    private func setupTapGesture() {
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        addGestureRecognizer(tap)
    }

    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: self)
        onPressCallback?(location.x, location.y)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        if effect == nil && bounds.size != .zero {
            applyFallbackEffect()
        }
    }

    /// Call this after setting props to apply/re-apply the effect
    @objc public func setupView() {
        applyFallbackEffect()
    }

    private func applyFallbackEffect() {
        guard effectStyle != "none" else {
            self.effect = nil
            return
        }

        // Use thin blur materials as fallback
        let blurStyle: UIBlurEffect.Style
        switch (effectStyle, colorScheme) {
        case ("clear", "dark"):
            blurStyle = .systemUltraThinMaterialDark
        case ("clear", "light"):
            blurStyle = .systemUltraThinMaterialLight
        case ("clear", _):
            blurStyle = .systemUltraThinMaterial
        case (_, "dark"):
            blurStyle = .systemThinMaterialDark
        case (_, "light"):
            blurStyle = .systemThinMaterialLight
        default:
            blurStyle = .systemThinMaterial
        }

        self.effect = UIBlurEffect(style: blurStyle)
        applyCornerRadius()
    }

    private func applyCornerRadius() {
        layer.cornerRadius = glassCornerRadius
        layer.cornerCurve = .continuous
        clipsToBounds = glassCornerRadius > 0
    }

    private func applyColorScheme() {
        switch colorScheme {
        case "light":
            overrideUserInterfaceStyle = .light
        case "dark":
            overrideUserInterfaceStyle = .dark
        default:
            overrideUserInterfaceStyle = .unspecified
        }
        applyFallbackEffect()
    }
}

#endif

// MARK: - UIColor hex extension

private extension UIColor {
    convenience init?(pcHex: String) {
        var hexSanitized = pcHex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

        let length = hexSanitized.count
        if length == 6 {
            self.init(
                red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
                green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
                blue: CGFloat(rgb & 0x0000FF) / 255.0,
                alpha: 1.0
            )
        } else if length == 8 {
            self.init(
                red: CGFloat((rgb & 0xFF000000) >> 24) / 255.0,
                green: CGFloat((rgb & 0x00FF0000) >> 16) / 255.0,
                blue: CGFloat((rgb & 0x0000FF00) >> 8) / 255.0,
                alpha: CGFloat(rgb & 0x000000FF) / 255.0
            )
        } else {
            return nil
        }
    }
}
