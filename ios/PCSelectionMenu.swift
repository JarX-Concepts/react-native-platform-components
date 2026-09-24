import os.log
import UIKit

private let logger = Logger(subsystem: "com.platformcomponents", category: "SelectionMenu")

// MARK: - Option model (bridged from ObjC++ as dictionaries)

struct PCSelectionMenuOption {
    let label: String
    let data: String
    let subtitle: String
    let icon: PCButtonSupport.Icon
}

@objcMembers
public final class PCSelectionMenuView: UIControl {
    // MARK: - Props (set from ObjC++)

    /// ObjC++ sets this as an array of dictionaries:
    /// [{label, data, subtitle, iconType, iconName, iconUri, iconScale, iconTinted}]
    public var options: [Any] = [] {
        didSet {
            parsedOptions = options.compactMap { any in
                guard let dict = any as? [String: Any] else { return nil }
                return PCSelectionMenuOption(
                    label: (dict["label"] as? String) ?? "",
                    data: (dict["data"] as? String) ?? "",
                    subtitle: (dict["subtitle"] as? String) ?? "",
                    icon: PCButtonSupport.Icon(dictionary: dict)
                )
            }
            sync()
        }
    }

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

    // MARK: - Internal (inline UIKit views)

    private var menuButton: UIButton?

    // MARK: - Internal (headless)

    /// Invisible anchor of the headless menu. On iOS 17.4+ it presents the
    /// system menu (`performPrimaryAction()`); before that it only marks the
    /// spot for the popover fallback.
    private var headlessMenuButton: PCMenuButton?
    private var headlessMenuVC: UIViewController?
    private var headlessPresentationToken: Int = 0
    /// An option was picked while the headless system menu was open.
    private var headlessSelectedWhileOpen = false

    private var parsedOptions: [PCSelectionMenuOption] = []

    private var displayTitle: String {
        let opts = parsedOptions
        if !selectedData.isEmpty, let opt = opts.first(where: { $0.data == selectedData }) {
            return opt.label
        }
        return placeholder ?? "Select"
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
        // Update the button title
        menuButton?.setTitle(displayTitle, for: .normal)

        // Rebuild the UIMenu with current options (and update it if it's open)
        rebuildMenu()

        invalidateIntrinsicContentSize()
        setNeedsLayout()
    }

    // MARK: - Inline (UIKit-based)

    private func installInlineIfNeeded() {
        guard menuButton == nil else { return }

        var config = UIButton.Configuration.plain()
        config.baseForegroundColor = .tintColor
        config.image = UIImage(systemName: "chevron.up.chevron.down")
        config.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(scale: .small)
        config.imagePlacement = .trailing
        config.imagePadding = 8
        config.contentInsets = NSDirectionalEdgeInsets(top: 10, leading: 0, bottom: 10, trailing: 0)

        let button = UIButton(configuration: config)
        button.showsMenuAsPrimaryAction = true
        button.changesSelectionAsPrimaryAction = false

        addSubview(button)
        menuButton = button

        rebuildMenu()
        setNeedsLayout()
    }

    private func uninstallInlineIfNeeded() {
        guard let button = menuButton else { return }
        button.removeFromSuperview()
        menuButton = nil
    }

    private func rebuildMenu() {
        guard menuButton != nil || headlessMenuButton != nil else { return }
        let menu = (interactivity == "disabled" || parsedOptions.isEmpty) ? nil : buildMenu()
        menuButton?.menu = menu
        headlessMenuButton?.setMenu(menu)
    }

    /// A single-selection system menu of the options, with their subtitles and
    /// icons. The system draws its checkmark on the selected option. Selection
    /// stays controlled by the `selected` prop: the menu is rebuilt when it
    /// changes, so the button's changesSelectionAsPrimaryAction stays off.
    private func buildMenu() -> UIMenu {
        let opts = parsedOptions
        let items = opts.enumerated().map { idx, opt in
            PCMenuItem(
                index: idx,
                id: String(idx),
                title: opt.label,
                subtitle: opt.subtitle,
                icon: opt.icon,
                state: (!selectedData.isEmpty && opt.data == selectedData) ? "on" : "off"
            )
        }
        return PCMenuSupport.menu(
            title: "",
            options: .singleSelection,
            items: items,
            onImageLoaded: { [weak self] in self?.rebuildMenu() },
            handler: { [weak self] item in
                guard let self, item.index < opts.count else { return }
                let opt = opts[item.index]
                // A pick from the headless system menu isn't a dismissal to report
                if self.anchorMode != "inline" { self.headlessSelectedWhileOpen = true }
                self.selectedData = opt.data
                self.onSelect?(item.index, opt.label, opt.data)
            }
        )
    }

