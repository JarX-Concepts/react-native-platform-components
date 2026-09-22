#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCButtonGroupState-custom.h"

namespace facebook::react {

extern const char PCButtonGroupComponentName[];

/**
 * Custom ShadowNode for ButtonGroup that supports Yoga measurement.
 *
 * - Native measures the actual group and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCButtonGroupShadowNode final : public ConcreteViewShadowNode<
                                          PCButtonGroupComponentName,
                                          PCButtonGroupProps,
                                          PCButtonGroupEventEmitter,
                                          PCButtonGroupStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback sizes used when native hasn't reported measurements yet
  // iOS: a row of small UIButtons
  static constexpr float kFallbackHeightIOS = 34.0f;

  // Android: small Material 3 buttons (40dp) plus their 4dp touch insets
  static constexpr float kFallbackHeightAndroid = 48.0f;

  static constexpr float kFallbackWidth = 160.0f;

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
