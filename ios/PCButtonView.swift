import UIKit

/// A native button: `UIButton` with a `UIButton.Configuration` chosen by the
/// variant, so it takes the system look of the iOS version it runs on. It can
/// be a toggle (`changesSelectionAsPrimaryAction`), open a `UIMenu` as its
/// primary action, and animate its SF Symbol.
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

    /// "filled" | "tonal" | "outlined" | "text" | "elevated" | "glass" |
    /// "prominentGlass" | "clearGlass" | "prominentClearGlass"
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

    /// "leading" | "trailing" | "top" | "bottom"
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

    /// ObjC++ sets this as an array of dictionaries: the flattened menu items
    public var menuItems: [Any] = [] {
        didSet {
            items = PCMenuSupport.items(from: menuItems)
            updateMenu()
        }
    }

    /// The `haptics` prop: PCButton.mm plays it on a press (a toggle's
    /// included), the menu handler on a pick
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onPress: (() -> Void)?
    /// A toggle was pressed; the state it asks for.
    public var onSelectedChange: ((Bool) -> Void)?
    public var onMenuSelect: ((String, String) -> Void)? // (id, title)
    public var onMenuOpen: (() -> Void)?
    public var onMenuClose: (() -> Void)?

    /// Called when content changed after layout (an icon finished loading),
    /// so the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    /// Reports when its menu opens and closes (see PCMenuSupport.swift).
    private let button = PCMenuButton(type: .system)

    /// Hidden twin with the idle configuration, measured while loading so the
    /// spinner keeps the button's size.
    private let sizingButton = UIButton(type: .system)

    /// The button whose size the view reports.
    private var measuredButton: UIButton { loading ? sizingButton : button }

    private var icon = PCButtonSupport.Icon.none
    private var iconImage: UIImage?

    /// Bumped on every icon change so late image loads can't apply a stale icon.
    private var iconGeneration = 0

    /// The enabled and selected states the current configuration was built for.
    private var configuredEnabled = true
    private var configuredSelected = false

    private var hasDisabledColors: Bool {
        disabledContainerColor != nil || disabledForegroundColor != nil
    }

    /// Whether the button is a toggle, and its controlled state.
    private var isToggle = false
    private var controlledSelected = false

    private var items: [PCMenuItem] = []
    private let menuImages = PCMenuImageState()
    private var hasMenu: Bool { !items.isEmpty }

    /// "" or an effect name; see `setSymbolEffect`.
    private var symbolEffect = ""
    private var symbolEffectTrigger = ""

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

        // A menu is the primary action only while there is one
        button.showsMenuAsPrimaryAction = false
        button.onMenuOpen = { [weak self] in self?.onMenuOpen?() }
        button.onMenuClose = { [weak self] in self?.onMenuClose?() }

        button.addTarget(self, action: #selector(pressed), for: .touchUpInside)
        button.addTarget(self, action: #selector(touchedDown), for: .touchDown)
        // Rebuild the configuration when isEnabled flips (custom disabled
        // colors) or a toggle's isSelected does (see toggleVariant)
        button.configurationUpdateHandler = { [weak self] button in
            guard let self else { return }
            let enabledChanged = self.hasDisabledColors && self.configuredEnabled != button.isEnabled
            let selectedChanged = self.isToggle && self.configuredSelected != button.isSelected
            guard enabledChanged || selectedChanged else { return }
            button.configuration = self.makeConfiguration()
        }
        applyConfiguration()
    }

    @objc private func pressed() {
        guard !loading, !hasMenu else { return }
        if isToggle {
            // A press asks for the opposite of the controlled state. UIKit
            // flips isSelected right away; syncSelected runs again once JS
            // has answered, so the controlled value decides.
            onSelectedChange?(!controlledSelected)
        }
        onPress?()
    }

    /// Readies the haptic for the press that is likely to follow.
    @objc private func touchedDown() {
        haptics.prepare(in: self)
    }

    // MARK: - Toggle

    /// Applies the controlled toggle state: "" (not a toggle) | "true" |
    /// "false". Called on every change of the prop and after every
    /// `onSelectedChange`, so a state the parent didn't take goes back.
    public func syncSelected(_ value: String) {
        let wasToggle = isToggle
        isToggle = !value.isEmpty
        controlledSelected = value == "true"
        updatePrimaryAction()
        if button.isSelected != controlledSelected {
            // The configuration follows in configurationUpdateHandler
            button.isSelected = controlledSelected
        } else if wasToggle != isToggle {
            applyConfiguration()
        }
    }

    /// A menu, when there is one, is the primary action; otherwise a toggle
    /// flips its selection (UIKit's toggle button).
    private func updatePrimaryAction() {
        button.showsMenuAsPrimaryAction = hasMenu
        button.changesSelectionAsPrimaryAction = isToggle && !hasMenu
    }

    // MARK: - Menu

    private func updateMenu() {
        menuImages.retain(icons: items.map(\.icon))
        button.setMenu(hasMenu ? buildMenu() : nil)
        updatePrimaryAction()
    }

    private func buildMenu() -> UIMenu {
        PCMenuSupport.menu(
            title: "",
            items: items,
            imageState: menuImages,
            onImageLoaded: { [weak self] in self?.updateMenu() },
            handler: { [weak self] item in
                guard let self else { return }
                self.haptics.perform(in: self, override: item.haptics)
                self.onMenuSelect?(item.id, item.title)
            }
        )
    }

    // MARK: - Symbol effects

    /// Animates the SF Symbol icon. With an empty `trigger` the effect repeats
    /// until it is unset; otherwise it plays once whenever `trigger` changes
    /// (not for the first value).
    public func setSymbolEffect(_ effect: String, trigger: String) {
        let modeChanged = effect != symbolEffect || trigger.isEmpty != symbolEffectTrigger.isEmpty
        let triggerChanged = trigger != symbolEffectTrigger
        symbolEffect = effect
        symbolEffectTrigger = trigger
        if modeChanged {
            restartSymbolEffect()
        } else if triggerChanged {
            playSymbolEffectOnce()
        }
    }

    /// The image view showing the SF Symbol, or nil for other icons.
    private var symbolImageView: UIImageView? {
        guard icon.type == "sfSymbol", !loading, iconImage != nil else { return nil }
        // The configuration's image view is created on layout
        button.layoutIfNeeded()
        return button.imageView
    }

    /// Removes any effect, then starts the repeating one when there is no
    /// trigger.
    private func restartSymbolEffect() {
        guard #available(iOS 17.0, *) else { return }
        button.imageView?.removeAllSymbolEffects(animated: false)
        guard symbolEffectTrigger.isEmpty, let imageView = symbolImageView else { return }
        PCSymbolEffects.add(symbolEffect, to: imageView, repeating: true)
    }

    private func playSymbolEffectOnce() {
        guard #available(iOS 17.0, *), let imageView = symbolImageView else { return }
        PCSymbolEffects.add(symbolEffect, to: imageView, repeating: false)
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
    public func setIcon(type: String, name: String, request: String, uri: String, scale: CGFloat, tinted: Bool) {
        let next = PCButtonSupport.Icon(type: type, name: name, uri: uri, scale: scale, tinted: tinted, request: request)
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
        // A repeating effect starts over on the new image (and stops while
        // loading, which drops the image).
        if !symbolEffect.isEmpty && symbolEffectTrigger.isEmpty {
            restartSymbolEffect()
        }
    }

    private var imagePlacement: NSDirectionalRectEdge {
        switch iconPosition {
        case "trailing": return .trailing
        case "top": return .top
        case "bottom": return .bottom
        default: return .leading
        }
    }

    private func makeConfiguration() -> UIButton.Configuration {
        configuredEnabled = button.isEnabled
        configuredSelected = button.isSelected
        var config = PCButtonSupport.makeConfiguration(
            variant: isToggle ? PCButtonSupport.toggleVariant(variant, selected: configuredSelected) : variant,
            selected: false,
            size: size,
            shape: shape,
            label: label,
            image: iconImage,
            containerColor: containerColor,
            foregroundColor: foregroundColor,
            font: labelFont,
            imagePlacement: imagePlacement,
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
