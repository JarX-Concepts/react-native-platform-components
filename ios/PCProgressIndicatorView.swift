import UIKit

/// A progress indicator built from the UIKit controls:
///
/// - `linear`: `UIProgressView`, or one per segment in a row. UIKit has no
///   indeterminate bar (SwiftUI's indeterminate `ProgressView` is the
///   spinner too), so an indeterminate bar shows `UIActivityIndicatorView`.
/// - `circular`: `UIActivityIndicatorView` when indeterminate. UIKit has no
///   determinate circle, and SwiftUI's circular `ProgressView` ignores its
///   value on iOS (it draws the spinner), so a determinate one is a ring
///   drawn with Core Animation in the system colors (see `PCProgressRingView`).
/// - `loading`: the Material 3 Expressive loading indicator has no iOS
///   counterpart; it's the spinner.
///
/// The Fabric view (PCProgressIndicator.mm) is the accessibility element
/// with the label, value and testID, so the controls here are hidden from
/// accessibility.
@objcMembers
public final class PCProgressIndicatorView: UIView {
    // MARK: - Props (set from ObjC++, then commit())

    /// "linear" | "circular" | "loading"
    public var variant: String = "linear"

    /// 0...1, or negative for indeterminate
    public var progress: Double = -1

    /// Indicator color; nil = the control's default (tint color, or the
    /// spinner's gray)
    public var indicatorColor: UIColor?

    /// Track color; nil = the control's default
    public var trackColor: UIColor?

    /// "small" | "large" | "" (small)
    public var size: String = ""

    /// Segments of a determinate bar; < 2 = one bar
    public var segments: Int = 0

    // MARK: - Views

    private var bars: [UIProgressView] = []
    private var spinner: UIActivityIndicatorView?
    private var ring: PCProgressRingView?

    /// The structure the current views were built for.
    private var builtKey: String?

    public override init(frame: CGRect) {
        super.init(frame: frame)
        isAccessibilityElement = false
        accessibilityElementsHidden = true
        isUserInteractionEnabled = false
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private var indeterminate: Bool { progress < 0 || variant == "loading" }

    private enum Mode { case bars(Int), spinner, ring }

    private var mode: Mode {
        if indeterminate { return .spinner }
        if variant == "linear" { return .bars(max(1, segments)) }
        return .ring
    }

    /// Applies the props set since the last commit.
    public func commit() {
        let currentMode = mode
        let key: String
        switch currentMode {
        case .bars(let count): key = "bars-\(count)"
        case .spinner: key = "spinner-\(size)"
        case .ring: key = "ring"
        }
        // A value change animates, except right after the views were built
        let animated = builtKey == key && window != nil
        if builtKey != key {
            rebuild(currentMode)
            builtKey = key
        }
        applyColors()
        applyProgress(animated: animated)
        setNeedsLayout()
    }

    private func rebuild(_ mode: Mode) {
        bars.forEach { $0.removeFromSuperview() }
        bars = []
        spinner?.removeFromSuperview()
        spinner = nil
        ring?.removeFromSuperview()
        ring = nil

        switch mode {
        case .bars(let count):
            for _ in 0..<count {
                let bar = UIProgressView(progressViewStyle: .default)
                hideFromAccessibility(bar)
                addSubview(bar)
                bars.append(bar)
            }
        case .spinner:
            let view = UIActivityIndicatorView(style: size == "large" ? .large : .medium)
            view.hidesWhenStopped = false
            hideFromAccessibility(view)
            addSubview(view)
            view.startAnimating()
            spinner = view
        case .ring:
            let view = PCProgressRingView()
            hideFromAccessibility(view)
            addSubview(view)
            ring = view
        }
    }

    private func hideFromAccessibility(_ view: UIView) {
        view.isAccessibilityElement = false
        view.accessibilityElementsHidden = true
    }

    private func applyColors() {
        for bar in bars {
            bar.progressTintColor = indicatorColor
            bar.trackTintColor = trackColor
        }
        if let spinner {
            // nil restores the spinner's own gray
            spinner.color = indicatorColor
        }
        if let ring {
            ring.indicatorColor = indicatorColor
            ring.trackColor = trackColor
        }
    }

    private func applyProgress(animated: Bool) {
        guard !indeterminate else { return }
        let value = Float(min(1, max(0, progress)))
        if !bars.isEmpty {
            let count = Float(bars.count)
            for (index, bar) in bars.enumerated() {
                // Segment i covers i/count ..< (i+1)/count
                let fill = min(1, max(0, value * count - Float(index)))
                if bar.progress != fill { bar.setProgress(fill, animated: animated) }
            }
        }
        ring?.setProgress(CGFloat(value), animated: animated)
    }

    // MARK: - Layout

    /// Gap between the segments of a segmented bar.
    private static let segmentGap: CGFloat = 4

    public override func layoutSubviews() {
        super.layoutSubviews()
        let bounds = self.bounds
        if !bars.isEmpty {
            let count = CGFloat(bars.count)
            let gap = count > 1 ? Self.segmentGap : 0
            let width = max(0, (bounds.width - gap * (count - 1)) / count)
            let rtl = effectiveUserInterfaceLayoutDirection == .rightToLeft
            for (index, bar) in bars.enumerated() {
                let height = bar.sizeThatFits(bounds.size).height
                let offset = CGFloat(index) * (width + gap)
                let x = rtl ? bounds.width - offset - width : offset
                bar.frame = CGRect(
                    x: x,
                    y: (bounds.height - height) / 2,
                    width: width,
                    height: height
                )
                bar.semanticContentAttribute = rtl ? .forceRightToLeft : .unspecified
            }
        }
        if let spinner {
            let fit = spinner.intrinsicContentSize
            spinner.frame = CGRect(
                x: (bounds.width - fit.width) / 2,
                y: (bounds.height - fit.height) / 2,
                width: fit.width,
                height: fit.height
            )
        }
        if let ring {
            let side = min(bounds.width, bounds.height)
            ring.frame = CGRect(
                x: (bounds.width - side) / 2,
                y: (bounds.height - side) / 2,
                width: side,
                height: side
            )
        }
    }
}

/// A determinate circular progress indicator: a track circle and an arc
/// from 12 o'clock, clockwise, with round caps. It takes UIProgressView's
/// colors (the tint color over the system fill), and the line width scales
/// with the diameter: 2pt for the 20pt size, about 3.5pt for 37pt.
@objcMembers
public final class PCProgressRingView: UIView {
    var indicatorColor: UIColor? { didSet { updateColors() } }
    var trackColor: UIColor? { didSet { updateColors() } }