    override public func layoutSubviews() {
        super.layoutSubviews()
        guard let button = menuButton else { return }
        let fitted = button.intrinsicContentSize
        button.frame = CGRect(
            x: 0,
            y: (bounds.height - fitted.height) / 2,
            width: fitted.width,
            height: fitted.height
        )
    }

    // MARK: - Headless

    private func installHeadlessIfNeeded() {
        guard headlessMenuButton == nil else { return }

        // An invisible button over the view's bounds anchors the system menu.
        // Touches pass through the headless view (see hitTest), so only the
        // `visible` prop opens it.
        let button = PCMenuButton(type: .custom)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.backgroundColor = .clear
        button.isAccessibilityElement = false
        button.onMenuOpen = { [weak self] in
            self?.headlessSelectedWhileOpen = false
        }
        button.onMenuClose = { [weak self] in
            guard let self else { return }
            let selected = self.headlessSelectedWhileOpen
            self.headlessSelectedWhileOpen = false
            // Dismissed without a pick while still meant to be open: ask to close.
            // A close requested through `visible` isn't reported back.
            if !selected && self.visible == "open" {
                logger.debug("headless system menu dismissed -> requestClose")
                self.onRequestClose?()
            }
        }

        addSubview(button)
        NSLayoutConstraint.activate([
            button.topAnchor.constraint(equalTo: topAnchor),
            button.bottomAnchor.constraint(equalTo: bottomAnchor),
            button.leadingAnchor.constraint(equalTo: leadingAnchor),
            button.trailingAnchor.constraint(equalTo: trailingAnchor),
        ])

        headlessMenuButton = button
        rebuildMenu()
    }

    private func uninstallHeadlessIfNeeded() {
        guard let button = headlessMenuButton else { return }
        headlessMenuButton = nil
        button.dismissMenu()
        button.removeFromSuperview()
    }

