#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCFloatingActionButtonState-custom.h"

namespace facebook::react {

extern const char PCFloatingActionButtonComponentName[];

/**
 * Custom ShadowNode for FloatingActionButton that supports Yoga measurement.
 *
 * - Native measures the button (the extended button in its current state)
 *   and updates state with frameSize
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCFloatingActionButtonShadowNode final
    : public ConcreteViewShadowNode<
          PCFloatingActionButtonComponentName,
          PCFloatingActionButtonProps,
          PCFloatingActionButtonEventEmitter,
          PCFloatingActionButtonStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback size used when native hasn't reported measurements yet: the
  // regular 56pt / 56dp button
  static constexpr float kFallbackHeightIOS = 56.0f;
  static constexpr float kFallbackHeightAndroid = 56.0f;
  static constexpr float kFallbackWidth = 56.0f;

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
