import UIKit

/// One chip: a capsule `UIButton` (Liquid Glass on iOS 26, prominent glass
/// with the tint color while selected; gray and filled before), with an
/// optional trailing xmark button laid over its end that removes the chip.
/// UIKit has no chip control, so Chip and ChipGroup both build on this.
///
/// Selection is controlled: the cell shows `model.selected` and only reports
/// presses.
final class PCChipCell: UIView {
    struct Model: Equatable {
        var label = ""
        var icon = PCButtonSupport.Icon.none
        var selected = false
        var closeIcon = false
        var disabled = false
        /// What VoiceOver announces for the chip; empty = the label.
        var accessibilityLabel = ""
        /// What VoiceOver announces for the close button; empty = "Remove <label>".
        var closeAccessibilityLabel = ""
        var testID = ""
        var closeTestID = ""
    }

    /// Width of the close button at the chip's trailing end, at the default
    /// text size; it grows with the xmark at larger sizes.
    static let closeWidth: CGFloat = 30
    /// The chip's horizontal padding.
    static let horizontalPadding: CGFloat = 12

    let button = UIButton(type: .system)
    private var closeButton: UIButton?

    private(set) var model = Model()
    private var image: UIImage?
    private var maxFontSizeMultiplier: CGFloat = 0
    /// The close button's width for the current text size
    private var closeSlotWidth = PCChipCell.closeWidth

    var onPress: (() -> Void)?
    var onClose: (() -> Void)?
    var onTouchDown: (() -> Void)?
    /// Called after the cell rebuilt its title for a new text size, so the
    /// owner can lay out and remeasure
    var onTextSizeChange: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        clipsToBounds = false
        button.addTarget(self, action: #selector(pressed), for: .touchUpInside)
        button.addTarget(self, action: #selector(touchedDown), for: .touchDown)
        addSubview(button)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) is not supported")
    }

    /// Applies the chip's content and state.
    func configure(_ model: Model, image: UIImage?, maxFontSizeMultiplier: CGFloat) {
        self.model = model
        self.image = image
        self.maxFontSizeMultiplier = maxFontSizeMultiplier
        apply()
    }

