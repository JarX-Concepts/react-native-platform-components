#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCButtonState-custom.h"

namespace facebook::react {

extern const char PCButtonComponentName[];

/**
 * Custom ShadowNode for Button that supports Yoga measurement.
 *
 * - Native measures the actual button and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCButtonShadowNode final : public ConcreteViewShadowNode<
                                          PCButtonComponentName,
                                          PCButtonProps,
                                          PCButtonEventEmitter,
                                          PCButtonStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback sizes used when native hasn't reported measurements yet
  // iOS UIButton.Configuration small size
  static constexpr float kFallbackHeightIOS = 34.0f;

  // Android Material 3 small button (40dp) plus its 4dp touch insets
  static constexpr float kFallbackHeightAndroid = 48.0f;

  static constexpr float kFallbackWidth = 64.0f;

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
