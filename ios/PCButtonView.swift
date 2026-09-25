import UIKit

/// A native button: `UIButton` with a `UIButton.Configuration` chosen by the
/// variant, so it takes the system look of the iOS version it runs on.
@objcMembers
public final class PCButtonView: UIView {
    // MARK: - Props (set from ObjC++)

    public var label: String = "" {
        didSet {
            guard oldValue != label else { return }
            applyConfiguration()
            updateAccessibilityLabel()
        }
    }

    /// "filled" | "tonal" | "outlined" | "text" | "elevated" | "glass" | "prominentGlass"
    public var variant: String = "filled" {
        didSet { if oldValue != variant { applyConfiguration() } }
    }

    /// "xsmall" | "small" | "medium" | "large" | "xlarge"
    public var size: String = "small" {
        didSet { if oldValue != size { applyConfiguration() } }
    }

    /// "" (UIKit default) | "round" | "square"
    public var shape: String = "" {
        didSet { if oldValue != shape { applyConfiguration() } }
    }

    /// "leading" | "trailing"
    public var iconPosition: String = "leading" {
        didSet { if oldValue != iconPosition { applyConfiguration() } }
    }

    /// Corner radius in points; negative uses `shape`
    public var cornerRadius: CGFloat = -1 {
        didSet { if oldValue != cornerRadius { applyConfiguration() } }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { button.isEnabled = interactivity != "disabled" }
    }

    /// Spinner in place of the label and icon; presses are ignored
    public var loading: Bool = false {
        didSet {
            guard oldValue != loading else { return }
            // Not isEnabled, so the button keeps its enabled colors
            button.isUserInteractionEnabled = !loading
            applyConfiguration()
            updateAccessibilityLabel()
        }
    }

    /// Container color; nil keeps the configuration's color
    public var containerColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// Label and icon color; nil keeps the configuration's color
    public var foregroundColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// Container color while disabled; nil keeps the system disabled look
    public var disabledContainerColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// Label and icon color while disabled; nil keeps the system disabled look
    public var disabledForegroundColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// Label font; nil keeps the configuration's font
    public var labelFont: UIFont? {
        didSet { applyConfiguration() }
    }

    /// Cap on the default title font's Dynamic Type scaling; below 1 = no cap.
    /// (A labelStyle font is capped when it is built, in PCButton.mm.)
    public var maxFontSizeMultiplier: CGFloat = 0 {
        didSet { if oldValue != maxFontSizeMultiplier { applyConfiguration() } }
    }

    /// Screen-reader label; empty uses the label
    public var spokenLabel: String = "" {
        didSet { updateAccessibilityLabel() }
    }

    /// The `haptics` prop; PCButton.mm plays it on a press
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onPress: (() -> Void)?

    /// Called when content changed after layout (an icon finished loading),
    /// so the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let button = UIButton(type: .system)

    /// Hidden twin with the idle configuration, measured while loading so the
    /// spinner keeps the button's size.
    private let sizingButton = UIButton(type: .system)

    /// The button whose size the view reports.
    private var measuredButton: UIButton { loading ? sizingButton : button }

    private var icon = PCButtonSupport.Icon.none
    private var iconImage: UIImage?

    /// Bumped on every icon change so late image loads can't apply a stale icon.
    private var iconGeneration = 0

    /// The enabled state the current configuration was built for.
    private var configuredEnabled = true

