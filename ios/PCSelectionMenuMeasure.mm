// PCSelectionMenuMeasure.mm
// UIKit-based text measurement for the SelectionMenu shadow node.
// Called from measureContent() so Yoga gets the correct intrinsic size
// in the same Fabric commit as the props change.

#import <UIKit/UIKit.h>
#import <cmath>
#import <string>

#include "PCSelectionMenuMeasure.h"

namespace facebook::react {

PCSelectionMenuMeasuredSize PCSelectionMenuMeasureLabel(
    const std::string& displayTitle) {
  @autoreleasepool {
    NSString *text = [NSString stringWithUTF8String:displayTitle.c_str()];

    UIFont *font = [UIFont preferredFontForTextStyle:UIFontTextStyleBody];
    CGSize textSize =
        [text sizeWithAttributes:@{NSFontAttributeName : font}];

    // Chevron icon (matches the SwiftUI view: chevron.up.chevron.down, .small)
    UIImageSymbolConfiguration *symCfg = [UIImageSymbolConfiguration
        configurationWithTextStyle:UIFontTextStyleBody
                             scale:UIImageSymbolScaleSmall];
    UIImage *chevron =
        [UIImage systemImageNamed:@"chevron.up.chevron.down"
                withConfiguration:symCfg];
    CGFloat chevronW = chevron ? chevron.size.width : 10.0;

    // Layout constants — must match PCSelectionMenuInlinePickerView
    const CGFloat hSpacing = 8.0;   // HStack spacing
    const CGFloat menuPad  = 6.0;   // Menu chrome padding
    const CGFloat vPad     = 20.0;  // .padding(.vertical, 10) × 2
    const CGFloat minH     = 44.0;  // PCConstants.minTouchTargetHeight

    float w = static_cast<float>(
        std::ceil(textSize.width + hSpacing + chevronW + menuPad));
    float h = static_cast<float>(
        std::fmax(minH, std::ceil(textSize.height) + vPad));

    return {w, h};
  }
}

} // namespace facebook::react
