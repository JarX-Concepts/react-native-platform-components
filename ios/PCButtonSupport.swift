import Symbols
import UIKit

/// UIButton configuration and icon handling shared by PCButtonView and
/// PCButtonGroupView.
enum PCButtonSupport {
    struct Icon: Hashable {
        /// "", "sfSymbol", "drawable" (ignored on iOS) or "image"
        var type: String = ""
        var name: String = ""
        var uri: String = ""
        var scale: CGFloat = 1
        var tinted: Bool = true
        var request: String = ""

        var isPresent: Bool { type == "sfSymbol" || type == "image" }

        static let none = Icon()

        init() {}

        init(type: String, name: String, uri: String, scale: CGFloat, tinted: Bool, request: String = "") {
            self.type = type
            self.name = name
            self.uri = uri
            self.scale = scale > 0 ? scale : 1
            self.tinted = tinted
            self.request = request
        }

        /// Reads the flat icon fields (iconType, iconName, ...) bridged as a dictionary.
        init(dictionary: [String: Any]) {
            let scale = (dictionary["iconScale"] as? NSNumber).map { CGFloat(truncating: $0) } ?? 1
            self.init(
                type: (dictionary["iconType"] as? String) ?? "",
                name: (dictionary["iconName"] as? String) ?? "",
                uri: (dictionary["iconUri"] as? String) ?? "",
                scale: scale,
                tinted: (dictionary["iconTinted"] as? String) != "false",
                request: (dictionary["iconRequest"] as? String) ?? ""
            )
        }
    }

    /// The configuration for a variant. A selected button (single / multiple
    /// selection in a group) uses the filled style, as UIKit's own toggle
    /// buttons do.
    ///
    /// | Variant  | Configuration |
    /// | filled   | .filled()     |
    /// | tonal    | .tinted()     |
    /// | outlined | .bordered()   |
    /// | text     | .plain()      |
    /// | elevated | .gray()       |
    /// | glass          | .glass() on iOS 26+, .gray() before          |
    /// | prominentGlass | .prominentGlass() on iOS 26+, .filled() before |
    /// | clearGlass          | .clearGlass() on iOS 26+, .gray() before          |
    /// | prominentClearGlass | .prominentClearGlass() on iOS 26+, .filled() before |
    ///
    /// Selected glass buttons, clear or not, use the prominent glass style.
    static func configuration(variant: String, selected: Bool) -> UIButton.Configuration {
        if selected {
            switch variant {
            // Prominent clear glass has no tint unless given a color, so a
            // selected clear glass button takes the prominent glass too
            case "glass", "prominentGlass", "clearGlass", "prominentClearGlass": return prominentGlass()
            default: return .filled()
            }
        }
        switch variant {
        case "tonal": return .tinted()
        case "outlined": return .bordered()
        case "text": return .plain()
        case "elevated": return .gray()
        case "glass": return glassConfiguration()
        case "prominentGlass": return prominentGlass()
        case "clearGlass": return clearGlass()
        case "prominentClearGlass": return prominentClearGlass()
        default: return .filled()
        }
    }

    /// The variant a toggle button shows. UIKit gives most configurations a
    /// selected look of their own (tinted becomes filled; bordered, plain,
    /// gray and glass become tinted), but none for the prominent styles and
    /// clear glass. Those toggles show a quieter style while off (filled is
    /// gray, prominent glass is glass), and clear glass takes the prominent
    /// glass while on.
    static func toggleVariant(_ variant: String, selected: Bool) -> String {
        switch variant {
        case "filled": return selected ? "filled" : "elevated"
        case "prominentGlass": return selected ? "prominentGlass" : "glass"
        case "clearGlass", "prominentClearGlass": return selected ? "prominentGlass" : "clearGlass"
        default: return variant
        }
    }

