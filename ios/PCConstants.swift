import UIKit

/// Centralized sizing constants for Platform Components iOS implementations.
/// These values control touch targets, popover sizes, and fallback dimensions.
enum PCConstants {
    // MARK: - Touch Targets

    /// Minimum touch target height (Apple HIG recommends 44pt)
    static let minTouchTargetHeight: CGFloat = 44

    // MARK: - Popover Sizing

    /// Default popover width for selection menus
    static let popoverWidth: CGFloat = 250

    /// Maximum popover height before scrolling
    static let popoverMaxHeight: CGFloat = 400

    /// Minimum row height in selection menu popover (used as baseline)
    static let popoverRowHeightMin: CGFloat = 44

    /// Dynamic row height that respects user's preferred content size
    static var popoverRowHeight: CGFloat {
        let bodyFont = UIFont.preferredFont(forTextStyle: .body)
        // Row height = font line height + vertical padding (16pt total)
        return max(popoverRowHeightMin, ceil(bodyFont.lineHeight) + 16)
    }

    /// Vertical padding in selection menu popover (top + bottom)
    static let popoverVerticalPadding: CGFloat = 16

    // MARK: - Fallback Dimensions

    /// Fallback width when constraint width is unavailable
    static let fallbackWidth: CGFloat = 320

    // MARK: - Timing

    /// Delay before presenting headless menu (allows layout to settle)
    static let headlessPresentationDelay: TimeInterval = 0.1
}
