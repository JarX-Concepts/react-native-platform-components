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
 * Custom state for SegmentedControl that holds the measured frame size from native.
 * This allows the native side to measure the actual segmented control and communicate
 * the size to the shadow node for proper Yoga layout.
 */
struct PCSegmentedControlStateFrameSize {
  using Shared = std::shared_ptr<const PCSegmentedControlStateFrameSize>;

  Size frameSize{}; // {width, height} in points

  PCSegmentedControlStateFrameSize() = default;

  explicit PCSegmentedControlStateFrameSize(Size size) : frameSize(size) {}

  bool operator==(const PCSegmentedControlStateFrameSize& other) const {
    return frameSize.width == other.frameSize.width &&
           frameSize.height == other.frameSize.height;
  }

  bool operator!=(const PCSegmentedControlStateFrameSize& other) const {
    return !(*this == other);
  }

#ifdef RN_SERIALIZABLE_STATE
  // Required for Android state serialization
  PCSegmentedControlStateFrameSize(
      const PCSegmentedControlStateFrameSize& previousState,
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