    private var hasDisabledColors: Bool {
        disabledContainerColor != nil || disabledForegroundColor != nil
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
        button.translatesAutoresizingMaskIntoConstraints = false
        addSubview(button)

        NSLayoutConstraint.activate([
            button.topAnchor.constraint(equalTo: topAnchor),
            button.bottomAnchor.constraint(equalTo: bottomAnchor),
            button.leadingAnchor.constraint(equalTo: leadingAnchor),
            button.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])

        // Hidden, but in the hierarchy so it measures with the same traits
        sizingButton.isHidden = true
        sizingButton.isAccessibilityElement = false
        addSubview(sizingButton)

        button.addTarget(self, action: #selector(pressed), for: .touchUpInside)
        button.addTarget(self, action: #selector(touchedDown), for: .touchDown)
        // Custom disabled colors: rebuild the configuration when isEnabled flips
        button.configurationUpdateHandler = { [weak self] button in
            guard let self, self.hasDisabledColors, self.configuredEnabled != button.isEnabled else { return }
            button.configuration = self.makeConfiguration()
        }
        applyConfiguration()
    }

    @objc private func pressed() {
        guard !loading else { return }
        onPress?()
    }

    /// Readies the haptic for the press that is likely to follow.
    @objc private func touchedDown() {
        haptics.prepare(in: self)
    }

    /// The title is dropped while loading, so the label is kept explicitly.
    private func updateAccessibilityLabel() {
        if !spokenLabel.isEmpty {
            button.accessibilityLabel = spokenLabel
        } else {
            button.accessibilityLabel = loading && !label.isEmpty ? label : nil
        }
    }

    // MARK: - Props handling

    /// Sets the icon from the flat spec fields. Images that are still loading
    /// apply once they arrive.
    public func setIcon(type: String, name: String, uri: String, scale: CGFloat, tinted: Bool) {
        let next = PCButtonSupport.Icon(type: type, name: name, uri: uri, scale: scale, tinted: tinted)
        guard next != icon else { return }
        icon = next
        iconGeneration += 1
        let generation = iconGeneration

        iconImage = PCButtonSupport.image(for: next) { [weak self] image in
            guard let self, self.iconGeneration == generation else { return }
            self.iconImage = image
            self.applyConfiguration()
            self.onNeedsRemeasure?()
        }
        applyConfiguration()
    }

    private func applyConfiguration() {
        button.configuration = makeConfiguration()
        invalidateIntrinsicContentSize()
    }

    private func makeConfiguration() -> UIButton.Configuration {
        configuredEnabled = button.isEnabled
        var config = PCButtonSupport.makeConfiguration(
            variant: variant,
            selected: false,
            size: size,
            shape: shape,
            label: label,
            image: iconImage,
            containerColor: containerColor,
            foregroundColor: foregroundColor,
            font: labelFont,
            imagePlacement: iconPosition == "trailing" ? .trailing : .leading,
            cornerRadius: cornerRadius >= 0 ? cornerRadius : nil,
            maxFontSizeMultiplier: maxFontSizeMultiplier,
            traits: traitCollection
        )
        if !configuredEnabled {
            applyDisabledColors(to: &config)
        }
        if loading {
            // The idle configuration sizes the button; the spinner alone is
            // centred in it, as the image's replacement.
            sizingButton.configuration = config
            config.title = nil
            config.image = nil
            config.imagePadding = 0
            config.showsActivityIndicator = true
        } else {
            sizingButton.configuration = nil
        }
        return config
    }

    /// Replaces the system's disabled colors with the custom ones. The
    /// transformers run last, after UIKit's own state handling.
    private func applyDisabledColors(to config: inout UIButton.Configuration) {
        if let color = disabledContainerColor {
            config.background.backgroundColorTransformer = UIConfigurationColorTransformer { _ in color }
        }
        if let color = disabledForegroundColor {
            let font = config.titleTextAttributesTransformer
            config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
                var outgoing = font?(incoming) ?? incoming
                outgoing.foregroundColor = color
                return outgoing
            }
            config.imageColorTransformer = UIConfigurationColorTransformer { _ in color }
        }
    }

    // A capped title font is fixed, so it is rebuilt when the text size changes
    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard maxFontSizeMultiplier >= 1,
              previousTraitCollection?.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
        else { return }
        applyConfiguration()
        onNeedsRemeasure?()
    }

    // MARK: - Sizing

    public override var intrinsicContentSize: CGSize {
        measuredButton.intrinsicContentSize
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        measuredButton.sizeThatFits(size)
    }

    /// Called by the measuring pipeline to get the size for Yoga layout: the
    /// button's natural size, or its height at the given width.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let fitted = measuredButton.sizeThatFits(
            CGSize(width: constrainedSize.width > 0 ? constrainedSize.width : .greatestFiniteMagnitude,
                   height: .greatestFiniteMagnitude)
        )
        return CGSize(width: ceil(fitted.width), height: ceil(fitted.height))
    }
}
