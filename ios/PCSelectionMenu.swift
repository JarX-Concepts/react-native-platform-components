import os.log
import SwiftUI
import UIKit

private let logger = Logger(subsystem: "com.platformcomponents", category: "SelectionMenu")

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
public final class PCSelectionMenuView: UIControl {
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

    private let model = PCSelectionMenuModel()
    private var hostingController: UIHostingController<AnyView>?
    private var headlessMenuView: UIView?

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
            uninstallHeadlessIfNeeded()
            installInlineIfNeeded()
            sync()
        } else {
            uninstallInlineIfNeeded()
            installHeadlessIfNeeded()
            sync()
        }
    }

    private func sync() {
        model.options = parsedOptions
        model.selectedData = selectedData
        model.placeholder = placeholder ?? "Select"
        model.interactivity = interactivity

        hostingController?.rootView = makeRootView()

        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    private func makeRootView() -> AnyView {
        return AnyView(PCSelectionMenuInlinePickerView(
            model: model,
            onSelectIndex: { [weak self] idx in
                guard let self else { return }
                let opts = self.parsedOptions
                guard idx >= 0, idx < opts.count else { return }
                let opt = opts[idx]
                self.selectedData = opt.data
                self.onSelect?(idx, opt.label, opt.data)
            }
        ))
    }

    private func installInlineIfNeeded() {
        guard hostingController == nil else { return }
        installHostingController()
    }

    private func uninstallInlineIfNeeded() {
        guard let host = hostingController else { return }
        hostingController = nil

        host.willMove(toParent: nil)
        host.view.removeFromSuperview()
        host.removeFromParent()
    }

    private func installHeadlessIfNeeded() {
        guard headlessMenuView == nil else { return }

        // Create an invisible anchor view
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = .clear
        view.isHidden = true

        addSubview(view)
        NSLayoutConstraint.activate([
            view.topAnchor.constraint(equalTo: topAnchor),
            view.bottomAnchor.constraint(equalTo: bottomAnchor),
            view.leadingAnchor.constraint(equalTo: leadingAnchor),
            view.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])

        headlessMenuView = view
    }

    private func uninstallHeadlessIfNeeded() {
        guard let view = headlessMenuView else { return }
        headlessMenuView = nil
        view.removeFromSuperview()
    }

    private func installHostingController() {
        let host = UIHostingController(rootView: makeRootView())
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
            presentHeadlessMenuIfNeeded()
        }
        // Note: dismissal is handled by the menu itself calling onRequestClose
    }

    private func presentHeadlessMenuIfNeeded() {
        guard headlessMenuView != nil else { return }
        guard let vc = nearestViewController() else { return }

        let opts = parsedOptions
        guard !opts.isEmpty else { return }

        logger.debug("presentHeadlessMenuIfNeeded: scheduling presentation with \(opts.count) options")
        DispatchQueue.main.asyncAfter(deadline: .now() + PCConstants.headlessPresentationDelay) {
            let menuVC = PCMenuViewController(
                options: opts,
                onSelect: { [weak self] idx in
                    guard let self else { return }
                    let opt = opts[idx]
                    logger.debug("headless menu selected: index=\(idx), data=\(opt.data)")
                    self.selectedData = opt.data
                    self.onSelect?(idx, opt.label, opt.data)
                },
                onCancel: { [weak self] in
                    logger.debug("headless menu cancelled")
                    self?.onRequestClose?()
                }
            )

            menuVC.modalPresentationStyle = .popover
            let popoverHeight = min(
                CGFloat(opts.count) * PCConstants.popoverRowHeight + PCConstants.popoverVerticalPadding,
                PCConstants.popoverMaxHeight
            )
            menuVC.preferredContentSize = CGSize(
                width: PCConstants.popoverWidth,
                height: popoverHeight
            )

            if let popover = menuVC.popoverPresentationController {
                popover.sourceView = self
                popover.sourceRect = self.bounds
                popover.permittedArrowDirections = []  // Remove arrow to match inline
                popover.delegate = menuVC
            }

            vc.present(menuVC, animated: true)
        }
    }

    // MARK: - Sizing

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        if anchorMode != "inline" { return CGSize(width: size.width, height: 1) }

        guard let host = hostingController else {
            return CGSize(width: size.width, height: PCConstants.minTouchTargetHeight)
        }

        let w = (size.width > 1) ? size.width : PCConstants.fallbackWidth
        let fitted = host.sizeThatFits(in: CGSize(width: w, height: .greatestFiniteMagnitude))
        return CGSize(width: size.width, height: max(PCConstants.minTouchTargetHeight, fitted.height))
    }

    public override var intrinsicContentSize: CGSize {
        if anchorMode != "inline" {
            return CGSize(width: UIView.noIntrinsicMetric, height: 1)
        }
        let h = max(
            PCConstants.minTouchTargetHeight,
            sizeThatFits(CGSize(width: bounds.width, height: .greatestFiniteMagnitude)).height
        )
        return CGSize(width: UIView.noIntrinsicMetric, height: h)
    }
}

// MARK: - Custom Menu View Controller (matches SwiftUI Menu appearance)

private class PCMenuViewController: UIViewController, UITableViewDelegate, UITableViewDataSource, UIPopoverPresentationControllerDelegate {
    private let options: [PCSelectionMenuOption]
    private let onSelect: (Int) -> Void
    private let onCancel: () -> Void
    private var tableView: UITableView!

    init(options: [PCSelectionMenuOption], onSelect: @escaping (Int) -> Void, onCancel: @escaping () -> Void) {
        self.options = options
        self.onSelect = onSelect
        self.onCancel = onCancel
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Add blur effect (liquid glass)
        let blurEffect = UIBlurEffect(style: .systemMaterial)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(blurView)

        tableView = UITableView(frame: .zero, style: .plain)
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .none
        tableView.isScrollEnabled = true
        tableView.rowHeight = PCConstants.popoverRowHeight
        let verticalPad = PCConstants.popoverVerticalPadding / 2
        tableView.contentInset = UIEdgeInsets(top: verticalPad, left: 0, bottom: verticalPad, right: 0)
        tableView.translatesAutoresizingMaskIntoConstraints = false

        blurView.contentView.addSubview(tableView)

        NSLayoutConstraint.activate([
            blurView.topAnchor.constraint(equalTo: view.topAnchor),
            blurView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            blurView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            blurView.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            tableView.topAnchor.constraint(equalTo: blurView.contentView.topAnchor),
            tableView.bottomAnchor.constraint(equalTo: blurView.contentView.bottomAnchor),
            tableView.leadingAnchor.constraint(equalTo: blurView.contentView.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: blurView.contentView.trailingAnchor),
        ])
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return options.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
        cell.textLabel?.text = options[indexPath.row].label
        cell.textLabel?.font = .systemFont(ofSize: 17)
        cell.backgroundColor = .clear
        cell.selectionStyle = .default
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        dismiss(animated: true) { [weak self] in
            self?.onSelect(indexPath.row)
        }
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        onCancel()
    }

    func adaptivePresentationStyle(for controller: UIPresentationController) -> UIModalPresentationStyle {
        return .none
    }
}

