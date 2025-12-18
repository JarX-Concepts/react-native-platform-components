import UIKit

@objcMembers
public final class PCDatePickerView: UIControl,
    UIPopoverPresentationControllerDelegate,
    UIAdaptivePresentationControllerDelegate
{
    // MARK: - UI
    private let picker = UIDatePicker()
    private var modalVC: UIViewController?

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
        return CGSize(width: UIView.noIntrinsicMetric, height: max(44, fitted.height))
    }

    /// ✅ Called by your measuring pipeline.
    /// Modal/headless should be zero so Yoga reserves nothing.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        guard presentation == "embedded" else { return .zero }

        picker.setNeedsLayout()
        picker.layoutIfNeeded()

        let width =
            (constrainedSize.width.isFinite && constrainedSize.width > 1)
            ? constrainedSize.width : 320
        let fitted = picker.systemLayoutSizeFitting(
            CGSize(width: width, height: UIView.layoutFittingCompressedSize.height),
            withHorizontalFittingPriority: .required,
            verticalFittingPriority: .fittingSizeLevel
        )
        return CGSize(width: constrainedSize.width, height: max(44, fitted.height))
    }

    /// Separate sizing for popover content.
    private func popoverContentSize() -> CGSize {
        picker.setNeedsLayout()
        picker.layoutIfNeeded()

        let fitted = picker.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
        let minH: CGFloat = (preferredStyle == "wheels") ? 216 : 160
        let minW: CGFloat = 280
        return CGSize(width: max(minW, fitted.width), height: max(minH, fitted.height))
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

        picker.removeFromSuperview()
        addSubview(picker)

        NSLayoutConstraint.activate([
            picker.topAnchor.constraint(equalTo: topAnchor),
            picker.bottomAnchor.constraint(equalTo: bottomAnchor),
            picker.leadingAnchor.constraint(equalTo: leadingAnchor),
            picker.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    private func detachInlinePickerIfNeeded() {
        if picker.superview === self {
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
        guard let top = topViewController() else { return }

        // Prevent “settle” events right as we present.
        suppressNextChangesBriefly()

        // Ensure picker is not inline.
        detachInlinePickerIfNeeded()

        let vc = UIViewController()
        vc.view.backgroundColor = .clear
        vc.view.isOpaque = false

        picker.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(picker)

        NSLayoutConstraint.activate([
            picker.topAnchor.constraint(equalTo: vc.view.topAnchor),
            picker.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor),
            picker.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
            picker.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
        ])

        let size = popoverContentSize()
        vc.preferredContentSize = size

        // ✅ Anchored popover-style (not a full sheet)
        vc.modalPresentationStyle = .popover
        vc.presentationController?.delegate = self

        if let pop = vc.popoverPresentationController {
            pop.delegate = self
            pop.sourceView = self
            pop.sourceRect = bounds
            pop.permittedArrowDirections = [.up, .down]
        }

        modalVC = vc
        top.present(vc, animated: true)
    }

    private func dismissIfNeeded(emitCancel: Bool) {
        guard let vc = modalVC else { return }
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
        guard let ms = dateMs?.doubleValue else { return }
        suppressNextChangesBriefly()
        picker.setDate(Date(timeIntervalSince1970: ms / 1000.0), animated: animated)
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
