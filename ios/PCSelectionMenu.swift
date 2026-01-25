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
                    .font(.body)
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
    private var headlessMenuVC: UIViewController?
    private var headlessPresentationToken: Int = 0

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
        if disabled {
            dismissHeadlessIfNeeded()
        }
    }

    // MARK: - Inline vs headless

    private func updateAnchorMode() {
        if anchorMode == "inline" {
            dismissHeadlessIfNeeded()
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
        headlessPresentationToken += 1

        if visible == "open" && interactivity != "disabled" {
            presentHeadlessMenuIfNeeded(token: headlessPresentationToken)
        } else {
            dismissHeadlessIfNeeded()
        }
    }

    private func dismissHeadlessIfNeeded() {
        guard let vc = headlessMenuVC else { return }
        headlessMenuVC = nil
        vc.dismiss(animated: true)
    }

    private func presentHeadlessMenuIfNeeded(token: Int) {
        guard headlessMenuView != nil else { return }
        guard let vc = nearestViewController() else { return }

        let opts = parsedOptions
        guard !opts.isEmpty else { return }

        logger.debug("presentHeadlessMenuIfNeeded: scheduling presentation with \(opts.count) options")
        DispatchQueue.main.asyncAfter(deadline: .now() + PCConstants.headlessPresentationDelay) { [weak self] in
            guard let self else { return }
            guard self.headlessPresentationToken == token else { return }
            guard self.visible == "open" else { return }
            guard self.anchorMode != "inline" else { return }
            guard self.interactivity != "disabled" else { return }
            guard self.headlessMenuVC == nil else { return }
            guard self.window != nil else { return }

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
                },
                onDismiss: { [weak self] in
                    self?.headlessMenuVC = nil
                }
            )

            // Calculate menu position relative to source view
            let sourceFrame = self.convert(self.bounds, to: vc.view)
            let screenBounds = vc.view.bounds
            let popoverHeight = min(
                CGFloat(opts.count) * PCConstants.popoverRowHeight + PCConstants.popoverVerticalPadding,
                PCConstants.popoverMaxHeight
            )
            let spacing: CGFloat = 8

            // Check if menu fits below the source view
            let rowHeight = PCConstants.popoverRowHeight
            let wouldExtendBeyondBottom = sourceFrame.maxY + spacing + popoverHeight > screenBounds.maxY - 20

            let menuY: CGFloat
            if wouldExtendBeyondBottom {
                // Position above the source view (no overlap offset)
                menuY = sourceFrame.minY - spacing - popoverHeight
            } else {
                // Position below, but shift up by one row to overlap trigger (like system menu)
                menuY = sourceFrame.maxY + spacing - rowHeight
            }

            // Center horizontally, but keep within screen bounds
            var menuX = sourceFrame.midX - PCConstants.popoverWidth / 2
            menuX = max(16, min(menuX, screenBounds.maxX - PCConstants.popoverWidth - 16))

            let menuFrame = CGRect(
                x: menuX,
                y: menuY,
                width: PCConstants.popoverWidth,
                height: popoverHeight
            )

            menuVC.modalPresentationStyle = .overCurrentContext
            menuVC.modalTransitionStyle = .crossDissolve
            menuVC.menuFrame = menuFrame

            self.headlessMenuVC = menuVC
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

// MARK: - Glass Menu Cell

private class PCGlassMenuCell: UITableViewCell {
    static let reuseIdentifier = "PCGlassMenuCell"

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupCell()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupCell()
    }

    private func setupCell() {
        backgroundColor = .clear
        contentView.backgroundColor = .clear
        selectionStyle = .none
        textLabel?.font = .preferredFont(forTextStyle: .body)
        textLabel?.adjustsFontForContentSizeCategory = true
    }
}

// MARK: - Custom Menu View Controller (matches SwiftUI Menu appearance)

private class PCMenuViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    private let options: [PCSelectionMenuOption]
    private let onSelect: (Int) -> Void
    private let onCancel: () -> Void
    private let onDismiss: () -> Void
    private var tableView: UITableView!
    private var menuContainer: UIView!

    var menuFrame: CGRect = .zero

    init(
        options: [PCSelectionMenuOption],
        onSelect: @escaping (Int) -> Void,
        onCancel: @escaping () -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.options = options
        self.onSelect = onSelect
        self.onCancel = onCancel
        self.onDismiss = onDismiss
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = .clear

        // Tap outside to dismiss
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleBackgroundTap))
        tapGesture.cancelsTouchesInView = false
        view.addGestureRecognizer(tapGesture)

        // Menu container positioned at menuFrame
        menuContainer = UIView(frame: menuFrame)
        menuContainer.backgroundColor = .clear
        menuContainer.layer.cornerRadius = 12
        menuContainer.clipsToBounds = true
        view.addSubview(menuContainer)

        // Use liquid glass on iOS 26+, fall back to system material blur on older versions
        let effectView: UIVisualEffectView
        if #available(iOS 26, *) {
            var glassEffect = UIGlassEffect()
            glassEffect.isInteractive = true
            effectView = UIVisualEffectView(effect: glassEffect)
        } else {
            let blurEffect = UIBlurEffect(style: .systemMaterial)
            effectView = UIVisualEffectView(effect: blurEffect)
        }
        effectView.frame = menuContainer.bounds
        effectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        menuContainer.addSubview(effectView)

        tableView = UITableView(frame: menuContainer.bounds, style: .plain)
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(PCGlassMenuCell.self, forCellReuseIdentifier: PCGlassMenuCell.reuseIdentifier)
        tableView.backgroundColor = .clear
        tableView.separatorStyle = .none
        tableView.isScrollEnabled = true
        tableView.rowHeight = PCConstants.popoverRowHeight
        tableView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        let verticalPad = PCConstants.popoverVerticalPadding / 2
        tableView.contentInset = UIEdgeInsets(top: verticalPad, left: 0, bottom: verticalPad, right: 0)

        effectView.contentView.addSubview(tableView)
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        onDismiss()
    }

    @objc private func handleBackgroundTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: view)
        if !menuContainer.frame.contains(location) {
            dismiss(animated: true) { [weak self] in
                self?.onCancel()
            }
        }
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return options.count
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: PCGlassMenuCell.reuseIdentifier, for: indexPath)
        cell.textLabel?.text = options[indexPath.row].label
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        dismiss(animated: true) { [weak self] in
            self?.onSelect(indexPath.row)
        }
    }
}
