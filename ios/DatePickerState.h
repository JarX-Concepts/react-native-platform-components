#pragma once

#include <react/renderer/core/LayoutPrimitives.h>

namespace facebook::react {

struct DatePickerStateFrameSize final {
  using Shared = std::shared_ptr<const DatePickerStateFrameSize>;

  Size frameSize{}; // {width, height} in points
};

} // namespace facebook::react
