import SwiftUI
import UIKit

// MARK: - Option model (bridged from ObjC++ as dictionaries)

struct PCSelectionMenuOption {
    let label: String
    let data: String
}

final class PCSelectionMenuModel: ObservableObject {
    @Published var options: [PCSelectionMenuOption] = []
    @Published var selectedData: String = ""  // sentinel = no selection
    @Published var placeholder: String = "Select"
    @Published var interactivity: String = "enabled"  // "enabled" | "disabled"

    var isDisabled: Bool { interactivity == "disabled" }

    var displayTitle: String {
        if let opt = options.first(where: { $0.data == selectedData }), !selectedData.isEmpty {
            return opt.label
        }
        return placeholder
    }

    var hasOptions: Bool { !options.isEmpty }
}

private struct PCSelectionMenuInlinePickerView: View {
    @ObservedObject var model: PCSelectionMenuModel
    let onSelectIndex: (Int) -> Void

    var body: some View {
        Menu {
            ForEach(Array(model.options.enumerated()), id: \.offset) { i, opt in
                Button(opt.label) { onSelectIndex(i) }
            }
        } label: {
            HStack(spacing: 8) {
                Text(model.displayTitle)
                    .lineLimit(1)
                    .truncationMode(.tail)

                Spacer(minLength: 0)

                Image(systemName: "chevron.up.chevron.down")
                    .imageScale(.small)
                    .opacity(0.7)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .padding(.vertical, 10)
        }
        .disabled(model.isDisabled || !model.hasOptions)
    }
}

@objcMembers
public final class PCSelectionMenuView: UIControl,
    UIPopoverPresentationControllerDelegate,
    UIAdaptivePresentationControllerDelegate
{
    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries: [{label,data}]
    public var options: [Any] = [] { didSet { sync() } }

    /// Controlled selection by data. "" = no selection.
    public var selectedData: String = "" { didSet { sync() } }

    /// "enabled" | "disabled"
    public var interactivity: String = "enabled" {
        didSet {
            updateEnabled()
            sync()
        }
    }

    public var placeholder: String? { didSet { sync() } }

    /// "open" | "closed" (headless only)
    public var visible: String = "closed" { didSet { updatePresentation() } }

    /// "inline" | "headless"
    public var anchorMode: String = "headless" { didSet { updateAnchorMode() } }

    /// Android material preference (ignored on iOS; retained for debugging/log parity)
    public var androidMaterial: String? = nil

    // MARK: - Events back to ObjC++

    public var onSelect: ((Int, String, String) -> Void)?  // (index,label,data)
    public var onRequestClose: (() -> Void)?

    // MARK: - Internal

    private weak var presentedVC: UIViewController?

    private let model = PCSelectionMenuModel()
    private var hostingController: UIHostingController<PCSelectionMenuInlinePickerView>?

    private var parsedOptions: [PCSelectionMenuOption] {
        options.compactMap { any in
            guard let dict = any as? [String: Any] else { return nil }
            let label = (dict["label"] as? String) ?? ""
            let data = (dict["data"] as? String) ?? ""
            return PCSelectionMenuOption(label: label, data: data)
        }
    }

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
        backgroundColor = .clear
        updateEnabled()
        updateAnchorMode()
        sync()
    }

    private func updateEnabled() {
        let disabled = (interactivity == "disabled")
        alpha = disabled ? 0.5 : 1.0
        isUserInteractionEnabled = !disabled
        accessibilityTraits = disabled ? [.notEnabled] : [.button]
    }

    // MARK: - Inline vs headless

    private func updateAnchorMode() {
        if anchorMode == "inline" {
            dismissIfNeeded(emitClose: false)
            installInlineIfNeeded()
            sync()
        } else {
            uninstallInlineIfNeeded()
            updatePresentation()
        }
    }

    private func sync() {
        model.options = parsedOptions
        model.selectedData = selectedData
        model.placeholder = placeholder ?? "Select"
        model.interactivity = interactivity

        if anchorMode == "inline" {
            hostingController?.rootView = makeInlineRootView()
        }

        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    private func makeInlineRootView() -> PCSelectionMenuInlinePickerView {
        PCSelectionMenuInlinePickerView(
            model: model,
            onSelectIndex: { [weak self] idx in
                guard let self else { return }
                let opts = self.parsedOptions
                guard idx >= 0, idx < opts.count else { return }
                let opt = opts[idx]
                self.selectedData = opt.data
                self.onSelect?(idx, opt.label, opt.data)
            }
        )
    }

    private func installInlineIfNeeded() {
        guard hostingController == nil else { return }

        let host = UIHostingController(rootView: makeInlineRootView())
        host.view.translatesAutoresizingMaskIntoConstraints = false
        host.view.backgroundColor = .clear

        addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.topAnchor.constraint(equalTo: topAnchor),
            host.view.bottomAnchor.constraint(equalTo: bottomAnchor),
            host.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])

        if let parent = nearestViewController() {
            parent.addChild(host)
            host.didMove(toParent: parent)
        }

