import UIKit

/// A `UISwitch`, on its own or at the trailing edge of a settings row with its
/// label at the leading edge, where a tap anywhere on the row toggles it.
///
/// One element carries the testID, the label, the switch trait and the on /
/// off value, and takes the touches, so VoiceOver reads it once and Detox
/// finds, reads and taps one element: with a label, this view (the whole
/// row); without one, the `UISwitch` itself, and this view is its size.
///
/// The value is controlled: the switch shows `value`, a toggle reports the new
/// value, and `syncValue()` (after JS answered) puts back a toggle the parent
/// didn't take.
@objcMembers
public final class PCSwitchView: UIView, UIGestureRecognizerDelegate {
    // MARK: - Props (set from ObjC++)

    /// The controlled value
    public var value: Bool = false

    public var label: String = "" {
        didSet { if oldValue != label { applyLabel() } }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet { if oldValue != interactivity { applyEnabled() } }
    }

    /// Track color while on; nil = the brand color of `useNativeTheme`, else UIKit's
    public var onColor: UIColor? {
        didSet { applyOnColor() }
    }

    /// Track color while off; nil = UIKit's
    public var offTrackColor: UIColor? {
        didSet { applyOffTrackColor() }
    }

    /// Thumb color; nil = UIKit's (white)
    public var thumbColor: UIColor? {
        didSet { applyThumbColor() }
    }

    /// Cap on the label's font scaling; below 1 = no cap
    public var maxFontSizeMultiplier: CGFloat = 0 {
        didSet { if oldValue != maxFontSizeMultiplier { applyFont() } }
    }

    /// Screen-reader label; empty = the label
    public var spokenLabel: String = "" {
        didSet { if oldValue != spokenLabel { applyAccessibility() } }
    }

    /// Test identifier of the switch (of the row with a label)
    public var testID: String = "" {
        didSet { if oldValue != testID { applyAccessibility() } }
    }

    /// Padding and border from the React style, in points
    public var contentInsets: UIEdgeInsets = .zero {
        didSet { if oldValue != contentInsets { setNeedsLayout() } }
    }

    public let haptics = PCHaptics()

    // MARK: - Events

    /// The user toggled the switch, with the new value
    public var onValueChange: ((Bool) -> Void)?

    /// The text size changed, so the size has to be measured again
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - UI

    // Not named `_switchView`: Detox treats a view with an instance variable
    // of that name as a UISwitch wrapper and turns a tap on it (anywhere on
    // the row) into a long press on the switch at the same point
    private let switchView = UISwitch()
    private let labelView = UILabel()
    private lazy var rowTap = UITapGestureRecognizer(target: self, action: #selector(rowTapped))

    /// Space between the label and the switch
    static let labelSpacing: CGFloat = 16
    /// The label's font size at the default text size (UIKit's body style)
    private static let labelFontSize: CGFloat = 17

    private var isEnabled: Bool { interactivity != "disabled" }
    private var hasLabel: Bool { !label.isEmpty }

    public override init(frame: CGRect) {
        super.init(frame: frame)
        labelView.numberOfLines = 0
        labelView.textColor = .label
        labelView.textAlignment = .natural
        labelView.isHidden = true
        addSubview(labelView)

        switchView.addTarget(self, action: #selector(switchChanged), for: .valueChanged)
        switchView.addTarget(self, action: #selector(touchedDown), for: .touchDown)
        addSubview(switchView)

        rowTap.delegate = self
        rowTap.isEnabled = false
        addGestureRecognizer(rowTap)

        applyFont()
        applyOnColor()
        applyAccessibility()
    }

    public required init?(coder: NSCoder) {
        fatalError("init(coder:) is not supported")
    }

    // MARK: - Value

    /// Shows `value`, animated when on screen: after a prop change, or after
    /// JS answered a toggle (a toggle the parent didn't take goes back).
    public func syncValue() {
        guard switchView.isOn != value else { return }
        switchView.setOn(value, animated: window != nil)
    }

    @objc private func touchedDown() {
        haptics.prepare(in: self)
    }

    @objc private func switchChanged() {
        reportChange()
    }

    @objc private func rowTapped() {
        toggleFromUser()
    }

    private func toggleFromUser() {
        guard isEnabled else { return }
        switchView.setOn(!switchView.isOn, animated: true)
        reportChange()
    }

    private func reportChange() {
        haptics.perform(in: self)
        onValueChange?(switchView.isOn)
    }

    // A tap on the switch itself is the switch's (it also takes drags)
    public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        guard let view = touch.view else { return true }
        return !view.isDescendant(of: switchView)
    }

    // MARK: - Appearance

    private func applyLabel() {
        labelView.text = label
        labelView.isHidden = !hasLabel
        rowTap.isEnabled = hasLabel && isEnabled
        applyAccessibility()
        setNeedsLayout()
    }

    /// With a label the row is the element; without one, the UISwitch, which
    /// UIKit already gives the switch trait, value and activation.
    private func applyAccessibility() {
        let identifier = testID.isEmpty ? nil : testID
        isAccessibilityElement = hasLabel
        accessibilityIdentifier = hasLabel ? identifier : nil
        switchView.accessibilityIdentifier = hasLabel ? nil : identifier
        switchView.accessibilityLabel = hasLabel || spokenLabel.isEmpty ? nil : spokenLabel
        labelView.isAccessibilityElement = false
    }

    private func applyEnabled() {
        switchView.isEnabled = isEnabled
        labelView.isEnabled = isEnabled
        rowTap.isEnabled = hasLabel && isEnabled
    }

    private func applyOnColor() {
        if let onColor {
            switchView.onTintColor = onColor
        } else if PCNativeTheme.shared.hasPrimaryColor {
            // As SwiftUI's Toggle follows the tint, the switch follows the
            // brand color of useNativeTheme (the window's tint color)
            switchView.onTintColor = tintColor
        } else {
            switchView.onTintColor = nil
        }
    }

    // UIKit has no off track color. As React Native's Switch does, the color
    // goes behind the switch, where it shows through the translucent track.
    private func applyOffTrackColor() {
        switchView.backgroundColor = offTrackColor
        switchView.layer.cornerRadius = offTrackColor == nil ? 0 : switchView.bounds.height / 2
        switchView.layer.cornerCurve = .continuous
    }

    public override func tintColorDidChange() {
        super.tintColorDidChange()
        if onColor == nil { applyOnColor() }
    }

    // iOS 26 keeps its white thumb for a thumbTintColor set before the switch
    // is in a window (seen on 26.2), so the color is set again once it is
    public override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil, thumbColor != nil { applyThumbColor() }
    }

    private func applyThumbColor() {
        switchView.thumbTintColor = nil
        switchView.thumbTintColor = thumbColor
    }

    /// UIKit's body style, at the current text size, capped at `maxFontSizeMultiplier`.
    private func labelFont(for traits: UITraitCollection) -> UIFont {
        let base = UIFont.systemFont(ofSize: Self.labelFontSize)
        let metrics = UIFontMetrics(forTextStyle: .body)
        if maxFontSizeMultiplier >= 1 {
            return metrics.scaledFont(
                for: base,
                maximumPointSize: Self.labelFontSize * maxFontSizeMultiplier,
                compatibleWith: traits
            )
        }
        return metrics.scaledFont(for: base, compatibleWith: traits)
    }

    private func applyFont() {
        labelView.font = labelFont(for: traitCollection)
        setNeedsLayout()
    }

    // The font is built for the current text size, so it is rebuilt from the
    // new traits when the size changes (the label hasn't been given them yet)
    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard let previousTraitCollection,
              previousTraitCollection.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
        else { return }
        applyFont()
        onNeedsRemeasure?()
    }

