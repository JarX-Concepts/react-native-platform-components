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

    /// Horizontal inset applied to each side of a menu row's label
    static let popoverRowHorizontalInset: CGFloat = 16

    /// Vertical padding added to each menu row's text (top + bottom combined)
    static let popoverRowVerticalPadding: CGFloat = 16

    /// Spacing between the selection checkmark and the row's label
    static let popoverCheckmarkSpacing: CGFloat = 8

    /// Symbol configuration of the selection checkmark (scales with Dynamic Type)
    static var popoverCheckmarkConfiguration: UIImage.SymbolConfiguration {
        UIImage.SymbolConfiguration(textStyle: .body, scale: .small)
            .applying(UIImage.SymbolConfiguration(weight: .semibold))
    }

    /// Leading column reserved for the checkmark on every row when the menu has a
    /// selection (like a system single-selection menu), checkmark width + spacing.
    static var popoverCheckmarkColumnWidth: CGFloat {
        let image = UIImage(systemName: "checkmark", withConfiguration: popoverCheckmarkConfiguration)
        return ceil(image?.size.width ?? 17) + popoverCheckmarkSpacing
    }

    /// Estimated single-line row height that respects the user's preferred
    /// content size. Used only as a table-view estimate; actual rows self-size.
    static var popoverRowHeight: CGFloat {
        let bodyFont = UIFont.preferredFont(forTextStyle: .body)
        return max(popoverRowHeightMin, ceil(bodyFont.lineHeight) + popoverRowVerticalPadding)
    }

    /// Measured height of a single menu row for the given label and content
    /// width, accounting for multi-line wrapping at the current Dynamic Type
    /// size. Mirrors the Auto Layout sizing of `PCGlassMenuCell` so the popover
    /// container can be sized to fit its content.
    static func popoverRowHeight(
        forLabel label: String,
        width: CGFloat,
        reservesCheckmark: Bool = false
    ) -> CGFloat {
        let bodyFont = UIFont.preferredFont(forTextStyle: .body)
        let checkmarkReserve = reservesCheckmark ? popoverCheckmarkColumnWidth : 0
        let textWidth = max(1, width - popoverRowHorizontalInset * 2 - checkmarkReserve)
        let bounding = (label as NSString).boundingRect(
            with: CGSize(width: textWidth, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: bodyFont],
            context: nil
        )
        return max(popoverRowHeightMin, ceil(bounding.height) + popoverRowVerticalPadding)
    }

    /// Adaptive popover width. Widens for accessibility content size categories
    /// so long labels wrap less aggressively (mirrors system menu behavior).
    /// The caller is responsible for clamping to the available screen width.
    static func popoverWidth(forCategory category: UIContentSizeCategory) -> CGFloat {
        guard category.isAccessibilityCategory else { return popoverWidth }
        switch category {
        case .accessibilityMedium: return 300
        case .accessibilityLarge: return 320
        case .accessibilityExtraLarge: return 340
        case .accessibilityExtraExtraLarge: return 360
        default: return 380 // accessibilityExtraExtraExtraLarge and beyond
        }
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
