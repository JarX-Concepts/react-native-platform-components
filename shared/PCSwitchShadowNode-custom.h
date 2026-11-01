#pragma once

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

// Only include what we need for the shadow node definition
// Do NOT include ComponentDescriptors.h here to avoid circular dependency
#include <react/renderer/components/PlatformComponentsViewSpec/EventEmitters.h>
#include <react/renderer/components/PlatformComponentsViewSpec/Props.h>

#include "PCSwitchState-custom.h"

namespace facebook::react {

extern const char PCSwitchComponentName[];

/**
 * Custom ShadowNode for Switch that supports Yoga measurement.
 *
 * - Native measures the switch (and the label of a settings row) and
 *   updates state with frameSize: the width with the label on one line, and
 *   the height at the width the row was laid out at, so a label that wraps
 *   makes the row taller
 * - measureContent() returns the size from state for proper Yoga layout
 * - Falls back to platform-specific defaults if state hasn't been set yet
 */
class MeasuringPCSwitchShadowNode final : public ConcreteViewShadowNode<
                                            PCSwitchComponentName,
                                            PCSwitchProps,
                                            PCSwitchEventEmitter,
                                            PCSwitchStateFrameSize> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Fallback sizes used when native hasn't reported measurements yet
  // iOS: a UISwitch (51 x 31; 63 x 28 on iOS 26)
  static constexpr float kFallbackHeightIOS = 31.0f;
  static constexpr float kFallbackWidthIOS = 51.0f;

  // Android: a Material 3 switch (52 x 32) inside its 48dp touch target
  static constexpr float kFallbackHeightAndroid = 48.0f;
  static constexpr float kFallbackWidthAndroid = 52.0f;

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
