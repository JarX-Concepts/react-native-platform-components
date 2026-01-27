#include "PCDatePickerShadowNode-custom.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/ConcreteShadowNode.h>
#include <algorithm>

namespace facebook::react {

Size MeasuringPCDatePickerShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {

  // Get frame size from native state - native measures the actual picker
  const auto& stateData = this->getStateData();
  Float measuredW = stateData.frameSize.width;
  Float measuredH = stateData.frameSize.height;

  // If width is 0, use available width from constraints
  const Float kHuge = static_cast<Float>(1.0e9);
  if (measuredW <= 0) {
    const Float maxW = layoutConstraints.maximumSize.width;
    measuredW = (maxW > 0 && maxW < kHuge) ? maxW : 0;
  }

  // Respect layout constraints
  measuredW = std::max<Float>(measuredW, layoutConstraints.minimumSize.width);
  measuredW = std::min<Float>(measuredW, layoutConstraints.maximumSize.width);

  measuredH = std::max<Float>(measuredH, layoutConstraints.minimumSize.height);
  measuredH = std::min<Float>(measuredH, layoutConstraints.maximumSize.height);

  Size result{measuredW, measuredH};
  return layoutConstraints.clamp(result);
}

} // namespace facebook::react
