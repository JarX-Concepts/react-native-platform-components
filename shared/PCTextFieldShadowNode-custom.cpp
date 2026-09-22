#include "PCTextFieldShadowNode-custom.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <algorithm>

namespace facebook::react {

Size MeasuringPCTextFieldShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {

  const auto& stateData = this->getStateData();
  Float measuredW = stateData.frameSize.width;
  Float measuredH = stateData.frameSize.height;

  const Float kHuge = static_cast<Float>(1.0e9);

  // A text field fills the width it is offered; only an unbounded row (no
  // width at all) gets a fixed fallback.
  if (measuredW <= 0) {
    const Float maxW = layoutConstraints.maximumSize.width;
    measuredW = (maxW > 0 && maxW < kHuge) ? maxW : static_cast<Float>(kFallbackWidth);
  }

  const bool usingFallback = (measuredH <= 0);
  if (usingFallback) {
#ifdef __ANDROID__
    measuredH = static_cast<Float>(kFallbackHeightAndroid);
#else
    measuredH = static_cast<Float>(kFallbackHeightIOS);
#endif
  }

  measuredW = std::max<Float>(measuredW, layoutConstraints.minimumSize.width);
  measuredW = std::min<Float>(measuredW, layoutConstraints.maximumSize.width);

  measuredH = std::max<Float>(measuredH, layoutConstraints.minimumSize.height);
  // Only clamp to max height if we have real measured data (not fallback)
  if (!usingFallback && layoutConstraints.maximumSize.height > 0 &&
      layoutConstraints.maximumSize.height < kHuge) {
    measuredH = std::min<Float>(measuredH, layoutConstraints.maximumSize.height);
  }

  return Size{measuredW, measuredH};
}

} // namespace facebook::react
