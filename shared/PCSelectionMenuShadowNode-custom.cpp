#include <react/renderer/core/LayoutConstraints.h>
#include "PCSelectionMenuShadowNode-Custom.h"

#include <algorithm>

namespace facebook::react {

Size MeasuringPCSelectionMenuShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {
    const Float kHuge = static_cast<Float>(1.0e9);

    const Float maxW = layoutConstraints.maximumSize.width;
    const Float measuredW = (maxW > 0 && maxW < kHuge) ? maxW : 0;

    Float measuredH = static_cast<Float>(kMinRowHeight);

    measuredH = std::max<Float>(measuredH, layoutConstraints.minimumSize.height);
    measuredH = std::min<Float>(measuredH, layoutConstraints.maximumSize.height);

    Size result{measuredW, measuredH};
    return layoutConstraints.clamp(result);
  }

} // namespace facebook::react
