#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCChipGroupState-custom.h"

namespace facebook::react {

extern const char PCChipGroupComponentName[];

/**
 * Custom ShadowNode for ChipGroup that supports Yoga measurement.
 *
 * - Native measures the actual group and updates state with frameSize: the
 *   width of every chip on one row, and the height at the width the group
 *   was laid out at (a wrapping group grows taller when it is narrower)
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCChipGroupShadowNode final : public ConcreteViewShadowNode<
                                          PCChipGroupComponentName,
                                          PCChipGroupProps,
                                          PCChipGroupEventEmitter,
                                          PCChipGroupStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback sizes used when native hasn't reported measurements yet
  // iOS: one row of capsule UIButtons
  static constexpr float kFallbackHeightIOS = 32.0f;

  // Android: one row of Material 3 chips in their 48dp touch targets
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
