#pragma once

#include <react/renderer/core/LayoutPrimitives.h>
#include <memory>

#if defined(RN_SERIALIZABLE_STATE) || defined(ANDROID)
#include <folly/dynamic.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook::react {

/**
 * Custom state for TextField that holds the measured frame size from native.
 * The field fills the width it is given; native measures the height the
 * label, text and supporting text need at that width and reports it here.
 */
struct PCTextFieldStateFrameSize {
  using Shared = std::shared_ptr<const PCTextFieldStateFrameSize>;

  Size frameSize{}; // {width, height} in points; width 0 = fill the available width

  PCTextFieldStateFrameSize() = default;

  explicit PCTextFieldStateFrameSize(Size size) : frameSize(size) {}

  bool operator==(const PCTextFieldStateFrameSize& other) const {
    return frameSize.width == other.frameSize.width &&
           frameSize.height == other.frameSize.height;
  }

  bool operator!=(const PCTextFieldStateFrameSize& other) const {
    return !(*this == other);
  }

#if defined(RN_SERIALIZABLE_STATE) || defined(ANDROID)
  // Required for Android state serialization
  PCTextFieldStateFrameSize(
      const PCTextFieldStateFrameSize& previousState,
      folly::dynamic data)
      : frameSize(previousState.frameSize) {
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
