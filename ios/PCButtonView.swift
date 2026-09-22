import UIKit

/// A native button: `UIButton` with a `UIButton.Configuration` chosen by the
/// variant, so it takes the system look of the iOS version it runs on.
@objcMembers
public final class PCButtonView: UIView {
    // MARK: - Props (set from ObjC++)

    public var label: String = "" {
        didSet { if oldValue != label { applyConfiguration() } }
    }

    /// "filled" | "tonal" | "outlined" | "text" | "elevated"
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

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { button.isEnabled = interactivity != "disabled" }
    }

    /// Container color; nil keeps the configuration's color
    public var containerColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// Label and icon color; nil keeps the configuration's color
    public var foregroundColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// Label font; nil keeps the configuration's font
    public var labelFont: UIFont? {
        didSet { applyConfiguration() }
    }

    /// Screen-reader label; empty uses the label
    public var spokenLabel: String = "" {
        didSet { button.accessibilityLabel = spokenLabel.isEmpty ? nil : spokenLabel }
    }

    // MARK: - Events back to ObjC++

    public var onPress: (() -> Void)?

    /// Called when content changed after layout (an icon finished loading),
    /// so the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let button = UIButton(type: .system)
    private var icon = PCButtonSupport.Icon.none
    private var iconImage: UIImage?

    /// Bumped on every icon change so late image loads can't apply a stale icon.
    private var iconGeneration = 0

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

        button.addTarget(self, action: #selector(pressed), for: .touchUpInside)
        applyConfiguration()
    }

    @objc private func pressed() {
        onPress?()
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
        button.configuration = PCButtonSupport.makeConfiguration(
            variant: variant,
            selected: false,
            size: size,
            shape: shape,
            label: label,
            image: iconImage,
            containerColor: containerColor,
            foregroundColor: foregroundColor,
            font: labelFont
        )
        invalidateIntrinsicContentSize()
    }

    // MARK: - Sizing

    public override var intrinsicContentSize: CGSize {
        button.intrinsicContentSize
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        button.sizeThatFits(size)
    }

    /// Called by the measuring pipeline to get the size for Yoga layout: the
    /// button's natural size, or its height at the given width.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let fitted = button.sizeThatFits(
            CGSize(width: constrainedSize.width > 0 ? constrainedSize.width : .greatestFiniteMagnitude,
                   height: .greatestFiniteMagnitude)
        )
        return CGSize(width: ceil(fitted.width), height: ceil(fitted.height))
    }
}
