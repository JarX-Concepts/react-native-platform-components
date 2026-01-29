import UIKit

// MARK: - Segment model (bridged from ObjC++ as dictionaries)

struct PCSegmentedControlSegment {
    let label: String
    let value: String
    let disabled: Bool
    let icon: String
}

@objcMembers
public final class PCSegmentedControlView: UIControl {
    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries: [{label, value, disabled, icon}]
    public var segments: [Any] = [] { didSet { rebuildControl() } }

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

    /// iOS-specific: selected segment tint color (hex string)
    public var selectedSegmentTintColor: String? { didSet { updateTintColor() } }

    // MARK: - Events back to ObjC++

    public var onSelect: ((Int, String) -> Void)?  // (index, value)

    // MARK: - Internal

    private let control = UISegmentedControl()
    private var parsedSegments: [PCSegmentedControlSegment] = []

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
    }

    // MARK: - Props handling

    private func rebuildControl() {
        parsedSegments = segments.compactMap { any in
            guard let dict = any as? [String: Any] else { return nil }
            let label = (dict["label"] as? String) ?? ""
            let value = (dict["value"] as? String) ?? ""
            let disabled = (dict["disabled"] as? String) == "disabled"
            let icon = (dict["icon"] as? String) ?? ""
            return PCSegmentedControlSegment(
                label: label,
                value: value,
                disabled: disabled,
                icon: icon
            )
        }

        control.removeAllSegments()

        for (index, segment) in parsedSegments.enumerated() {
            // Try to use SF Symbol icon if available
            if !segment.icon.isEmpty,
               let sfImage = UIImage(systemName: segment.icon) {
                control.insertSegment(with: sfImage, at: index, animated: false)
            } else {
                control.insertSegment(withTitle: segment.label, at: index, animated: false)
            }

            // Set enabled state for this segment
            control.setEnabled(!segment.disabled, forSegmentAt: index)
        }

        updateSelection()
        invalidateIntrinsicContentSize()
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

    private func updateTintColor() {
        if let colorString = selectedSegmentTintColor, !colorString.isEmpty {
            control.selectedSegmentTintColor = UIColor(hex: colorString)
        } else {
            control.selectedSegmentTintColor = nil
        }
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

// MARK: - UIColor hex extension

private extension UIColor {
    convenience init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

        let length = hexSanitized.count
        if length == 6 {
            self.init(
                red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
                green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
                blue: CGFloat(rgb & 0x0000FF) / 255.0,
                alpha: 1.0
            )
        } else if length == 8 {
            self.init(
                red: CGFloat((rgb & 0xFF000000) >> 24) / 255.0,
                green: CGFloat((rgb & 0x00FF0000) >> 16) / 255.0,
                blue: CGFloat((rgb & 0x0000FF00) >> 8) / 255.0,
                alpha: CGFloat(rgb & 0x000000FF) / 255.0
            )
        } else {
            return nil
        }
    }
}
