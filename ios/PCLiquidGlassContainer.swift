import UIKit

/// The container Liquid Glass views merge in: a UIVisualEffectView with a
/// UIGlassContainerEffect on iOS 26. Glass views in its contentView render
/// as one shape, and blend into each other when they come within `spacing`.
///
/// Elsewhere (older iOS, or a build without the iOS 26 SDK) it has no effect
/// and is a plain container.
@objcMembers
public final class PCLiquidGlassContainerView: UIVisualEffectView {

    /// Distance at which glass views begin to merge; negative keeps the
    /// system default.
    public var spacing: CGFloat = -1 {
        didSet {
            if spacing != oldValue { applyEffect() }
        }
    }

    /// True once the container has been on screen for a run loop. Glass
    /// added, removed or moved after that morphs; glass that arrives with the
    /// container just appears.
    public private(set) var isSettled = false

    public override init(effect: UIVisualEffect?) {
        super.init(effect: nil)
        clipsToBounds = false
        applyEffect()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        clipsToBounds = false
        applyEffect()
    }

    public override func willMove(toWindow newWindow: UIWindow?) {
        super.willMove(toWindow: newWindow)
        if newWindow == nil {
            isSettled = false
        }
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        isSettled = false
        guard window != nil else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.isSettled = self.window != nil
        }
    }

    private func applyEffect() {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            let containerEffect = UIGlassContainerEffect()
            if spacing >= 0 {
                containerEffect.spacing = spacing
            }
            // Replacing one container effect with another leaves the
            // spacing the glass was merged with; clearing it first applies
            // the new one
            effect = nil
            effect = containerEffect
        }
        #endif
    }
}
