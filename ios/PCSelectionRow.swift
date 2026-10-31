import UIKit

/// One row of a selection control (Checkbox, RadioGroup): a title that
/// wraps, an optional detail line under it, and an SF Symbol at the leading
/// or trailing edge, as in UIKit lists. UIKit has no checkbox or radio
/// button; a checkbox is a row with a leading `circle` /
/// `checkmark.circle.fill`, and a single choice is a list of rows with a
/// trailing `checkmark` on the chosen one.
///
/// The row is one control and one accessibility element: it takes the
/// touches, highlights while pressed like a list cell, and carries the
/// owner's label, value and test identifier. It shows only what its owner
/// sets; a tap is reported, not applied.
final class PCSelectionRow: UIControl {
    enum SymbolPlacement {
        case leading
        case trailing
    }

    struct Model: Equatable {
        var title = ""
        var detail = ""
        /// SF Symbol name; empty = no symbol (its slot is kept)
        var symbolName = ""
        var symbolPlacement = SymbolPlacement.leading
        /// Leading symbols are sized like a list's checkbox circle; trailing
        /// ones like a list's checkmark accessory
        /// The symbol's color; nil = the tint color
        var symbolColor: UIColor?
        var titleColor: UIColor = .label
        var detailColor: UIColor = .secondaryLabel
        /// The detail line's text style
        var detailStyle = UIFont.TextStyle.subheadline
        var disabled = false
    }

    // MARK: - Metrics

    /// Space above and below the text, as in a list cell (44 points tall
    /// with one line of body text)
    static let verticalPadding: CGFloat = 11
    /// Gap between the symbol and the text
    static let symbolSpacing: CGFloat = 12
    /// Gap between the title and the detail line
    static let detailSpacing: CGFloat = 2
    /// How far the press highlight reaches past the row's sides, so it
    /// frames the content rather than touching it
    static let highlightOutset: CGFloat = 10
    static let minHeight: CGFloat = 44

    // MARK: - State

    private(set) var model = Model()
    var maxFontSizeMultiplier: CGFloat = 0 {
        didSet { if oldValue != maxFontSizeMultiplier { applyFonts() } }
    }

    /// Called on touch down, so the owner can ready its haptic
    var onTouchDown: (() -> Void)?
    /// Called when the row is tapped (touch up inside)
    var onTap: (() -> Void)?
    /// Called after the fonts changed for a new text size, so the owner can
    /// lay out and remeasure
    var onTextSizeChange: (() -> Void)?

