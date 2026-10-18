#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCChipState-custom.h"

namespace facebook::react {

extern const char PCChipComponentName[];

/**
 * Custom ShadowNode for Chip that supports Yoga measurement.
 *
 * - Native measures the actual chip and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCChipShadowNode final : public ConcreteViewShadowNode<
                                          PCChipComponentName,
                                          PCChipProps,
                                          PCChipEventEmitter,
                                          PCChipStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback sizes used when native hasn't reported measurements yet
  // iOS: a capsule UIButton
  static constexpr float kFallbackHeightIOS = 32.0f;

  // Android: a Material 3 chip (32dp) inside its 48dp touch target
  static constexpr float kFallbackHeightAndroid = 48.0f;

  static constexpr float kFallbackWidth = 80.0f;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  /**
   * Called by Yoga when it needs the intrinsic size of the component.
   */
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;
};

} // namespace facebook::react