    // The title font is fixed at the current text size, so it is rebuilt when
    // the text size changes. The cell handles this itself: when its owner
    // hears of the change, UIKit hasn't passed the new traits down to the
    // cell yet, and a font built then keeps the old size.
    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard let previousTraitCollection,
              previousTraitCollection.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
        else { return }
        apply()
        onTextSizeChange?()
    }

    private func apply() {
        let font = titleFont()
        // Room for the xmark (sized from the font in updateCloseButton) and
        // the padding around it
        closeSlotWidth = max(Self.closeWidth, Self.xmarkPointSize(for: font) + 19)
        // Unselected glass / gray, selected prominent glass / filled
        var config = PCButtonSupport.makeConfiguration(
            variant: model.selected ? "prominentGlass" : "glass",
            selected: false,
            size: "small",
            shape: "round",
            label: model.label,
            image: image,
            containerColor: nil,
            foregroundColor: foregroundColor,
            font: font
        )
        config.imagePadding = image != nil ? 6 : 0
        config.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(font: font, scale: .small)
        config.contentInsets = NSDirectionalEdgeInsets(
            top: 6,
            leading: Self.horizontalPadding,
            bottom: 6,
            trailing: model.closeIcon ? closeSlotWidth : Self.horizontalPadding
        )
        button.configuration = config
        // The selected trait, which VoiceOver announces. The configuration
        // above already has the selected look.
        button.isSelected = model.selected
        button.isEnabled = !model.disabled
        button.accessibilityLabel = model.accessibilityLabel.isEmpty ? model.label : model.accessibilityLabel
        button.accessibilityIdentifier = model.testID.isEmpty ? nil : model.testID

        updateCloseButton(font: font)
        setNeedsLayout()
    }

    /// The label and icon color: the label color on the glass (gray), white
    /// on the tinted prominent glass (filled).
    private var foregroundColor: UIColor {
        model.selected ? .white : .label
    }

    private static func xmarkPointSize(for font: UIFont) -> CGFloat {
        round(font.pointSize * 0.75)
    }

    /// Subheadline, medium weight, capped at `maxFontSizeMultiplier`.
    private func titleFont() -> UIFont {
        let base = UIFont.preferredFont(forTextStyle: .subheadline, compatibleWith: traitCollection)
        let font = UIFont.systemFont(ofSize: base.pointSize, weight: .medium)
        guard maxFontSizeMultiplier >= 1 else { return font }
        let defaultTraits = UITraitCollection(preferredContentSizeCategory: .large)
        let defaultSize = UIFont.preferredFont(forTextStyle: .subheadline, compatibleWith: defaultTraits).pointSize
        let cap = defaultSize * maxFontSizeMultiplier
        return font.pointSize > cap ? UIFont.systemFont(ofSize: cap, weight: .medium) : font
    }

    private func updateCloseButton(font: UIFont) {
        guard model.closeIcon else {
            closeButton?.removeFromSuperview()
            closeButton = nil
            return
        }
        let close: UIButton
        if let existing = closeButton {
            close = existing
        } else {
            close = UIButton(type: .system)
            close.addTarget(self, action: #selector(closePressed), for: .touchUpInside)
            close.addTarget(self, action: #selector(touchedDown), for: .touchDown)
            addSubview(close)
            closeButton = close
        }
        var config = UIButton.Configuration.plain()
        config.image = UIImage(systemName: "xmark")
        config.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(
            pointSize: Self.xmarkPointSize(for: font),
            weight: .semibold
        )
        config.baseForegroundColor = model.selected ? UIColor.white.withAlphaComponent(0.85) : .secondaryLabel
        config.contentInsets = .zero
        close.configuration = config
        close.isEnabled = !model.disabled
        close.accessibilityLabel = model.closeAccessibilityLabel.isEmpty
            ? "Remove \(model.label)"
            : model.closeAccessibilityLabel
        close.accessibilityIdentifier = model.closeTestID.isEmpty ? nil : model.closeTestID
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        button.frame = bounds
        if let close = closeButton {
            // The xmark sits in the button's trailing padding
            let rtl = effectiveUserInterfaceLayoutDirection == .rightToLeft
            let width = min(closeSlotWidth + 4, bounds.width)
            close.frame = CGRect(
                x: rtl ? 0 : bounds.width - width,
                y: 0,
                width: width,
                height: bounds.height
            )
        }
    }

    /// The chip's natural size: one line of label, at most `maxWidth` wide.
    func fittingSize(maxWidth: CGFloat = .greatestFiniteMagnitude) -> CGSize {
        let size = button.sizeThatFits(CGSize(width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude))
        let width = min(max(ceil(size.width), ceil(size.height)), maxWidth)
        return CGSize(width: width, height: ceil(size.height))
    }

    @objc private func touchedDown() {
        onTouchDown?()
    }

    @objc private func pressed() {
        onPress?()
    }

    @objc private func closePressed() {
        onClose?()
    }
}

/// A standalone chip (Chip).
@objcMembers
public final class PCChipView: UIView {
    // MARK: - Props (set from ObjC++)

    public var label: String = "" {
        didSet { if oldValue != label { apply() } }
    }

    /// "assist" | "filter" | "input" | "suggestion": the Material chip type.
    /// iOS has one chip look; the variant is kept for parity.
    public var variant: String = "assist"

    /// "" (not selectable) | "true" | "false"
    public var selected: String = "" {
        didSet { if oldValue != selected { apply() } }
    }

    public var closeIcon: Bool = false {
        didSet { if oldValue != closeIcon { apply() } }
    }

    public var closeAccessibilityLabel: String = "" {
        didSet { if oldValue != closeAccessibilityLabel { apply() } }
    }

    public var closeTestID: String = "" {
        didSet { if oldValue != closeTestID { apply() } }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { if oldValue != interactivity { apply() } }
    }

    public var maxFontSizeMultiplier: CGFloat = 0 {
        didSet { if oldValue != maxFontSizeMultiplier { apply() } }
    }

    /// Screen-reader label; empty = the label
    public var spokenLabel: String = "" {
        didSet { if oldValue != spokenLabel { apply() } }
    }

    /// The `haptics` prop: PCChip.mm plays it on a press or a close
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onPress: (() -> Void)?
    public var onClose: (() -> Void)?

    /// Called when the content changed size after layout (an icon finished
    /// loading, the text size changed), so the Fabric measurement can be
    /// refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let cell = PCChipCell()
    private var icon = PCButtonSupport.Icon.none
    private var image: UIImage?
    private var iconGeneration = 0

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        addSubview(cell)
        cell.onTouchDown = { [weak self] in
            guard let self else { return }
            self.haptics.prepare(in: self)
        }
        cell.onPress = { [weak self] in self?.onPress?() }
        cell.onClose = { [weak self] in self?.onClose?() }
        cell.onTextSizeChange = { [weak self] in
            guard let self else { return }
            self.invalidateIntrinsicContentSize()
            self.setNeedsLayout()
            self.onNeedsRemeasure?()
        }
        apply()
    }

    public func setIcon(type: String, name: String, request: String, uri: String, scale: CGFloat, tinted: Bool) {
        let next = PCButtonSupport.Icon(type: type, name: name, uri: uri, scale: scale, tinted: tinted, request: request)
        guard next != icon else { return }
        icon = next
        iconGeneration += 1
        let generation = iconGeneration
        image = PCButtonSupport.image(for: next) { [weak self] loaded in
            guard let self, self.iconGeneration == generation else { return }
            self.image = loaded
            self.apply()
            self.onNeedsRemeasure?()
        }
        apply()
    }

    private func apply() {
        cell.configure(
            PCChipCell.Model(
                label: label,
                icon: icon,
                selected: selected == "true",
                closeIcon: closeIcon,
                disabled: interactivity == "disabled",
                accessibilityLabel: spokenLabel,
                closeAccessibilityLabel: closeAccessibilityLabel,
                testID: "",
                closeTestID: closeTestID
            ),
            image: image,
            maxFontSizeMultiplier: maxFontSizeMultiplier
        )
        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        cell.frame = bounds
    }

    // MARK: - Sizing

    public override var intrinsicContentSize: CGSize {
        cell.fittingSize()
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        cell.fittingSize()
    }

    /// Called by the measuring pipeline to get the size for Yoga layout: the
    /// chip's natural size; Yoga clamps it to the available width.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        cell.fittingSize()
    }
}
