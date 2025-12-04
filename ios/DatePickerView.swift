import UIKit

@objcMembers
public class DatePickerView: UIControl {

    private let picker = UIDatePicker()

    // MARK: Props from React — must be @objc public

    @objc public var mode: String = "date" {
        didSet { updateMode() }
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

    // MARK: Event callback exposed to ObjC/React Native
    //
    // Swift closures DO NOT appear in -Swift.h.
    // So we expose a selector-based callback instead.

    @objc public var onChangeHandler: ((NSNumber) -> Void)?

    @objc public func setOnChangeTarget(_ target: Any, action: Selector) {
        // ObjC++ will call this and set a selector for change notifications.
        addTarget(target, action: action, for: .valueChanged)
    }

    // MARK: Init

    @objc public override init(frame: CGRect) {
        super.init(frame: frame)
        commonInit()
    }

    @objc public required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        addSubview(picker)
        picker.addTarget(self, action: #selector(handleValueChanged), for: .valueChanged)
        updateMode()
    }

    // MARK: Layout

    public override func layoutSubviews() {
        super.layoutSubviews()
        picker.frame = bounds
    }

    // MARK: Internal helpers

    private func updateMode() {
        switch mode {
        case "time":
            picker.datePickerMode = .time
        case "datetime":
            picker.datePickerMode = .dateAndTime
        default:
            picker.datePickerMode = .date
        }
    }

    // MARK: Value change

    @objc private func handleValueChanged() {
        let ms = picker.date.timeIntervalSince1970 * 1000.0
        let value = NSNumber(value: ms)

        // Swift callback (for Fabric)
        onChangeHandler?(value)

        // Notify ObjC/UIControl listeners
        sendActions(for: .valueChanged)
    }
}
