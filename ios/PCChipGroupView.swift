import UIKit

/// A group of chips (ChipGroup): capsule buttons (see `PCChipCell`) in a flow
/// layout that wraps onto more rows, or in one row inside a horizontal
/// `UIScrollView`. Single / multiple selection is controlled: the chips show
/// `selectedValues`, and a press reports the selection it asks for.
@objcMembers
public final class PCChipGroupView: UIView {
    private struct Item {
        let label: String
        let value: String
        let disabled: Bool
        let icon: PCButtonSupport.Icon
        let closeIcon: Bool
        let testID: String
        let closeTestID: String
        let accessibilityLabel: String
        let closeAccessibilityLabel: String
    }

    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries; see `rebuild` for keys.
    public var chips: [Any] = [] { didSet { rebuild() } }

    /// "assist" | "filter" | "input" | "suggestion": the Material chip type.
    /// iOS has one chip look; the variant is kept for parity.
    public var variant: String = "assist"

    /// "none" | "single" | "multiple"
    public var selection: String = "none" {
        didSet { if oldValue != selection { applyConfigurations() } }
    }

    /// Controlled selection by value
    public var selectedValues: [String] = [] {
        didSet { if oldValue != selectedValues { applyConfigurations() } }
    }

    /// Whether at least one chip must stay selected
    public var selectionRequired: Bool = false

    /// true: rows wrap; false: one row that scrolls horizontally
    public var wrap: Bool = true {
        didSet {
            guard oldValue != wrap else { return }
            scrollView.contentOffset = .zero
            setNeedsLayout()
        }
    }

