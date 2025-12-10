import UIKit

@objcMembers
public class DatePickerView: UIControl, UIPopoverPresentationControllerDelegate {

    private let picker = UIDatePicker()
    private var modalVC: UIViewController?
  
    private lazy var tapRecognizer: UITapGestureRecognizer = {
        UITapGestureRecognizer(target: self, action: #selector(handleTap))
    }()

    // MARK: - Props from ObjC / Fabric

    /// "date" | "time" | "dateAndTime" | "countDownTimer"
    public var mode: String = "date" {
        didSet { updateMode() }
    }

    /// "inline" | "modal"
    public var presentation: String = "modal" {
      didSet {
          guard oldValue != presentation else { return }
          updatePresentation()
      }
    }

    /// Controls whether the picker is presented in a modal/popover.
    /// Only meaningful when `presentation == "modal"`.
    public var open: NSNumber? {
        didSet {
            guard oldValue != open else { return }
            guard presentation == "modal" else { return }
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
            guard let ms = dateMs?.doubleValue, ms >= 0 else { return }
            let date = Date(timeIntervalSince1970: ms / 1000.0)
            picker.setDate(date, animated: false)
        }
    }

    public var minDateMs: NSNumber? {
        didSet {
            guard let ms = minDateMs?.doubleValue, ms >= 0 else {
                picker.minimumDate = nil
                return
            }
            picker.minimumDate = Date(timeIntervalSince1970: ms / 1000.0)
        }
    }

    public var maxDateMs: NSNumber? {
        didSet {
            guard let ms = maxDateMs?.doubleValue, ms >= 0 else {
                picker.maximumDate = nil
                return
            }
            picker.maximumDate = Date(timeIntervalSince1970: ms / 1000.0)
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

    /// IANA time zone, e.g. "America/Los_Angeles".
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

    /// "automatic" | "wheels" | "compact" | "calendar"/"inline"
    public var preferredStyle: String? {
        didSet { updatePreferredStyle() }
    }

    public var countDownDurationSeconds: NSNumber? {
        didSet {
            if let seconds = countDownDurationSeconds?.doubleValue {
                picker.countDownDuration = seconds
            }
        }
    }

    public var minuteIntervalValue: NSNumber? {
        didSet {
            if let value = minuteIntervalValue?.intValue {
                picker.minuteInterval = value
            }
        }
    }

    public var roundsToMinuteIntervalValue: NSNumber? {
        didSet {
            if #available(iOS 14.0, *) {
                picker.roundsToMinuteInterval =
                    roundsToMinuteIntervalValue?.boolValue ?? false
            }
        }
    }

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
      picker.addTarget(self, action: #selector(handleValueChanged), for: .valueChanged)
      picker.datePickerMode = .date

      isUserInteractionEnabled = true

      updatePresentation()
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
        let value = preferredStyle ?? "automatic"

        if #available(iOS 13.4, *) {
            switch value {
            case "wheels":
                picker.preferredDatePickerStyle = .wheels
            case "compact":
                picker.preferredDatePickerStyle = .compact
            case "calendar", "inline":
                picker.preferredDatePickerStyle = .inline
            default: // "automatic"
                picker.preferredDatePickerStyle = .automatic
            }
        } else {
            // Pre-iOS 13.4 only has wheels.
            picker.preferredDatePickerStyle = .wheels
        }
    }

    // MARK: - Presentation

    private func updatePresentation() {
        switch presentation {
        case "inline":
            // No tap recognizer → touches go to the picker.
            removeGestureRecognizer(tapRecognizer)
            embedInlinePicker()
        case "modal":
            // Acts like a button; picker lives in the popover VC.
            removeInlinePickerIfNeeded()
            if !(gestureRecognizers?.contains(tapRecognizer) ?? false) {
              addGestureRecognizer(tapRecognizer)
            }
        default:
            embedInlinePicker()
        }
    }

    private func embedInlinePicker() {
        // If already inline, do nothing.
        guard picker.superview !== self else { return }

        // If it was in a modal VC, remove from there.
        picker.removeFromSuperview()

        picker.translatesAutoresizingMaskIntoConstraints = false
        addSubview(picker)

        NSLayoutConstraint.activate([
            picker.topAnchor.constraint(equalTo: topAnchor),
            picker.bottomAnchor.constraint(equalTo: bottomAnchor),
            picker.leadingAnchor.constraint(equalTo: leadingAnchor),
            picker.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])
    }

    private func removeInlinePickerIfNeeded() {
        if picker.superview === self {
            picker.removeFromSuperview()
        }
    }

    @objc private func handleTap() {
        // In inline mode, the picker is already visible – no modal.
        guard presentation == "modal" else { return }
        presentIfNeeded()
    }
  
    // handleValueChanged just calls onChangeHandler, no sendActions(for:) now.
    @objc private func handleValueChanged() {
        let ms = picker.date.timeIntervalSince1970 * 1000.0
        onChangeHandler?(NSNumber(value: ms))
    }

    private func presentIfNeeded() {
        guard modalVC == nil else { return }

        // Ensure picker is not attached to inline view.
        picker.removeFromSuperview()

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

        let fittingSize = vc.view.systemLayoutSizeFitting(
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
        vc.dismiss(animated: true, completion: nil)
        modalVC = nil
        onCancelHandler?()
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
        modalVC = nil
    }
  
    public func sizeForLayout(constrainedTo size: CGSize) -> CGSize {
        // Only inline needs height; modal can be “zero height button”
        if presentation == "inline" {
            // Ask the UIDatePicker how tall it wants to be
            let fitted = picker.sizeThatFits(
                CGSize(width: size.width > 0 ? size.width : UIView.noIntrinsicMetric,
                       height: UIView.layoutFittingCompressedSize.height)
            )
            return CGSize(width: fitted.width, height: fitted.height)
        } else {
            return CGSize(width: 0, height: 0)
        }
    }
    
  
    public override func layoutSubviews() {
        super.layoutSubviews()

        if presentation == "inline" && picker.superview == nil {
            embedInlinePicker()
        }
    }
}
