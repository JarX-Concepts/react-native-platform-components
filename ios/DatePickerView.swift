import UIKit

@objcMembers
public class DatePickerView: UIControl, UIPopoverPresentationControllerDelegate {

    private let picker = UIDatePicker()
    private var modalVC: UIViewController?

    // MARK: - Props from ObjC / Fabric

    /// Mode string: "date" | "time" | "dateAndTime" | "countDownTimer"
    public var mode: String = "date" {
        didSet { updateMode() }
    }

    /// Controls whether the picker is presented in a modal/popover.
    public var open: NSNumber? {
        didSet {
            let shouldOpen = open?.boolValue ?? true
            if shouldOpen {
                presentIfNeeded()
            } else {
                dismissIfNeeded()
            }
        }
    }

    /// Controlled value in ms since Unix epoch, or nil for "no value".
    public var dateMs: NSNumber? {
        didSet {
            guard let ms = dateMs?.doubleValue, ms >= 0 else {
                // Leave picker at its current date if sentinel / nil.
                return
            }
            let date = Date(timeIntervalSince1970: ms / 1000.0)
            picker.setDate(date, animated: false)
        }
    }

    /// Minimum selectable date in ms since Unix epoch.
    public var minDateMs: NSNumber? {
        didSet {
            guard let ms = minDateMs?.doubleValue, ms >= 0 else {
                picker.minimumDate = nil
                return
            }
            let date = Date(timeIntervalSince1970: ms / 1000.0)
            picker.minimumDate = date
        }
    }

    /// Maximum selectable date in ms since Unix epoch.
    public var maxDateMs: NSNumber? {
        didSet {
            guard let ms = maxDateMs?.doubleValue, ms >= 0 else {
                picker.maximumDate = nil
                return
            }
            let date = Date(timeIntervalSince1970: ms / 1000.0)
            picker.maximumDate = date
        }
    }

    /// Locale identifier, e.g. "en-US".
    public var localeIdentifier: String? {
        didSet {
            if let id = localeIdentifier {
                picker.locale = Locale(identifier: id)
            } else {
                picker.locale = nil
            }
        }
    }

    /// IANA time zone name, e.g. "America/Los_Angeles".
    public var timeZoneName: String? {
        didSet {
            if let name = timeZoneName,
               let tz = TimeZone(identifier: name) {
                picker.timeZone = tz
            } else {
                picker.timeZone = nil
            }
        }
    }

    /// UIDatePicker.preferredDatePickerStyle as a string: "automatic" | "wheels" | "compact" | "inline"
    public var preferredStyle: String? {
        didSet {
            updatePreferredStyle()
        }
    }

    /// For `countDownTimer` mode, duration in seconds.
    public var countDownDurationSeconds: NSNumber? {
        didSet {
            if let seconds = countDownDurationSeconds?.doubleValue {
                picker.countDownDuration = seconds
            }
        }
    }

    /// UIDatePicker.minuteInterval, kept separate from the property name.
    public var minuteIntervalValue: NSNumber? {
        didSet {
            if let value = minuteIntervalValue?.intValue {
                picker.minuteInterval = value
            }
        }
    }

    /// UIDatePicker.roundsToMinuteInterval (iOS 14+).
    public var roundsToMinuteIntervalValue: NSNumber? {
        didSet {
            if #available(iOS 14.0, *) {
                picker.roundsToMinuteInterval = roundsToMinuteIntervalValue?.boolValue ?? false
            }
        }
    }

    /// Callback invoked when the picker value changes, passing ms since epoch.
    public var onChangeHandler: ((NSNumber) -> Void)?
    public var onCancelHandler: (() -> Void)?

    // MARK: - Init

    public override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        addTarget(self, action: #selector(handleTap), for: .touchUpInside)

        picker.addTarget(self, action: #selector(handleValueChanged), for: .valueChanged)
        picker.datePickerMode = .date

        isUserInteractionEnabled = true
    }

    // MARK: - Mode / Style

    private func updateMode() {
        switch mode {
        case "date":
            picker.datePickerMode = .date
        case "time":
            picker.datePickerMode = .time
        case "dateAndTime":
            picker.datePickerMode = .dateAndTime
        case "countDownTimer":
            picker.datePickerMode = .countDownTimer
        default:
            picker.datePickerMode = .date
        }
    }

    private func updatePreferredStyle() {
        let value = preferredStyle ?? "inline"

        if #available(iOS 13.4, *) {
            switch value {
            case "wheels":
                picker.preferredDatePickerStyle = .wheels
            default:
                picker.preferredDatePickerStyle = .inline
            }
        } else {
            // Pre-iOS 13.4 only has wheels.
            picker.preferredDatePickerStyle = .wheels
        }
    }

    // MARK: - Presentation

    @objc private func handleTap() {
        presentIfNeeded()
    }

    private func presentIfNeeded() {
        guard modalVC == nil else { return }

        let vc = UIViewController()
        vc.view.backgroundColor = .clear

        picker.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(picker)

        NSLayoutConstraint.activate([
            picker.topAnchor.constraint(equalTo: vc.view.topAnchor),
            picker.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor),
            picker.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
            picker.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
        ])
      
        picker.setNeedsLayout()
        picker.layoutIfNeeded()
        let fittingSize = picker.systemLayoutSizeFitting(
            UIView.layoutFittingCompressedSize
        )
      
        vc.modalPresentationStyle = .popover
        vc.preferredContentSize = fittingSize

        if let popover = vc.popoverPresentationController {
            popover.delegate = self
            popover.sourceView = self
            popover.sourceRect = bounds
            popover.permittedArrowDirections = [.down, .up]
        }

        topViewController()?.present(vc, animated: true, completion: nil)
        modalVC = vc
    }

    private func dismissIfNeeded() {
        guard let vc = modalVC else { return }
        vc.dismiss(animated: true) { [weak self] in
            // When dismissed without selecting a value → onCancel
            self?.onCancelHandler?()
        }
        modalVC = nil
    }

    private func topViewController(
        base: UIViewController? = UIApplication.shared.connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.keyWindow?.rootViewController }
            .first
    ) -> UIViewController? {
        if let nav = base as? UINavigationController {
            return topViewController(base: nav.visibleViewController)
        }
        if let tab = base as? UITabBarController {
            return topViewController(base: tab.selectedViewController)
        }
        if let presented = base?.presentedViewController {
            return topViewController(base: presented)
        }
        return base
    }

    // MARK: - UIPopoverPresentationControllerDelegate

    public func adaptivePresentationStyle(
        for controller: UIPresentationController
    ) -> UIModalPresentationStyle {
        // Keep as popover where possible.
        return .none
    }
  
    public func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        // User dismissed the popover (tap outside, swipe, etc.)
        onCancelHandler?()
    }

    // MARK: - Value change

    @objc private func handleValueChanged() {
        let ms = picker.date.timeIntervalSince1970 * 1000.0
        let num = NSNumber(value: ms)

        onChangeHandler?(num)
        sendActions(for: .valueChanged)
    }
}
