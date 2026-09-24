import UIKit

/// iOS has no floating action button, so this is the system's prominent
/// button in a round shape: a `UIButton` with the `.prominentGlass()`
/// configuration on iOS 26 (`.filled()` before), a circle with the icon, or a
/// capsule with the icon and the label when extended. Shrinking and extending
/// animate between the two, following the `extended` prop or a linked
/// ScrollView.
///
/// The button sits at the trailing edge of this view, so it shrinks toward
/// that edge; the view keeps the extended size until the button has shrunk,
/// and takes it before the button extends, so a trailing-anchored button
/// doesn't jump.
@objcMembers
public final class PCFloatingActionButtonView: UIView {
    // MARK: - Props (set from ObjC++)

    public var label: String = "" {
        didSet {
            guard oldValue != label else { return }
            shownExtended = targetExtended
            applyConfiguration()
            updateAccessibilityLabel()
            onNeedsRemeasure?()
        }
    }

    /// "small" | "regular" | "medium" | "large"
    public var size: String = "regular" {
        didSet {
            guard oldValue != size else { return }
            applyConfiguration()
            onNeedsRemeasure?()
        }
    }

    /// Whether a button with a label shows it
    public var extended: Bool = true {
        didSet { if oldValue != extended { updateExtended(animated: true) } }
    }

    /// Container color; nil keeps the configuration's (the tint color)
    public var containerColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// Icon and label color; nil keeps the configuration's
    public var foregroundColor: UIColor? {
        didSet { applyConfiguration() }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { button.isEnabled = interactivity != "disabled" }
    }

    /// Screen-reader label; empty uses the label
    public var spokenLabel: String = "" {
        didSet { updateAccessibilityLabel() }
    }

    /// nativeID of the ScrollView whose scrolling shrinks and extends the button
    public var scrollViewNativeID: String = "" {
        didSet {
            guard oldValue != scrollViewNativeID else { return }
            detachScrollView()
            attachScrollView()
        }
    }

    // MARK: - Events back to ObjC++

    public var onPress: (() -> Void)?

    /// Called when the size the view should take changed, so the Fabric
    /// measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let button = UIButton(type: .system)

    /// Hidden twin in the extended configuration, measured for the extended size.
    private let sizingButton = UIButton(type: .system)

    private var icon = PCButtonSupport.Icon.none
    private var iconImage: UIImage?

    /// Bumped on every icon change so late image loads can't apply a stale icon.
    private var iconGeneration = 0

    /// Shrunk by scrolling down the linked ScrollView.
    private var scrollShrunk = false

    /// The state the button shows, or is animating to.
    private var shownExtended = false

    /// A shrink animation is running: the view keeps the extended size.
    private var shrinking = false

    private weak var observedScrollView: UIScrollView?
    private var scrollObservation: NSKeyValueObservation?
    private var lastOffsetY: CGFloat = 0

    private var targetExtended: Bool { !label.isEmpty && extended && !scrollShrunk }

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
        // Hidden, but in the hierarchy so it measures with the same traits
        sizingButton.isHidden = true
        sizingButton.isAccessibilityElement = false
        addSubview(sizingButton)

        // Frame layout: the button's width animates inside this view
        addSubview(button)
        button.addTarget(self, action: #selector(pressed), for: .touchUpInside)
        applyConfiguration()
    }

    @objc private func pressed() {
        onPress?()
    }

    /// The label stays the spoken name while the button is shrunk.
    private func updateAccessibilityLabel() {
        let spoken = spokenLabel.isEmpty ? label : spokenLabel
        button.accessibilityLabel = spoken.isEmpty ? nil : spoken
    }

