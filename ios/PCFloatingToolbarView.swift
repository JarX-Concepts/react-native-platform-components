import UIKit

/// The floating toolbar container: a Liquid Glass capsule on iOS 26, and a
/// blur-material capsule with a soft shadow on earlier versions, where a blur
/// over a flat background would otherwise have no edge.
///
/// Linked to a ScrollView (by nativeID), it sits on one of its edges: on iOS
/// 26 that edge's scroll edge effect takes the toolbar's shape and the style
/// asked for, and with hideOnScroll the toolbar slides past the edge while
/// the content scrolls down.
@objcMembers
public final class PCFloatingToolbarView: UIView {
    // MARK: - Props (set from ObjC++)

    /// "regular" | "clear"
    public var effectStyle: String = "regular" {
        didSet { if oldValue != effectStyle { applyEffect() } }
    }

    /// Tint over the material; nil keeps the plain material
    public var tintUIColor: UIColor? {
        didSet { applyEffect() }
    }

    /// iOS 26: glass that scales and shimmers under a touch
    public var interactive: Bool = false {
        didSet { if oldValue != interactive { applyEffect() } }
    }

    /// nativeID of the ScrollView the toolbar floats over
    public var scrollViewNativeID: String = "" {
        didSet { if oldValue != scrollViewNativeID { unlinkScrollView(); linkScrollView() } }
    }

    /// iOS 26 edge effect under the toolbar: "" (the scroll view's own) |
    /// "automatic" | "soft" | "hard" | "hidden"
    public var scrollEdgeEffect: String = "" {
        didSet { if oldValue != scrollEdgeEffect { applyScrollEdge() } }
    }

    /// Slide past the scroll view's edge while its content scrolls down
    public var hideOnScroll: Bool = false {
        didSet { if !hideOnScroll { setScrollHidden(false) } }
    }

    /// Whether the toolbar is slid away (the host passes touches through)
    public private(set) var isScrollHidden = false

    /// React children mount here
    public var contentView: UIView { effectView.contentView }

    // MARK: - Internal

    private let effectView = UIVisualEffectView(effect: nil)

    /// The linked scroll view, its offset observation and the edge the
    /// toolbar sits on
    private weak var linkedScrollView: UIScrollView?
    private var offsetObservation: NSKeyValueObservation?
    private var linkedEdge: UIRectEdge = .bottom

    /// iOS 26: the UIScrollEdgeElementContainerInteraction on this view, and
    /// the edge effect values it replaced (edge, style, isHidden)
    private var edgeInteraction: UIInteraction?
    private var savedEdgeEffect: (edge: UIRectEdge, style: AnyObject, hidden: Bool)?

    /// Liquid Glass needs both the iOS 26 SDK at build time and iOS 26 at runtime.
    private static var glassAvailable: Bool {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) { return true }
        #endif
        return false
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
        clipsToBounds = false
        effectView.layer.cornerCurve = .continuous
        addSubview(effectView)

