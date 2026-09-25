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
 * Custom state for FloatingActionButton that holds the measured frame size from native.
 * The native side measures the actual button and communicates the size to
 * the shadow node for proper Yoga layout.
 */
struct PCFloatingActionButtonStateFrameSize {
  using Shared = std::shared_ptr<const PCFloatingActionButtonStateFrameSize>;

  Size frameSize{}; // {width, height} in points

  PCFloatingActionButtonStateFrameSize() = default;

  explicit PCFloatingActionButtonStateFrameSize(Size size) : frameSize(size) {}

  bool operator==(const PCFloatingActionButtonStateFrameSize& other) const {
    return frameSize.width == other.frameSize.width &&
           frameSize.height == other.frameSize.height;
  }

  bool operator!=(const PCFloatingActionButtonStateFrameSize& other) const {
    return !(*this == other);
  }

#if defined(RN_SERIALIZABLE_STATE) || defined(ANDROID)
  // Required for Android state serialization
  PCFloatingActionButtonStateFrameSize(
      const PCFloatingActionButtonStateFrameSize& previousState,
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