    private let trackLayer = CAShapeLayer()
    private let progressLayer = CAShapeLayer()
    private var progress: CGFloat = 0

    override init(frame: CGRect) {
        super.init(frame: frame)
        for shape in [trackLayer, progressLayer] {
            shape.fillColor = nil
            shape.lineCap = .round
            layer.addSublayer(shape)
        }
        progressLayer.strokeEnd = 0
        updateColors()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func setProgress(_ value: CGFloat, animated: Bool) {
        let from = progressLayer.presentation()?.strokeEnd ?? progressLayer.strokeEnd
        progress = value
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        progressLayer.strokeEnd = value
        CATransaction.commit()
        guard animated, from != value, !UIAccessibility.isReduceMotionEnabled else {
            progressLayer.removeAnimation(forKey: "progress")
            return
        }
        let animation = CABasicAnimation(keyPath: "strokeEnd")
        animation.fromValue = from
        animation.toValue = value
        // UIProgressView's animated setProgress takes about as long
        animation.duration = 0.25
        animation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        progressLayer.add(animation, forKey: "progress")
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        let side = min(bounds.width, bounds.height)
        // A tenth of the diameter, in half points
        let lineWidth = max(2, (side / 5).rounded() / 2)
        let radius = max(0, (side - lineWidth) / 2)
        let center = CGPoint(x: bounds.midX, y: bounds.midY)
        let path = UIBezierPath(
            arcCenter: center,
            radius: radius,
            startAngle: -.pi / 2,
            endAngle: 3 * .pi / 2,
            clockwise: true
        ).cgPath
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        for shape in [trackLayer, progressLayer] {
            shape.frame = bounds
            shape.path = path
            shape.lineWidth = lineWidth
        }
        CATransaction.commit()
    }

    public override func tintColorDidChange() {
        super.tintColorDidChange()
        updateColors()
    }

    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        updateColors()
    }

    private func updateColors() {
        // CGColors don't follow light/dark, so they are resolved for the
        // current traits here and again on every trait change
        let traits = traitCollection
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        progressLayer.strokeColor = (indicatorColor ?? tintColor).resolvedColor(with: traits).cgColor
        trackLayer.strokeColor = (trackColor ?? .systemFill).resolvedColor(with: traits).cgColor
        CATransaction.commit()
    }
}
