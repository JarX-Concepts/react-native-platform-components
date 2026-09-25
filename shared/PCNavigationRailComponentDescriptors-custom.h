#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>

// Forward declaration to avoid circular includes
namespace facebook::react {
class MeasuringPCNavigationRailShadowNode;
}

// Include the actual shadow node definition
#include "PCNavigationRailShadowNode-custom.h"

namespace facebook::react {

/**
 * Component descriptor for NavigationRail. Gives the node the natural width
 * native reported, as horizontal padding (the way SafeAreaView applies its
 * insets): a node with children can't have a measure function, and its only
 * child, the header, is out of the flow.
 */
class MeasuringPCNavigationRailComponentDescriptor final
    : public ConcreteComponentDescriptor<MeasuringPCNavigationRailShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode& shadowNode) const override {
    auto& layoutableShadowNode = static_cast<YogaLayoutableShadowNode&>(shadowNode);
    const auto& stateData =
        static_cast<const MeasuringPCNavigationRailShadowNode::ConcreteState&>(
            *shadowNode.getState())
            .getData();

    Float width = stateData.frameSize.width;
    if (width <= 0) {
#ifdef __ANDROID__
      width = MeasuringPCNavigationRailShadowNode::kFallbackWidthAndroid;
#else
      width = MeasuringPCNavigationRailShadowNode::kFallbackWidthIOS;
#endif
    }
    layoutableShadowNode.setPadding({width / 2, 0, width / 2, 0});

    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