    // MARK: - Accessibility

    public override var accessibilityLabel: String? {
        get {
            if !spokenLabel.isEmpty { return spokenLabel }
            return hasLabel ? label : nil
        }
        set {}
    }

    // "1" / "0", as UISwitch reports it: VoiceOver reads it as on / off
    // with the switch trait
    public override var accessibilityValue: String? {
        get { switchView.isOn ? "1" : "0" }
        set {}
    }

    public override var accessibilityTraits: UIAccessibilityTraits {
        get {
            var traits = switchView.accessibilityTraits
            if !isEnabled { traits.insert(.notEnabled) }
            return traits
        }
        set {}
    }

    public override func accessibilityActivate() -> Bool {
        guard isEnabled else { return false }
        toggleFromUser()
        return true
    }

    // MARK: - Layout

    private var switchSize: CGSize { switchView.intrinsicContentSize }

    /// The label's size in `width`
    private func labelSize(in width: CGFloat) -> CGSize {
        let size = labelView.sizeThatFits(CGSize(width: max(0, width), height: .greatestFiniteMagnitude))
        return CGSize(width: ceil(size.width), height: ceil(size.height))
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        let content = bounds.inset(by: contentInsets)
        let size = switchSize
        let rtl = effectiveUserInterfaceLayoutDirection == .rightToLeft

        guard hasLabel else {
            // The view is the switch's size (see frame(in:insets:))
            switchView.frame = CGRect(origin: CGPoint(x: (bounds.width - size.width) / 2,
                                                      y: (bounds.height - size.height) / 2),
                                      size: size)
            applyOffTrackColor()
            return
        }

        let switchX = rtl ? content.minX : content.maxX - size.width
        switchView.frame = CGRect(x: switchX, y: content.midY - size.height / 2,
                                  width: size.width, height: size.height)

        let labelWidth = max(0, content.width - size.width - Self.labelSpacing)
        let labelHeight = min(labelSize(in: labelWidth).height, content.height)
        let labelX = rtl ? content.maxX - labelWidth : content.minX
        labelView.frame = CGRect(x: labelX, y: content.midY - labelHeight / 2,
                                 width: labelWidth, height: labelHeight)
        applyOffTrackColor()
    }

    /// Where this view goes in its host's `bounds`: the whole row with a label;
    /// otherwise just the switch, at the leading edge, so that only the switch
    /// takes taps when the layout makes the host wider than it.
    public func frame(in bounds: CGRect, insets: UIEdgeInsets) -> CGRect {
        if hasLabel { return bounds }
        let content = bounds.inset(by: insets)
        let size = switchSize
        let rtl = effectiveUserInterfaceLayoutDirection == .rightToLeft
        let x = rtl ? content.maxX - size.width : content.minX
        return CGRect(x: x, y: content.midY - size.height / 2, width: size.width, height: size.height)
    }

    /// The content size (without the insets): the switch, and with a label the
    /// row's width with the label on one line and its height in
    /// `constrainedSize.width` (when set) less the insets.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let size = switchSize
        guard hasLabel else { return size }

        let oneLine = labelSize(in: .greatestFiniteMagnitude)
        let naturalWidth = oneLine.width + Self.labelSpacing + size.width
        let available = constrainedSize.width > 0
            ? constrainedSize.width - contentInsets.left - contentInsets.right
            : naturalWidth
        let width = min(naturalWidth, available)
        let labelHeight = labelSize(in: width - Self.labelSpacing - size.width).height
        return CGSize(width: naturalWidth, height: max(size.height, labelHeight))
    }
}
