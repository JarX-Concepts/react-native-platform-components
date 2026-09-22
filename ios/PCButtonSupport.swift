import UIKit

/// UIButton configuration and icon handling shared by PCButtonView and
/// PCButtonGroupView.
enum PCButtonSupport {
    struct Icon: Equatable {
        /// "", "sfSymbol", "drawable" (ignored on iOS) or "image"
        var type: String = ""
        var name: String = ""
        var uri: String = ""
        var scale: CGFloat = 1
        var tinted: Bool = true

        var isPresent: Bool { type == "sfSymbol" || type == "image" }

        static let none = Icon()

        init() {}

        init(type: String, name: String, uri: String, scale: CGFloat, tinted: Bool) {
            self.type = type
            self.name = name
            self.uri = uri
            self.scale = scale > 0 ? scale : 1
            self.tinted = tinted
        }

        /// Reads the flat icon fields (iconType, iconName, ...) bridged as a dictionary.
        init(dictionary: [String: Any]) {
            let scale = (dictionary["iconScale"] as? NSNumber).map { CGFloat(truncating: $0) } ?? 1
            self.init(
                type: (dictionary["iconType"] as? String) ?? "",
                name: (dictionary["iconName"] as? String) ?? "",
                uri: (dictionary["iconUri"] as? String) ?? "",
                scale: scale,
                tinted: (dictionary["iconTinted"] as? String) != "false"
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
    static func configuration(variant: String, selected: Bool) -> UIButton.Configuration {
        if selected { return .filled() }
        switch variant {
        case "tonal": return .tinted()
        case "outlined": return .bordered()
        case "text": return .plain()
        case "elevated": return .gray()
        default: return .filled()
        }
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
        font: UIFont?
    ) -> UIButton.Configuration {
        var config = configuration(variant: variant, selected: selected)
        config.title = label.isEmpty ? nil : label
        config.image = image
        config.imagePadding = (image != nil && !label.isEmpty) ? 8 : 0
        config.buttonSize = buttonSize(size)
        config.titleLineBreakMode = .byTruncatingTail
        if let corner = cornerStyle(shape) {
            config.cornerStyle = corner
        }
        if let containerColor {
            config.baseBackgroundColor = containerColor
        }
        if let foregroundColor {
            config.baseForegroundColor = foregroundColor
        }
        if let font {
            config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
                var outgoing = incoming
                outgoing.font = font
                return outgoing
            }
        }
        return config
    }

    /// Resolves the icon's image. SF Symbols resolve synchronously; images
    /// that are still loading return nil and call `completion` on the main
    /// thread once they arrive.
    static func image(for icon: Icon, completion: @escaping (UIImage?) -> Void) -> UIImage? {
        switch icon.type {
        case "sfSymbol":
            return UIImage(systemName: icon.name).map { decorate($0, tinted: icon.tinted) }

        case "image":
            let cached = PCImageLoader.shared.image(uri: icon.uri, scale: icon.scale) { image in
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
