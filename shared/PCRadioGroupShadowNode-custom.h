#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCRadioGroupState-custom.h"

namespace facebook::react {

extern const char PCRadioGroupComponentName[];

/**
 * Custom ShadowNode for RadioGroup that supports Yoga measurement.
 *
 * - Native measures the group: the width of
 *   its widest option on one line, and the height at the width it was laid
 *   out at (the labels wrap onto more lines when it is narrower)
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCRadioGroupShadowNode final : public ConcreteViewShadowNode<
                                          PCRadioGroupComponentName,
                                          PCRadioGroupProps,
                                          PCRadioGroupEventEmitter,
                                          PCRadioGroupStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback sizes used when native hasn't reported measurements yet
  // iOS: one 44-point row
  static constexpr float kFallbackHeightIOS = 44.0f;

  // Android: one MaterialRadioButton in its 48dp touch target
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
