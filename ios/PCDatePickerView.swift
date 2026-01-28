import UIKit
import os.log

private let logger = Logger(subsystem: "com.platformcomponents", category: "DatePicker")

@objcMembers
public final class PCDatePickerView: UIControl,
    UIPopoverPresentationControllerDelegate,
    UIAdaptivePresentationControllerDelegate
{
    // MARK: - UI
    private let picker = UIDatePicker()
    private var modalVC: UIViewController?
    private var inlineConstraints: [NSLayoutConstraint] = []

    // Suppress “programmatic” valueChanged events (apply props / initial present settle).
    private var suppressChangeEvents = false
    private func suppressNextChangesBriefly() {
        suppressChangeEvents = true
        // Clear on next runloop tick (usually enough to skip the “settle” event).
        DispatchQueue.main.async { [weak self] in
            self?.suppressChangeEvents = false
        }
    }

    // MARK: - Events (wired from ObjC++)
    public var onChangeHandler: ((NSNumber) -> Void)?
    public var onCancelHandler: (() -> Void)?

    // MARK: - Props

    /// "date" | "time" | "dateAndTime" | "countDownTimer"
    public var mode: String = "date" {
        didSet {
            if oldValue != mode {
                applyMode()
                invalidateSize()
            }
        }
    }

    /// "modal" | "inline"
    public var presentation: String = "modal" {
        didSet {
            if oldValue != presentation {
                applyPresentation()
                invalidateSize()
            }
        }
    }

    /// modal only: NSNumber(0/1)
    public var open: NSNumber? {
        didSet {
            guard oldValue != open else { return }
            applyOpen()
        }
    }

    public var dateMs: NSNumber? {
        didSet { applyDateMs(animated: false) }
    }

    public var minDateMs: NSNumber? { didSet { applyMinMax() } }
    public var maxDateMs: NSNumber? { didSet { applyMinMax() } }

    public var localeIdentifier: String? { didSet { applyLocale() } }
    public var timeZoneName: String? { didSet { applyTimeZone() } }

    /// "wheels" | "compact" | "inline" | "automatic"
    public var preferredStyle: String? {
        didSet {
            if oldValue != preferredStyle {
                applyPreferredStyle()
                invalidateSize()
            }
        }
    }

    public var countDownDurationSeconds: NSNumber? { didSet { applyCountDownDuration() } }
    public var minuteIntervalValue: NSNumber? { didSet { applyMinuteInterval() } }

    /// "inherit" | "round" | "noRound"
    public var roundsToMinuteIntervalMode: String = "inherit" {
        didSet { if oldValue != roundsToMinuteIntervalMode { applyRoundsMode() } }
    }

    // MARK: - Init

    public override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        backgroundColor = .clear
        isOpaque = false

        isUserInteractionEnabled = true
        picker.isUserInteractionEnabled = true

        picker.translatesAutoresizingMaskIntoConstraints = false
        picker.addTarget(self, action: #selector(handleValueChanged), for: .valueChanged)

        applyMode()
        applyPreferredStyle()
        applyLocale()
        applyTimeZone()
        applyMinMax()
        applyMinuteInterval()
        applyCountDownDuration()
        applyRoundsMode()
        applyPresentation()
    }

    // MARK: - Layout / Sizing

    private var lastLayoutBounds: CGRect = .zero
    private var needsStyleReset = false

    public override func layoutSubviews() {
        super.layoutSubviews()

        // For embedded presentation, manually center the picker after Auto Layout
        // This ensures consistent centering regardless of UIDatePicker's internal state
        if presentation == "embedded" && picker.superview === self && bounds.width > 0 {
            let widthChanged = abs(bounds.width - lastLayoutBounds.width) > 1
            if needsStyleReset || widthChanged {
                if #available(iOS 13.4, *) {
                    let currentStyle = picker.preferredDatePickerStyle
                    picker.preferredDatePickerStyle = .automatic
                    picker.preferredDatePickerStyle = currentStyle
                }
                picker.sizeToFit()
                needsStyleReset = false
            }
            lastLayoutBounds = bounds

            // After constraints do their thing, manually adjust picker position to center it
            let pickerSize = picker.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
            let xOffset = (bounds.width - pickerSize.width) / 2
            if xOffset > 0 {
                picker.frame = CGRect(
                    x: xOffset,
                    y: 0,
                    width: pickerSize.width,
                    height: bounds.height
                )
            }
        }
    }

    private func invalidateSize() {
        invalidateIntrinsicContentSize()
        setNeedsLayout()
        superview?.setNeedsLayout()
    }

    /// ✅ Inline only takes space; modal/headless must be 0 height.
    public override var intrinsicContentSize: CGSize {
        guard presentation == "embedded" else {
            return CGSize(width: UIView.noIntrinsicMetric, height: 0)
        }

        picker.setNeedsLayout()
        picker.layoutIfNeeded()
        let fitted = picker.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
        return CGSize(
            width: UIView.noIntrinsicMetric,
            height: max(PCConstants.minTouchTargetHeight, fitted.height))
    }

    /// ✅ Called by your measuring pipeline.
    /// Modal/headless should be zero so Yoga reserves nothing.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        guard presentation == "embedded" else { return .zero }

        picker.setNeedsLayout()
        picker.layoutIfNeeded()

        let width =
            (constrainedSize.width.isFinite && constrainedSize.width > 1)
            ? constrainedSize.width : PCConstants.fallbackWidth
        let fitted = picker.systemLayoutSizeFitting(
            CGSize(width: width, height: UIView.layoutFittingCompressedSize.height),
            withHorizontalFittingPriority: .required,
            verticalFittingPriority: .fittingSizeLevel
        )
        return CGSize(
            width: constrainedSize.width,
            height: max(PCConstants.minTouchTargetHeight, fitted.height))
    }

    /// Separate sizing for popover content.
    private func popoverContentSize() -> CGSize {
        picker.setNeedsLayout()
        picker.layoutIfNeeded()

        let fitted = picker.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
        return fitted
    }

    // MARK: - Presentation

    private func applyPresentation() {
        if presentation == "embedded" {
            dismissIfNeeded(emitCancel: false)
            attachInlinePickerIfNeeded()
        } else {
            detachInlinePickerIfNeeded()
            applyOpen()
        }
    }

    private func attachInlinePickerIfNeeded() {
        guard picker.superview !== self else { return }

        // Deactivate any previous inline constraints
        NSLayoutConstraint.deactivate(inlineConstraints)
        inlineConstraints.removeAll()

        picker.removeFromSuperview()
        addSubview(picker)

        // Mark that we need a style reset on next layout pass
        // This ensures centering is recalculated after Yoga provides correct bounds
        needsStyleReset = true

        inlineConstraints = [
            picker.topAnchor.constraint(equalTo: topAnchor),
            picker.bottomAnchor.constraint(equalTo: bottomAnchor),
            picker.leadingAnchor.constraint(equalTo: leadingAnchor),
            picker.trailingAnchor.constraint(equalTo: trailingAnchor),
        ]
        NSLayoutConstraint.activate(inlineConstraints)

        // Force picker to recalculate its internal layout after being moved between view hierarchies.
        // Re-applying the style resets internal layout state that can become stale after modal use.
        if #available(iOS 13.4, *) {
            let currentStyle = picker.preferredDatePickerStyle
            picker.preferredDatePickerStyle = .automatic
            picker.preferredDatePickerStyle = currentStyle
        }
        picker.sizeToFit()
    }

    private func detachInlinePickerIfNeeded() {
        if picker.superview === self {
            NSLayoutConstraint.deactivate(inlineConstraints)
            inlineConstraints.removeAll()
            picker.removeFromSuperview()
        }
    }

    private func applyOpen() {
        guard presentation == "modal" else { return }
        let shouldOpen = open?.boolValue ?? false
        if shouldOpen { presentIfNeeded() } else { dismissIfNeeded(emitCancel: false) }
    }

    // MARK: - Modal Popover

    private func presentIfNeeded() {
        guard modalVC == nil else { return }
        guard let top = topViewController() else {
            logger.warning("presentIfNeeded: no view controller found")
            return
        }
        logger.debug("presentIfNeeded: presenting modal picker")

        // Ensure picker is not inline.
        detachInlinePickerIfNeeded()

        // Sync the picker's date to the current prop value before presenting.
        // This ensures React Native's date is always respected as the source of truth.
        applyDateMs(animated: false)

        // Prevent "settle" events right as we present.
        suppressNextChangesBriefly()

        // Check if using inline style (full calendar) - needs larger popover size
        var isInlineStyle = false
        if #available(iOS 13.4, *) {
            isInlineStyle = picker.preferredDatePickerStyle == .inline
        }

        let vc = UIViewController()
        picker.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(picker)

        // For inline style, use system background and constrain all edges
        // For other styles, use clear background and only top/leading constraints
        if isInlineStyle {
            vc.view.backgroundColor = .systemBackground
            vc.view.isOpaque = true
            NSLayoutConstraint.activate([
                picker.topAnchor.constraint(equalTo: vc.view.topAnchor, constant: 8),
                picker.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor, constant: 8),
                picker.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor, constant: -8),
                picker.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor, constant: -8),
            ])
        } else {
            vc.view.backgroundColor = .clear
            vc.view.isOpaque = false
            NSLayoutConstraint.activate([
                picker.topAnchor.constraint(equalTo: vc.view.topAnchor),
                picker.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
            ])
        }

        let size = popoverContentSize()
        vc.preferredContentSize = size

        vc.modalPresentationStyle = .popover
        vc.presentationController?.delegate = self

        if let pop = vc.popoverPresentationController {
            pop.delegate = self
            pop.sourceView = self
            let sourceRect = CGRect(
                x: bounds.minX,
                y: bounds.minY,
                width: max(bounds.width, 44),
                height: max(bounds.height, 44)
            )
            pop.sourceRect = sourceRect
            pop.permittedArrowDirections = [.up, .down]
        }

        modalVC = vc
        top.present(vc, animated: true)
    }

    private func dismissIfNeeded(emitCancel: Bool) {
        guard let vc = modalVC else { return }
        logger.debug("dismissIfNeeded: dismissing modal, emitCancel=\(emitCancel)")
        modalVC = nil
        vc.dismiss(animated: true) { [weak self] in
            guard let self else { return }
            if emitCancel { self.onCancelHandler?() }
        }
    }

    // ✅ Critical: prevent popover → sheet adaptation in compact environments
    public func adaptivePresentationStyle(for controller: UIPresentationController)
        -> UIModalPresentationStyle
    {
        return .none
    }

    // Tap outside / dismiss
    public func presentationControllerDidDismiss(_ presentationController: UIPresentationController)
    {
        modalVC = nil
        onCancelHandler?()
    }

    public func popoverPresentationControllerDidDismissPopover(
        _ popoverPresentationController: UIPopoverPresentationController
    ) {
        modalVC = nil
        onCancelHandler?()
    }

    // MARK: - Value changes

    @objc private func handleValueChanged() {
        // Skip “programmatic/settle” changes
        if suppressChangeEvents { return }

        let ms = picker.date.timeIntervalSince1970 * 1000.0
        onChangeHandler?(NSNumber(value: ms))
    }

    // MARK: - Apply props (avoid firing valueChanged)

    private func applyDateMs(animated: Bool) {
        suppressNextChangesBriefly()
        if let ms = dateMs?.doubleValue {
            picker.setDate(Date(timeIntervalSince1970: ms / 1000.0), animated: animated)
        } else {
            // When no date is provided, default to now to avoid layout issues
            // (especially with inline style in modal presentation)
            picker.setDate(Date(), animated: animated)
        }
    }

    private func applyMinMax() {
        suppressNextChangesBriefly()

        if let ms = minDateMs?.doubleValue {
            picker.minimumDate = Date(timeIntervalSince1970: ms / 1000.0)
        } else {
            picker.minimumDate = nil
        }

        if let ms = maxDateMs?.doubleValue {
            picker.maximumDate = Date(timeIntervalSince1970: ms / 1000.0)
        } else {
            picker.maximumDate = nil
        }
    }

    private func applyLocale() {
        suppressNextChangesBriefly()
        if let id = localeIdentifier, !id.isEmpty {
            picker.locale = Locale(identifier: id)
        } else {
            picker.locale = nil
        }
    }

    private func applyTimeZone() {
        suppressNextChangesBriefly()
        if let name = timeZoneName, let tz = TimeZone(identifier: name) {
            picker.timeZone = tz
        } else {
            picker.timeZone = nil
        }
    }

    private func applyMode() {
        suppressNextChangesBriefly()
        switch mode {
        case "date": picker.datePickerMode = .date
        case "time": picker.datePickerMode = .time
        case "dateAndTime": picker.datePickerMode = .dateAndTime
        case "countDownTimer": picker.datePickerMode = .countDownTimer
        default: picker.datePickerMode = .date
        }
    }

    private func applyPreferredStyle() {
        guard #available(iOS 13.4, *) else { return }
        suppressNextChangesBriefly()
        let s = preferredStyle ?? "automatic"
        switch s {
        case "wheels": picker.preferredDatePickerStyle = .wheels
        case "compact": picker.preferredDatePickerStyle = .compact
        case "inline": picker.preferredDatePickerStyle = .inline
        default: picker.preferredDatePickerStyle = .automatic
        }
    }

    private func applyCountDownDuration() {
        guard picker.datePickerMode == .countDownTimer else { return }
        suppressNextChangesBriefly()
        if let secs = countDownDurationSeconds?.doubleValue {
            picker.countDownDuration = secs
        }
    }

    private func applyMinuteInterval() {
        guard let v = minuteIntervalValue?.intValue else { return }
        suppressNextChangesBriefly()
        picker.minuteInterval = max(1, min(30, v))
    }

    private func applyRoundsMode() {
        guard #available(iOS 14.0, *) else { return }
        suppressNextChangesBriefly()
        switch roundsToMinuteIntervalMode {
        case "round": picker.roundsToMinuteInterval = true
        case "noRound": picker.roundsToMinuteInterval = false
        default: break  // inherit
        }
    }

    // MARK: - Top VC (same approach you were using)

    private func topViewController() -> UIViewController? {
        guard
            let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene })
                .first,
            let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
        else { return nil }

        var top = root
        while true {
            if let presented = top.presentedViewController {
                top = presented
                continue
            }
            if let nav = top as? UINavigationController, let visible = nav.visibleViewController {
                top = visible
                continue
            }
            if let tab = top as? UITabBarController, let selected = tab.selectedViewController {
                top = selected
                continue
            }
            break
        }
        return top
    }
}