    public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        // Headless: the view is only an anchor, never a touch target.
        guard anchorMode == "inline" else { return nil }
        return super.hitTest(point, with: event)
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        // A menu asked for before the view was on screen opens now.
        if window != nil, visible == "open" { updatePresentation() }
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
            if PCMenuButton.canPresentMenuProgrammatically {
                presentSystemMenuIfNeeded(token: headlessPresentationToken)
            } else {
                presentHeadlessMenuIfNeeded(token: headlessPresentationToken)
            }
        } else {
            dismissHeadlessIfNeeded()
        }
    }

    private func dismissHeadlessIfNeeded() {
        if let button = headlessMenuButton, button.isMenuVisible {
            button.dismissMenu()
        }
        guard let vc = headlessMenuVC else { return }
        headlessMenuVC = nil
        vc.dismiss(animated: true)
    }

    /// iOS 17.4+: the system menu, opened from the invisible anchor button with
    /// `UIControl.performPrimaryAction()`.
    private func presentSystemMenuIfNeeded(token: Int) {
        guard let button = headlessMenuButton, !parsedOptions.isEmpty else { return }

        // Next run loop turn, so the anchor has its final frame.
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard self.headlessPresentationToken == token else { return }
            guard self.visible == "open", self.anchorMode != "inline" else { return }
            guard self.interactivity != "disabled" else { return }
            guard self.window != nil, !button.isMenuVisible else { return }

            logger.debug("presentSystemMenuIfNeeded: presenting \(self.parsedOptions.count) options")
            self.layoutIfNeeded()
            self.rebuildMenu()
            button.presentMenu()
        }
    }

    /// Before iOS 17.4 UIKit has no public way to open a menu without a touch,
    /// so modal mode shows a popover styled like a system menu.
    private func presentHeadlessMenuIfNeeded(token: Int) {
        guard headlessMenuButton != nil else { return }
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

            let selectedIndex = self.selectedData.isEmpty
                ? nil
                : opts.firstIndex(where: { $0.data == self.selectedData })
            // Like a system menu, every row reserves the checkmark column when one is shown.
            let reservesCheckmark = selectedIndex != nil

            let menuVC = PCMenuViewController(
                options: opts,
                selectedIndex: selectedIndex,
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
            let spacing: CGFloat = 8

            // Adaptive width (wider at accessibility sizes), clamped to the screen.
            let category = self.traitCollection.preferredContentSizeCategory
            let menuWidth = min(
                PCConstants.popoverWidth(forCategory: category),
                screenBounds.width - 32
            )

            // Measure the real (possibly multi-line) content height so the
            // container fits its rows instead of clipping or leaving gaps.
            let contentHeight = opts.reduce(PCConstants.popoverVerticalPadding) { partial, opt in
                partial + PCConstants.popoverRowHeight(
                    forLabel: opt.label,
                    width: menuWidth,
                    reservesCheckmark: reservesCheckmark
                )
            }
            // Allow taller menus at accessibility sizes; otherwise keep them compact.
            let maxHeight = category.isAccessibilityCategory
                ? max(PCConstants.popoverMaxHeight, screenBounds.height - 120)
                : PCConstants.popoverMaxHeight
            let popoverHeight = min(contentHeight, maxHeight)

            // Check if menu fits below the source view
            let firstRowHeight = PCConstants.popoverRowHeight(
                forLabel: opts[0].label,
                width: menuWidth,
                reservesCheckmark: reservesCheckmark
            )
            let wouldExtendBeyondBottom = sourceFrame.maxY + spacing + popoverHeight > screenBounds.maxY - 20

            var menuY: CGFloat
            if wouldExtendBeyondBottom {
                // Position above the source view (no overlap offset)
                menuY = sourceFrame.minY - spacing - popoverHeight
            } else {
                // Position below, but shift up by one row to overlap trigger (like system menu)
                menuY = sourceFrame.maxY + spacing - firstRowHeight
            }

            // Keep the menu fully on screen vertically (tall menus at large
            // Dynamic Type sizes can otherwise run off the top or bottom).
            let topMargin = vc.view.safeAreaInsets.top + spacing
            let bottomLimit = screenBounds.maxY - vc.view.safeAreaInsets.bottom - spacing - popoverHeight
            menuY = min(max(menuY, topMargin), max(topMargin, bottomLimit))

            // Center horizontally, but keep within screen bounds
            var menuX = sourceFrame.midX - menuWidth / 2
            menuX = max(16, min(menuX, screenBounds.maxX - menuWidth - 16))

            let menuFrame = CGRect(
                x: menuX,
                y: menuY,
                width: menuWidth,
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

        guard let button = menuButton else {
            return CGSize(width: 0, height: PCConstants.minTouchTargetHeight)
        }

        let fitted = button.intrinsicContentSize
        return CGSize(
            width: fitted.width,
            height: max(PCConstants.minTouchTargetHeight, fitted.height)
        )
    }

    public override var intrinsicContentSize: CGSize {
        if anchorMode != "inline" {
            return CGSize(width: UIView.noIntrinsicMetric, height: 1)
        }
        let fitted = sizeThatFits(CGSize(width: CGFloat.greatestFiniteMagnitude, height: .greatestFiniteMagnitude))
        return CGSize(
            width: fitted.width,
            height: max(PCConstants.minTouchTargetHeight, fitted.height)
        )
    }

    /// Called by the measuring pipeline to get the size for Yoga layout.
    /// Headless mode returns zero so Yoga reserves nothing.
    @objc public func sizeForLayout(withConstrainedTo constrainedSize: CGSize) -> CGSize {
        guard anchorMode == "inline" else { return .zero }

        guard let button = menuButton else {
            return CGSize(width: 0, height: PCConstants.minTouchTargetHeight)
        }

        let fitted = button.intrinsicContentSize
        return CGSize(
            width: fitted.width,
            height: max(PCConstants.minTouchTargetHeight, fitted.height)
        )
    }
}

// MARK: - Glass Menu Cell

private class PCGlassMenuCell: UITableViewCell {
    static let reuseIdentifier = "PCGlassMenuCell"

    /// Custom multi-line label. We avoid the legacy `textLabel` because it
    /// defaults to a single line and does not drive self-sizing reliably, which
    /// caused rows to overlap at large Dynamic Type sizes.
    let menuLabel = UILabel()

    /// Leading checkmark on the selected row, as in a system single-selection menu.
    private let checkmarkView = UIImageView()
    private var labelLeadingToContent: NSLayoutConstraint!
    private var labelLeadingToCheckmark: NSLayoutConstraint!

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

        menuLabel.font = .preferredFont(forTextStyle: .body)
        menuLabel.adjustsFontForContentSizeCategory = true
        menuLabel.numberOfLines = 0
        menuLabel.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(menuLabel)

        checkmarkView.image = UIImage(
            systemName: "checkmark",
            withConfiguration: PCConstants.popoverCheckmarkConfiguration
        )
        checkmarkView.tintColor = .label
        checkmarkView.contentMode = .center
        checkmarkView.translatesAutoresizingMaskIntoConstraints = false
        checkmarkView.setContentHuggingPriority(.required, for: .horizontal)
        checkmarkView.setContentCompressionResistancePriority(.required, for: .horizontal)
        contentView.addSubview(checkmarkView)

        let v = PCConstants.popoverRowVerticalPadding / 2
        let h = PCConstants.popoverRowHorizontalInset
        labelLeadingToContent = menuLabel.leadingAnchor.constraint(
            equalTo: contentView.leadingAnchor, constant: h)
        labelLeadingToCheckmark = menuLabel.leadingAnchor.constraint(
            equalTo: checkmarkView.trailingAnchor, constant: PCConstants.popoverCheckmarkSpacing)
        // Center the label and let it grow the row vertically. The min-height
        // constraint guarantees the 44pt touch target for short labels, while
        // the >= top / <= bottom pair lets tall (wrapped) labels expand the row.
        NSLayoutConstraint.activate([
            menuLabel.topAnchor.constraint(greaterThanOrEqualTo: contentView.topAnchor, constant: v),
            menuLabel.bottomAnchor.constraint(lessThanOrEqualTo: contentView.bottomAnchor, constant: -v),
            menuLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            labelLeadingToContent,
            checkmarkView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: h),
            checkmarkView.firstBaselineAnchor.constraint(equalTo: menuLabel.firstBaselineAnchor),
            menuLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -h),
            contentView.heightAnchor.constraint(greaterThanOrEqualToConstant: PCConstants.popoverRowHeightMin),
        ])
    }

    /// `reservesCheckmark` indents every row when the menu has a selection, so labels
    /// stay aligned; only the selected row shows the checkmark.
    func configure(label: String, selected: Bool, reservesCheckmark: Bool) {
        menuLabel.text = label
        checkmarkView.isHidden = !selected
        labelLeadingToContent.isActive = !reservesCheckmark
        labelLeadingToCheckmark.isActive = reservesCheckmark
        accessibilityTraits = selected ? [.button, .selected] : [.button]
    }
}

