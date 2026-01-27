#include <react/renderer/core/LayoutConstraints.h>
#include "PCSelectionMenuShadowNode-custom.h"

#include <algorithm>

namespace facebook::react {

  Size MeasuringPCSelectionMenuShadowNode::measureContent(
      const LayoutContext&,
      const LayoutConstraints& layoutConstraints) const {

    const Float kHuge = static_cast<Float>(1.0e9);

    const Float maxW = layoutConstraints.maximumSize.width;
    const Float measuredW = (maxW > 0 && maxW < kHuge) ? maxW : 0;

    const auto& props = *std::static_pointer_cast<const PCSelectionMenuProps>(getProps());
    const bool inlineMode = props.anchorMode == "inline";

    Float measuredH = 0;

    if (inlineMode) {
#ifdef __ANDROID__
      // Android heights differ by material mode:
      // - M3 TextInputLayout with floating label: 72dp
      // - System Spinner: 56dp
      const std::string& material = props.android.material;
      if (material == "m3") {
        measuredH = static_cast<Float>(kMinRowHeightAndroidM3);
      } else {
        measuredH = static_cast<Float>(kMinRowHeightAndroid);
      }
#else
      // iOS standard row height
      measuredH = static_cast<Float>(kMinRowHeight);
#endif
    } else {
      measuredH = 0;
    }

    // Respect layout constraints (min/max) coming from JS styles
    measuredH = std::max<Float>(measuredH, layoutConstraints.minimumSize.height);
    measuredH = std::min<Float>(measuredH, layoutConstraints.maximumSize.height);

    Size result{measuredW, measuredH};
    return layoutConstraints.clamp(result);
  }

} // namespace facebook::react
