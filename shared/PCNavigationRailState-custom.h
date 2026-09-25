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
 * Custom state for NavigationRail that holds the measured frame size from native.
 * This allows the native side to measure the rail and communicate
 * the size to the shadow node for proper Yoga layout.
 */
struct PCNavigationRailStateFrameSize {
  using Shared = std::shared_ptr<const PCNavigationRailStateFrameSize>;

  Size frameSize{}; // {width, height} in points

  PCNavigationRailStateFrameSize() = default;

  explicit PCNavigationRailStateFrameSize(Size size) : frameSize(size) {}

  bool operator==(const PCNavigationRailStateFrameSize& other) const {
    return frameSize.width == other.frameSize.width &&
           frameSize.height == other.frameSize.height;
  }

  bool operator!=(const PCNavigationRailStateFrameSize& other) const {
    return !(*this == other);
  }

#if defined(RN_SERIALIZABLE_STATE) || defined(ANDROID)
  // Required for Android state serialization
  PCNavigationRailStateFrameSize(
      const PCNavigationRailStateFrameSize& previousState,
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