    /// `.glass()` needs the iOS 26 SDK and runtime; `.gray()` otherwise.
    private static func glassConfiguration() -> UIButton.Configuration {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) { return .glass() }
        #endif
        return .gray()
    }

    /// `.prominentGlass()` needs the iOS 26 SDK and runtime; `.filled()` otherwise.
    private static func prominentGlass() -> UIButton.Configuration {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) { return .prominentGlass() }
        #endif
        return .filled()
    }

    /// `.clearGlass()` needs the iOS 26 SDK and runtime; `.gray()` otherwise.
    private static func clearGlass() -> UIButton.Configuration {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) { return .clearGlass() }
        #endif
        return .gray()
    }

    /// `.prominentClearGlass()` needs the iOS 26 SDK and runtime; `.filled()` otherwise.
    private static func prominentClearGlass() -> UIButton.Configuration {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) { return .prominentClearGlass() }
        #endif
        return .filled()
    }

    /// Material's five sizes onto UIKit's four.
    static func buttonSize(_ size: String) -> UIButton.Configuration.Size {
        switch size {
        case "xsmall": return .mini
        case "medium": return .medium
        case "large", "xlarge": return .large
        default: return .small
        }
    }

    /// `nil` keeps UIKit's dynamic corner style.
    static func cornerStyle(_ shape: String) -> UIButton.Configuration.CornerStyle? {
        switch shape {
        case "round": return .capsule
        case "square": return .large
        default: return nil
        }
    }

    static func makeConfiguration(
        variant: String,
        selected: Bool,
        size: String,
        shape: String,
        label: String,
        image: UIImage?,
        containerColor: UIColor?,
        foregroundColor: UIColor?,
        font: UIFont?,
        imagePlacement: NSDirectionalRectEdge = .leading,
        cornerRadius: CGFloat? = nil,
        maxFontSizeMultiplier: CGFloat = 0,
        traits: UITraitCollection? = nil
    ) -> UIButton.Configuration {
        var config = configuration(variant: variant, selected: selected)
        config.title = label.isEmpty ? nil : label
        config.image = image
        config.imagePadding = (image != nil && !label.isEmpty) ? 8 : 0
        config.imagePlacement = imagePlacement
        config.buttonSize = buttonSize(size)
        config.titleLineBreakMode = .byTruncatingTail
        if let cornerRadius {
            // A numeric radius overrides the shape
            config.cornerStyle = .fixed
            config.background.cornerRadius = cornerRadius
        } else if let corner = cornerStyle(shape) {
            config.cornerStyle = corner
        }
        if let containerColor {
            config.baseBackgroundColor = containerColor
        }
        if let foregroundColor {
            config.baseForegroundColor = foregroundColor
        }
        var titleFont = font
        if titleFont == nil, maxFontSizeMultiplier >= 1, !label.isEmpty, let traits,
           let systemFont = defaultTitleFont(for: config) {
            titleFont = cappedFont(systemFont, maxFontSizeMultiplier: maxFontSizeMultiplier, traits: traits)
        }
        if let titleFont {
            config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
                var outgoing = incoming
                outgoing.font = titleFont
                return outgoing
            }
        }
        return config
    }

    /// The title font UIKit picks for a configuration, read from a throwaway
    /// button.
    private static func defaultTitleFont(for config: UIButton.Configuration) -> UIFont? {
        let probe = UIButton(configuration: config)
        probe.updateConfiguration()
        probe.layoutIfNeeded()
        return probe.titleLabel?.font
    }

    /// Caps a Dynamic Type font at `maxFontSizeMultiplier` times its size at
    /// the default content size category, as React Native's `Text` does. The
    /// size is read for `traits`, so the probe's own traits don't matter.
    /// nil when the cap doesn't bind, or the font has no text style (it
    /// doesn't scale), so UIKit keeps its own font.
    static func cappedFont(_ font: UIFont, maxFontSizeMultiplier: CGFloat, traits: UITraitCollection) -> UIFont? {
        guard maxFontSizeMultiplier >= 1,
              let style = font.fontDescriptor.object(forKey: .textStyle) as? String
        else { return nil }
        let textStyle = UIFont.TextStyle(rawValue: style)
        let defaultTraits = UITraitCollection(preferredContentSizeCategory: .large)
        let base = UIFont.preferredFont(forTextStyle: textStyle, compatibleWith: defaultTraits).pointSize
        let current = UIFont.preferredFont(forTextStyle: textStyle, compatibleWith: traits).pointSize
        let cap = base * maxFontSizeMultiplier
        guard current > cap else { return nil }
        // A plain system font at the capped size: a font that keeps its text
        // style could be scaled again by the label.
        let fontTraits = font.fontDescriptor.object(forKey: .traits) as? [UIFontDescriptor.TraitKey: Any]
        let weight = (fontTraits?[.weight] as? CGFloat).map { UIFont.Weight($0) } ?? .regular
        return UIFont.systemFont(ofSize: cap, weight: weight)
    }

    /// Resolves the icon's image. SF Symbols resolve synchronously; images
    /// that are still loading return nil and call `completion` on the main
    /// thread once they arrive.
    static func image(for icon: Icon, completion: @escaping (UIImage?) -> Void) -> UIImage? {
        switch icon.type {
        case "sfSymbol":
            return PCImageLoader.symbol(named: icon.name).map { decorate($0, tinted: icon.tinted) }

        case "image":
            let cached = PCImageLoader.shared.image(uri: icon.uri, scale: icon.scale, request: icon.request) { image in
                completion(image.map { decorate($0, tinted: icon.tinted) })
            }
            return cached.map { decorate($0, tinted: icon.tinted) }

        default:
            return nil
        }
    }

    /// Template images take the button's foreground color; untinted images
    /// keep their own colors.
    static func decorate(_ image: UIImage, tinted: Bool) -> UIImage {
        image.withRenderingMode(tinted ? .alwaysTemplate : .alwaysOriginal)
    }
}

