#pragma once

#include <react/renderer/core/LayoutPrimitives.h>
#include <memory>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/**
 * Custom state for DatePicker that holds the measured frame size from native.
 * This allows the native side to measure the actual picker and communicate
 * the size to the shadow node for proper Yoga layout.
 *
 * Note: Does NOT inherit from StateData (which is final). Custom state types
 * are standalone structs that satisfy the ConcreteState template requirements.
 */
struct PCDatePickerStateFrameSize {
  using Shared = std::shared_ptr<const PCDatePickerStateFrameSize>;

  Size frameSize{}; // {width, height} in points

  PCDatePickerStateFrameSize() = default;

  explicit PCDatePickerStateFrameSize(Size size) : frameSize(size) {}

  bool operator==(const PCDatePickerStateFrameSize& other) const {
    return frameSize.width == other.frameSize.width &&
           frameSize.height == other.frameSize.height;
  }

  bool operator!=(const PCDatePickerStateFrameSize& other) const {
    return !(*this == other);
  }

#ifdef RN_SERIALIZABLE_STATE
  // Required for Android state serialization
  PCDatePickerStateFrameSize(
      const PCDatePickerStateFrameSize& previousState,
      folly::dynamic data)
      : frameSize(previousState.frameSize) {
    // Parse frame size from dynamic data if provided
    if (data.isObject()) {
      if (data.count("width") && data.count("height")) {
        frameSize.width = static_cast<Float>(data["width"].asDouble());
        frameSize.height = static_cast<Float>(data["height"].asDouble());
      }
    }
  }

  folly::dynamic getDynamic() const {
    return folly::dynamic::object("width", frameSize.width)("height", frameSize.height);
  }

  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  }
#endif
};

} // namespace facebook::react
