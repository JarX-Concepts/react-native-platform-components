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
    }

    private func applyCornerRadius() {
        layer.cornerRadius = glassCornerRadius
        layer.cornerCurve = .continuous
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

// MARK: - UIColor parsing extension

private extension UIColor {
    /// Parses color strings in React Native compatible formats:
    /// - Hex: #RGB, #RRGGBB, #RRGGBBAA
    /// - RGB: rgb(r, g, b) where r, g, b are 0-255
    /// - RGBA: rgba(r, g, b, a) where r, g, b are 0-255 and a is 0-1
    /// - HSL: hsl(h, s%, l%) where h is 0-360, s and l are 0-100
    /// - HSLA: hsla(h, s%, l%, a) where h is 0-360, s and l are 0-100, a is 0-1
    /// - Named colors: red, blue, transparent, etc. (CSS named colors)
    convenience init?(pcColor: String) {
        let trimmed = pcColor.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        // Try named colors first
        if let namedColor = UIColor.namedColors[trimmed] {
            self.init(red: namedColor.r, green: namedColor.g, blue: namedColor.b, alpha: namedColor.a)
            return
        }

        // Try rgba format: rgba(r, g, b, a)
        if trimmed.hasPrefix("rgba(") && trimmed.hasSuffix(")") {
            let inner = String(trimmed.dropFirst(5).dropLast(1))
            let components = inner.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            guard components.count == 4,
                  let r = Double(components[0]),
                  let g = Double(components[1]),
                  let b = Double(components[2]),
                  let a = Double(components[3]) else { return nil }
            self.init(
                red: CGFloat(r) / 255.0,
                green: CGFloat(g) / 255.0,
                blue: CGFloat(b) / 255.0,
                alpha: CGFloat(a)
            )
            return
        }

        // Try rgb format: rgb(r, g, b)
        if trimmed.hasPrefix("rgb(") && trimmed.hasSuffix(")") {
            let inner = String(trimmed.dropFirst(4).dropLast(1))
            let components = inner.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            guard components.count == 3,
                  let r = Double(components[0]),
                  let g = Double(components[1]),
                  let b = Double(components[2]) else { return nil }
            self.init(
                red: CGFloat(r) / 255.0,
                green: CGFloat(g) / 255.0,
                blue: CGFloat(b) / 255.0,
                alpha: 1.0
            )
            return
        }

        // Try hsla format: hsla(h, s%, l%, a)
        if trimmed.hasPrefix("hsla(") && trimmed.hasSuffix(")") {
            let inner = String(trimmed.dropFirst(5).dropLast(1))
            let components = inner.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "%", with: "") }
            guard components.count == 4,
                  let h = Double(components[0]),
                  let s = Double(components[1]),
                  let l = Double(components[2]),
                  let a = Double(components[3]) else { return nil }
            let rgb = UIColor.hslToRgb(h: h / 360.0, s: s / 100.0, l: l / 100.0)
            self.init(red: rgb.r, green: rgb.g, blue: rgb.b, alpha: CGFloat(a))
            return
        }

        // Try hsl format: hsl(h, s%, l%)
        if trimmed.hasPrefix("hsl(") && trimmed.hasSuffix(")") {
            let inner = String(trimmed.dropFirst(4).dropLast(1))
            let components = inner.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "%", with: "") }
            guard components.count == 3,
                  let h = Double(components[0]),
                  let s = Double(components[1]),
                  let l = Double(components[2]) else { return nil }
            let rgb = UIColor.hslToRgb(h: h / 360.0, s: s / 100.0, l: l / 100.0)
            self.init(red: rgb.r, green: rgb.g, blue: rgb.b, alpha: 1.0)
            return
        }

        // Fall back to hex parsing
        var hexSanitized = trimmed.replacingOccurrences(of: "#", with: "")

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

    // Keep old name for backwards compatibility
    convenience init?(pcHex: String) {
        self.init(pcColor: pcHex)
    }

    // HSL to RGB conversion
    private static func hslToRgb(h: Double, s: Double, l: Double) -> (r: CGFloat, g: CGFloat, b: CGFloat) {
        if s == 0 {
            return (CGFloat(l), CGFloat(l), CGFloat(l))
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s
        let p = 2 * l - q

        func hueToRgb(_ p: Double, _ q: Double, _ t: Double) -> Double {
            var t = t
            if t < 0 { t += 1 }
            if t > 1 { t -= 1 }
            if t < 1/6 { return p + (q - p) * 6 * t }
            if t < 1/2 { return q }
            if t < 2/3 { return p + (q - p) * (2/3 - t) * 6 }
            return p
        }

        return (
            CGFloat(hueToRgb(p, q, h + 1/3)),
            CGFloat(hueToRgb(p, q, h)),
            CGFloat(hueToRgb(p, q, h - 1/3))
        )
    }

    // CSS named colors (React Native compatible)
    private static let namedColors: [String: (r: CGFloat, g: CGFloat, b: CGFloat, a: CGFloat)] = [
        "transparent": (0, 0, 0, 0),
        "aliceblue": (240/255, 248/255, 255/255, 1),
        "antiquewhite": (250/255, 235/255, 215/255, 1),
        "aqua": (0, 255/255, 255/255, 1),
        "aquamarine": (127/255, 255/255, 212/255, 1),
        "azure": (240/255, 255/255, 255/255, 1),
        "beige": (245/255, 245/255, 220/255, 1),
        "bisque": (255/255, 228/255, 196/255, 1),
        "black": (0, 0, 0, 1),
        "blanchedalmond": (255/255, 235/255, 205/255, 1),
        "blue": (0, 0, 255/255, 1),
        "blueviolet": (138/255, 43/255, 226/255, 1),
        "brown": (165/255, 42/255, 42/255, 1),
        "burlywood": (222/255, 184/255, 135/255, 1),
        "cadetblue": (95/255, 158/255, 160/255, 1),
        "chartreuse": (127/255, 255/255, 0, 1),
        "chocolate": (210/255, 105/255, 30/255, 1),
        "coral": (255/255, 127/255, 80/255, 1),
        "cornflowerblue": (100/255, 149/255, 237/255, 1),
        "cornsilk": (255/255, 248/255, 220/255, 1),
        "crimson": (220/255, 20/255, 60/255, 1),
        "cyan": (0, 255/255, 255/255, 1),
        "darkblue": (0, 0, 139/255, 1),
        "darkcyan": (0, 139/255, 139/255, 1),
        "darkgoldenrod": (184/255, 134/255, 11/255, 1),
        "darkgray": (169/255, 169/255, 169/255, 1),
        "darkgreen": (0, 100/255, 0, 1),
        "darkgrey": (169/255, 169/255, 169/255, 1),
        "darkkhaki": (189/255, 183/255, 107/255, 1),
        "darkmagenta": (139/255, 0, 139/255, 1),
        "darkolivegreen": (85/255, 107/255, 47/255, 1),
        "darkorange": (255/255, 140/255, 0, 1),
        "darkorchid": (153/255, 50/255, 204/255, 1),
        "darkred": (139/255, 0, 0, 1),
        "darksalmon": (233/255, 150/255, 122/255, 1),
        "darkseagreen": (143/255, 188/255, 143/255, 1),
        "darkslateblue": (72/255, 61/255, 139/255, 1),
        "darkslategray": (47/255, 79/255, 79/255, 1),
        "darkslategrey": (47/255, 79/255, 79/255, 1),
        "darkturquoise": (0, 206/255, 209/255, 1),
        "darkviolet": (148/255, 0, 211/255, 1),
        "deeppink": (255/255, 20/255, 147/255, 1),
        "deepskyblue": (0, 191/255, 255/255, 1),
        "dimgray": (105/255, 105/255, 105/255, 1),
        "dimgrey": (105/255, 105/255, 105/255, 1),
        "dodgerblue": (30/255, 144/255, 255/255, 1),
        "firebrick": (178/255, 34/255, 34/255, 1),
        "floralwhite": (255/255, 250/255, 240/255, 1),
        "forestgreen": (34/255, 139/255, 34/255, 1),
        "fuchsia": (255/255, 0, 255/255, 1),
        "gainsboro": (220/255, 220/255, 220/255, 1),
        "ghostwhite": (248/255, 248/255, 255/255, 1),
        "gold": (255/255, 215/255, 0, 1),
        "goldenrod": (218/255, 165/255, 32/255, 1),
        "gray": (128/255, 128/255, 128/255, 1),
        "green": (0, 128/255, 0, 1),
        "greenyellow": (173/255, 255/255, 47/255, 1),
        "grey": (128/255, 128/255, 128/255, 1),
        "honeydew": (240/255, 255/255, 240/255, 1),
        "hotpink": (255/255, 105/255, 180/255, 1),
        "indianred": (205/255, 92/255, 92/255, 1),
        "indigo": (75/255, 0, 130/255, 1),
        "ivory": (255/255, 255/255, 240/255, 1),
        "khaki": (240/255, 230/255, 140/255, 1),
        "lavender": (230/255, 230/255, 250/255, 1),
        "lavenderblush": (255/255, 240/255, 245/255, 1),
        "lawngreen": (124/255, 252/255, 0, 1),
        "lemonchiffon": (255/255, 250/255, 205/255, 1),
        "lightblue": (173/255, 216/255, 230/255, 1),
        "lightcoral": (240/255, 128/255, 128/255, 1),
        "lightcyan": (224/255, 255/255, 255/255, 1),
        "lightgoldenrodyellow": (250/255, 250/255, 210/255, 1),
        "lightgray": (211/255, 211/255, 211/255, 1),
        "lightgreen": (144/255, 238/255, 144/255, 1),
        "lightgrey": (211/255, 211/255, 211/255, 1),
        "lightpink": (255/255, 182/255, 193/255, 1),
        "lightsalmon": (255/255, 160/255, 122/255, 1),
        "lightseagreen": (32/255, 178/255, 170/255, 1),
        "lightskyblue": (135/255, 206/255, 250/255, 1),
        "lightslategray": (119/255, 136/255, 153/255, 1),
        "lightslategrey": (119/255, 136/255, 153/255, 1),
        "lightsteelblue": (176/255, 196/255, 222/255, 1),
        "lightyellow": (255/255, 255/255, 224/255, 1),
        "lime": (0, 255/255, 0, 1),
        "limegreen": (50/255, 205/255, 50/255, 1),
        "linen": (250/255, 240/255, 230/255, 1),
        "magenta": (255/255, 0, 255/255, 1),
        "maroon": (128/255, 0, 0, 1),
        "mediumaquamarine": (102/255, 205/255, 170/255, 1),
        "mediumblue": (0, 0, 205/255, 1),
        "mediumorchid": (186/255, 85/255, 211/255, 1),
        "mediumpurple": (147/255, 112/255, 219/255, 1),
        "mediumseagreen": (60/255, 179/255, 113/255, 1),
        "mediumslateblue": (123/255, 104/255, 238/255, 1),
        "mediumspringgreen": (0, 250/255, 154/255, 1),
        "mediumturquoise": (72/255, 209/255, 204/255, 1),
        "mediumvioletred": (199/255, 21/255, 133/255, 1),
        "midnightblue": (25/255, 25/255, 112/255, 1),
        "mintcream": (245/255, 255/255, 250/255, 1),
        "mistyrose": (255/255, 228/255, 225/255, 1),
        "moccasin": (255/255, 228/255, 181/255, 1),
        "navajowhite": (255/255, 222/255, 173/255, 1),
        "navy": (0, 0, 128/255, 1),
        "oldlace": (253/255, 245/255, 230/255, 1),
        "olive": (128/255, 128/255, 0, 1),
        "olivedrab": (107/255, 142/255, 35/255, 1),
        "orange": (255/255, 165/255, 0, 1),
        "orangered": (255/255, 69/255, 0, 1),
        "orchid": (218/255, 112/255, 214/255, 1),
        "palegoldenrod": (238/255, 232/255, 170/255, 1),
        "palegreen": (152/255, 251/255, 152/255, 1),
        "paleturquoise": (175/255, 238/255, 238/255, 1),
        "palevioletred": (219/255, 112/255, 147/255, 1),
        "papayawhip": (255/255, 239/255, 213/255, 1),
        "peachpuff": (255/255, 218/255, 185/255, 1),
        "peru": (205/255, 133/255, 63/255, 1),
        "pink": (255/255, 192/255, 203/255, 1),
        "plum": (221/255, 160/255, 221/255, 1),
        "powderblue": (176/255, 224/255, 230/255, 1),
        "purple": (128/255, 0, 128/255, 1),
        "rebeccapurple": (102/255, 51/255, 153/255, 1),
        "red": (255/255, 0, 0, 1),
        "rosybrown": (188/255, 143/255, 143/255, 1),
        "royalblue": (65/255, 105/255, 225/255, 1),
        "saddlebrown": (139/255, 69/255, 19/255, 1),
        "salmon": (250/255, 128/255, 114/255, 1),
        "sandybrown": (244/255, 164/255, 96/255, 1),
        "seagreen": (46/255, 139/255, 87/255, 1),
        "seashell": (255/255, 245/255, 238/255, 1),
        "sienna": (160/255, 82/255, 45/255, 1),
        "silver": (192/255, 192/255, 192/255, 1),
        "skyblue": (135/255, 206/255, 235/255, 1),
        "slateblue": (106/255, 90/255, 205/255, 1),
        "slategray": (112/255, 128/255, 144/255, 1),
        "slategrey": (112/255, 128/255, 144/255, 1),
        "snow": (255/255, 250/255, 250/255, 1),
        "springgreen": (0, 255/255, 127/255, 1),
        "steelblue": (70/255, 130/255, 180/255, 1),
        "tan": (210/255, 180/255, 140/255, 1),
        "teal": (0, 128/255, 128/255, 1),
        "thistle": (216/255, 191/255, 216/255, 1),
        "tomato": (255/255, 99/255, 71/255, 1),
        "turquoise": (64/255, 224/255, 208/255, 1),
        "violet": (238/255, 130/255, 238/255, 1),
        "wheat": (245/255, 222/255, 179/255, 1),
        "white": (255/255, 255/255, 255/255, 1),
        "whitesmoke": (245/255, 245/255, 245/255, 1),
        "yellow": (255/255, 255/255, 0, 1),
        "yellowgreen": (154/255, 205/255, 50/255, 1)
    ]
}