    private let highlightView = UIView()
    private let symbolView = UIImageView()
    private let titleLabel = UILabel()
    private let detailLabel = UILabel()

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)

        isAccessibilityElement = true
        clipsToBounds = false

        highlightView.isUserInteractionEnabled = false
        highlightView.backgroundColor = .systemFill
        highlightView.layer.cornerRadius = 10
        highlightView.layer.cornerCurve = .continuous
        highlightView.alpha = 0
        addSubview(highlightView)

        symbolView.isUserInteractionEnabled = false
        symbolView.contentMode = .center
        addSubview(symbolView)

        for label in [titleLabel, detailLabel] {
            label.isUserInteractionEnabled = false
            label.numberOfLines = 0
            label.lineBreakMode = .byWordWrapping
            addSubview(label)
        }

        addTarget(self, action: #selector(touchedDown), for: .touchDown)
        addTarget(self, action: #selector(tapped), for: .touchUpInside)

        applyFonts()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) is not supported")
    }

    func configure(_ model: Model) {
        guard model != self.model else { return }
        let old = self.model
        self.model = model
        titleLabel.text = model.title
        detailLabel.text = model.detail
        detailLabel.isHidden = model.detail.isEmpty
        titleLabel.textColor = model.titleColor
        detailLabel.textColor = model.detailColor
        if model.symbolName != old.symbolName || model.symbolPlacement != old.symbolPlacement
            || model.detailStyle != old.detailStyle {
            applyFonts()
        }
        // nil inherits the tint color (useNativeTheme sets the window's)
        symbolView.tintColor = model.symbolColor
        isEnabled = !model.disabled
        setNeedsLayout()
    }

    // MARK: - Fonts

    // The fonts are fixed at the current text size, so they are rebuilt when
    // it changes. The row handles this itself: when its owner hears of the
    // change, UIKit hasn't passed the new traits down to the row yet.
    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard let previousTraitCollection,
              previousTraitCollection.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
        else { return }
        applyFonts()
        onTextSizeChange?()
    }

    /// A text style's font at the current text size, capped at
    /// `maxFontSizeMultiplier` times its size at the default text size.
    private func scaledFont(_ style: UIFont.TextStyle) -> UIFont {
        let base = UIFont.preferredFont(
            forTextStyle: style,
            compatibleWith: UITraitCollection(preferredContentSizeCategory: .large)
        )
        let metrics = UIFontMetrics(forTextStyle: style)
        if maxFontSizeMultiplier >= 1 {
            return metrics.scaledFont(
                for: base,
                maximumPointSize: base.pointSize * maxFontSizeMultiplier,
                compatibleWith: traitCollection
            )
        }
        return metrics.scaledFont(for: base, compatibleWith: traitCollection)
    }

    private var titleFont: UIFont { titleLabel.font }

    private func applyFonts() {
        let title = scaledFont(.body)
        titleLabel.font = title
        detailLabel.font = scaledFont(model.detailStyle)

        // A checkbox circle a little larger than the text, as in Reminders;
        // a checkmark accessory in the body font's semibold weight
        let configuration: UIImage.SymbolConfiguration
        switch model.symbolPlacement {
        case .leading:
            configuration = UIImage.SymbolConfiguration(font: title, scale: .large)
        case .trailing:
            configuration = UIImage.SymbolConfiguration(font: title, scale: .medium)
                .applying(UIImage.SymbolConfiguration(weight: .semibold))
        }
        symbolView.preferredSymbolConfiguration = configuration
        symbolView.image = model.symbolName.isEmpty ? nil : UIImage(systemName: model.symbolName)
        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    /// The symbol's size at the current text size, with or without an image
    /// (an empty slot keeps its width, so the text doesn't move when the
    /// chosen row changes).
    private var symbolSize: CGSize {
        let name: String
        switch model.symbolPlacement {
        case .leading: name = "circle"
        case .trailing: name = "checkmark"
        }
        let image = UIImage(systemName: name, withConfiguration: symbolView.preferredSymbolConfiguration)
        return image?.size ?? CGSize(width: 22, height: 22)
    }

    // MARK: - Layout

    private struct Frames {
        var symbol: CGRect
        var title: CGRect
        var detail: CGRect
        var height: CGFloat
    }

    private func frames(width: CGFloat) -> Frames {
        let symbol = symbolSize
        let textWidth = max(0, width - symbol.width - Self.symbolSpacing)
        let fit = CGSize(width: textWidth, height: .greatestFiniteMagnitude)
        let titleSize = titleLabel.text?.isEmpty == false ? titleLabel.sizeThatFits(fit) : .zero
        let detailSize = detailLabel.isHidden ? .zero : detailLabel.sizeThatFits(fit)

        // A leading symbol sits on the title's first line; a trailing one
        // is centered on the row, as a list's accessory is
        let lineHeight = titleFont.lineHeight
        var top = Self.verticalPadding
        if model.symbolPlacement == .leading, symbol.height > lineHeight {
            top += (symbol.height - lineHeight) / 2
        }
        let titleHeight = max(titleSize.height, lineHeight)
        let detailHeight = detailSize.height > 0 ? detailSize.height + Self.detailSpacing : 0
        let textHeight = titleHeight + detailHeight
        let height = max(Self.minHeight, ceil(top + textHeight + Self.verticalPadding))
        let contentTop = max(top, (height - textHeight) / 2)

        let textX: CGFloat
        let symbolX: CGFloat
        switch model.symbolPlacement {
        case .leading:
            symbolX = 0
            textX = symbol.width + Self.symbolSpacing
        case .trailing:
            textX = 0
            symbolX = width - symbol.width
        }
        let symbolY: CGFloat
        switch model.symbolPlacement {
        case .leading: symbolY = contentTop + (lineHeight - symbol.height) / 2
        case .trailing: symbolY = (height - symbol.height) / 2
        }

        var result = Frames(
            symbol: CGRect(x: symbolX, y: symbolY, width: symbol.width, height: symbol.height),
            title: CGRect(x: textX, y: contentTop, width: textWidth, height: titleHeight),
            detail: CGRect(
                x: textX, y: contentTop + titleHeight + Self.detailSpacing,
                width: textWidth, height: detailSize.height
            ),
            height: height
        )
        if effectiveUserInterfaceLayoutDirection == .rightToLeft {
            func mirror(_ rect: CGRect) -> CGRect {
                CGRect(x: width - rect.maxX, y: rect.minY, width: rect.width, height: rect.height)
            }
            result.symbol = mirror(result.symbol)
            result.title = mirror(result.title)
            result.detail = mirror(result.detail)
        }
        return result
    }

    /// The width the row takes with its text on one line
    func naturalWidth() -> CGFloat {
        let one = CGSize(width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude)
        let title = titleLabel.text?.isEmpty == false ? titleLabel.sizeThatFits(one).width : 0
        let detail = detailLabel.isHidden ? 0 : detailLabel.sizeThatFits(one).width
        return ceil(symbolSize.width + Self.symbolSpacing + max(title, detail))
    }

    /// The row's height at `width`, the text wrapping as it needs
    func height(forWidth width: CGFloat) -> CGFloat {
        frames(width: width > 0 ? width : naturalWidth()).height
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let f = frames(width: bounds.width)
        symbolView.frame = f.symbol
        titleLabel.frame = f.title
        detailLabel.frame = f.detail
        highlightView.frame = bounds.insetBy(dx: -Self.highlightOutset, dy: 0)
    }

    override func sizeThatFits(_ size: CGSize) -> CGSize {
        let width = size.width > 0 ? size.width : naturalWidth()
        return CGSize(width: width, height: height(forWidth: width))
    }

    override var intrinsicContentSize: CGSize {
        CGSize(width: naturalWidth(), height: height(forWidth: bounds.width))
    }

    // The highlight covers the outset too, so touches there count
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        bounds.insetBy(dx: -Self.highlightOutset, dy: 0).contains(point)
    }

    // MARK: - Touches

    override var isHighlighted: Bool {
        didSet {
            guard oldValue != isHighlighted else { return }
            if isHighlighted {
                highlightView.alpha = 1
            } else {
                // A list cell's highlight fades out after the touch ends
                UIView.animate(withDuration: 0.25, delay: 0, options: [.beginFromCurrentState, .allowUserInteraction]) {
                    self.highlightView.alpha = 0
                }
            }
        }
    }

    @objc private func touchedDown() {
        onTouchDown?()
    }

    @objc private func tapped() {
        onTap?()
    }

    // VoiceOver's double tap
    override func accessibilityActivate() -> Bool {
        guard isEnabled else { return false }
        onTap?()
        return true
    }
}

/// The words VoiceOver reads for a checkable row's role and state. iOS has
/// no checkbox or radio button trait, so, as React Native does for
/// `accessibilityRole="checkbox"` / `"radio"`, they go in the row's
/// accessibility value.
enum PCSelectionAccessibility {
    static let checkbox = "checkbox"
    static let radioButton = "radio button"
    static let checked = "checked"
    static let unchecked = "unchecked"
    static let mixed = "mixed"

    static func value(_ parts: [String]) -> String {
        parts.filter { !$0.isEmpty }.joined(separator: ", ")
    }
}