/// SF Symbol effects for Button's `ios.symbolEffect`, through
/// `UIImageView.addSymbolEffect`. `bounce`, `pulse` and `variableColor` need
/// iOS 17; `wiggle`, `rotate` and `breathe` iOS 18. Unknown names and effects
/// the running iOS doesn't have do nothing.
@available(iOS 17.0, *)
enum PCSymbolEffects {
    /// Adds the effect: repeating until the image view's effects are
    /// removed, or played once.
    static func add(_ name: String, to view: UIImageView, repeating: Bool) {
        switch name {
        case "bounce":
            if repeating {
                if #available(iOS 18.0, *) {
                    indefinite(.bounce, view)
                } else {
                    // Bounce is a one-shot effect on iOS 17; repeat it
                    discrete(.bounce, view, options: .repeating)
                }
            } else {
                discrete(.bounce, view)
            }
        case "pulse":
            repeating ? indefinite(.pulse, view) : discrete(.pulse, view)
        case "variableColor":
            repeating ? indefinite(.variableColor, view) : discrete(.variableColor, view)
        case "wiggle":
            if #available(iOS 18.0, *) {
                repeating ? indefinite(.wiggle, view) : discrete(.wiggle, view)
            }
        case "rotate":
            if #available(iOS 18.0, *) {
                repeating ? indefinite(.rotate, view) : discrete(.rotate, view)
            }
        case "breathe":
            if #available(iOS 18.0, *) {
                repeating ? indefinite(.breathe, view) : discrete(.breathe, view)
            }
        default:
            break
        }
    }

    // Typed entry points, so an effect that is both discrete and indefinite
    // takes the overload that matches the mode.

    private static func discrete(
        _ effect: some DiscreteSymbolEffect & SymbolEffect,
        _ view: UIImageView,
        options: SymbolEffectOptions = .default
    ) {
        view.addSymbolEffect(effect, options: options)
    }

    private static func indefinite(_ effect: some IndefiniteSymbolEffect & SymbolEffect, _ view: UIImageView) {
        view.addSymbolEffect(effect)
    }
}
