import UIKit

// MARK: - Segment model (bridged from ObjC++ as dictionaries)

struct PCSegmentedControlSegment {
    let label: String
    let value: String
    let disabled: Bool
    /// "", "sfSymbol", "drawable" (ignored on iOS) or "image"
    let iconType: String
    let iconName: String
    let iconUri: String
    let iconScale: CGFloat
    let iconTinted: Bool
    let badge: String
    let accessibilityLabel: String
    let testID: String

    var hasIcon: Bool { iconType == "sfSymbol" || iconType == "image" }

    /// What VoiceOver announces for the segment, badge included.
    var spokenLabel: String {
        let base = accessibilityLabel.isEmpty ? label : accessibilityLabel
        return badge.isEmpty ? base : "\(base), \(badge)"
    }
}

/// A capsule badge drawn over a segment's top-right corner.
private final class PCBadgeLabel: UILabel {
    static let height: CGFloat = 16
    static let horizontalPadding: CGFloat = 5

    override init(frame: CGRect) {
        super.init(frame: frame)
        font = .systemFont(ofSize: 11, weight: .semibold)
        textAlignment = .center
        layer.cornerRadius = Self.height / 2
        clipsToBounds = true
        isUserInteractionEnabled = false
        // The segment announces the badge; don't expose it twice
        isAccessibilityElement = false
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override var intrinsicContentSize: CGSize {
        let base = super.intrinsicContentSize
        return CGSize(
            width: max(Self.height, base.width + Self.horizontalPadding * 2),
            height: Self.height
        )
    }
}

@objcMembers
public final class PCSegmentedControlView: UIControl {
    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries; see `rebuildControl` for keys.
    public var segments: [Any] = [] { didSet { rebuildControl() } }

    /// "auto" | "labeled" | "unlabeled"
    public var labelVisibility: String = "auto" {
        didSet { if oldValue != labelVisibility { rebuildControl() } }
    }

    /// Controlled selection by value. "" = no selection.
    public var selectedValue: String = "" { didSet { updateSelection() } }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" { didSet { updateEnabled() } }

    /// iOS-specific: momentary mode (segment springs back after touch)
    public var momentary: Bool = false { didSet { control.isMomentary = momentary } }

    /// iOS-specific: segment widths proportional to content
    public var apportionsSegmentWidthsByContent: Bool = false {
        didSet { control.apportionsSegmentWidthsByContent = apportionsSegmentWidthsByContent }
    }

    /// Background of the selected segment
    public var selectedSegmentColor: UIColor? {
        didSet { control.selectedSegmentTintColor = selectedSegmentColor }
    }

    /// Text / icon color of the selected segment
    public var activeTintColor: UIColor? { didSet { updateTitleAttributes() } }

    /// Text / icon color of unselected segments
    public var inactiveTintColor: UIColor? { didSet { updateTitleAttributes() } }

    /// Label font; nil keeps the system font
    public var labelFont: UIFont? {
        didSet {
            updateTitleAttributes()
            invalidateIntrinsicContentSize()
        }
    }

    /// Badge background; nil = system red
    public var badgeBackgroundColor: UIColor? { didSet { updateBadgeColors() } }

    /// Badge text color; nil = white
    public var badgeTextColor: UIColor? { didSet { updateBadgeColors() } }

    /// The `haptics` prop; PCSegmentedControl.mm plays it on a user selection
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onSelect: ((Int, String) -> Void)?  // (index, value)

    /// Called when content changed after layout (an icon finished loading),
    /// so the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    private let control = UISegmentedControl()
    private var parsedSegments: [PCSegmentedControlSegment] = []

    /// Bumped on every rebuild so late image loads can't touch a stale control.
    private var rebuildGeneration = 0

    /// Badge label per segment index (only segments with a badge have one).
    private var badgeLabels: [Int: PCBadgeLabel] = [:]

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
        // Badges overhang the top edge slightly
        clipsToBounds = false

        control.translatesAutoresizingMaskIntoConstraints = false
        addSubview(control)

        NSLayoutConstraint.activate([
            control.topAnchor.constraint(equalTo: topAnchor),
            control.bottomAnchor.constraint(equalTo: bottomAnchor),
            control.leadingAnchor.constraint(equalTo: leadingAnchor),
            control.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])

        control.addTarget(self, action: #selector(valueChanged), for: .valueChanged)
    }

    @objc private func valueChanged() {
        let index = control.selectedSegmentIndex
        guard index != UISegmentedControl.noSegment,
              index >= 0, index < parsedSegments.count else { return }

        let segment = parsedSegments[index]
        onSelect?(index, segment.value)
        if !momentary {
            // UIKit selects immediately; restore the controlled value if
            // the parent keeps its previous selection.
            DispatchQueue.main.async { [weak self] in self?.updateSelection() }
        }
    }

