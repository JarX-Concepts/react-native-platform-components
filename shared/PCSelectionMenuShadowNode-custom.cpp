#include "PCSelectionMenuShadowNode-custom.h"

#include <react/renderer/core/LayoutConstraints.h>
#include <algorithm>

namespace facebook::react {

Size MeasuringPCSelectionMenuShadowNode::measureContent(
    const LayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {

  const auto& props = *std::static_pointer_cast<const PCSelectionMenuProps>(getProps());
  const bool inlineMode = props.anchorMode == "inline";

  // Headless mode: zero size
  if (!inlineMode) {
    return layoutConstraints.clamp(Size{0, 0});
  }

  // Get frame size from native state - native measures the actual picker
  const auto& stateData = this->getStateData();
  Float measuredW = stateData.frameSize.width;
  Float measuredH = stateData.frameSize.height;

  // If height is 0, use fallback values (state not yet set by native)
  if (measuredH <= 0) {
#ifdef __ANDROID__
    const std::string& material = props.android.material;
    if (material == "m3") {
      measuredH = static_cast<Float>(kFallbackHeightAndroidM3);
    } else {
      measuredH = static_cast<Float>(kFallbackHeightAndroid);
    }
#else
    measuredH = static_cast<Float>(kFallbackHeightIOS);
#endif
  }

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