        hostingController = host
    }

    private func uninstallInlineIfNeeded() {
        guard let host = hostingController else { return }
        hostingController = nil

        host.willMove(toParent: nil)
        host.view.removeFromSuperview()
        host.removeFromParent()
    }

    private func nearestViewController() -> UIViewController? {
        var r: UIResponder? = self
        while let next = r?.next {
            if let vc = next as? UIViewController { return vc }
            r = next
        }
        return nil
    }

    // MARK: - Headless presentation

    private func updatePresentation() {
        guard anchorMode != "inline" else { return }
        guard interactivity != "disabled" else { return }

        if visible == "open" {
            presentIfNeeded()
        } else {
            dismissIfNeeded(emitClose: false)
        }
    }

    private func presentIfNeeded() {
        guard presentedVC == nil else { return }
        guard let top = topViewController() else { return }

        let opts = parsedOptions
        let list = PCSelectionMenuListViewController(
            titleText: placeholder ?? "Select",
            options: opts,
            selectedData: selectedData,
            onSelect: { [weak self] idx in
                guard let self else { return }
                guard idx >= 0, idx < opts.count else { return }
                let opt = opts[idx]
                self.selectedData = opt.data
                self.onSelect?(idx, opt.label, opt.data)
                self.dismissIfNeeded(emitClose: true)
            },
            onCancel: { [weak self] in
                self?.dismissIfNeeded(emitClose: true)
            }
        )

        let nav = UINavigationController(rootViewController: list)
        nav.modalPresentationStyle = .popover
        nav.preferredContentSize = list.computePreferredSize()

        if let pop = nav.popoverPresentationController {
            pop.delegate = self
            pop.sourceView = top.view
            let rectInTopView = self.convert(self.bounds, to: top.view)
            pop.sourceRect = rectInTopView
            pop.permittedArrowDirections = [.up, .down]
            pop.backgroundColor = list.view.backgroundColor
        }

        nav.presentationController?.delegate = self

        presentedVC = nav
        top.present(nav, animated: true)
    }

    private func dismissIfNeeded(emitClose: Bool) {
        guard let vc = presentedVC else { return }
        presentedVC = nil
        vc.dismiss(animated: true) { [weak self] in
            guard let self else { return }
            if emitClose { self.onRequestClose?() }
        }
    }

    // MARK: - Dismiss callbacks

    public func popoverPresentationControllerDidDismissPopover(
        _ popoverPresentationController: UIPopoverPresentationController
    ) {
        presentedVC = nil
        onRequestClose?()
    }

    public func presentationControllerDidDismiss(_ presentationController: UIPresentationController)
    {
        presentedVC = nil
        onRequestClose?()
    }

    public func adaptivePresentationStyle(for controller: UIPresentationController)
        -> UIModalPresentationStyle
    {
        .none
    }

    // MARK: - Top VC helper

    private func topViewController() -> UIViewController? {
        guard
            var top = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: { $0.isKeyWindow })?.rootViewController
        else { return nil }

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

    // MARK: - sizing (inline only)

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        if anchorMode != "inline" { return CGSize(width: size.width, height: 0) }

        let minH: CGFloat = 44
        guard let host = hostingController else {
            return CGSize(width: size.width, height: minH)
        }

        let w = (size.width > 1) ? size.width : 320
        let fitted = host.sizeThatFits(in: CGSize(width: w, height: .greatestFiniteMagnitude))
        return CGSize(width: size.width, height: max(minH, fitted.height))
    }

    public override var intrinsicContentSize: CGSize {
        if anchorMode != "inline" {
            return CGSize(width: UIView.noIntrinsicMetric, height: 0)
        }
        let h = max(
            44, sizeThatFits(CGSize(width: bounds.width, height: .greatestFiniteMagnitude)).height)
        return CGSize(width: UIView.noIntrinsicMetric, height: h)
    }
}

// MARK: - List VC (headless)

private final class PCSelectionMenuListViewController: UITableViewController {

    private let titleText: String
    private let options: [PCSelectionMenuOption]
    private let selectedData: String
    private let onSelectIndex: (Int) -> Void
    private let onCancel: () -> Void

    init(
        titleText: String,
        options: [PCSelectionMenuOption],
        selectedData: String,
        onSelect: @escaping (Int) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.titleText = titleText
        self.options = options
        self.selectedData = selectedData
        self.onSelectIndex = onSelect
        self.onCancel = onCancel
        super.init(style: .insetGrouped)
        title = titleText
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        options.count
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath)
        -> UITableViewCell
    {
        let cell = UITableViewCell(style: .default, reuseIdentifier: nil)
        let opt = options[indexPath.row]
        cell.textLabel?.text = opt.label
        cell.accessoryType =
            (opt.data == selectedData && !selectedData.isEmpty) ? .checkmark : .none
        return cell
    }

    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        onSelectIndex(indexPath.row)
    }

    func computePreferredSize() -> CGSize {
        CGSize(width: 320, height: min(480, CGFloat(options.count) * 44))
    }
}