        if !Self.glassAvailable {
            // The blur is clipped to the capsule; the shadow lives on this view
            effectView.clipsToBounds = true
            layer.shadowColor = UIColor.black.cgColor
            layer.shadowOpacity = 0.12
            layer.shadowRadius = 10
            layer.shadowOffset = CGSize(width: 0, height: 4)
        }
        applyEffect()
    }

    // MARK: - Layout

    public override func layoutSubviews() {
        super.layoutSubviews()
        effectView.frame = bounds
        let radius = min(bounds.width, bounds.height) / 2
        effectView.layer.cornerRadius = radius
        if !Self.glassAvailable {
            layer.shadowPath = UIBezierPath(roundedRect: bounds, cornerRadius: radius).cgPath
        }
        // The ScrollView may mount after the toolbar, and the toolbar may
        // move to another edge
        if let scrollView = linkedScrollView, scrollView.window != nil {
            if edge(of: scrollView) != linkedEdge { applyScrollEdge() }
        } else {
            unlinkScrollView()
            linkScrollView()
        }
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        // Off screen, the scroll view gets its edge effect back
        if window == nil {
            unlinkScrollView()
        } else {
            linkScrollView()
        }
    }

    // MARK: - Effect

    private func applyEffect() {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            let glass = UIGlassEffect(style: effectStyle == "clear" ? .clear : .regular)
            glass.isInteractive = interactive
            if let tintUIColor {
                glass.tintColor = tintUIColor
            }
            effectView.effect = glass
            effectView.contentView.backgroundColor = nil
            return
        }
        #endif
        effectView.effect = UIBlurEffect(
            style: effectStyle == "clear" ? .systemUltraThinMaterial : .systemThinMaterial
        )
        // UIBlurEffect has no tint; wash the content area with the color instead
        effectView.contentView.backgroundColor = tintUIColor?.withAlphaComponent(0.35)
    }

    // MARK: - Linked scroll view

    private func linkScrollView() {
        guard linkedScrollView == nil, !scrollViewNativeID.isEmpty, let window,
              let scrollView = Self.scrollView(nativeID: scrollViewNativeID, in: window)
        else { return }
        linkedScrollView = scrollView
        offsetObservation = scrollView.observe(\.contentOffset, options: [.old, .new]) { [weak self] scrollView, change in
            guard let old = change.oldValue, let new = change.newValue else { return }
            self?.contentScrolled(scrollView, from: old, to: new)
        }
        applyScrollEdge()
    }

    private func unlinkScrollView() {
        guard linkedScrollView != nil || offsetObservation != nil || edgeInteraction != nil else { return }
        offsetObservation?.invalidate()
        offsetObservation = nil
        restoreScrollEdge()
        #if compiler(>=6.2)
        if #available(iOS 26.0, *), let edgeInteraction {
            removeInteraction(edgeInteraction)
        }
        #endif
        edgeInteraction = nil
        linkedScrollView = nil
        setScrollHidden(false)
    }

    /// The edge of the scroll view the toolbar sits on: top or bottom for a
    /// horizontal toolbar, left or right for a vertical one.
    private func edge(of scrollView: UIScrollView) -> UIRectEdge {
        // The host, not this view, which moves while hidden
        let host = superview ?? self
        let toolbar = host.convert(host.bounds, to: nil)
        let visible = scrollView.convert(scrollView.bounds, to: nil)
        if toolbar.width >= toolbar.height {
            return toolbar.midY < visible.midY ? .top : .bottom
        }
        return toolbar.midX < visible.midX ? .left : .right
    }

    /// The UIScrollView of the React Native view with this nativeID.
    private static func scrollView(nativeID: String, in root: UIView) -> UIScrollView? {
        var match: UIView?
        func find(_ view: UIView) {
            guard match == nil else { return }
            if view.responds(to: NSSelectorFromString("nativeId")),
               view.value(forKey: "nativeId") as? String == nativeID {
                match = view
                return
            }
            view.subviews.forEach(find)
        }
        find(root)
        guard let match else { return nil }
        if let scroll = match as? UIScrollView { return scroll }
        var scroll: UIScrollView?
        func firstScroll(_ view: UIView) {
            guard scroll == nil else { return }
            if let s = view as? UIScrollView { scroll = s; return }
            view.subviews.forEach(firstScroll)
        }
        firstScroll(match)
        return scroll
    }

    // MARK: - Scroll edge effect (iOS 26)

    /// Shapes the linked edge's effect around the toolbar and applies the
    /// style asked for, after giving back what an earlier call replaced.
    private func applyScrollEdge() {
        restoreScrollEdge()
        guard let scrollView = linkedScrollView else { return }
        linkedEdge = edge(of: scrollView)
        #if compiler(>=6.2)
        guard #available(iOS 26.0, *) else { return }

        let interaction = edgeInteraction as? UIScrollEdgeElementContainerInteraction
            ?? UIScrollEdgeElementContainerInteraction()
        if edgeInteraction == nil {
            addInteraction(interaction)
            edgeInteraction = interaction
        }
        interaction.scrollView = scrollView
        interaction.edge = linkedEdge

        guard !scrollEdgeEffect.isEmpty else { return }
        let effect = Self.edgeEffect(of: scrollView, at: linkedEdge)
        savedEdgeEffect = (linkedEdge, effect.style, effect.isHidden)
        switch scrollEdgeEffect {
        case "hidden":
            effect.isHidden = true
        case "soft":
            effect.style = .soft
            effect.isHidden = false
        case "hard":
            effect.style = .hard
            effect.isHidden = false
        default:
            effect.style = .automatic
            effect.isHidden = false
        }
        #endif
    }

    /// Gives the scroll view back the edge effect values applyScrollEdge
    /// replaced.
    private func restoreScrollEdge() {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *), let saved = savedEdgeEffect, let scrollView = linkedScrollView,
           let style = saved.style as? UIScrollEdgeEffect.Style {
            let effect = Self.edgeEffect(of: scrollView, at: saved.edge)
            effect.style = style
            effect.isHidden = saved.hidden
        }
        #endif
        savedEdgeEffect = nil
    }

    #if compiler(>=6.2)
    @available(iOS 26.0, *)
    private static func edgeEffect(of scrollView: UIScrollView, at edge: UIRectEdge) -> UIScrollEdgeEffect {
        switch edge {
        case .top: return scrollView.topEdgeEffect
        case .left: return scrollView.leftEdgeEffect
        case .right: return scrollView.rightEdgeEffect
        default: return scrollView.bottomEdgeEffect
        }
    }
    #endif

    // MARK: - Hide on scroll

    // The motion of Material's HideViewOnScrollBehavior, as TabBar uses on
    // Android: out while the content scrolls down, back as it scrolls up or
    // reaches the top.
    private func contentScrolled(_ scrollView: UIScrollView, from old: CGPoint, to new: CGPoint) {
        guard hideOnScroll else { return }
        let top = -scrollView.adjustedContentInset.top
        if new.y <= top {
            setScrollHidden(false)
            return
        }
        // Rubber-banding past the end doesn't scroll the content
        let bottom = max(top, scrollView.contentSize.height + scrollView.adjustedContentInset.bottom - scrollView.bounds.height)
        guard new.y != old.y, new.y <= bottom, old.y <= bottom else { return }
        setScrollHidden(new.y > old.y)
    }

    private func setScrollHidden(_ hide: Bool) {
        guard isScrollHidden != hide else { return }
        isScrollHidden = hide
        let offset = hide ? hiddenOffset() : .zero
        UIView.animate(
            withDuration: hide ? 0.175 : 0.225,
            delay: 0,
            options: [hide ? .curveEaseIn : .curveEaseOut, .beginFromCurrentState, .allowUserInteraction]
        ) {
            self.transform = CGAffineTransform(translationX: offset.x, y: offset.y)
        }
    }

    /// How far to move to get past the linked edge: from the toolbar to the
    /// edge of the visible scroll view, and at least the toolbar's own size.
    private func hiddenOffset() -> CGPoint {
        guard let scrollView = linkedScrollView else { return .zero }
        let host = superview ?? self
        let toolbar = host.convert(host.bounds, to: nil)
        let visible = scrollView.convert(scrollView.bounds, to: nil)
        switch linkedEdge {
        case .top:
            return CGPoint(x: 0, y: min(visible.minY - toolbar.maxY, -toolbar.height))
        case .left:
            return CGPoint(x: min(visible.minX - toolbar.maxX, -toolbar.width), y: 0)
        case .right:
            return CGPoint(x: max(visible.maxX - toolbar.minX, toolbar.width), y: 0)
        default:
            return CGPoint(x: 0, y: max(visible.maxY - toolbar.minY, toolbar.height))
        }
    }
}
