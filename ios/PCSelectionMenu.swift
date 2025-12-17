import SwiftUI
import UIKit

// MARK: - SwiftUI inline picker model (file-scoped so SwiftUI can see it)

final class PCSelectionMenuModel: ObservableObject {
    @Published var options: [String] = []
    @Published var selectedIndex: Int = -1
    @Published var placeholder: String = "Select"
    @Published var disabled: Bool = false

    var displayTitle: String {
        if selectedIndex >= 0, selectedIndex < options.count {
            return options[selectedIndex]
        }
        return placeholder
    }

    var effectiveSelection: Int {
        if selectedIndex >= 0, selectedIndex < options.count { return selectedIndex }
        return 0
    }

    var hasOptions: Bool { !options.isEmpty }
}

// MARK: - SwiftUI inline picker (system anchor + system popup)

/*
private struct PCSelectionMenuInlinePickerView: View {
    @ObservedObject var model: PCSelectionMenuModel
    let onSelectIndex: (Int) -> Void

    var body: some View {
        Picker(
            model.displayTitle,
            selection: Binding<Int>(
                get: { model.effectiveSelection },
                set: { (newValue: Int) in onSelectIndex(newValue) }
            )
        ) {
            ForEach(0..<model.options.count, id: \.self) { (i: Int) in
                Text(model.options[i]).tag(i)
            }
        }
        .pickerStyle(.menu)  // ✅ system popup menu style
        .disabled(model.disabled || !model.hasOptions)
    }
}*/

private struct PCSelectionMenuInlinePickerView: View {
    @ObservedObject var model: PCSelectionMenuModel
    let onSelectIndex: (Int) -> Void

    var body: some View {
        Menu {
            ForEach(Array(model.options.enumerated()), id: \.offset) { i, title in
                Button(title) { onSelectIndex(i) }
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
            .padding(.vertical, 10)     // gives you a nice ~44pt-ish hit target
        }
        .disabled(model.disabled || !model.hasOptions)
    }
}

// MARK: - Main view

@objcMembers
public final class PCSelectionMenuView: UIControl,
    UIPopoverPresentationControllerDelegate,
    UIAdaptivePresentationControllerDelegate
{

    // MARK: - Props (set from ObjC++)

    public var options: [String] = [] { didSet { sync() } }
    public var selectedIndex: Int = -1 { didSet { sync() } }

    public var disabled: Bool = false {
        didSet {
            updateEnabled()
            sync()
        }
    }

    public var placeholder: String? { didSet { sync() } }

    /// "open" | "closed"
    /// ✅ Used only when inlineMode == false (headless presenter)
    public var visible: String = "closed" { didSet { updatePresentation() } }

    /// "auto" | "popover" | "sheet"
    public var presentation: String = "auto" { didSet { updatePresentation() } }

    /// ✅ true = inline SwiftUI Picker(.menu)
    /// ✅ false = headless presenter controlled by `visible`
    public var inlineMode: Bool = false { didSet { updateInlineMode() } }

    // MARK: - Events back to ObjC++

    public var onSelect: ((Int, String) -> Void)?
    public var onRequestClose: (() -> Void)?

    // MARK: - Internal

    private weak var presentedVC: UIViewController?

    // Inline SwiftUI hosting
    private let model = PCSelectionMenuModel()
    private var hostingController: UIHostingController<PCSelectionMenuInlinePickerView>?

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
        updateInlineMode()
        sync()
    }

    private func updateEnabled() {
        alpha = disabled ? 0.5 : 1.0
        isUserInteractionEnabled = !disabled
        accessibilityTraits = disabled ? [.notEnabled] : [.button]
    }

    // MARK: - Inline vs headless mode

    private func updateInlineMode() {
        if inlineMode {
            // Inline: remove any headless presentation if currently shown.
            dismissIfNeeded(emitClose: false)

            // Inline ignores `visible` (interactive UI)
            installInlineIfNeeded()
            sync()
        } else {
            // Headless: remove inline SwiftUI view
            uninstallInlineIfNeeded()

            // Apply current `visible`
            updatePresentation()
        }
    }

