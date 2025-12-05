import UIKit

@objcMembers
public class DatePickerView: UIControl, UIPopoverPresentationControllerDelegate {

    private let picker = UIDatePicker()
    private var modalVC: UIViewController?

    // MARK: Props

    @objc public var mode: String = "date" {
        didSet { updateMode() }
    }

    @objc public var open: NSNumber? {
        didSet {
            guard let isOpen = open?.boolValue else { return }
            if isOpen {
                presentModal()
            } else {
                dismissModal()
            }
        }
    }

    @objc public var date: NSNumber? {
        didSet {
            if let ms = date?.doubleValue {
                picker.date = Date(timeIntervalSince1970: ms / 1000.0)
            }
        }
    }

    @objc public var minimumDate: NSNumber? {
        didSet {
            if let ms = minimumDate?.doubleValue {
                picker.minimumDate = Date(timeIntervalSince1970: ms / 1000.0)
            } else {
                picker.minimumDate = nil
            }
        }
    }

    @objc public var maximumDate: NSNumber? {
        didSet {
            if let ms = maximumDate?.doubleValue {
                picker.maximumDate = Date(timeIntervalSince1970: ms / 1000.0)
            } else {
                picker.maximumDate = nil
            }
        }
    }

    @objc public var localeIdentifier: String? {
        didSet {
            if let id = localeIdentifier {
                picker.locale = Locale(identifier: id)
            } else {
                picker.locale = nil
            }
        }
    }

    @objc public var timeZoneName: String? {
        didSet {
            if let name = timeZoneName,
               let tz = TimeZone(identifier: name) {
                picker.timeZone = tz
            } else {
                picker.timeZone = nil
            }
        }
    }

    @objc public var onChangeHandler: ((NSNumber) -> Void)?

    @objc public func setOnChangeTarget(_ target: Any, action: Selector) {
        addTarget(target, action: action, for: .valueChanged)
    }

    // MARK: Init

    public override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    required public init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        picker.addTarget(self, action: #selector(handleValueChanged), for: .valueChanged)
        updateMode()
    }

    // MARK: Mode

    private func updateMode() {
        switch mode {
        case "time":
            picker.datePickerMode = .time
            picker.preferredDatePickerStyle = .wheels
        case "datetime":
            picker.datePickerMode = .dateAndTime
            picker.preferredDatePickerStyle = .wheels
        default:
            picker.datePickerMode = .date
            picker.preferredDatePickerStyle = .inline   // calendar style
        }
    }

    // MARK: Modal (popover) presentation

  private func presentModal() {
      guard modalVC == nil else { return }

      let vc = UIViewController()
      vc.view.backgroundColor = .systemBackground

      picker.translatesAutoresizingMaskIntoConstraints = false
      vc.view.addSubview(picker)

      NSLayoutConstraint.activate([
          picker.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
          picker.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
          picker.topAnchor.constraint(equalTo: vc.view.topAnchor),
          picker.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor)
      ])

      // Let Auto Layout compute the natural size of the picker
      vc.view.setNeedsLayout()
      vc.view.layoutIfNeeded()
      let targetSize = vc.view.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
      vc.preferredContentSize = targetSize   // <- no magic numbers

      vc.modalPresentationStyle = .popover

      guard
          let root = UIApplication.shared
              .connectedScenes
              .compactMap({ $0 as? UIWindowScene })
              .flatMap({ $0.windows })
              .first(where: { $0.isKeyWindow })?
              .rootViewController
      else {
          return
      }

      if let pop = vc.popoverPresentationController {
          pop.delegate = self               // to return .none for adaptive style
          pop.sourceView = self
          pop.sourceRect = bounds
          pop.permittedArrowDirections = [] // no arrow -> compact-style popup
          // pop.backgroundColor = .systemBackground // optional
      }

      root.present(vc, animated: true)
      modalVC = vc
  }

    private func dismissModal() {
        guard let vc = modalVC else { return }
        vc.dismiss(animated: true)
        modalVC = nil
    }

    // MARK: UIPopoverPresentationControllerDelegate

    /// **This is the key bit** – prevents auto-adaptation to full screen on iPhone.
    public func adaptivePresentationStyle(
        for controller: UIPresentationController,
        traitCollection: UITraitCollection
    ) -> UIModalPresentationStyle {
        return .none
    }

    // MARK: Value change

    @objc private func handleValueChanged() {
        let ms = picker.date.timeIntervalSince1970 * 1000.0
        let num = NSNumber(value: ms)

        onChangeHandler?(num)
        sendActions(for: .valueChanged)
    }
}
