#include "PCButtonGroupShadowNode-custom.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <algorithm>

namespace facebook::react {

Size MeasuringPCButtonGroupShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {

  // Native measures the actual group and reports its intrinsic size
  const auto& stateData = this->getStateData();
  Float measuredW = stateData.frameSize.width;
  Float measuredH = stateData.frameSize.height;

  const Float fallbackHeight =
#ifdef __ANDROID__
      static_cast<Float>(kFallbackHeightAndroid);
#else
      static_cast<Float>(kFallbackHeightIOS);
#endif

  const bool usingFallback = (measuredH <= 0);
  if (usingFallback) {
    measuredH = fallbackHeight;
  }
  if (measuredW <= 0) {
    measuredW = static_cast<Float>(kFallbackWidth);
  }

  const Float kHuge = static_cast<Float>(1.0e9);

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