    private func sync() {
        model.options = options
        model.selectedIndex = selectedIndex
        model.placeholder = placeholder ?? "Select"
        model.disabled = disabled

        if inlineMode {
            hostingController?.rootView = makeInlineRootView()
        }

        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    private func makeInlineRootView() -> PCSelectionMenuInlinePickerView {
        PCSelectionMenuInlinePickerView(
            model: model,
            onSelectIndex: { [weak self] (idx: Int) in
                guard let self else { return }
                guard idx >= 0, idx < self.options.count else { return }
                self.selectedIndex = idx
                self.onSelect?(idx, self.options[idx])
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

        // Attach to nearest VC to avoid lifecycle warnings
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

    // MARK: - Headless presentation (non-inline)

    private func updatePresentation() {
        guard !inlineMode else { return }  // inline ignores visible
        guard !disabled else { return }  // disabled => don't present

        if visible == "open" {
            presentIfNeeded()
        } else {
            dismissIfNeeded(emitClose: false)
        }
    }

    private func presentIfNeeded() {
        guard presentedVC == nil else { return }
        guard let top = topViewController() else { return }

        let list = PCSelectionMenuListViewController(
            titleText: placeholder ?? "Select",
            options: options,
            onSelect: { [weak self] (idx: Int) in
                guard let self else { return }
                guard idx >= 0, idx < self.options.count else { return }
                self.selectedIndex = idx
                self.onSelect?(idx, self.options[idx])

                // Dismiss immediately for headless mode.
                self.dismissIfNeeded(emitClose: true)
            },
            onCancel: { [weak self] in
                self?.dismissIfNeeded(emitClose: true)
            }
        )

        let nav = UINavigationController(rootViewController: list)

        let style = resolvedModalStyle(for: top)
        nav.modalPresentationStyle = style

        if style == .popover {
            nav.preferredContentSize = list.computePreferredSize()

            if let pop = nav.popoverPresentationController {
                pop.delegate = self

                // ✅ Invisible anchor (top-center of the presenting VC)
                pop.sourceView = top.view
                let rectInTopView = self.convert(self.bounds, to: top.view)
                pop.sourceRect = rectInTopView

                pop.permittedArrowDirections = [.up, .down]
                pop.backgroundColor = list.view.backgroundColor
            }
        } else {
            nav.modalPresentationStyle = .pageSheet
            nav.presentationController?.delegate = self
        }

        // Track swipe-to-dismiss for sheets
        nav.presentationController?.delegate = self

        presentedVC = nav
        top.present(nav, animated: true)
    }

    private func dismissIfNeeded(emitClose: Bool) {
        guard let vc = presentedVC else { return }
        presentedVC = nil
        vc.dismiss(animated: true) { [weak self] in
            guard let self else { return }
            if emitClose {
                self.onRequestClose?()
            }
        }
    }

    private func resolvedModalStyle(for top: UIViewController) -> UIModalPresentationStyle {
        let isPad = (top.traitCollection.userInterfaceIdiom == .pad)
        switch presentation {
        case "popover":
            return .popover
        case "sheet":
            return .pageSheet
        default:  // "auto"
            return isPad ? .popover : .pageSheet
        }
    }

    private func invisibleAnchorRect(in container: UIView) -> CGRect {
        // Top-center, slightly below safe-area so it feels like a dropdown.
        container.layoutIfNeeded()
        let w = container.bounds.width
        let topInset = container.safeAreaInsets.top
        let y = topInset + 8
        return CGRect(x: w * 0.5, y: y, width: 1, height: 1)
    }

    // MARK: - Dismiss callbacks (user tapped outside / swiped down)

    public func popoverPresentationControllerDidDismissPopover(
        _ popoverPresentationController: UIPopoverPresentationController
    ) {
        // If the user dismisses the popover, notify JS to flip visible to "closed".
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
        // Keep popover as popover on iPhone if forced; otherwise UIKit may adapt.
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

    public override func sizeThatFits(_ size: CGSize) -> CGSize {
        if !inlineMode {
            return CGSize(width: size.width, height: 0)
        }

        let minH: CGFloat = 44
        guard let host = hostingController else {
            return CGSize(width: size.width, height: minH)
        }

        let w = (size.width > 1) ? size.width : 320
        let fitted = host.sizeThatFits(in: CGSize(width: w, height: .greatestFiniteMagnitude))
        return CGSize(width: size.width, height: max(minH, fitted.height))
    }

    public override var intrinsicContentSize: CGSize {
        if !inlineMode {
            return CGSize(width: UIView.noIntrinsicMetric, height: 0)
        }
        let h = max(44, sizeThatFits(CGSize(width: bounds.width, height: .greatestFiniteMagnitude)).height)
        return CGSize(width: UIView.noIntrinsicMetric, height: h)
    }
}

// MARK: - List VC (used only for headless non-inline presentation)

private final class PCSelectionMenuListViewController: UITableViewController {

    private let titleText: String
    private let options: [String]
    private let onSelectIndex: (Int) -> Void
    private let onCancel: () -> Void

    init(
        titleText: String,
        options: [String],
        onSelect: @escaping (Int) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.titleText = titleText
        self.options = options
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

    @objc private func cancelTapped() {
        onCancel()
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        options.count
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath)
        -> UITableViewCell
    {
        let cell = UITableViewCell(style: .default, reuseIdentifier: nil)
        cell.textLabel?.text = options[indexPath.row]
        cell.accessoryType = .none  // no checkmark UI
        return cell
    }

    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        onSelectIndex(indexPath.row)
    }

    func computePreferredSize() -> CGSize {
        return CGSize(width: -1, height: CGFloat(options.count) * 44)
    }
}