    // MARK: - Icon

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
        onNeedsRemeasure?()
    }

    // MARK: - Metrics

    /// Diameter of the round button, and height of the extended capsule. The
    /// small button keeps the 44pt minimum touch target.
    private var diameter: CGFloat {
        switch size {
        case "small": return 44
        case "medium": return 80
        case "large": return 96
        default: return 56
        }
    }

    private var symbolPointSize: CGFloat {
        switch size {
        case "small": return 17
        case "medium": return 26
        case "large": return 32
        default: return 22
        }
    }

    private var titleTextStyle: UIFont.TextStyle {
        switch size {
        case "medium": return .title3
        case "large": return .title2
        default: return .headline
        }
    }

    /// Leading and trailing space of the extended capsule, and between icon and label.
    private var horizontalInset: CGFloat {
        switch size {
        case "small": return 16
        case "medium": return 26
        case "large": return 28
        default: return 20
        }
    }

    private var iconSpacing: CGFloat {
        switch size {
        case "medium": return 12
        case "large": return 16
        default: return 8
        }
    }

    // MARK: - Configuration

    private func applyConfiguration() {
        button.configuration = makeConfiguration(extended: shownExtended)
        sizingButton.configuration = label.isEmpty ? nil : makeConfiguration(extended: true)
        setNeedsLayout()
    }

    /// The prominent button: `.prominentGlass()` on iOS 26, `.filled()` before.
    private func makeConfiguration(extended: Bool) -> UIButton.Configuration {
        var config = PCButtonSupport.configuration(variant: "prominentGlass", selected: false)
        config.cornerStyle = .capsule
        config.image = iconImage
        config.preferredSymbolConfigurationForImage =
            UIImage.SymbolConfiguration(pointSize: symbolPointSize, weight: .semibold)
        let showsLabel = extended && !label.isEmpty
        config.title = showsLabel ? label : nil
        config.titleLineBreakMode = .byTruncatingTail
        config.imagePadding = showsLabel && iconImage != nil ? iconSpacing : 0
        config.contentInsets = showsLabel
            ? NSDirectionalEdgeInsets(top: 0, leading: horizontalInset, bottom: 0, trailing: horizontalInset)
            : .zero
        if let containerColor {
            config.baseBackgroundColor = containerColor
        }
        if let foregroundColor {
            config.baseForegroundColor = foregroundColor
        }
        // A semibold title in the size's text style, following Dynamic Type
        let font = UIFont.systemFont(
            ofSize: UIFont.preferredFont(forTextStyle: titleTextStyle).pointSize,
            weight: .semibold
        )
        config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var outgoing = incoming
            outgoing.font = font
            return outgoing
        }
        return config
    }

    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard previousTraitCollection?.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
        else { return }
        applyConfiguration()
        onNeedsRemeasure?()
    }

    // MARK: - Shrink and extend

    private func updateExtended(animated: Bool) {
        let target = targetExtended
        guard target != shownExtended else { return }
        shownExtended = target
        if target {
            // Take the extended size first; the button widens from the trailing edge
            shrinking = false
            onNeedsRemeasure?()
        } else {
            shrinking = true
        }
        guard animated, window != nil else {
            shrinking = false
            applyConfiguration()
            layoutButton()
            onNeedsRemeasure?()
            return
        }
        UIView.animate(
            withDuration: target ? 0.3 : 0.25,
            delay: 0,
            options: [.beginFromCurrentState, .curveEaseInOut, .allowUserInteraction]
        ) {
            self.applyConfiguration()
            self.layoutButton()
            self.button.layoutIfNeeded()
        } completion: { _ in
            // A later change may have taken over
            guard !target, !self.shownExtended, self.shrinking else { return }
            self.shrinking = false
            self.onNeedsRemeasure?()
        }
    }

    // MARK: - Scroll link

    private func attachScrollView() {
        guard observedScrollView == nil, !scrollViewNativeID.isEmpty, let window,
              let scrollView = PCFloatingActionButtonView.scrollView(nativeID: scrollViewNativeID, in: window)
        else { return }
        observedScrollView = scrollView
        lastOffsetY = clampedOffset(scrollView)
        scrollObservation = scrollView.observe(\.contentOffset, options: [.new]) { [weak self] scrollView, _ in
            self?.contentScrolled(scrollView)
        }
    }

    private func detachScrollView() {
        scrollObservation?.invalidate()
        scrollObservation = nil
        observedScrollView = nil
        if scrollShrunk {
            scrollShrunk = false
            updateExtended(animated: window != nil)
        }
    }

    /// The offset within the content, so the bounce past either end doesn't
    /// count as scrolling.
    private func clampedOffset(_ scrollView: UIScrollView) -> CGFloat {
        let minY = -scrollView.adjustedContentInset.top
        let maxY = max(minY, scrollView.contentSize.height + scrollView.adjustedContentInset.bottom - scrollView.bounds.height)
        return min(max(scrollView.contentOffset.y, minY), maxY)
    }

    private func contentScrolled(_ scrollView: UIScrollView) {
        let y = clampedOffset(scrollView)
        let dy = y - lastOffsetY
        lastOffsetY = y
        guard abs(dy) > 0.5 else { return }
        // Shrink scrolling down; extend scrolling up, and always at the top
        let atTop = y <= -scrollView.adjustedContentInset.top + 1
        let shrink = !atTop && dy > 0
        guard shrink != scrollShrunk else { return }
        scrollShrunk = shrink
        updateExtended(animated: true)
    }

    /// The UIScrollView of the React Native view with this nativeID.
    private static func scrollView(nativeID: String, in root: UIView) -> UIScrollView? {
        var match: UIView?
        func find(_ view: UIView) {
            guard match == nil else { return }
            if view.responds(to: NSSelectorFromString("nativeId")),
               view.value(forKey: "nativeId") as? String == nativeID {
                match = view
                return
            }
            view.subviews.forEach(find)
        }
        find(root)
        guard let match else { return nil }
        if let scroll = match as? UIScrollView { return scroll }
        var scroll: UIScrollView?
        func firstScroll(_ view: UIView) {
            guard scroll == nil else { return }
            if let s = view as? UIScrollView { scroll = s; return }
            view.subviews.forEach(firstScroll)
        }
        firstScroll(match)
        return scroll
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window == nil {
            detachScrollView()
        } else {
            attachScrollView()
        }
    }

    // MARK: - Layout

    /// The extended capsule's size, at least the round button's.
    private var extendedSize: CGSize {
        let fitted = sizingButton.sizeThatFits(
            CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        )
        return CGSize(width: max(diameter, ceil(fitted.width)), height: max(diameter, ceil(fitted.height)))
    }

    /// The button's size in the state it shows.
    private var buttonSize: CGSize {
        shownExtended ? extendedSize : CGSize(width: diameter, height: diameter)
    }

    private func layoutButton() {
        let size = buttonSize
        let trailing = effectiveUserInterfaceLayoutDirection == .rightToLeft
            ? size.width
            : bounds.width
        button.frame = CGRect(
            x: trailing - size.width,
            y: (bounds.height - size.height) / 2,
            width: size.width,
            height: size.height
        )
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        layoutButton()
        // The ScrollView may mount after the button
        attachScrollView()
    }

    public override var intrinsicContentSize: CGSize {
        sizeForLayout(withConstrainedTo: .zero)
    }

    /// Called by the measuring pipeline: the button's size, or the extended
    /// size while the button shrinks.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        shownExtended || shrinking ? extendedSize : CGSize(width: diameter, height: diameter)
    }
}
