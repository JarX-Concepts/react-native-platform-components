#include "PCSegmentedControlShadowNode-custom.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <algorithm>

namespace facebook::react {

Size MeasuringPCSegmentedControlShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {

  // Get frame size from native state - native measures the actual control
  const auto& stateData = this->getStateData();
  Float measuredW = stateData.frameSize.width;
  Float measuredH = stateData.frameSize.height;

  // Platform-specific fallback heights
  const Float fallbackHeight =
#ifdef __ANDROID__
      static_cast<Float>(kFallbackHeightAndroid);
#else
      static_cast<Float>(kFallbackHeightIOS);
#endif

  // If height is 0, use fallback (state not yet set by native)
  const bool usingFallback = (measuredH <= 0);
  if (usingFallback) {
    measuredH = fallbackHeight;
  }

  // If width is 0, use available width from constraints
  const Float kHuge = static_cast<Float>(1.0e9);
  if (measuredW <= 0) {
    const Float maxW = layoutConstraints.maximumSize.width;
    measuredW = (maxW > 0 && maxW < kHuge) ? maxW : 300;
  }

  // Respect layout constraints, but if using fallback height,
  // don't let maximum constraint override our fallback
  measuredW = std::max<Float>(measuredW, layoutConstraints.minimumSize.width);
  if (layoutConstraints.maximumSize.width > 0 && layoutConstraints.maximumSize.width < kHuge) {
    measuredW = std::min<Float>(measuredW, layoutConstraints.maximumSize.width);
  }

  measuredH = std::max<Float>(measuredH, layoutConstraints.minimumSize.height);
  // Only clamp to max height if we have real measured data (not fallback)
  if (!usingFallback && layoutConstraints.maximumSize.height > 0 && layoutConstraints.maximumSize.height < kHuge) {
    measuredH = std::min<Float>(measuredH, layoutConstraints.maximumSize.height);
  }

  return Size{measuredW, measuredH};
}

} // namespace facebook::react
