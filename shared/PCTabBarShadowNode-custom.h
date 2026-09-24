#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCTabBarState-custom.h"

namespace facebook::react {

extern const char PCTabBarComponentName[];

/**
 * Custom ShadowNode for TabBar that supports Yoga measurement.
 *
 * Key behavior:
 * - Native side measures the actual tab bar and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCTabBarShadowNode final : public ConcreteViewShadowNode<
                                          PCTabBarComponentName,
                                          PCTabBarProps,
                                          PCTabBarEventEmitter,
                                          PCTabBarStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback heights used when native hasn't reported measurements yet:
  // the iOS tab bar and the Android Material 3 navigation bar
  static constexpr float kFallbackHeightIOS = 49.0f;
  static constexpr float kFallbackHeightAndroid = 80.0f;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  /**
   * Called by Yoga when it needs the intrinsic size of the component.
   * Returns the size provided by native through state, with fallback to
   * platform-specific defaults if state hasn't been set.
   */
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