// MARK: - Custom Menu View Controller (matches SwiftUI Menu appearance)

private class PCMenuViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    private let options: [PCSelectionMenuOption]
    private let selectedIndex: Int?
    private let onSelect: (Int) -> Void
    private let onCancel: () -> Void
    private let onDismiss: () -> Void
    private var tableView: UITableView!
    private var menuContainer: UIView!

    var menuFrame: CGRect = .zero

    init(
        options: [PCSelectionMenuOption],
        selectedIndex: Int?,
        onSelect: @escaping (Int) -> Void,
        onCancel: @escaping () -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.options = options
        self.selectedIndex = selectedIndex
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

        // Use liquid glass on iOS 26+, fall back to system material blur on older
        // versions. UIGlassEffect only exists in the iOS 26 SDK, so the branch is
        // compiled out entirely on older toolchains — same guard as
        // PCLiquidGlass.swift, which keeps the library buildable without Xcode 26.
        let effectView: UIVisualEffectView
        #if compiler(>=6.2)
        if #available(iOS 26, *) {
            let glassEffect = UIGlassEffect()
            glassEffect.isInteractive = true
            effectView = UIVisualEffectView(effect: glassEffect)
        } else {
            let blurEffect = UIBlurEffect(style: .systemMaterial)
            effectView = UIVisualEffectView(effect: blurEffect)
        }
        #else
        let blurEffect = UIBlurEffect(style: .systemMaterial)
        effectView = UIVisualEffectView(effect: blurEffect)
        #endif
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
        // Self-sizing rows so labels that wrap at large Dynamic Type sizes get
        // the height they need instead of overlapping a fixed-height row.
        tableView.rowHeight = UITableView.automaticDimension
        tableView.estimatedRowHeight = PCConstants.popoverRowHeight
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
        (cell as? PCGlassMenuCell)?.configure(
            label: options[indexPath.row].label,
            selected: indexPath.row == selectedIndex,
            reservesCheckmark: selectedIndex != nil
        )
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        dismiss(animated: true) { [weak self] in
            self?.onSelect(indexPath.row)
        }
    }
}
