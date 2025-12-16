#pragma once

#include <react/renderer/core/LayoutPrimitives.h>

namespace facebook::react {

struct PCDatePickerStateFrameSize final {
  using Shared = std::shared_ptr<const PCDatePickerStateFrameSize>;

  Size frameSize{}; // {width, height} in points
};

} // namespace facebook::react