    // MARK: - Props handling

    private func rebuildControl() {
        parsedSegments = segments.compactMap { any in
            guard let dict = any as? [String: Any] else { return nil }
            let scale = (dict["iconScale"] as? NSNumber).map { CGFloat(truncating: $0) } ?? 1
            return PCSegmentedControlSegment(
                label: (dict["label"] as? String) ?? "",
                value: (dict["value"] as? String) ?? "",
                disabled: (dict["disabled"] as? String) == "disabled",
                iconType: (dict["iconType"] as? String) ?? "",
                iconName: (dict["iconName"] as? String) ?? "",
                iconUri: (dict["iconUri"] as? String) ?? "",
                iconScale: scale > 0 ? scale : 1,
                iconTinted: (dict["iconTinted"] as? String) != "false",
                badge: (dict["badge"] as? String) ?? "",
                accessibilityLabel: (dict["accessibilityLabel"] as? String) ?? "",
                testID: (dict["testID"] as? String) ?? ""
            )
        }

        rebuildGeneration += 1
        let generation = rebuildGeneration
        control.removeAllSegments()

        for (index, segment) in parsedSegments.enumerated() {
            if let image = iconImage(for: segment, generation: generation) {
                control.insertSegment(with: image, at: index, animated: false)
            } else {
                control.insertSegment(withTitle: segment.label, at: index, animated: false)
            }

            // Set enabled state for this segment
            control.setEnabled(!segment.disabled, forSegmentAt: index)
        }

        rebuildBadges()
        updateSelection()
        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    // MARK: - Badges

    private func rebuildBadges() {
        badgeLabels.values.forEach { $0.removeFromSuperview() }
        badgeLabels = [:]

        for (index, segment) in parsedSegments.enumerated() where !segment.badge.isEmpty {
            let label = PCBadgeLabel()
            label.text = segment.badge
            addSubview(label)
            badgeLabels[index] = label
        }

        updateBadgeColors()
        setNeedsLayout()
    }

    private func updateBadgeColors() {
        for label in badgeLabels.values {
            label.backgroundColor = badgeBackgroundColor ?? .systemRed
            label.textColor = badgeTextColor ?? .white
        }
    }

    /// Frames of the individual segments in the control's coordinate space.
    /// UISegmentedControl lays each segment out as its own subview, so their
    /// frames honor proportional widths; if the hierarchy ever looks different
    /// fall back to equal division.
    private func segmentFrames() -> [CGRect] {
        let count = control.numberOfSegments
        guard count > 0 else { return [] }

        let segmentViews = self.segmentViews()
        if segmentViews.count == count {
            return segmentViews.map { control.convert($0.bounds, from: $0) }
        }

        let width = control.bounds.width / CGFloat(count)
        return (0..<count).map {
            CGRect(x: CGFloat($0) * width, y: 0, width: width, height: control.bounds.height)
        }
    }

    /// The control's segment views in index order (right to left in RTL).
    private func segmentViews() -> [UIView] {
        // Direct subviews before iOS 26; inside a container view on iOS 26
        var found: [UIView] = []
        func collect(_ view: UIView) {
            for sub in view.subviews {
                if NSStringFromClass(type(of: sub)) == "UISegment" {
                    found.append(sub)
                } else {
                    collect(sub)
                }
            }
        }
        collect(control)
        let views = found.sorted {
            control.convert($0.bounds, from: $0).minX < control.convert($1.bounds, from: $1).minX
        }
        return control.effectiveUserInterfaceLayoutDirection == .rightToLeft ? views.reversed() : views
    }

    /// Puts each segment's testID on the segment's title label or image view.
    /// A UISegment hands its hit-tests to the control, so E2E drivers (Detox)
    /// reject a tap on the segment itself as not hittable; its content view
    /// passes. The views exist once laid out, and are replaced when a
    /// segment's title or image changes.
    private func applySegmentTestIDs() {
        guard parsedSegments.contains(where: { !$0.testID.isEmpty }) else { return }
        control.layoutIfNeeded()
        let views = segmentViews()
        guard views.count == parsedSegments.count else { return }
        for (view, segment) in zip(views, parsedSegments) {
            let content = view.subviews.first {
                ($0 is UILabel || $0 is UIImageView) && !$0.isHidden
            } ?? view
            content.accessibilityIdentifier = segment.testID.isEmpty ? nil : segment.testID
        }
    }

    private func layoutBadges() {
        guard !badgeLabels.isEmpty else { return }
        control.layoutIfNeeded()
        let frames = segmentFrames()

        for (index, label) in badgeLabels {
            guard index < frames.count else {
                label.isHidden = true
                continue
            }
            label.isHidden = false
            let segment = convert(frames[index], from: control)
            let size = label.intrinsicContentSize
            label.frame = CGRect(
                x: segment.maxX - size.width - 2,
                y: segment.minY - size.height / 4,
                width: size.width,
                height: size.height
            )
        }
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        layoutBadges()
        applySegmentTestIDs()
    }

    /// Resolves the image shown for a segment, or nil when the segment shows
    /// its title. UISegmentedControl shows either a title or an image, so
    /// "labeled" always wins and "auto" / "unlabeled" prefer the icon.
    ///
    /// Images that are still loading return nil; the segment starts with its
    /// title and switches to the image once it arrives.
    private func iconImage(for segment: PCSegmentedControlSegment, generation: Int) -> UIImage? {
        guard segment.hasIcon, labelVisibility != "labeled" else { return nil }

        switch segment.iconType {
        case "sfSymbol":
            return PCImageLoader.symbol(named: segment.iconName).map { decorate($0, for: segment) }

        case "image":
            let cached = PCImageLoader.shared.image(uri: segment.iconUri, scale: segment.iconScale) { [weak self] image in
                guard let self, let image,
                      self.rebuildGeneration == generation,
                      let index = self.parsedSegments.firstIndex(where: { $0.value == segment.value }),
                      index < self.control.numberOfSegments else { return }
                self.control.setImage(self.decorate(image, for: segment), forSegmentAt: index)
                self.invalidateIntrinsicContentSize()
                self.onNeedsRemeasure?()
            }
            return cached.map { decorate($0, for: segment) }

        default:
            return nil
        }
    }

    /// Applies the rendering mode and the VoiceOver label. Rendering-mode
    /// variants are fresh instances, so the label never leaks onto shared
    /// system images.
    private func decorate(_ image: UIImage, for segment: PCSegmentedControlSegment) -> UIImage {
        let rendered = image.withRenderingMode(segment.iconTinted ? .alwaysTemplate : .alwaysOriginal)
        rendered.accessibilityLabel = segment.spokenLabel
        return rendered
    }

    private func updateSelection() {
        if selectedValue.isEmpty {
            control.selectedSegmentIndex = UISegmentedControl.noSegment
        } else if let index = parsedSegments.firstIndex(where: { $0.value == selectedValue }) {
            control.selectedSegmentIndex = index
        } else {
            control.selectedSegmentIndex = UISegmentedControl.noSegment
        }
    }

    private func updateEnabled() {
        let enabled = interactivity != "disabled"
        control.isEnabled = enabled
        alpha = enabled ? 1.0 : 0.5
    }

    /// UISegmentedControl draws template images with the same foreground
    /// color as the title for that state, so these attributes style icons too.
    private func updateTitleAttributes() {
        var normal: [NSAttributedString.Key: Any] = [:]
        var selected: [NSAttributedString.Key: Any] = [:]

        if let labelFont {
            normal[.font] = labelFont
            selected[.font] = labelFont
        }
        if let inactiveTintColor {
            normal[.foregroundColor] = inactiveTintColor
        }
        if let activeTintColor {
            selected[.foregroundColor] = activeTintColor
        }

        control.setTitleTextAttributes(normal.isEmpty ? nil : normal, for: .normal)
        control.setTitleTextAttributes(selected.isEmpty ? nil : selected, for: .selected)
    }

    // MARK: - Sizing

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        let fitted = control.sizeThatFits(CGSize(width: size.width, height: .greatestFiniteMagnitude))
        return CGSize(
            width: size.width > 0 ? size.width : fitted.width,
            height: max(PCConstants.minTouchTargetHeight, fitted.height)
        )
    }

    public override var intrinsicContentSize: CGSize {
        let fitted = control.intrinsicContentSize
        return CGSize(
            width: fitted.width,
            height: max(PCConstants.minTouchTargetHeight, fitted.height)
        )
    }

    /// Called by the measuring pipeline to get the size for Yoga layout.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let fitted = control.sizeThatFits(
            CGSize(width: constrainedSize.width > 0 ? constrainedSize.width : .greatestFiniteMagnitude,
                   height: .greatestFiniteMagnitude)
        )
        return CGSize(
            width: constrainedSize.width > 0 ? constrainedSize.width : fitted.width,
            height: max(PCConstants.minTouchTargetHeight, fitted.height)
        )
    }
}