    /// Gap between chips in points; negative means the default (8)
    public var spacing: CGFloat = -1 {
        didSet { if oldValue != spacing { setNeedsLayout() } }
    }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet {
            guard oldValue != interactivity else { return }
            alpha = interactivity == "disabled" ? 0.5 : 1
            applyConfigurations()
        }
    }

    public var maxFontSizeMultiplier: CGFloat = 0 {
        didSet { if oldValue != maxFontSizeMultiplier { applyConfigurations() } }
    }

    /// Smallest height of every chip in points; negative = the natural height
    public var chipMinHeight: CGFloat = -1 {
        didSet { if oldValue != chipMinHeight { applyConfigurations() } }
    }

    /// Space between each chip's edges and its content in points; negative = default
    public var chipPaddingHorizontal: CGFloat = -1 {
        didSet { if oldValue != chipPaddingHorizontal { applyConfigurations() } }
    }

    /// The `haptics` prop: PCChipGroup.mm plays it on a press or a close
    public let haptics = PCHaptics()

    // MARK: - Events back to ObjC++

    public var onPress: ((Int, String) -> Void)? // (index, value)
    public var onClose: ((Int, String) -> Void)? // (index, value)
    public var onSelectionChange: (([String]) -> Void)?

    /// Called when content changed after layout (an icon finished loading,
    /// the text size changed), so the Fabric measurement can be refreshed.
    public var onNeedsRemeasure: (() -> Void)?

    // MARK: - Internal

    /// Holds the chips; scrolls only in the no-wrap mode.
    private let scrollView = ChipScrollView()
    private var items: [Item] = []
    private var cells: [PCChipCell] = []
    private var iconImages: [UIImage?] = []

    /// Bumped on every rebuild so late image loads can't touch stale chips.
    private var rebuildGeneration = 0

    private var gap: CGFloat { spacing >= 0 ? spacing : 8 }

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
        // The glass and the chips' press effects draw past their bounds
        clipsToBounds = false
        scrollView.clipsToBounds = false
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.alwaysBounceVertical = false
        scrollView.contentInsetAdjustmentBehavior = .never
        // Chips highlight on touch down; a drag that starts on one still
        // scrolls (see ChipScrollView)
        scrollView.delaysContentTouches = false
        addSubview(scrollView)
    }

    // MARK: - Props handling

    private func rebuild() {
        items = chips.compactMap { any in
            guard let dict = any as? [String: Any] else { return nil }
            return Item(
                label: (dict["label"] as? String) ?? "",
                value: (dict["value"] as? String) ?? "",
                disabled: (dict["disabled"] as? String) == "disabled",
                icon: PCButtonSupport.Icon(dictionary: dict),
                closeIcon: (dict["closeIcon"] as? String) == "true",
                testID: (dict["testID"] as? String) ?? "",
                closeTestID: (dict["closeTestID"] as? String) ?? "",
                accessibilityLabel: (dict["accessibilityLabel"] as? String) ?? "",
                closeAccessibilityLabel: (dict["closeAccessibilityLabel"] as? String) ?? ""
            )
        }

        rebuildGeneration += 1
        let generation = rebuildGeneration

        // Reuse the cells there are; a chip's press handlers look its value
        // up by index at press time
        while cells.count > items.count {
            cells.removeLast().removeFromSuperview()
        }
        while cells.count < items.count {
            let index = cells.count
            let cell = PCChipCell()
            cell.onTouchDown = { [weak self] in
                guard let self else { return }
                self.haptics.prepare(in: self)
            }
            cell.onPress = { [weak self] in self?.press(at: index) }
            cell.onClose = { [weak self] in self?.close(at: index) }
            cell.onTextSizeChange = { [weak self] in self?.textSizeChanged() }
            scrollView.addSubview(cell)
            cells.append(cell)
        }

        iconImages = items.enumerated().map { index, item in
            PCButtonSupport.image(for: item.icon) { [weak self] image in
                guard let self, self.rebuildGeneration == generation, index < self.iconImages.count else { return }
                self.iconImages[index] = image
                self.applyConfigurations()
                self.onNeedsRemeasure?()
            }
        }

        applyConfigurations()
    }

    private func applyConfigurations() {
        let groupDisabled = interactivity == "disabled"
        for (index, cell) in cells.enumerated() where index < items.count {
            let item = items[index]
            cell.configure(
                PCChipCell.Model(
                    label: item.label,
                    icon: item.icon,
                    selected: selection != "none" && selectedValues.contains(item.value),
                    closeIcon: item.closeIcon,
                    disabled: groupDisabled || item.disabled,
                    accessibilityLabel: item.accessibilityLabel,
                    closeAccessibilityLabel: item.closeAccessibilityLabel,
                    testID: item.testID,
                    closeTestID: item.closeTestID,
                    minHeight: chipMinHeight,
                    paddingHorizontal: chipPaddingHorizontal
                ),
                image: index < iconImages.count ? iconImages[index] : nil,
                maxFontSizeMultiplier: maxFontSizeMultiplier
            )
        }
        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    /// Every cell reports a text size change (each rebuilds its own title);
    /// the group lays out and remeasures once for all of them.
    private var textSizeChangePending = false

    private func textSizeChanged() {
        guard !textSizeChangePending else { return }
        textSizeChangePending = true
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.textSizeChangePending = false
            self.invalidateIntrinsicContentSize()
            self.setNeedsLayout()
            self.onNeedsRemeasure?()
        }
    }

    // MARK: - Presses

    private func press(at index: Int) {
        guard index >= 0, index < items.count else { return }
        let item = items[index]
        haptics.perform(in: self)
        onPress?(index, item.value)

        guard selection != "none", let next = nextSelection(tapping: item.value) else { return }
        // The parent owns selection; the chips change once selectedValues does
        onSelectionChange?(next)
    }

    private func close(at index: Int) {
        guard index >= 0, index < items.count else { return }
        haptics.perform(in: self)
        onClose?(index, items[index].value)
    }

    /// The selection after a tap, or nil when the tap changes nothing.
    private func nextSelection(tapping value: String) -> [String]? {
        let isSelected = selectedValues.contains(value)
        if selection == "single" {
            if isSelected {
                return selectionRequired ? nil : []
            }
            return [value]
        }

        // multiple
        if isSelected {
            if selectionRequired && selectedValues.count == 1 { return nil }
            return selectedValues.filter { $0 != value }
        }
        var chosen = Set(selectedValues)
        chosen.insert(value)
        // Report in chip order
        return items.map(\.value).filter { chosen.contains($0) }
    }

    // MARK: - Layout

    /// The chips' frames for a width, and the content size they take. Rows
    /// wrap at `width` in the wrap mode; otherwise one row as wide as it
    /// needs. Right to left, the rows start at the right edge.
    private func layoutFrames(width: CGFloat) -> (frames: [CGRect], size: CGSize) {
        let sizes = cells.map { $0.fittingSize(maxWidth: wrap && width > 0 ? width : .greatestFiniteMagnitude) }
        var frames: [CGRect] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxRowWidth: CGFloat = 0

        for size in sizes {
            if wrap, width > 0, x > 0, x + size.width > width + 0.5 {
                // Next row
                y += rowHeight + gap
                x = 0
                rowHeight = 0
            }
            frames.append(CGRect(x: x, y: y, width: size.width, height: size.height))
            maxRowWidth = max(maxRowWidth, x + size.width)
            x += size.width + gap
            rowHeight = max(rowHeight, size.height)
        }

        let contentSize = CGSize(width: maxRowWidth, height: frames.isEmpty ? 0 : y + rowHeight)
        if effectiveUserInterfaceLayoutDirection == .rightToLeft {
            let mirrorWidth = max(width, contentSize.width)
            frames = frames.map { frame in
                var mirrored = frame
                mirrored.origin.x = mirrorWidth - frame.maxX
                return mirrored
            }
        }
        return (frames, contentSize)
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        scrollView.frame = bounds
        let (frames, size) = layoutFrames(width: bounds.width)
        for (cell, frame) in zip(cells, frames) {
            cell.frame = frame
        }
        if wrap {
            scrollView.contentSize = bounds.size
            scrollView.isScrollEnabled = false
        } else {
            let contentWidth = max(size.width, bounds.width)
            let wasSize = scrollView.contentSize
            scrollView.contentSize = CGSize(width: contentWidth, height: bounds.height)
            scrollView.isScrollEnabled = size.width > bounds.width + 0.5
            if effectiveUserInterfaceLayoutDirection == .rightToLeft, wasSize.width != contentWidth {
                // Right to left, the row starts scrolled to its right end
                scrollView.contentOffset = CGPoint(x: contentWidth - bounds.width, y: 0)
            }
        }
    }

    // MARK: - Sizing

    /// Every chip on one row, and the height at `width` (rows wrapping when
    /// that is narrower than the row).
    private func measuredSize(width: CGFloat) -> CGSize {
        let natural = layoutFrames(width: 0).size
        guard wrap, width > 0, width < natural.width else { return natural }
        return CGSize(width: natural.width, height: layoutFrames(width: width).size.height)
    }

    public override var intrinsicContentSize: CGSize {
        measuredSize(width: bounds.width)
    }

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        measuredSize(width: size.width)
    }

    /// Called by the measuring pipeline to get the size for Yoga layout: the
    /// width of the chips on one row (Yoga clamps it to the space there is),
    /// and the height at the given width.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        let size = measuredSize(width: constrainedSize.width)
        return CGSize(width: ceil(size.width), height: ceil(size.height))
    }
}

/// A scroll view whose drags win over the chips: UIScrollView keeps a touch
/// that began on a UIControl with the control, so a row covered in chip
/// buttons would barely scroll.
private final class ChipScrollView: UIScrollView {
    override func touchesShouldCancel(in view: UIView) -> Bool {
        true
    }
}
